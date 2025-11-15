import type { Readable } from 'node:stream';
import { v } from 'convex/values';
import FormData from 'form-data';
import { action, mutation } from './_generated/server';
import { callFields } from './schema';
import { api } from './_generated/api';

const BASE_URL = 'https://api.elevenlabs.io/v1';

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
    const res = await fetch(`${BASE_URL}/convai/twilio/outbound-call`, {
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

    const data = await res.json();
    await _ctx.runMutation(api.elevenlabs.saveCall, {
      callSid: data.callSid,
      conversation_id: data.conversation_id,
      year: args.year,
      make: args.make,
      model: args.model,
      zipcode: args.zipcode,
      dealer_name: args.dealer_name,
      msrp: args.msrp,
      listing_price: args.listing_price,
      stock_number: args.stock_number,
      phone_number: args.phone_number,
      status: 'pending',
    });
    return data;
  },
});

export const saveCall = mutation({
  args: callFields,
  returns: v.null(),
  handler: async (_ctx, args) => {
    await _ctx.db.insert('calls', args);
  },
});

export const createVoice = action({
  args: {
    audio: v.string(),
    name: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    const audioBuffer = Buffer.from(args.audio, 'base64');

    const formData = new FormData();
    formData.append('name', args.name);
    formData.append('files', audioBuffer, 'audio.mp3');

    const headers = formData.getHeaders();

    const chunks: Buffer[] = [];
    const formDataStream = formData as unknown as Readable;

    await new Promise<void>((resolve, reject) => {
      formDataStream.on('data', (chunk: Buffer | string) => {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else {
          chunks.push(Buffer.from(chunk));
        }
      });
      formDataStream.on('end', () => {
        resolve();
      });
      formDataStream.on('error', (err: Error) => {
        reject(err);
      });

      formDataStream.resume();
    });

    const bodyBuffer = Buffer.concat(chunks);

    const res = await fetch(`${BASE_URL}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        'Content-Type': headers['content-type'],
      },
      body: bodyBuffer,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `ElevenLabs API error: ${res.status} ${res.statusText} - ${errorText}`,
      );
    }

    const data = await res.json();

    return {
      data: data,
    };
  },
});
