import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';

const http = httpRouter();

http.route({
  path: '/elevenlabs/post-call',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    // wsec_7a2ffb7845a1298fc7ea97a2dc2aa71d908624921b4e53d36248d147b9c309ca
    console.log(request);
    console.log(request.body);
    return new Response(`Hello from ${request.url}`);
  }),
});
export default http;
