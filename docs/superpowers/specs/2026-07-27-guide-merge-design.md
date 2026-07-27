# Merging the retailer guide into the onboard site

**Ticket:** [TT-377](https://linear.app/street/issue/TT-377) (child of TT-230)
**Date:** 2026-07-27
**Repos:** `street-vendor-portal` (all changes), `street-training-site` (source, unchanged)

## Problem

The retailer guide ships today as `street-training-site`: a standalone Next.js app on its own
Vercel project. Retailers experience two websites where there should be one product, and someone
finishing onboarding at `onboard.street.london` has no in-product route to the guide. It is also a
second deploy to maintain for what is essentially a docs section.

## Outcome

The training site's content and renderer move into `street-vendor-portal` under `/guide`, sharing
the portal's shell, nav, footer and design tokens. Ships to the vendor-portal `staging` branch
only. The standalone training site stays live and untouched until the merged guide reaches
production; retiring it is a follow-up.

Both apps are Next.js 16 / React 19 and already share the STREET tokens (cream, sand, black, lime;
Hanson + Barlow), so this is a structural merge, not a redesign.

## Decisions

| Decision | Choice | Reason |
| --- | --- | --- |
| Merge shape | Full merge into vendor-portal | One deploy, one design system, one nav. The guide is only useful if it feels like part of the product. |
| Collision policy | Vendor portal is always the base | Single shell; the funnel is the production-critical surface and must not move. |
| Visibility | Public, `noindex` | Matches the training site today. Copy is still being finished; flipping to indexable later is a one-line change. |
| Front door | `/` still redirects to `/onboard` | The `?shop` deep-link is App Store req 2.3.1 (TT-359). Smallest correct change; a hub page can come later. |
| Guide CSS | Scoped `app/guide/guide.css` | `globals.css` stays 645 lines and the funnel cannot be reached by guide CSS. |

## File moves

| From `street-training-site` | To `street-vendor-portal` |
| --- | --- |
| `content/` (36 markdown files) | `content/` |
| `lib/content.ts` | `lib/content.ts` |
| `scripts/sync-content.mjs`, `scripts/add-order.mjs` | `scripts/` |
| `app/page.tsx` | `app/guide/page.tsx` |
| `app/[...slug]/page.tsx` | `app/guide/[...slug]/page.tsx` |
| `app/_components/Sidebar.tsx` | `app/guide/_components/Sidebar.tsx` |
| guide portion of `app/globals.css` | `app/guide/guide.css` |
| `app/layout.tsx`, `app/_components/TopNav.tsx`, `app/_components/Footer.tsx`, `app/icon.svg` | dropped |

New file: `app/guide/layout.tsx` — imports `guide.css`, renders the portal's `Nav` and `Footer`
around a `.guide` wrapper.

Dependencies added: `marked@^14.1.4`, `gray-matter@^4.0.3`.

The `@/*` tsconfig alias is identical in both repos, so `lib/content.ts` needs no import rewrites.

## Routing

The root route, the `/onboard` funnel and the `?shop` deep-link are unchanged.

```
/                → redirect /onboard   (?shop preserved — unchanged)
/onboard/*       → funnel              (unchanged)
/set-password    → (unchanged)
/change-password → (unchanged)
/guide           → guide index
/guide/<section>/<page> → article
```

`lib/content.ts` constructs hrefs as `"/" + slug.join("/")` in two places (lines 87 and 149).
Both read a `GUIDE_BASE = "/guide"` constant, exported from `lib/content.ts`. The sidebar, index
cards and `[[wiki-links]]` all derive from `doc.href`, so they follow from that one edit.

There is one further hardcoded path: the article breadcrumb in `[...slug]/page.tsx:39`
(`<Link href="/">Guide</Link>`), which is not derived from `doc.href`. It imports and uses the
same `GUIDE_BASE` constant so the guide's root is defined once. (`TopNav.tsx` also hardcodes `/`,
but that component is dropped.)

## Styling

A class-name audit found only **two** genuine collisions between the two stylesheets. The training
CSS is BEM-ish (`.card__title`, `.sidebar__link`) and all prose rules are already scoped under
`.doc`, so the merge surface is small.

- `.footer` — training rules deleted; the portal's `Footer` component is used.
- `.hero` — renamed `.guide-hero`.
- Base resets (`html`, `body`, `a`, `button`) — deleted; `globals.css` already has them.
- The duplicate `:root` token block — deleted. Colours and fonts keep one definition.
- Four guide-local tokens (`--content-w`, `--sidebar-w`, `--watch`, `--missing`) move onto the
  `.guide` wrapper class rather than `:root`, since they are layout dimensions and callout colours
  that only the guide uses.

Every rule in `guide.css` nests under a `.guide` root class. Importing a stylesheet in a layout
does not scope it in the App Router — Next.js chunks CSS by route, but once loaded during a
client-side navigation the rules stay in the document. The `.guide` ancestor makes containment
real regardless of load order.

Restyling the guide in Tailwind was rejected: `marked` emits plain HTML with no class hooks, so
utility classes cannot be applied to the rendered markdown.

## Entry points and indexing

- `app/_components/Nav.tsx` gains a `Guide` link.
- `app/onboard/complete` gains a link into the guide.
- `next.config.ts` gains `X-Robots-Tag: noindex, nofollow` scoped to `/guide/:path*`.

Noted but out of scope: the onboarding funnel has no robots config at all today, so it is
indexable. This spec does not change that.

## Content loop

Unchanged in shape. Copy is authored in the STREET-Training Obsidian vault, `npm run sync` (now
living in vendor-portal) copies the numbered section folders into `content/`, excluding
`_Internal/`; then commit and deploy. The vault stays the single source of truth for copy.

Accepted consequence of the full merge: a copy fix now redeploys the onboarding app. A git
submodule was considered and rejected — it would still require a vendor-portal commit to bump the
pointer, so it does not actually decouple the deploys, and it complicates the Vercel build.

## Verification

1. `/guide` renders the index; every article resolves at `/guide/<section>/<page>`.
2. Wiki-links between articles resolve under `/guide/`; no link 404s.
3. Section rail visible at desktop 1280; collapses to the "Browse the guide" switcher at mobile
   390. **Checked with screenshots at both widths, not inferred from the diff** — a past mobile fix
   silently removed the desktop rail.
4. `curl -I` against the staging deploy returns `X-Robots-Tag: noindex, nofollow` on guide pages.
5. Funnel regression: `/` redirects to `/onboard`; `/?shop=<domain>` redirects to
   `/onboard?shop=<domain>` with the store URL prefilled and read-only.
6. Navigating `/guide` then back to `/onboard` in one session leaves the funnel visually unchanged.
7. `npm run build` succeeds and guide pages are statically generated.
8. Deployed to the `staging` branch only.

## Out of scope

- Retiring `street-training-site` and its Vercel project (follow-up once this reaches production).
- Content edits. Copy is still being finished in the vault.
- A hub page at `/`.
- Robots config for the onboarding funnel.
