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
  stock_number: v.number(),
  phone_number: v.string(),
  status: v.union(
    v.literal('pending'),
    v.literal('completed'),
    v.literal('failed'),
  ),
};

export const videoFields = {
  storageId: v.id("_storage"),
  vin: v.string()
}

export default defineSchema({
  calls: defineTable(callFields),
  videos: defineTable(videoFields),
});
