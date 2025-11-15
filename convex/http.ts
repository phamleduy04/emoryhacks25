import { httpRouter } from 'convex/server';
import type { GenericActionCtx } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

const http = httpRouter();

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: GenericActionCtx<any>,
  data: PostCallTranscriptionData,
) {
  console.log('Processing post_call_transcription webhook');
  console.log('Conversation ID:', data.conversation_id);
  console.log('Call successful:', data.analysis?.call_successful);

  // Extract relevant information
  const conversationId = data.conversation_id;
  const callSuccessful = data.analysis?.call_successful ?? false;
  const transcriptSummary = data.analysis?.transcript_summary;

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
    call_successful: callSuccessful,
  });

  console.log(`Updated call ${conversationId} to status: ${newStatus}`);
}

async function handleCallInitiationFailure(
  ctx: GenericActionCtx<any>,
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
