// Cloudflare Pages Function: GET /api/founding-count
// Returns { count: N } where N is the number of founding artists currently registered.
// NASA P10: bounded loops, no globals, validated env, all return paths handled.

const CACHE_MAX_AGE_SECONDS = 60;
const COHORT_CAP = 1000;
const MAX_PAGES = 4;

function jsonResponse(payload, status, cacheSeconds) {
  if (typeof status !== 'number' || status < 100 || status > 599) {
    status = 200;
  }
  if (payload === null || typeof payload !== 'object') {
    payload = { error: 'invalid_payload' };
  }
  const cache = (typeof cacheSeconds === 'number' && cacheSeconds > 0)
    ? 'public, max-age=' + cacheSeconds
    : 'no-store';
  return new Response(JSON.stringify(payload), {
    status: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache,
      'X-Robots-Tag': 'noindex',
    },
  });
}

async function countKeys(kv, prefix) {
  if (kv === null || typeof kv.list !== 'function') return 0;
  if (typeof prefix !== 'string' || prefix.length === 0) return 0;
  let cursor = undefined;
  let total = 0;
  for (let i = 0; i < MAX_PAGES; i++) {
    const page = await kv.list({ prefix: prefix, limit: 1000, cursor: cursor });
    if (page === null || !Array.isArray(page.keys)) break;
    total += page.keys.length;
    if (page.list_complete === true || !page.cursor) break;
    cursor = page.cursor;
  }
  return total;
}

export async function onRequestGet(context) {
  try {
    const env = context && context.env ? context.env : null;
    const kv = env && env.WAITLIST ? env.WAITLIST : null;
    if (kv === null) {
      // Storage not bound — return graceful zero so the UI does not crash.
      return jsonResponse({ count: 0, cap: COHORT_CAP, status: 'storage_unbound' }, 200, 30);
    }
    const count = await countKeys(kv, 'artist:');
    const capped = count > COHORT_CAP ? COHORT_CAP : count;
    return jsonResponse({ count: capped, cap: COHORT_CAP }, 200, CACHE_MAX_AGE_SECONDS);
  } catch (err) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('founding-count read failed', err && err.message ? err.message : err);
    }
    return jsonResponse({ count: 0, cap: COHORT_CAP, error: 'read_failed' }, 200, 30);
  }
}

export async function onRequest(context) {
  const method = context && context.request ? context.request.method : '';
  if (method === 'GET') return onRequestGet(context);
  return jsonResponse({ error: 'method_not_allowed' }, 405);
}
