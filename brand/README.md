# HoldingMusic — Brand

A music platform identity. Restraint in form, vibrancy in colour.

## The Mark

A **fermata** — the classical musical notation meaning *"hold this note as long as desired."* A dot above a sustained line. We abstracted it to its two essential elements and made it our symbol.

It reads as:
- A musical notation (instant music industry recognition)
- A held tone (literal embodiment of "holding music")
- A minimal geometric mark (works as a 16×16 favicon)

The mark is `currentColor` in SVG — it inherits whatever colour you set in CSS, so it can be phosphor lime, magenta, white, black, or any genre-reactive colour.

## Files

| File | Use |
|---|---|
| `mark.svg` | The mark alone — `currentColor`, scales infinitely |
| `logo-full.svg` | Mark + wordmark horizontal lockup |
| `icon.svg` | App icon (512×512) — rounded square, phosphor lime mark on near-black |
| `favicon.svg` | Browser favicon (32×32 viewBox, phosphor lime, no background) |

## Colour System

The base is a deep warm black. The accent system is **vibrant + genre-reactive**.

### Base
```
--bg:           #0A0908   /* deep warm black */
--bg-elev:      #161413   /* surfaces, cards */
--bg-line:      #2A2724   /* dividers */
--ink:          #F5F2EC   /* primary text — warm cream */
--ink-soft:     #A19B92   /* secondary text */
--ink-faint:    #6B655D   /* tertiary */
```

### Vibrant Accents
The two primary accents:
```
--accent:        #D4FF3A   /* phosphor lime — primary */
--accent-hot:    #FF2E93   /* electric magenta — energy */
```

### Genre-Reactive Palette
Each genre cluster gets a signature colour. These can drive album-art generators, leaderboard tabs, mood indicators, and now-playing glows.
```
--g-ambient:     #5BFFE3   /* aqua — chill / lo-fi / ambient */
--g-electronic:  #D4FF3A   /* phosphor lime — house / techno / electronic */
--g-pop:         #FF2E93   /* magenta — pop / dance */
--g-rock:        #FF6B35   /* coral — rock / alt */
--g-hiphop:      #B388FF   /* lavender — hip-hop / R&B */
--g-world:       #FFC857   /* amber — world / folk / cinematic */
```

### Rule
**One dominant, one sharp accent.** Don't use all six colours at once. The palette is a wardrobe, not a costume.

## Type

| Role | Family | Source | Notes |
|---|---|---|---|
| Display headlines | **Fraunces** | Google Fonts | Variable; use opsz 80–144 for large sizes, weight 300–600 |
| UI / body | **Manrope** | Google Fonts | Geometric grotesk; weights 400–700 |
| Mono / spec | **JetBrains Mono** | Google Fonts | Use for timestamps, track durations, metadata, code-style labels |

Pairing pattern: Fraunces for art, Manrope for function, JetBrains Mono for spec sheets.

## Logo Usage

**Spacing.** Always leave clear-space equal to the height of the fermata dot around the entire mark.

**Minimum sizes.**
- Mark only: 24px square
- Lockup: 120px wide

**Don't.**
- Don't stretch or skew
- Don't apply drop shadows
- Don't reverse the mark's proportions (the dot must remain above the bar)
- Don't place the mark on busy photographic backgrounds without a solid plate

**Do.**
- Apply genre colours liberally — the mark is designed to wear them
- Animate it: the bar can "sustain" (pulse), the dot can "drop" (settle into place) on page load
- Pair with other musical glyphs (♩, ♪, fermata in text form) only when context demands; otherwise let it stand alone

## Voice (cross-reference)

See `holdingmusic-manifesto.md` for the written voice — this brand visualises *"The tool is never the music."* The mark is a tool of notation. The music is what the tool lets through.
