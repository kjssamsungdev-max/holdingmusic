# holdingmusic-landing

Marketing site, founder essay, brand identity, and Founding Artist waitlist for **HoldingMusic.com**.

## What's in this package

```
holdingmusic-landing/
├── index.html                          # / — vibrant main landing, player-forward
├── story/
│   └── index.html                      # /story — founder essay (editorial)
├── founding-artist/
│   └── index.html                      # /founding-artist — 1-of-1000 waitlist
├── brand/
│   ├── mark.svg                        # Primary mark (fermata) — currentColor
│   ├── logo-full.svg                   # Mark + wordmark horizontal lockup
│   ├── icon.svg                        # 512×512 app icon (rounded square)
│   ├── favicon.svg                     # 32×32 favicon
│   └── README.md                       # Brand identity reference
├── functions/
│   └── api/
│       ├── founding-artist.js          # POST /api/founding-artist (waitlist submission)
│       └── founding-count.js           # GET  /api/founding-count (live counter)
└── README.md                           # This file
```

Pure static HTML + Cloudflare Pages Functions. No build step, no framework, no `node_modules`.

## Aesthetic split — intentional

Two registers, on purpose:

| Page | Mood | Why |
|---|---|---|
| `/` (main landing) | **Vibrant. Player-forward.** Aurora gradients, genre-reactive accent cycling through 4 featured tracks, animated waveform, switchable services row | This is a *music platform*. It should feel alive. |
| `/story` (founder essay) | **Editorial. Restrained.** Newsreader serif body, single column, slow tempo | The essay carries the platform's gravity. Energy here would cheapen it. |
| `/founding-artist` | **Editorial. Direct.** Live counter, structured form, full Trail Clause disclosure | Artists deciding to give us their music need to feel respect, not marketing. |

The main page sells. The inner pages earn trust.

## Brand quick reference

**Mark.** A fermata — the classical musical notation for *"hold this note as long as desired."* Dot above a sustained bar. Inherits `currentColor`, so it wears any genre colour.

**Type.**
- Display: **Fraunces** (Google Fonts) — variable, opsz 80–144
- Body (vibrant pages): **Manrope** (Google Fonts)
- Body (editorial pages): **Newsreader** (Google Fonts)
- Spec/mono: **JetBrains Mono** (Google Fonts)

**Colours.**
- Base: `#0A0908` deep warm black
- Ink: `#F5F2EC` warm cream
- Primary accent: `#D4FF3A` phosphor lime
- Hot accent: `#FF2E93` electric magenta
- Genre palette (aqua / lime / magenta / coral / lavender / amber) rotates as the featured track changes

Full identity reference in `brand/README.md`.

## Player behaviour (main landing)

- **4 featured tracks rotate every 8 seconds** with genre-reactive colour shifts (hero accent, album art gradient, waveform, pulse dot, glow under player all change together)
- **Pager dots** below the player let visitors jump tracks manually
- **Play button** toggles visual state; if a track has an `audioUrl` in the FEATURED array (top of the `<script>`), it plays real audio
- **Switchable services row** — Spotify, Apple Music, YouTube Music, Tidal, Bandcamp, SoundCloud, Deezer pills, each with brand-coloured hover state. Currently `href="#"` placeholders — wire to real deeplinks once the platform has its first uploaded tracks

To plug in real audio, edit the `FEATURED` array in `index.html` and set `audioUrl` to a streamable URL (R2 public bucket, Cloudflare Stream, etc.).

## Deploy to Cloudflare Pages

**Prerequisites.** Cloudflare account (you have it: `dbaac4c99956159d7594d90033b0224d`), Wrangler installed, GitHub repo for source.

### 1. Push to GitHub
```bash
cd holdingmusic-landing
git init && git add . && git commit -m "Initial: holdingmusic landing + brand + story + waitlist"
gh repo create kjssamsungdev-max/holdingmusic-landing --public --source=. --push
```

### 2. Create the KV namespace for the waitlist
```bash
wrangler kv:namespace create "WAITLIST"
# Output gives you an `id` — note it down.
```

### 3. Connect Pages to the repo (Cloudflare dashboard)
- Workers & Pages → Create application → Pages → Connect to Git
- Select `holdingmusic-landing` repo
- **Framework preset:** None
- **Build command:** *(leave empty)*
- **Build output directory:** `/`
- Deploy

### 4. Bind KV to Pages project
- Pages project → Settings → Functions → KV namespace bindings
- Variable name: `WAITLIST`
- KV namespace: (the one created in step 2)
- Redeploy

### 5. Custom domain
- Pages project → Custom domains → Add `holdingmusic.com`
- DNS is automatic since the domain is on Cloudflare Registrar

### 6. Verify the endpoints
```bash
curl https://holdingmusic.com/api/founding-count
# Expect: {"current":0,"cap":1000,"remaining":1000,"open":true}

curl -X POST https://holdingmusic.com/api/founding-artist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","platform":"suno","handle":"@testartist","tracks":3,"community":"suno-discord","pressConsent":true,"hp":""}'
# Expect: {"ok":true,"position":1,"tier":"founding"}
```

### 7. Hard refresh after deploy
**Always** `Ctrl+Shift+R` (or open incognito) after a Cloudflare deploy. Edge cache lies otherwise.

## Pre-launch hardening checklist

Before posting to Reddit / Discord / Twitter (i.e. before any traffic spike):

- [ ] **Cloudflare Turnstile** — replace the honeypot-only spam guard with proper Turnstile widget on `/founding-artist` form. Site keys in Pages → Settings → Environment variables.
- [ ] **Rate limit** — WAF rule: `5 req/min/IP` on `POST /api/founding-artist`. Cloudflare → Security → WAF → Rate limiting rules.
- [ ] **Confirmation email** — wire Resend (or Cloudflare Email Workers) into `functions/api/founding-artist.js` so submitters get a confirmation. Currently the endpoint returns position but does not email.
- [ ] **Real audio URLs** — plug in 4 actual tracks for the player. Without these, the player is visual-only (which is fine for now, but real audio doubles dwell time).
- [ ] **Fill founder essay placeholders** — `[Her name]`, `[month, year]`, and `[Your name]` in `story/index.html`. Three spots in the file. Search-and-replace, or leave them — your call.
- [ ] **Service deeplinks** — replace `href="#"` on the switchable services row with real outbound URLs once you have tracks on those services.
- [ ] **Trademark** — file USPTO + IPOPHL + EUIPO for "HoldingMusic" wordmark and the fermata mark. Music industry attorney can bundle this with the Trail Clause TOS work.

## Files Kevin will likely want to edit

| File | What to change |
|---|---|
| `index.html` line ~580 (FEATURED array) | Real track titles, artists, genres, durations, audio URLs |
| `index.html` line ~440 (founding-banner) | Adjust copy once cap drops below 500 |
| `story/index.html` | Three placeholder spots: `[Her name]`, `[month, year]`, `[Your name]` |
| `founding-artist/index.html` | Live counter wired to `/api/founding-count` — no edits needed |

## NASA Power of 10 compliance

All JS in this package follows P10:
- No globals (every script is IIFE-wrapped)
- Bounded loops (MAX_ELEMENTS, MAX_PAGES constants — no `while(true)`)
- ≥2 assertions per non-trivial function (type + range checks)
- Functions ≤60 lines
- All return values checked (`if (el === null) return`)
- No `@ts-ignore` or `eslint-disable`
- No silent failure paths

Codex `/codex:adversarial-review --background --base main` before any production deploy.

## Brand voice cross-reference

See `../holdingmusic-manifesto.md` and `../holdingmusic-founder-essay.md` (sibling files outside this package) for the voice bank and full essay. The thesis: **the tool is never the music.**

---

**Built in Palawan, May 2026.** Artisans F&B Corp.
