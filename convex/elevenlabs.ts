import { v } from 'convex/values';
import { action } from './_generated/server';

export const requestCall = action({
  args: {
    year: v.number(),
    make: v.string(),
    model: v.string(),
    zipcode: v.number(),
    dealer_name: v.string(),
    msrp: v.number(),
    listing_price: v.number(),
    stock_number: v.number(),
    phone_number: v.string(),
  },
  handler: async (_ctx, args) => {
    const data = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent_id: process.env.ELEVENLABS_AGENT_ID || '',
        agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID || '',
        to_number: args.phone_number,
        conversation_initiation_client_data: {
          dynamic_variables: {
            year: args.year,
            make: args.make,
            model: args.model,
            zipcode: args.zipcode,
            dealer_name: args.dealer_name,
            msrp: args.msrp,
            listing_price: args.listing_price,
            stock_number: args.stock_number,
          },
        },
      }),
    });

    return {
      data: data
    };
  },
});
