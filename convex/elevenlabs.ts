import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { callFields } from './schema';

export const saveCall = mutation({
  args: callFields,
  returns: v.null(),
  handler: async (_ctx, args) => {
    await _ctx.db.insert('calls', args);
    return null;
  },
});

export const updateCallStatus = mutation({
  args: {
    conversation_id: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('quoted'),
    ),
    transcript_summary: v.optional(v.string()),
    call_successful: v.optional(v.boolean()),
    confirmed_price: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find the call by conversation_id
    const call = await ctx.db
      .query('calls')
      .withIndex('by_conversation_id', (q) =>
        q.eq('conversation_id', args.conversation_id),
      )
      .first();

    if (!call) {
      console.error(
        `Call not found for conversation_id: ${args.conversation_id}`,
      );
      return null;
    }

    // Update the call with new status and transcript data
    await ctx.db.patch(call._id, {
      status: args.status,
      transcript_summary: args.transcript_summary,
      call_successful: args.call_successful,
      confirmed_price: args.confirmed_price,
    });

    console.log(`Updated call ${call._id} to status ${args.status}`);
    if (args.confirmed_price) {
      console.log(`Confirmed price: $${args.confirmed_price}`);
    }
    return null;
  },
});

export const checkExistingCall = query({
  args: {
    vin: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id('calls'),
      status: v.union(
        v.literal('pending'),
        v.literal('completed'),
        v.literal('failed'),
        v.literal('quoted'),
      ),
      confirmed_price: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const existingCall = await ctx.db
      .query('calls')
      .withIndex('by_vin', (q) => q.eq('vin', args.vin))
      .filter((q) =>
        q.or(
          q.eq(q.field('status'), 'pending'),
          q.eq(q.field('status'), 'completed'),
          q.eq(q.field('status'), 'quoted'),
        ),
      )
      .first();

    if (!existingCall) {
      return null;
    }

    return {
      _id: existingCall._id,
      status: existingCall.status,
      confirmed_price: existingCall.confirmed_price,
    };
  },
});

export const getCompetitiveDeals = query({
  args: {
    make: v.string(),
    model: v.string(),
  },
  returns: v.array(
    v.object({
      dealer_name: v.string(),
      confirmed_price: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    // Query all calls from the database
    const allCalls = await ctx.db.query('calls').collect();

    // Filter calls based on criteria
    const competitiveDeals = allCalls
      .filter((call) => {
        // Exclude pending status
        if (call.status === 'pending') return false;

        // Must have a confirmed price
        if (!call.confirmed_price) return false;

        // Match make and model (case insensitive)
        if (
          call.make.toLowerCase() !== args.make.toLowerCase() ||
          call.model.toLowerCase() !== args.model.toLowerCase()
        ) {
          return false;
        }

        return true;
      })
      .map((call) => ({
        dealer_name: call.dealer_name,
        confirmed_price: call.confirmed_price as number,
      }));

    return competitiveDeals;
  },
});
