# Product

## Register

brand

## Users

**Primary audience: post-install retailers.** Owners and founders of London-based e-commerce brands across a wide category spread: streetwear, contemporary fashion, high-end (Represent-tier), activewear, beauty, lifestyle. Predominantly Gen Z and millennial founders running their own stores. Predominantly on Shopify, with a tail on WooCommerce, Magento, and custom platforms.

**The arrival context has shifted.** Per Shopify's recent policy change, retailers now install the STREET app via the Shopify App Store. OAuth and app install happen entirely in Shopify's flow, not ours. Once installed, Shopify redirects them into vendor.street.london (the codebase namespace) to complete onboarding.

This means: the retailer arrives *already committed*. They have decided to use STREET. They are not evaluating, comparing, or hesitating. Our job is to welcome them and finish setting them up, not to pitch them.

**Job to be done:** Complete the additional onboarding details that Shopify install does not collect (operator name, contact, business address, operating hours, category) and confirm the retailer as live on the STREET marketplace inside a single session.

## Product Purpose

A clean, on-brand onboarding flow that lives downstream of the Shopify app install. Two roles in one surface:

- **Welcome and orient.** Make it immediately clear that the install worked, what STREET will do for the retailer once live, and what's left to complete the setup.
- **Collect what Shopify install did not.** A short, well-paced form (operator, contact, address, hours, category) that respects the retailer's time and doesn't repeat anything Shopify already provided.

Success is twofold: (a) low-friction completion of the post-install onboarding, measured by completion rate from welcome → confirmed; (b) a first impression of STREET as a competent operational partner that respects retailer time, measured by retailer activation in the weeks following onboarding.

## Naming convention

External (user-facing copy, page titles, headlines, CTAs, marketing): **retailer**. Always.

Internal (route names, code identifiers, API namespaces, database schema, env vars): **vendor** is the existing codebase convention and stays. Do not touch `/vendors/*` API routes, `VendorOnboardingFormData` types, or similar internals as part of UI copy work.

If a user-facing surface ever has to say `vendor` because of a technical constraint (a Shopify-injected label, an external link), flag it.

## Brand Personality

**Three words:** confident, direct, operational. Supporting register: warm, London, premium.

**Voice and tone.** Plain English with retail and logistics fluency — the voice of an experienced operator briefing another operator on a partnership they've already signed. Friendly handshake at the door, not a marketing pitch. The retailer should feel addressed as a peer who already understands margins, fulfilment windows, and stock control, not as a lead to be educated. No exclamation marks, no growth-y verbs ("supercharge", "unlock", "elevate"), no AI-marketing cadence.

**Emotional goal.** A retailer should leave the onboarding thinking "good — they handled my first impression with the same competence I expect from their delivery operation". The same-day mechanic is operational, not novelty.

## Cohesion with street.london

The retailer portal is the sister of street.london, not a separate brand. It uses the same token system: cream `#fdfbf7` base, sand `#f7f3ed` for differentiated sections, Hanson Bold display, Barlow body, lime `#c6ff00` as accent on key words and CTA hover, black CTA button. The retailer should feel they have not left STREET when Shopify redirects them in.

The portal can simplify and tighten relative to street.london (it is a utility flow, not a marketing surface) but it cannot diverge in palette, typography, or warmth.

## Anti-references

Explicit nos. These are the shapes the redesign is reacting against:

- **AI-slop SaaS template.** The current state. A 3-column benefits grid with stock Lucide icons (TrendingUp / RefreshCw / Rocket) and generic upside copy ("Increase Exposure", "Real-time Sync", "Grow Your Business"). Wrong shape, wrong tone, wrong audience.
- **Generic dark-mode YC startup landing.** Black background + centered hero + oversized bold headline + bright neon CTA + dim body text. The lazy answer that every Y Combinator company defaults to. Even though STREET's palette includes black and lime, this template is what the redesign must escape. The cream + Hanson + lime treatment of street.london is the reference, not the SaaS dark default.
- **Consumer marketplace tone (Etsy, Depop).** Warm, hand-drawn, friendly-illustrated, "we're a community". Wrong register and wrong audience — these are operator-to-operator surfaces, not consumer signups.
- **Web3 / crypto / gaming aesthetic.** Glowing gradients, animated grids, neon glows on borders, particle systems. Wrong category entirely.
- **Fabricated proof.** Named retailers we do not actually have. Invented GMV figures. Fictional fleet sizes. Fictional dispatch averages. The mechanic is the proof until we have real numbers to show; pretending otherwise is disingenuous and is forbidden in this surface.

## Design Principles

1. **The mechanic is the proof.** While we lack real retailer logos and operational stats to publish, the credibility carrier is the operational story itself: a customer orders, you ship from where you already ship from, our rider delivers same-day. Show the mechanic clearly. Do not invent retailers, GMV, or fleet metrics to fill the gap.
2. **Type does the heavy lifting.** Retailers come from many category aesthetics (streetwear → beauty → high-end → activewear) and no single photographic mood fits all of them. Hanson Bold for display plus Barlow for body carries the identity; imagery is supporting and rotates per section without driving the system.
3. **Lime is the accent, not the brand.** Lime (`#c6ff00`) marks the action — CTA hover, single-word highlight in a heading, active state, focus rings, "you are here". It is not a body color, not a heading color, not a hero fill. Black and cream carry weight; lime carries direction. This is the discipline street.london uses; we inherit it.
4. **Onboarding is part of the brand.** Every label, every grouping, every microcopy line is an opportunity to demonstrate operator-grade taste. No `placeholder="John"` defaults. The retailer should feel the brand all the way through to "confirm and go live".
5. **Welcome over pitch.** The retailer arrived through a deliberate Shopify install. Treat them as already in. The hero is a handshake, not a banner. The flow surfaces what's done, what's now, and what's left, in that order.

## Accessibility & Inclusion

- **Target:** WCAG 2.1 AA across all surfaces.
- **Current state to fix.** The existing site uses `text-gray-400` body on `bg-black`, which fails AA at the smaller sizes used in the benefits grid and form helper text. The redesign establishes a text-soft / text-pale scale that passes against the cream base inherited from street.london.
- **Forms.** Every input has a visible label (no placeholder-as-label patterns). Focus rings carry both color AND offset — lime alone is never the sole signal of focus or error. Error states use color plus an icon plus text.
- **Motion.** Respect `prefers-reduced-motion: reduce`. No parallax by default, no scroll-triggered hijacks that fight a screen reader's flow.
- **Type.** Body line length capped between 65 and 75ch. Hanson Bold's heavy x-height makes it hostile at body sizes — confine it to display.
