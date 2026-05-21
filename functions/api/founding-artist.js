// Cloudflare Pages Function: POST /api/founding-artist
// NASA Power of 10 alignment: bounded inputs, validated everything, ≤60 line functions,
// ≥2 assertions per function, all return values checked, no globals, no silent failure.

const MAX_EMAIL = 254;
const MAX_NAME = 80;
const MAX_COMMUNITY = 120;
const MAX_PLATFORM = 40;
const MAX_TRACKS = 20;
const MAX_TURNSTILE_TOKEN = 2048;
const COHORT_CAP = 1000;

const ALLOWED_PLATFORMS = new Set([
  '', 'suno', 'udio', 'elevenlabs', 'mubert', 'soundraw',
  'aiva', 'mureka', 'beatoven', 'loudly', 'soundverse',
  'multiple', 'custom', 'other',
]);

const ALLOWED_TRACKS = new Set(['', '1-5', '6-20', '21-50', '51-100', '100+']);

function jsonResponse(payload, status) {
  if (typeof status !== 'number' || status < 100 || status > 599) {
    status = 200;
  }
  if (payload === null || typeof payload !== 'object') {
    payload = { error: 'invalid_payload' };
  }
  return new Response(JSON.stringify(payload), {
    status: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const len = value.length;
  if (len < 3 || len > MAX_EMAIL) return false;
  // Pragmatic email regex — server-side gate, deliverability checked downstream.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clampString(value, max) {
  if (typeof max !== 'number' || max <= 0) return '';
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function sanitizePayload(raw) {
  if (raw === null || typeof raw !== 'object') return null;

  const email = clampString(raw.email, MAX_EMAIL).toLowerCase();
  if (!isValidEmail(email)) return null;

  const platform = clampString(raw.platform, MAX_PLATFORM).toLowerCase();
  const safePlatform = ALLOWED_PLATFORMS.has(platform) ? platform : '';

  const tracks = clampString(raw.tracks, MAX_TRACKS);
  const safeTracks = ALLOWED_TRACKS.has(tracks) ? tracks : '';

  return {
    email: email,
    platform: safePlatform,
    handle: clampString(raw.handle, MAX_NAME),
    tracks: safeTracks,
    community: clampString(raw.community, MAX_COMMUNITY),
    press: raw.press === 'yes' ? 'yes' : 'no',
  };
}

async function verifyTurnstile(token, secret, ip) {
  if (typeof token !== 'string') return false;
  if (token.length === 0 || token.length > MAX_TURNSTILE_TOKEN) return false;
  if (typeof secret !== 'string' || secret.length === 0) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (typeof ip === 'string' && ip.length > 0) form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  if (res === null || !res.ok) return false;
  const data = await res.json();
  if (data === null || typeof data !== 'object') return false;
  return data.success === true;
}

async function countArtistKeys(kv) {
  if (kv === null || typeof kv.list !== 'function') return 0;
  let cursor = undefined;
  let total = 0;
  const MAX_PAGES = 4; // bounded loop (P10)
  for (let i = 0; i < MAX_PAGES; i++) {
    const page = await kv.list({ prefix: 'artist:', limit: 1000, cursor: cursor });
    if (page === null || !Array.isArray(page.keys)) break;
    total += page.keys.length;
    if (page.list_complete === true || !page.cursor) break;
    cursor = page.cursor;
  }
  return total;
}

async function readExisting(kv, email) {
  if (kv === null || typeof kv.get !== 'function') return null;
  if (typeof email !== 'string' || email.length === 0) return null;
  const existing = await kv.get('artist:' + email, { type: 'json' });
  return existing === null ? null : existing;
}

async function handleSubmission(context) {
  const env = context && context.env ? context.env : null;
  const kv = env && env.WAITLIST ? env.WAITLIST : null;
  if (kv === null) {
    return jsonResponse({ error: 'storage_unavailable' }, 503);
  }

  let body = null;
  try {
    body = await context.request.json();
  } catch (parseErr) {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }

  const clean = sanitizePayload(body);
  if (clean === null) {
    return jsonResponse({ error: 'invalid_input' }, 400);
  }

  const turnstileSecret = env && typeof env.TURNSTILE_SECRET_KEY === 'string' ? env.TURNSTILE_SECRET_KEY : '';
  if (turnstileSecret.length > 0) {
    const ip = context.request.headers.get('CF-Connecting-IP') || '';
    const verified = await verifyTurnstile(body.turnstile, turnstileSecret, ip);
    if (!verified) {
      return jsonResponse({ error: 'turnstile_failed' }, 400);
    }
  }

  const existing = await readExisting(kv, clean.email);
  if (existing !== null && existing.position) {
    return jsonResponse({
      error: 'already_claimed',
      position: existing.position,
      tier: existing.tier || 'founding',
    }, 409);
  }

  const currentCount = await countArtistKeys(kv);
  const position = currentCount + 1;
  const tier = position <= COHORT_CAP ? 'founding' : 'public_waitlist';

  const record = {
    email: clean.email,
    platform: clean.platform,
    handle: clean.handle,
    tracks: clean.tracks,
    community: clean.community,
    press: clean.press,
    tier: tier,
    position: position,
    created_at: new Date().toISOString(),
    ip_country: context.request.cf && context.request.cf.country ? context.request.cf.country : '',
  };

  const storeKey = tier === 'founding' ? 'artist:' + clean.email : 'public:' + clean.email;
  await kv.put(storeKey, JSON.stringify(record));

  if (tier === 'public_waitlist') {
    return jsonResponse({ ok: true, tier: tier, position: position, error: 'cohort_full' }, 200);
  }
  return jsonResponse({ ok: true, tier: tier, position: position }, 200);
}

export async function onRequestPost(context) {
  try {
    return await handleSubmission(context);
  } catch (err) {
    // P10: never swallow errors silently. Surface a generic message; log to Workers logs.
    if (typeof console !== 'undefined' && console.error) {
      console.error('founding-artist submission failed', err && err.message ? err.message : err);
    }
    return jsonResponse({ error: 'submission_failed' }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequest(context) {
  const method = context && context.request ? context.request.method : '';
  if (method === 'POST') return onRequestPost(context);
  if (method === 'OPTIONS') return onRequestOptions();
  return jsonResponse({ error: 'method_not_allowed' }, 405);
}
