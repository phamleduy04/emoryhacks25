'use node';

import type { Readable } from 'node:stream';
import { v } from 'convex/values';
import FormData from 'form-data';
import { api } from './_generated/api';
import { action } from './_generated/server';

const BASE_URL = 'https://api.elevenlabs.io/v1';
const BASE_URL_V2 = 'https://api.elevenlabs.io/v2';

export const requestCall = action({
  args: {
    year: v.number(),
    make: v.string(),
    model: v.string(),
    zipcode: v.number(),
    dealer_name: v.string(),
    msrp: v.number(),
    vin: v.string(),
    listing_price: v.number(),
    stock_number: v.string(),
    phone_number: v.string(),
    voice_id: v.string(),
    paymentSignature: v.string(),
  },
  returns: v.any(),
  handler: async (_ctx, args) => {
    console.log('requestCall', args);

    // Get merchant address from environment variable
    const merchantAddress =
      process.env.SOLANA_MERCHANT_ADDRESS || '11111111111111111111111111111111'; // Default to system program if not set

    // Verify payment before processing the call
    const paymentVerification = await _ctx.runAction(
      api.solanaPayment.verifyPayment,
      {
        signature: args.paymentSignature,
        merchantAddress,
      },
    );

    if (!paymentVerification) {
      throw new Error('Payment verification failed');
    }

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
          conversation_config_override: {
            tts: {
              voice_id: args.voice_id,
            },
          },
          dynamic_variables: {
            year: args.year,
            make: args.make,
            model: args.model,
            zipcode: args.zipcode,
            dealer_name: args.dealer_name,
            vin: args.vin,
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
      vin: args.vin,
      stock_number: args.stock_number,
      phone_number: args.phone_number,
      status: 'pending',
      transcript_summary: undefined,
      call_successful: undefined,
    });
    return data;
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

    console.log('created voice data', data);

    return {
      data: data,
    };
  },
});

export const getVoices = action({
  args: {},
  returns: v.array(
    v.object({
      name: v.string(),
      voiceId: v.string(),
    }),
  ),
  handler: async (_ctx, _args) => {
    const res = await fetch(`${BASE_URL_V2}/voices`, {
      method: 'GET',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `ElevenLabs API error: ${res.status} ${res.statusText} - ${errorText}`,
      );
    }

    const data = await res.json();

    // Extract just name and voice_id from the response
    const voices = data.voices.map(
      (voice: { name: string; voice_id: string }) => ({
        name: voice.name,
        voiceId: voice.voice_id,
      }),
    );

    return voices;
  },
});
