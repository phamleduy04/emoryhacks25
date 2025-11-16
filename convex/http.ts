import { GoogleGenAI } from '@google/genai';
import type { GenericActionCtx } from 'convex/server';
import { httpRouter } from 'convex/server';
import { api } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import { httpAction } from './_generated/server';

const getPrompt = (data: string) => {
  return `You are an information-extraction model. Extract the final price that the user provided from the email and provide a summary of the email content.\n\nReturn a JSON object following this TypeScript interface:\n\nParsedEmail {\n  final_price: number | null;\n  summary: string;\n}\n\nRules:\n- Output only the JSON object.\n- Do not wrap the result in code blocks or add any commentary.\n- Parse only from the content of the email.\n- Remove currency symbols and commas from the final price (e.g., $23,500 → 23500).\n- If the final price is missing, unclear, or cannot be confidently interpreted as a number, set it to null.\n- The summary should be a concise 1-2 sentence overview of the email's main content.\n- Include no extra fields.\n\n\nData to parse:\n${data}`;
};

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || '',
});

const http = httpRouter();

http.route({
  path: '/elevenlabs/get-competitive-deals',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const bodyText = await request.text();
      const body = JSON.parse(bodyText);
      const { make, model } = body;

      console.log('Fetching competitive deals for:', {
        make,
        model,
      });

      // Validate required parameters
      if (!make || !model) {
        return new Response(
          JSON.stringify({
            error: 'Missing required parameters: make and model are required',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Query calls database for competitive deals (excluding pending status)
      const competitiveDeals = await ctx.runQuery(
        api.elevenlabs.getCompetitiveDeals,
        {
          make: String(make),
          model: String(model),
        },
      );

      console.log(`Returning ${competitiveDeals.length} competitive deals`);

      // Format response as plain text
      let responseText: string;
      if (competitiveDeals.length > 0) {
        responseText = competitiveDeals
          .map((deal) => `${deal.dealer_name}: ${deal.confirmed_price}`)
          .join(', ');
      } else {
        responseText = 'no offer avaliables';
      }

      return new Response(responseText, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    } catch (error) {
      console.error('Error fetching competitive deals:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch competitive deals',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }),
});

http.route({
  path: '/quotes',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      const bodyText = await request.text();
      const body = JSON.parse(bodyText);
      const { finalPrice, vin } = body;

      console.log('Received quote:', { finalPrice, vin });

      // Validate required parameters
      if (!vin) {
        return new Response(
          JSON.stringify({
            error: 'Missing required parameter: vin is required',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (finalPrice === undefined || finalPrice === null) {
        return new Response(
          JSON.stringify({
            error: 'Missing required parameter: finalPrice is required',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // Update the call status to confirmed_quote with the final price
      await ctx.runMutation(api.elevenlabs.updateCallStatusByVin, {
        vin: String(vin),
        status: 'confirmed_quote',
        confirmed_price: Number(finalPrice),
      });

      console.log(
        `Updated call for VIN ${vin} to confirmed_quote with price: $${finalPrice}`,
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Quote updated successfully',
          vin,
          finalPrice,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } catch (error) {
      console.error('Error updating quote:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to update quote',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }),
});

http.route({
  path: '/elevenlabs/post-call',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    try {
      // Get the request body
      const bodyText = await request.text();

      // Parse the webhook payload
      const webhookData = JSON.parse(bodyText);

      console.log('Webhook type:', webhookData.type);

      // Handle different webhook types
      if (webhookData.type === 'post_call_transcription') {
        await handlePostCallTranscription(ctx, webhookData.data);
      } else if (webhookData.type === 'post_call_audio') {
        console.log('Received post_call_audio webhook');
        // Handle audio webhook if needed in the future
      } else if (webhookData.type === 'call_initiation_failure') {
        await handleCallInitiationFailure(ctx, webhookData.data);
      } else {
        console.log('Unknown webhook type:', webhookData.type);
      }

      return new Response('Webhook processed successfully', { status: 200 });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response('Internal server error', { status: 500 });
    }
  }),
});

interface PostCallTranscriptionData {
  conversation_id: string;
  analysis?: {
    call_successful?: boolean;
    transcript_summary?: string;
  };
}

interface CallInitiationFailureData {
  conversation_id: string;
  failure_reason?: string;
}

async function handlePostCallTranscription(
  ctx: GenericActionCtx<DataModel>,
  data: PostCallTranscriptionData,
) {
  console.log('Processing post_call_transcription webhook');
  console.log('Conversation ID:', data.conversation_id);
  console.log('Call successful:', data.analysis?.call_successful);

  // Extract relevant information
  const conversationId = data.conversation_id;
  const callSuccessful = data.analysis?.call_successful ?? false;
  const transcriptSummary = data.analysis?.transcript_summary;

  if (!transcriptSummary) {
    console.error('Transcript summary is missing');
    return;
  }

  // Extract confirmed price using AI
  let confirmedPrice: number | undefined;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: getPrompt(transcriptSummary),
    });

    const responseText = response.text;
    console.log('AI Response:', responseText);

    // Parse the JSON response
    const parsed = JSON.parse(responseText || '{}');
    if (parsed.final_price && typeof parsed.final_price === 'number') {
      confirmedPrice = parsed.final_price;
      console.log('Extracted confirmed price:', confirmedPrice);
    }
  } catch (error) {
    console.error('Error extracting price with AI:', error);
  }

  // Determine the new status based on call analysis
  let newStatus: 'completed' | 'failed' | 'quoted' = 'completed';

  if (!callSuccessful) {
    newStatus = 'failed';
  } else if (
    transcriptSummary &&
    (transcriptSummary.toLowerCase().includes('quote') ||
      transcriptSummary.toLowerCase().includes('price') ||
      transcriptSummary.toLowerCase().includes('offer'))
  ) {
    newStatus = 'quoted';
  }

  // Update the call status in the database
  await ctx.runMutation(api.elevenlabs.updateCallStatus, {
    conversation_id: conversationId,
    status: newStatus,
    transcript_summary: transcriptSummary,
    call_successful: Boolean(callSuccessful), // Ensure it's always a boolean
    confirmed_price: confirmedPrice,
  });

  console.log(`Updated call ${conversationId} to status: ${newStatus}`);
}

async function handleCallInitiationFailure(
  ctx: GenericActionCtx<DataModel>,
  data: CallInitiationFailureData,
) {
  console.log('Processing call_initiation_failure webhook');
  console.log('Conversation ID:', data.conversation_id);
  console.log('Failure reason:', data.failure_reason);

  const conversationId = data.conversation_id;

  // Update the call status to failed
  await ctx.runMutation(api.elevenlabs.updateCallStatus, {
    conversation_id: conversationId,
    status: 'failed',
    transcript_summary: `Call initiation failed: ${data.failure_reason}`,
    call_successful: false,
  });

  console.log(`Updated call ${conversationId} to status: failed`);
}

export default http;
