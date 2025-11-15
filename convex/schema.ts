import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.

// Shared validator for call fields - reusable across schema and mutations
export const callFields = {
  callSid: v.string(),
  conversation_id: v.string(),
  year: v.number(),
  make: v.string(),
  model: v.string(),
  zipcode: v.number(),
  dealer_name: v.string(),
  msrp: v.number(),
  listing_price: v.number(),
  stock_number: v.string(),
  phone_number: v.string(),
  vin: v.string(),
  status: v.union(
    v.literal('pending'),
    v.literal('completed'),
    v.literal('failed'),
    v.literal('quoted'),
  ),
  transcript_summary: v.optional(v.string()),
  call_successful: v.optional(v.boolean()),
  confirmed_price: v.optional(v.number()),
};

export const videoFields = {
  storageId: v.id('_storage'),
  vin: v.string(),
};

export default defineSchema({
  videos: defineTable(videoFields),
  calls: defineTable(callFields)
    .index('by_vin', ['vin'])
    .index('by_conversation_id', ['conversation_id']),
  payments: defineTable({
    signature: v.string(),
    amount: v.number(),
    merchantAddress: v.string(),
  }).index('by_signature', ['signature']),
});
