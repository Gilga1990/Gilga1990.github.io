import { get } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

function authorized(request) {
  const expected = process.env.THOMAS_CAPTURE_TOKEN || '';
  const supplied = request.headers.get('authorization') || '';
  const prefix = 'Bearer ';
  if (!expected || !supplied.startsWith(prefix)) return false;
  const got = supplied.slice(prefix.length);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(got, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request) {
  if (!authorized(request)) {
    return new Response('unauthorized', { status: 401 });
  }
  const result = await get('openai-webhooks/latest.json', {
    access: 'private',
    useCache: false
  });
  if (!result) return new Response('no webhook evidence captured', { status: 404 });
  return new Response(result.stream, {
    status: 200,
    headers: { 'content-type': result.blob.contentType || 'application/json' }
  });
}

export async function POST() {
  return new Response('method not allowed', { status: 405 });
}
