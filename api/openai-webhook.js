import { put } from '@vercel/blob';
import { createHash, randomUUID } from 'node:crypto';

const MAX_BODY_BYTES = 4_000_000;

export async function POST(request) {
  const webhookId = request.headers.get('webhook-id');
  const webhookTimestamp = request.headers.get('webhook-timestamp');
  const webhookSignature = request.headers.get('webhook-signature');
  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return new Response('missing OpenAI webhook signature headers', { status: 400 });
  }

  const raw = Buffer.from(await request.arrayBuffer());
  if (raw.length === 0 || raw.length > MAX_BODY_BYTES) {
    return new Response('invalid webhook body size', { status: 413 });
  }

  const receivedAt = new Date().toISOString();
  const safeWebhookId = webhookId.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 160);
  const envelope = {
    schema: 'THOMAS_OPENAI_WEBHOOK_CAPTURE_ENVELOPE_V1',
    received_at: receivedAt,
    webhook_id: webhookId,
    webhook_timestamp: webhookTimestamp,
    webhook_signature: webhookSignature,
    raw_body_b64: raw.toString('base64'),
    raw_body_sha256: createHash('sha256').update(raw).digest('hex')
  };
  const body = JSON.stringify(envelope);
  const uniquePath = `openai-webhooks/${safeWebhookId}/${Date.now()}-${randomUUID()}.json`;
  await put(uniquePath, body, { access: 'private', contentType: 'application/json' });
  await put('openai-webhooks/latest.json', body, {
    access: 'private', contentType: 'application/json', allowOverwrite: true
  });
  return Response.json({ ok: true, webhook_id: webhookId }, { status: 200 });
}

export async function GET() {
  return new Response('method not allowed', { status: 405 });
}
