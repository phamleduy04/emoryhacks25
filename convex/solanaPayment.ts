"use node";

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { api } from './_generated/api';
import { action } from './_generated/server';
import { v } from 'convex/values';

// Devnet RPC endpoint
const DEVNET_RPC_URL = 'https://api.devnet.solana.com';

// Payment amount in SOL (0.001 SOL)
const PAYMENT_AMOUNT_SOL = 0.001;
const PAYMENT_AMOUNT_LAMPORTS = PAYMENT_AMOUNT_SOL * LAMPORTS_PER_SOL;

/**
 * Verify a Solana payment transaction
 * Checks that the transaction:
 * 1. Exists and is confirmed on devnet
 * 2. Sends the correct amount (0.001 SOL) to the merchant address
 * 3. Hasn't been used before (prevent double-spending)
 */
export const verifyPayment = action({
  args: {
    signature: v.string(),
    merchantAddress: v.string(), // The address that should receive the payment
  },
  returns: v.object({
    valid: v.boolean(),
    message: v.string(),
    amount: v.optional(v.number()),
  }),
  handler: async (_ctx, args) => {
    try {
      // Validate signature format
      if (!args.signature || args.signature.length < 64) {
        return {
          valid: false,
          message: 'Invalid transaction signature format',
        };
      }

      // Validate merchant address
      let merchantPubkey: PublicKey;
      try {
        merchantPubkey = new PublicKey(args.merchantAddress);
      } catch (error) {
        return {
          valid: false,
          message: 'Invalid merchant address format',
        };
      }

      // Connect to Solana devnet
      const connection = new Connection(DEVNET_RPC_URL, 'confirmed');

      // Get transaction details (support both legacy and versioned transactions)
      const signature = args.signature;
      const transaction = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!transaction) {
        return {
          valid: false,
          message: 'Transaction not found on devnet',
        };
      }

      // Check if transaction is confirmed
      if (!transaction.meta) {
        return {
          valid: false,
          message: 'Transaction metadata not available',
        };
      }

      if (transaction.meta.err) {
        return {
          valid: false,
          message: `Transaction failed: ${JSON.stringify(transaction.meta.err)}`,
        };
      }

      // Check if this transaction has already been used
      const existingPayment = await _ctx.runQuery(
        api.solana.checkPaymentExists,
        { signature },
      );
      if (existingPayment) {
        return {
          valid: false,
          message: 'This payment has already been used',
        };
      }

      // Verify payment amount and recipient
      const preBalances = transaction.meta.preBalances;
      const postBalances = transaction.meta.postBalances;
      
      // Handle both legacy and versioned transactions
      // Since we're using maxSupportedTransactionVersion: 0, we should only get legacy transactions
      // But TypeScript doesn't know that, so we need to handle both cases
      let accountKeys: PublicKey[];
      if ('accountKeys' in transaction.transaction.message) {
        // Legacy transaction - accountKeys is PublicKey[]
        accountKeys = transaction.transaction.message.accountKeys;
      } else {
        // Versioned transaction - use getAccountKeys().staticAccountKeys
        const loadedAddresses = transaction.transaction.message.getAccountKeys();
        accountKeys = loadedAddresses.staticAccountKeys;
      }

      let paymentFound = false;
      let actualAmount = 0;

      // Check each account balance change
      for (let i = 0; i < accountKeys.length; i++) {
        const accountKey = accountKeys[i];

        const preBalance = preBalances[i];
        const postBalance = postBalances[i];
        const balanceChange = postBalance - preBalance;

        // Check if this account is the merchant address and received SOL
        if (accountKey.equals(merchantPubkey) && balanceChange > 0) {
          actualAmount = balanceChange;
          // Allow small tolerance for transaction fees (within 1000 lamports)
          if (
            balanceChange >= PAYMENT_AMOUNT_LAMPORTS - 1000 &&
            balanceChange <= PAYMENT_AMOUNT_LAMPORTS + 1000
          ) {
            paymentFound = true;
            break;
          }
        }
      }

      if (!paymentFound) {
        return {
          valid: false,
          message: `Payment amount mismatch. Expected ~${PAYMENT_AMOUNT_SOL} SOL, but transaction shows different amount`,
          amount: actualAmount / LAMPORTS_PER_SOL,
        };
      }

      // Record the payment to prevent reuse
      await _ctx.runMutation(api.solana.recordPayment, {
        signature,
        amount: actualAmount / LAMPORTS_PER_SOL,
        merchantAddress: args.merchantAddress,
      });

      return {
        valid: true,
        message: 'Payment verified successfully',
        amount: actualAmount / LAMPORTS_PER_SOL,
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        valid: false,
        message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});
