# Flot Design System

## Product Overview

**Flot** is a mobile app for taxi-pooling among airport travelers. It matches two strangers heading in the same direction from major airports (starting with Milan Malpensa, MXP) so they can split the fixed taxi fare — e.g. €120 → €60 each.

### Core User Moments

1. **Trip Creation** — User enters terminal, destination, flight datetime, and luggage details
2. **Matching** — System searches for a compatible co-rider (scheduled in advance or live at the airport)
3. **Connection** — Once matched, users see each other's profile and can chat in-app

### Monetization

- **€1.99** one-time unlock fee to reveal a match
- **€4.99/mo** PRO subscription (priority matching, no unlock fees, etc.)

### Sources

This design system was created from the product brief. No existing codebase, Figma files, or brand assets were provided — all brand identity, colors, typography, and components were designed from scratch for this project.

---

## Brand Essence

**Tagline:** Split the ride. Share the savings.

**Positioning:** Flot sits at the intersection of airport efficiency and ride-share friendliness. The brand should feel trustworthy (you're sharing a taxi with a stranger), modern (app-native), and travel-oriented (international, clean, confident).

**Name origin:** "Flot" evokes flotation, flow, lightness — the ease of gliding from airport to destination. Short, memorable, works across languages.

---

## CONTENT FUNDAMENTALS

### Tone of Voice
- **Friendly but efficient.** Not overly casual (this isn't a meme app), not corporate (this isn't enterprise SaaS). Think: a well-traveled friend who knows the airport shortcuts.
- **Reassuring.** Users are trusting the app to pair them with a stranger. Copy should quietly build confidence.
- **Action-oriented.** Short sentences. Clear CTAs. No fluff.

### Language & Casing
- **Sentence case** for all UI elements (buttons, labels, headings). "Create a trip" not "Create A Trip"
- **Title Case** only for the product name "Flot" and navigation tabs
- **You/Your** to address the user directly: "Your match is ready" not "The match is ready"
- **We** sparingly, for brand voice: "We found someone heading your way"
- Primary language: **English** with Italian localization planned

### Copy Style
- CTAs: imperative verbs — "Split this ride", "Unlock match", "Start chatting"
- Status messages: present tense — "Searching for riders…", "Match found"
- Error states: empathetic + solution — "No riders found yet. We'll notify you when someone matches."
- Numbers: always use digits (€60, 2 riders, 15 min)
- Currency: Euro symbol before amount (€1.99)

### Emoji & Special Characters
- **No emoji** in core UI (buttons, labels, navigation, cards)
- Emoji permitted in chat (user-generated), marketing banners, and onboarding illustrations only
- Use the → arrow character in "learn more" style links

---

## VISUAL FOUNDATIONS

### Color Philosophy
Flot uses a **teal-forward** palette. Teal communicates trust, calm, and modernity — critical when asking users to share a ride with a stranger. A **warm coral** accent provides energy and draws the eye to primary actions.

- **Primary (Teal):** The dominant brand color. Used for headers, primary buttons, active states, and brand moments. Rich enough to feel premium, not so dark it feels heavy.
- **Accent (Coral):** Reserved for primary CTAs, badges, notifications, and moments of delight. Warm contrast against the cool teal.
- **Neutrals:** Cool-toned grays that harmonize with the teal primary. Used for text, borders, backgrounds, and disabled states.
- **Semantic:** Standard success/warning/error colors, tuned to complement the teal palette.

See `colors_and_type.css` for exact values.

### Typography
- **Display / Headings:** Sora — geometric, modern, slightly tech-forward but approachable. Used for all headings h1–h3, hero text, and feature callouts.
- **Body / UI:** Plus Jakarta Sans — warm, readable, slightly rounded terminals that feel friendly. Used for body text, labels, buttons, form inputs.
- **Monospace:** JetBrains Mono — for data display (prices, codes, times).

All fonts sourced from Google Fonts. See `fonts/` folder.

### Type Scale
| Token | Size | Weight | Font | Use |
|-------|------|--------|------|-----|
| display-xl | 32px | 700 | Sora | Hero headlines |
| display-lg | 28px | 700 | Sora | Screen titles |
| display-md | 24px | 600 | Sora | Section headers |
| display-sm | 20px | 600 | Sora | Card titles |
| body-lg | 18px | 400 | Plus Jakarta Sans | Lead paragraphs |
| body-md | 16px | 400 | Plus Jakarta Sans | Default body |
| body-sm | 14px | 400 | Plus Jakarta Sans | Secondary text |
| body-xs | 12px | 500 | Plus Jakarta Sans | Captions, metadata |
| label-lg | 16px | 600 | Plus Jakarta Sans | Button text |
| label-md | 14px | 600 | Plus Jakarta Sans | Tab labels, form labels |
| label-sm | 12px | 600 | Plus Jakarta Sans | Badges, chips |
| mono-md | 14px | 500 | JetBrains Mono | Prices, codes |

### Spacing
4px base unit. Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120.

- **Micro spacing** (4–8px): Between icon and label, between badge elements
- **Component spacing** (12–24px): Padding inside cards, buttons, inputs
- **Section spacing** (32–64px): Between content sections on a screen
- **Screen spacing** (80–120px): Top/bottom page margins, hero spacing

### Border Radii
| Token | Value | Use |
|-------|-------|-----|
| radius-xs | 4px | Small chips, inline badges |
| radius-sm | 8px | Buttons, inputs, small cards |
| radius-md | 12px | Standard cards, modals |
| radius-lg | 16px | Large cards, bottom sheets |
| radius-xl | 24px | Feature cards, hero elements |
| radius-full | 9999px | Avatars, pills, FABs |

### Shadows / Elevation
Four elevation levels using cool-toned shadows:
- **Level 1 (Subtle):** `0 1px 3px rgba(10, 22, 36, 0.06)` — inputs, flat cards
- **Level 2 (Medium):** `0 2px 8px rgba(10, 22, 36, 0.08)` — raised cards, dropdowns
- **Level 3 (Prominent):** `0 8px 24px rgba(10, 22, 36, 0.12)` — modals, bottom sheets
- **Level 4 (Dramatic):** `0 16px 48px rgba(10, 22, 36, 0.16)` — floating action buttons, popovers

### Backgrounds
- **Primary screens:** White (`#FFFFFF`) or light gray (`#F5F7FA`)
- **Feature sections:** Primary-50 teal tint (`#EBF5F4`)
- **No gradients** on UI backgrounds — solid colors only
- **Dark surfaces:** Neutral-900 (`#1A1D23`) for dark mode or contrast sections
- **No full-bleed photography** in the app chrome — imagery confined to cards and avatars
- **No hand-drawn illustrations** — clean, geometric, iconographic style

### Animation & Motion
- **Duration:** 200ms for micro-interactions (hovers, toggles), 300ms for transitions (screen changes, modals), 500ms for emphasis (match reveal)
- **Easing:** `cubic-bezier(0.25, 0.1, 0.25, 1.0)` (ease-out) for entrances, `cubic-bezier(0.5, 0, 0.75, 1.0)` for exits
- **No bounces, no spring physics.** Motion should feel smooth and purposeful, like an airport conveyor.
- **Fade + slide** for screen transitions (content slides up 12px while fading in)
- **Scale pulse** for the match-found moment (subtle 1.0 → 1.05 → 1.0)

### Hover & Press States
- **Hover:** Background darkens by 8% (mix with black at 8%). Transition: 150ms ease
- **Press/Active:** Scale to 0.97 + background darkens by 12%. Transition: 100ms ease
- **Focus:** 2px ring in primary-300 with 2px offset
- **Disabled:** 40% opacity, no pointer events

### Cards
- White background, radius-md (12px), shadow Level 2
- 16px internal padding (20px on larger cards)
- No colored left-border accents
- Subtle 1px border in neutral-100 as fallback for low-contrast environments
- Content hierarchy: title (display-sm) → metadata (body-sm, neutral-500) → action (label-md, primary)

### Imagery
- **Photography style:** Bright, natural light, warm tones. Airport terminals, taxi interiors, cityscapes, luggage.
- **Avatar style:** Circular crop (radius-full), 1px border in neutral-200, placeholder uses initials on primary-100 background
- **No stock-photo-feeling images.** Candid, documentary style preferred.
- **Image treatment:** No filters, no overlays, no grain. Clean and direct.

### Transparency & Blur
- **Bottom sheet overlay:** `rgba(0, 0, 0, 0.4)` backdrop
- **Blur:** `backdrop-filter: blur(8px)` on overlapping navigation only (not standard usage)
- Minimal use of transparency — the app should feel solid and grounded

---

## ICONOGRAPHY

### Icon System
Flot uses **Lucide Icons** — a clean, consistent, open-source icon set with 1.5px stroke weight. Loaded via CDN.

**CDN:** `https://unpkg.com/lucide-static@latest/font/lucide.css`

### Icon Usage Rules
- **Size:** 20px default in UI, 24px in navigation, 16px inline with text
- **Color:** Inherits text color (currentColor)
- **Style:** Stroke-only, 1.5px weight. No filled icons except for active navigation states.
- **Navigation bar:** Uses filled variants for active tab, stroke for inactive
- **No emoji as icons.** No Unicode symbol substitutes.
- **Custom brand icons:** The Flot logomark and specific feature icons (match animation, route visualization) are custom SVGs in `assets/`.

### Key Icons Used
| Concept | Lucide Icon | Usage |
|---------|-------------|-------|
| Plane | `plane` | Flight/airport references |
| Map pin | `map-pin` | Destination |
| Users | `users` | Match / co-rider |
| Message | `message-circle` | Chat |
| Clock | `clock` | Time / schedule |
| Luggage | `briefcase` | Luggage indicator |
| Star | `star` | Ratings / PRO |
| Shield | `shield-check` | Trust / verification |
| Arrow right | `arrow-right` | Navigation / CTAs |
| Search | `search` | Search / matching |
| Settings | `settings` | Settings |
| Bell | `bell` | Notifications |
| Credit card | `credit-card` | Payment |
| Check circle | `circle-check` | Success / confirmed |
| X circle | `circle-x` | Error / cancelled |

---

## File Index

| Path | Description |
|------|-------------|
| `README.md` | This file — brand overview, visual foundations, content guide |
| `SKILL.md` | Agent skill definition for Claude Code compatibility |
| `colors_and_type.css` | CSS custom properties for colors, typography, spacing, shadows |
| `assets/logo-full.svg` | Full logo (wordmark + connected-dots icon) |
| `assets/logo-icon.svg` | App icon (teal rounded square with dots) |
| `assets/logo-wordmark-dark.svg` | Wordmark only, dark text |
| `assets/logo-wordmark-white.svg` | Wordmark only, white text |
| `assets/logo-full-white.svg` | Full logo for dark backgrounds |
| `preview/` | Design System tab preview cards (16 HTML files) |

### Preview Cards
| Card | Group | File |
|------|-------|------|
| Primary Colors | Colors | `preview/colors-primary.html` |
| Accent Colors | Colors | `preview/colors-accent.html` |
| Neutral Colors | Colors | `preview/colors-neutrals.html` |
| Semantic Colors | Colors | `preview/colors-semantic.html` |
| Display Type | Type | `preview/type-display.html` |
| Body Type | Type | `preview/type-body.html` |
| Labels & Mono | Type | `preview/type-labels-mono.html` |
| Spacing Scale | Spacing | `preview/spacing-scale.html` |
| Border Radii | Spacing | `preview/spacing-radii.html` |
| Shadow System | Spacing | `preview/spacing-shadows.html` |
| Buttons | Components | `preview/comp-buttons.html` |
| Form Inputs | Components | `preview/comp-inputs.html` |
| Cards | Components | `preview/comp-cards.html` |
| Badges & Pills | Components | `preview/comp-badges.html` |
| Navigation | Components | `preview/comp-navigation.html` |
| Logo | Brand | `preview/brand-logo.html` |

### UI Kits
| Kit | Path | Description |
|-----|------|-------------|
| Flot Mobile App | `ui_kits/flot-app/` | Interactive click-through prototype with 6 screens |

**UI Kit files:**
| File | Role |
|------|------|
| `ui_kits/flot-app/index.html` | Main entry — renders app in iOS device frame |
| `ui_kits/flot-app/components.jsx` | Shared primitives: Avatar, Badge, Button, InputField, Card, TopBar, BottomNav, TripCard, MatchCard, Toggle, SectionHeader |
| `ui_kits/flot-app/screens.jsx` | Full screens: Home, NewTrip, Matching, MatchDetail, Chat, Profile |
| `ui_kits/flot-app/ios-frame.jsx` | Device bezel (starter component) |
| `ui_kits/flot-app/README.md` | Kit-specific documentation |

### Fonts
All fonts loaded via Google Fonts CDN (`@import` in `colors_and_type.css`):
- **Sora** (400, 500, 600, 700) — display headings
- **Plus Jakarta Sans** (400, 500, 600, 700) — body & UI
- **JetBrains Mono** (400, 500, 600) — monospace data

### Icons
Lucide Icons loaded via CDN: `https://unpkg.com/lucide-static@0.460.0/font/lucide.min.css`
