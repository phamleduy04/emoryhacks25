import type { WalletContextState } from '@solana/wallet-adapter-react';
import {
  type Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

// Payment amount in SOL (0.001 SOL)
export const PAYMENT_AMOUNT_SOL = 0.001;
export const PAYMENT_AMOUNT_LAMPORTS = PAYMENT_AMOUNT_SOL * LAMPORTS_PER_SOL;

/**
 * Send a payment transaction to the merchant address
 * @param merchantAddress - The Solana address to send payment to
 * @param wallet - The wallet context state
 * @param connection - The Solana connection
 * @returns Transaction signature
 */
export async function sendPayment(
  merchantAddress: string,
  wallet: WalletContextState,
  connection: Connection,
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  if (!wallet.signTransaction) {
    throw new Error('Wallet does not support signing transactions');
  }

  try {
    // Validate merchant address
    const merchantPubkey = new PublicKey(merchantAddress);

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: merchantPubkey,
        lamports: PAYMENT_AMOUNT_LAMPORTS,
      }),
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign transaction
    const signedTransaction = await wallet.signTransaction(transaction);

    // Send transaction
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: false,
      },
    );

    // Wait for confirmation
    await connection.confirmTransaction(
      {
        blockhash,
        lastValidBlockHeight,
        signature,
      },
      'confirmed',
    );

    return signature;
  } catch (error) {
    console.error('Payment error:', error);
    throw new Error(
      `Failed to send payment: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}
