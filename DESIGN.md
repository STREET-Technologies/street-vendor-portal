# Design

The retailer portal inherits street.london's visual system and adapts it for a utility flow. Cream-warm base, Hanson Bold display, Barlow body, lime accent reserved for action.

## Theme

**Light only.** No dark mode in v1.

Scene sentence: *A retail founder at their desk on a Monday morning, on a laptop or external monitor, finishing the post-Shopify-install setup for their store. Ambient lighting is daylight; their existing store dashboard is in the next browser tab.*

The surface is a utility flow that arrives after a deliberate Shopify install. It should feel like the same family of warmth as street.london, but tighter and more focused on completion.

## Color

**Strategy: Restrained.** Three warm neutrals (cream + sand + white) alternating across sections, plus a single lime accent reserved for action.

```css
/* Brand neutrals — inherited from street.london */
--cream:        #fdfbf7;   /* page base, hero, input fields when section is white */
--sand:         #f7f3ed;   /* differentiated panels, image fallback bg */
--white:        #ffffff;   /* apply section, footer */
--black:        #000000;   /* body ink, CTA, hairlines */
--gray:         #a4a3a8;   /* placeholder, faint meta */
--gray-dark:    #666666;   /* secondary text, lede, labels */
--gray-light:   #f0ede8;   /* dividers when sand is in use */

/* Action */
--primary:      #c6ff00;   /* lime — CTA hover, accent hairline, focus ring */
```

**Section alternation.** Cream (page bg, hero) → white (apply form section) → white (footer) creates a single tonal step down the page. Sand is reserved for differentiated panels (image card fallback, secondary surfaces) but is NOT used for full-bleed sections in the onboarding flow — it competed with the form when tested.

**Accent rules.** Lime is for *action and current state only*:
- The 2px hairline before each section eyebrow label
- The `here` chip in the onboarding sidebar
- The CTA button background on hover (default state is black)
- Input focus ring (4px lime glow + black border)

**Lime is NOT for:** body text, headings, hero highlights (street.london uses lime-text-with-black-stroke on its dark hero video; on cream that treatment clashes and is forbidden in this surface), section backgrounds, decorative elements.

## Typography

**Pairing:** Hanson Bold (display) + Barlow (body). No serif. Same as street.london.

```css
--font-title: 'Hanson', 'Arial Black', sans-serif;
--font-body:  'Barlow', sans-serif;
```

Hanson Bold is heavy and quirky. Confine it to display sizes (≥1rem upright headings, ≥3rem hero). At body sizes its x-height is hostile and it competes with content.

**Scale:**

| Role               | Family  | Size                      | Weight | Notes                                  |
|--------------------|---------|---------------------------|--------|----------------------------------------|
| Hero h1            | Hanson  | `clamp(2rem, 3.6vw, 2.875rem)` | 800    | -0.02em letter-spacing                 |
| Hero lede          | Barlow  | 1.05rem                   | 400    | `--gray-dark`, max-width 56ch          |
| Section title (h2) | Hanson  | `clamp(1.875rem, 3.4vw, 2.5rem)` | 800 | -0.02em letter-spacing                 |
| Section eyebrow    | Barlow  | 0.82rem                   | 600    | uppercase, 0.08em tracking, lime hairline before |
| Body               | Barlow  | 1rem (15px)               | 400    | line-height 1.65                       |
| Input              | Barlow  | 1rem                      | 400    | cream bg                               |
| Input label        | Barlow  | 0.88rem                   | 600    |                                        |
| Sidebar item       | Barlow  | 0.95rem                   | 500/600| with Hanson decimal-leading-zero numeral |
| `here` pill        | Barlow  | 0.7rem                    | 700    | uppercase, 0.08em, lime bg              |
| Form button        | Barlow  | 0.95rem                   | 600    | 8px radius                             |
| Footer note        | Barlow  | 0.85rem                   | 400    | `--gray-dark`                          |

Body line length capped at 56–75ch.

## Spacing

Base unit: 4px. Vary for rhythm; don't apply uniform padding.

- Hero section padding: 2.75rem top / 3rem bottom (compressed — this is an onboarding page, not a marketing landing)
- Apply section padding: 5rem top / 6rem bottom
- Section gap (between major blocks): 4rem desktop, 1.5rem mobile
- Hero grid columns: 2fr / 1fr (text 2/3, image 1/3)
- Apply grid columns: 4fr / 8fr (sidebar / form)
- Form fields gap: 1.875rem vertical / 1.5rem horizontal
- Container max-width: 1120px

## Layout grammar

**Page bg:** cream (default body).
**Header (nav):** transparent on cream, hairline bottom border.
**Hero:** cream, 2/3 text + 1/3 image grid, image is 1:1 aspect ratio inside a 12px sand-backed rounded card.
**Apply section:** full-bleed white, hairline top border (no border needed if the section before is the hero).
**Form sidebar:** small uppercase `Onboarding` heading + numbered ordered list with `here` chip on current step.
**Form:** two-column grid (full-width fields can span both columns). Cream-bg inputs with 1px hairline border, 8px radius, 4px lime glow + black border on focus.
**Footer:** full-bleed white via `.ftnote-wrap`, hairline top border, simple line + back-link inside a constrained container.

## Signature Components

### Eyebrow label

```html
<p class="eyebrow">Shopify install complete</p>
```

`Barlow 0.82rem 600`, uppercase, 0.08em tracking, `--gray-dark`, preceded by a 1.5rem × 2px lime hairline. Used to introduce each section without a heading-sized label.

### Hero image card

A 1:1 aspect-ratio container with `--sand` background fallback and 12px border-radius. Image fills via `object-fit: cover`. No caption overlay (was tried; competed with light areas of the photo). The image speaks for itself.

The hero photograph itself uses street.london's editorial documentary palette: warm interior, lime cast from a screen, retailer at work. Future shots in this slot should match: editorial style, warm light, lime accent appearing naturally.

### Onboarding sidebar (progress)

`<ol>` with `counter-reset`, leading-zero Hanson numerals in `--gray`. Each `<li>` has hairline bottom border. Three states:
- `done`: text + numeral in `--gray-dark`, suffixed with `✓`
- `current`: text + numeral in `--black` weight 600, suffixed with lime `here` pill
- (default): text in `--gray-dark`, numeral in `--gray`

### Form input

```css
.fld input {
  background: var(--cream);
  border: 1px solid rgba(0,0,0,0.14);
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border-radius: 8px;
}
.fld input:hover { border-color: rgba(0,0,0,0.28); }
.fld input:focus {
  border-color: var(--black);
  box-shadow: 0 0 0 4px rgba(198, 255, 0, 0.32);
}
```

Cream background ensures inputs are visible against white apply section bg. Hover darkens border. Focus carries both black border AND lime ring — accent is never the sole signal.

### CTA button

```css
.btn {
  background: var(--black);
  color: var(--white);
  font-family: var(--font-body);
  font-weight: 600;
  padding: 0.95rem 1.875rem;
  border-radius: 8px;
}
.btn:hover { background: var(--primary); color: var(--black); }
```

Same primary-button pattern as street.london. Black default, lime hover. Never lime by default — that's reserved for the active state.

### Stepbar (4 segments)

A 4-segment progress bar (one segment per onboarding step) at the top of the apply section. 4px tall, 320px max-width.
- `.done`: lime
- `.current`: black
- (default): `rgba(0,0,0,0.08)`

## Motion

- Hover: `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (street.london's curve)
- Card hover: `translateY(-1px)` + `box-shadow: 0 8px 24px rgba(0,0,0,0.06)`
- Input focus: `transition: border-color 200ms, box-shadow 200ms, background 200ms`
- No bounce, no elastic
- Respect `prefers-reduced-motion: reduce`

## Accessibility

- `--black` on `--cream`: ~21:1 (AAA)
- `--gray-dark` on `--cream`: ~6.8:1 (AAA body, AA large)
- `--gray-dark` on `--white`: ~7.1:1 (AAA)
- `--gray` on `--cream`: ~3.6:1 (placeholder only — never used as standalone body)
- `--primary` on `--black`: ~12.5:1 (CTA hover state — passes)
- `--primary` on `--cream`: ~1.3:1 (NOT for text — used as background fill only, never as text on cream)

Focus rings pair color (`--black`) with offset (`4px` lime ring). Active sidebar state pairs accent color with `here` text + position (numeral changes color and pill appears).

## What this design is NOT

- Not dark. The current vendor portal's black background is the thing we're moving away from.
- Not lime-on-cream-text. The street.london hero's lime-text-with-black-outline treatment works on a dark video; on cream it clashes and is dropped.
- Not card-based. Cards exist (image card, sidebar progress group) but are not the layout primitive.
- Not animated as identity. Motion is functional only.
- Not a marketing landing. This is a utility onboarding surface downstream of a deliberate Shopify install — it greets, orients briefly, and gets out of the way of the form.
