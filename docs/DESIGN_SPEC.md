# RideWave 2.0 Design Spec ("Wave" theme)

Every UI task in `docs/AGENT_QUEUE.md` follows this file. It replaces the Sem 7 look (amber + slate + Inter). The goal for Review 1 is that **a reviewer who saw Sem 7 recognises at a glance that the product was redesigned**: new colours, new type, new layouts.

Mood: calm, premium, trustworthy ("quiet luxury" for daily commuting). Ivory and ink with a deep teal brand. Few colours, generous spacing, large type, soft shadows. No gradients except the one named below. No emoji in UI text.

---

## 1. Colour tokens (put these in `frontend/src/index.css`, replace the old values)

Keep every **existing token name** (other code uses them), only change the values, then add the new ones.

### Light (`:root`)
| Token | Value | Use |
|---|---|---|
| `--brand` | `#0F766E` | Primary buttons, links, active nav, map route |
| `--brand-dark` | `#115E59` | Hover / pressed |
| `--brand-light` | `#E6F2F0` | Tinted chips, selected rows |
| `--brand-ink` | `#FFFFFF` | Text on brand backgrounds |
| `--ai` | `#6D5BD0` | Only for ML items (admin ML Lab, "smart match") |
| `--ai-light` | `#EEEBFB` | ML tinted backgrounds |
| `--gold` | `#B08D57` | Rare highlight: savings badge, "new in 2.0" tag |
| `--success` | `#15803D` | |
| `--warning` | `#B45309` | |
| `--danger` | `#B91C1C` | SOS, cancel, delete |
| `--surface` | `#FFFFFF` | Cards |
| `--surface-2` | `#F4F1EA` | Secondary panels, inputs background |
| `--bg-primary` | `#FAF8F4` | Page background (ivory) |
| `--bg-secondary` | `#F4F1EA` | Alternate sections |
| `--bg-card` | `var(--surface)` | |
| `--border` | `#E7E2D8` | |
| `--text-primary` | `#12161C` | Headings, body (ink) |
| `--text-secondary` | `#4B5563` | |
| `--text-muted` | `#8A8F98` | |
| `--accent` / `--accent-bg` / `--accent-border` / `--error` / `--text-h` / `--social-bg` | keep as aliases pointing to the new tokens | legacy names |

### Dark (`[data-theme="dark"]` and the `prefers-color-scheme` block)
| Token | Value |
|---|---|
| `--brand` | `#2DD4BF` |
| `--brand-dark` | `#14B8A6` |
| `--brand-light` | `#0F2A28` |
| `--brand-ink` | `#06201D` |
| `--ai` | `#A99BFF` |
| `--ai-light` | `#1E1A3A` |
| `--gold` | `#D4B483` |
| `--surface` | `#151A21` |
| `--surface-2` | `#1C222B` |
| `--bg-primary` | `#0E1116` |
| `--bg-secondary` | `#12161C` |
| `--border` | `#262D38` |
| `--text-primary` | `#F2EFE9` |
| `--text-secondary` | `#B3B8C2` |
| `--text-muted` | `#7C8390` |

### The one gradient
`--hero-glow: radial-gradient(1200px 500px at 85% -10%, rgba(15,118,110,0.14), transparent 60%)` used only behind the landing hero and auth brand panel. Dark mode: same with `rgba(45,212,191,0.12)`.

### Rule: no hardcoded colours in JSX
After Task U1 there must be **no** `#F59E0B`, `#D97706`, `#FEF3C7`, `rgba(245,158,11` or `#0F172A`-style hex values left in `frontend/src`. Use `var(--token)`. Check with:
```
cd /d frontend && findstr /s /i /n /l "F59E0B D97706 FEF3C7 245,158,11 F7C948 'Inter'" src\*.jsx src\*.css
```
The command must print nothing. Map/marker colours in `MapComponent.jsx` and `MlLab.jsx` may stay as hex but must use the new palette (`#0F766E` route, `#6D5BD0` ML, `#B91C1C` danger).

---

## 2. Typography

Add to `frontend/index.html` (replace the Inter link):
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```
| Token | Value |
|---|---|
| `--font-sans` | `'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif` |
| `--font-display` | `'Instrument Serif', Georgia, serif` |

- Body, buttons, inputs, tables: `--font-sans`. Replace every `'Inter'` in CSS and JSX.
- Big page headings (landing hero, auth panel, page titles h1): `--font-display`, weight 400, letter-spacing `-0.02em`. One word or phrase in each hero heading may be *italic* in the brand colour.
- Scale (rem): 0.75 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3 / 4 (hero desktop) / 2.6 (hero phone). Use `clamp()` for h1.
- Numbers in stat cards: `--font-sans`, weight 700, `font-variant-numeric: tabular-nums`.
- Also set the browser tab title in `index.html` to `RideWave · Daily rides, shared smarter` (no em dash).

---

## 3. Shape, depth, spacing

| Token | Value |
|---|---|
| `--radius-sm` | 10px |
| `--radius-md` | 14px |
| `--radius-lg` | 20px |
| `--radius-xl` | 28px |
| `--radius-pill` | 999px |
| `--shadow-sm` | `0 1px 2px rgba(18,22,28,0.04), 0 1px 1px rgba(18,22,28,0.03)` |
| `--shadow-md` | `0 8px 24px rgba(18,22,28,0.06)` |
| `--shadow-lg` | `0 24px 60px rgba(18,22,28,0.10)` |
| `--space` | 4px base; use 8 / 12 / 16 / 24 / 32 / 48 / 72 |

Cards: surface background, 1px `--border`, `--radius-lg`, `--shadow-sm`, padding 20 (phone 16). No heavy borders, no coloured card backgrounds except brand-light / ai-light chips.

---

## 4. Shared classes (update in `index.css`, keep the names)

| Class | Spec |
|---|---|
| `.rw-btn-primary` | brand bg, brand-ink text, radius-pill, height 48px, padding 0 22px, weight 600, hover brand-dark, focus ring `0 0 0 3px var(--brand-light)` |
| `.rw-btn-secondary` | transparent bg, 1px border, text-primary, radius-pill, height 48px |
| `.rw-btn-ghost` (new) | no border, brand text, height 40px |
| `.rw-btn-danger` (new) | danger bg, white text, radius-pill |
| `.rw-input` | height 52px, surface-2 bg, 1px transparent border, radius-md, focus border brand + ring |
| `.rw-card` | as section 3 |
| `.rw-chip` (new) | radius-pill, 32px tall, surface-2 bg, 13px text; `.rw-chip.is-active` brand-light bg + brand text |
| `.rw-badge-*` | keep variants, restyle to pill, 12px, weight 600 |
| `.rw-section-title` (new) | 0.75rem, uppercase, letter-spacing 0.12em, text-muted, weight 600 |
| `.rw-display` (new) | font-display, `clamp(2.2rem, 5vw, 4rem)`, line-height 1.05 |
| `.rw-stat` (new) | card with label (section-title style) on top and number (1.75rem, 700) below, optional small delta line |
| `.rw-tag-new` (new) | small pill, gold text, 1px gold border, text "New in 2.0" |

---

## 5. Components and screens

### 5.1 Logo (`BrandLogo.jsx`)
New mark: a 28px rounded square in `--brand` containing a white "wave/route" glyph (an SVG path: two stops joined by a curved line), followed by the word `RideWave` in font-sans 700 and a small `2.0` in `--text-muted`. Inline SVG only, no image files.

### 5.2 Public navbar (`PublicNavbar.jsx`) and app navbar (`Navbar.jsx`)
- Sticky, 68px tall, background `color-mix(in srgb, var(--bg-primary) 82%, transparent)` with `backdrop-filter: blur(12px)`, bottom border.
- Desktop: logo left; centre links as pills (`Home`, `How it works` (anchor), `For drivers` (anchor), `About`). The ML Lab is admin-only and never linked publicly; right: theme toggle, `Log in` (ghost), `Get started` (primary).
- App navbar (logged in): logo, role-based links as pills with the active one brand-light, avatar circle with initials opening a small menu (Profile, Saved places, Log out).
- Phone: logo + a single menu button that opens a full-width sheet with the links.

### 5.3 Bottom nav (`BottomNav.jsx`, phones only, passengers and drivers)
Floating bar: 12px from the bottom and sides, radius-xl, surface bg, shadow-lg, 64px tall. Icons from lucide 22px with labels 11px. Active item: brand text + small brand dot above the icon. Passenger: Home, Book, Rides, Daily, Profile. Driver: Requests, Active, Earnings, Profile.

### 5.4 Landing page (`Landing.jsx`)
Light ivory page with `--hero-glow`. Sections in order:
1. **Hero**, two columns on desktop, stacked on phones.
   - Left: `.rw-tag-new` "New in 2.0: route-corridor pooling", h1 in `.rw-display`: "Your daily commute, *shared* smarter." (italic word in brand colour), one-line sub copy, two buttons: `Book a ride` (primary, to `/register/passenger`) and `See how matching works` (secondary, scrolls to `#how-it-works`). Below: three small trust items with icons: "OTP-verified ride start", "Live tracking", "Upfront fares".
   - Right: **route card illustration**: an `rw-card` with an inline SVG of a soft street grid, one teal corridor line with three stops (A pickup, B joins on the way, University), and a floating mini card "Shares 4.3 km with Rider A · saves ₹38" in brand-light. Pure SVG + CSS, no images, no map tiles.
2. **How it works**: three numbered steps in cards: "Set your route", "We match riders on your corridor", "Split the fare fairly".
3. **Ride types**: Bike / Auto / Car cards with icon, seats, base fare and per km (use the existing fare constants, do not invent prices).
4. **What's new in 2.0** grid (6 small cards, each with `.rw-tag-new`): Route-corridor pooling, ML-assisted matching (simulated data), OTP ride start, Saved places, Real-time updates, Redesigned mobile app. Cards link to a public page where one exists; the ML card has no link (the ML Lab is admin-only).
5. **For drivers** band: surface-2 background, short copy and `Drive with RideWave` button to `/register/driver`.
6. Footer (restyled).
No testimonials, ratings, user counts or city counts.

### 5.5 Auth screens (new `components/auth/AuthLayout.jsx`)
Split screen on desktop (45 / 55), stacked on phones (brand panel shrinks to a 140px header).
- Left brand panel: `--hero-glow` on `--bg-secondary`, logo, display heading ("Welcome back." for login, "Ride together." for register), 3 bullet benefits, small corridor SVG from the landing page reused.
- Right: form card max 420px. Segmented control at the top: `Passenger | Driver` that switches between `/login/passenger` and `/login/driver` (or the register pair). Inputs use `.rw-input` with labels above. Primary button full width. Links: "New here? Create an account".
- Used by `PassengerLogin`, `DriverLogin`, `PassengerRegister`, `DriverRegister`, and `Login`/`Register` if they render forms. **Only layout changes: keep all form fields, validation, Redux calls and navigation exactly as they are.** Driver registration keeps every vehicle field; on desktop it may use a 2-column grid inside the card.

### 5.6 Passenger home (`Dashboard.jsx`)
- Greeting: display font "Good morning, {firstName}." (time-based).
- **Where to?** card: large input-like button opening `/book`, with saved place chips (Home / Work / College from `components/places`) underneath; tapping a chip opens `/book` with that destination (reuse the existing saved places behaviour).
- If there is an active ride: a prominent **Active ride** card at the top (status pill, driver name, vehicle, OTP if accepted, button `Track ride`).
- Row of 3 `.rw-stat` cards computed from the user's rides (`/rides/my-rides`): Rides this month, Total spent (₹), **Saved with pooling (₹)** (sum of pool savings; show ₹0 if none). Do not invent numbers.
- Recent rides: last 3 rides as compact rows (date, from → to, fare, status pill), link `View all`.

### 5.7 Live trip view (in `MyRides.jsx` / `DriverEnRoute.jsx`)
- Vertical status stepper: Requested → Driver assigned → Arriving → On trip → Completed, current step in brand, done steps with a check.
- OTP card: big 4 digits with letter spacing, label "Share this code with your driver to start the ride".
- Driver card: initials avatar, name, rating if present, vehicle model and number.
- Pool card when pooled: "Why matched" note, shared km, your saving, number of co-riders.
- Buttons row: `Share trip` and `SOS` (from Task U7), `Cancel` (secondary danger).

### 5.8 Driver dashboard (`DriverDashboard.jsx`)
- Big online/offline toggle card at the top (pill switch, text "You're online, receiving requests").
- Stats row: Today's trips, Today's earnings (₹), Rating, from the driver's own rides.
- Request cards: pickup → drop with a thin vertical route line, distance, fare (large), ride type icon, `Pool` badge when pooled, primary `Accept` and secondary `Skip`.

### 5.9 Admin (`AdminDashboard.jsx`)
- Left sidebar on desktop (240px) with the tabs as vertical items; on phones keep the horizontal tabs.
- Overview: stat cards in `.rw-stat` style + charts from Task U8.
- Tables: zebra rows with `--bg-secondary`, 52px rows, status pills.

### 5.10 Motion
- Page content fades up 8px over 240ms on mount (CSS class `.rw-fade-up`).
- Buttons: 120ms colour transition. Respect `prefers-reduced-motion: reduce` (no animation).

---

## 6. Accessibility and phones
- Text contrast at least 4.5:1 (the palette above passes on ivory and on dark surfaces).
- Touch targets at least 44px. No horizontal scroll at 360px.
- Every icon-only button has `aria-label`.
- Test widths: 360, 390, 768, 1280.

## 7. Loaders, motion and micro-interactions (Task F6)

Motion should feel calm and quick. Nothing bounces, nothing loops forever except loaders.

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--dur-fast` | 120ms (buttons, hovers) |
| `--dur-base` | 240ms (page fade, cards, sheets) |
| `--dur-slow` | 600ms (count-up, success check) |

| Element | Spec |
|---|---|
| Top progress bar | Fixed, top 0, height 3px, `--brand`, grows from 0 to 80% while waiting, jumps to 100% and fades out when done; shown only after 150ms |
| Spinner | 18px circle, 2px border `currentColor` at 25% with one brand-coloured quarter, rotating 700ms linear |
| Skeleton | `--surface-2` block with a light sweep (`linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)`, dark mode `rgba(255,255,255,0.06)`), 1.2s loop, radius as the real element |
| Page transition | opacity 0 to 1 and translateY 8px to 0, `--dur-base`, `--ease-out` |
| Card entrance | same as page transition, staggered 40ms per card, max 8 cards staggered |
| Card hover (pointer devices only) | translateY(-2px), `--shadow-md`, `--dur-fast` |
| Button press | scale 0.98 on `:active` |
| Button loading | text stays, spinner appears on the left, button disabled, width does not change |
| Count-up | 0 to value over `--dur-slow`, ease-out, `font-variant-numeric: tabular-nums`, currency keeps the ₹ sign |
| Success check | circle and tick drawn with `stroke-dasharray` over 500ms in `--success` |
| Searching radar | 3 rings scale 0.6 to 2.2 and fade out, 2.4s loop, offset 0.8s each, brand colour |
| Driver marker | soft pulsing ring (2s loop); position interpolated over 1s between updates |
| Toast | slide 12px + fade, 200ms; thin bar at the bottom showing time left |
| Theme switch | `background-color, color, border-color` transition 200ms, added only after first paint |
| Empty state | 120px inline SVG line illustration in `--text-muted` + brand accent, one sentence, one button |

Every animation sits inside `@media (prefers-reduced-motion: no-preference)` or is switched off under `prefers-reduced-motion: reduce`. No animation library; CSS keyframes and small hooks only.

## 8. Definition of "visibly redesigned" (check before marking a UI task done)
1. Open the same page in Sem 7 (`D:\25_MajorProject\SEM 7\...`) and Sem 8 side by side: colour, font and layout must all differ.
2. Light and dark mode both look finished.
3. 390px phone view has no overflow and uses the bottom nav where expected.
