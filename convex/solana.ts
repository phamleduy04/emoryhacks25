import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get the merchant address for payments
 */
export const getMerchantAddress = query({
  args: {},
  returns: v.string(),
  handler: async () => {
    // Get merchant address from environment variable
    // This should be set in Convex dashboard
    return (
      process.env.SOLANA_MERCHANT_ADDRESS ||
      '11111111111111111111111111111111' // Default fallback
    );
  },
});

/**
 * Check if a payment transaction has already been used
 */
export const checkPaymentExists = query({
  args: {
    signature: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('payments'),
      signature: v.string(),
      amount: v.number(),
      merchantAddress: v.string(),
      _creationTime: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const existingPayment = await ctx.db
      .query('payments')
      .withIndex('by_signature', (q) => q.eq('signature', args.signature))
      .first();

    return existingPayment
      ? {
          _id: existingPayment._id,
          signature: existingPayment.signature,
          amount: existingPayment.amount,
          merchantAddress: existingPayment.merchantAddress,
          _creationTime: existingPayment._creationTime,
        }
      : null;
  },
});

/**
 * Record a payment transaction to prevent double-spending
 */
export const recordPayment = mutation({
  args: {
    signature: v.string(),
    amount: v.number(),
    merchantAddress: v.string(),
  },
  returns: v.id('payments'),
  handler: async (ctx, args) => {
    // Double-check it doesn't exist (race condition protection)
    const existing = await ctx.db
      .query('payments')
      .withIndex('by_signature', (q) => q.eq('signature', args.signature))
      .first();

    if (existing) {
      throw new Error('Payment already recorded');
    }

    return await ctx.db.insert('payments', {
      signature: args.signature,
      amount: args.amount,
      merchantAddress: args.merchantAddress,
    });
  },
});
