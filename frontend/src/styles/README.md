# RideWave Design System

Tokens and shared classes for consistent UI across light and dark themes.

## CSS Custom Properties (Design Tokens)

### Colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--brand` | #0F766E | #2DD4BF | Primary buttons, links, active nav |
| `--brand-dark` | #115E59 | #14B8A6 | Hover / pressed |
| `--brand-light` | #E6F2F0 | #0F2A28 | Tinted chips, selected rows |
| `--brand-ink` | #FFFFFF | #06201D | Text on brand backgrounds |
| `--ai` | #6D5BD0 | #A99BFF | AI / Pooling Lab items |
| `--ai-light` | #EEEBFB | #1E1A3A | AI tinted backgrounds |
| `--gold` | #B08D57 | #D4B483 | Savings badge, "new" tag |
| `--accent` | = --brand | = --brand | Legacy alias (App.css) |
| `--accent-bg` | = --brand-light | = --brand-light | Legacy alias |
| `--accent-border` | = --brand | = --brand | Legacy alias |
| `--success` | #15803D | #15803D | Success states |
| `--warning` | #B45309 | #B45309 | Warning states |
| `--danger` | #B91C1C | #B91C1C | Error / danger states |
| `--error` | = --danger | = --danger | Legacy alias |

### Surfaces

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--surface` | #FFFFFF | #151A21 | Main surface background |
| `--surface-2` | #F4F1EA | #1C222B | Secondary surface |
| `--bg-primary` | #FAF8F4 | #0E1116 | Page background (ivory) |
| `--bg-secondary` | #F4F1EA | #12161C | Alternate background |
| `--bg-card` | = --surface | = --surface | Card background |
| `--social-bg` | = --surface-2 | = --surface-2 | Social section bg |
| `--border` | #E7E2D8 | #262D38 | Borders and dividers |

### Text

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--text-primary` | #12161C | #F2EFE9 | Primary text / headings |
| `--text-secondary` | #4B5563 | #B3B8C2 | Secondary / body text |
| `--text-muted` | #8A8F98 | #7C8390 | Placeholder / muted text |
| `--text-h` | = --text-primary | = --text-primary | Heading text alias |

### Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 10px | Small cards, inputs |
| `--radius-md` | 14px | Default radius |
| `--radius-lg` | 20px | Cards, modals |
| `--radius-xl` | 28px | Large modals, sheets |
| `--radius-pill` | 999px | Pill buttons, chips |
| `--radius` | = --radius-md | Generic alias |

### Shadow

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--shadow-sm` | 0 1px 2px rgba(18,22,28,0.04), 0 1px 1px rgba(18,22,28,0.03) | 0 1px 2px rgba(0,0,0,0.2) | Cards |
| `--shadow-md` | 0 8px 24px rgba(18,22,28,0.06) | 0 8px 24px rgba(0,0,0,0.3) | Dropdowns |
| `--shadow-lg` | 0 24px 60px rgba(18,22,28,0.10) | 0 24px 60px rgba(0,0,0,0.4) | Modals, toasts |
| `--shadow` | = --shadow-sm | = --shadow-sm | Generic alias |

### Font Sizes

| Token | Value | Usage |
|---|---|---|
| `--text-xs` | 0.75rem | Labels, captions |
| `--text-sm` | 0.875rem | Small body |
| `--text-base` | 1rem | Default body |
| `--text-lg` | 1.125rem | Large body |
| `--text-xl` | 1.375rem | Subheadings |
| `--text-2xl` | 1.75rem | Section headings |
| `--text-3xl` | 2.25rem | Page headings |

### Font Family

| Token | Value |
|---|---|
| `--font-sans` | `'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif` |
| `--font-display` | `'Instrument Serif', Georgia, serif` |
| `--font-family` | = --font-sans |

## Shared Component Classes

### `rw-card`

```jsx
<div className="rw-card" style={{ padding: "16px" }}>
  <h3 style={{ color: "var(--text-primary)" }}>Card title</h3>
  <p style={{ color: "var(--text-secondary)" }}>Card content</p>
</div>
```

### `rw-btn-primary`

```jsx
<button className="rw-btn-primary" onClick={handleBook}>
  Book a ride
</button>
```

48px height, pill shape, brand background, brand-ink text, focus ring, disabled state.

### `rw-btn-secondary`

```jsx
<button className="rw-btn-secondary" onClick={handleCancel}>
  Cancel
</button>
```

48px height, pill shape, transparent background, border, brand hover.

### `rw-btn-ghost`

```jsx
<button className="rw-btn-ghost" onClick={handleAction}>
  Edit
</button>
```

40px height, no border, brand text, brand-light hover.

### `rw-btn-danger`

```jsx
<button className="rw-btn-danger" onClick={handleDelete}>
  Delete
</button>
```

48px height, pill shape, danger background, white text.

### `rw-input`

```jsx
<input className="rw-input" placeholder="Enter pickup location" />
```

Full width, 52px height, surface-2 background, brand focus ring, disabled state.

### `rw-label`

```jsx
<label className="rw-label">Pickup location</label>
```

Uppercase, secondary color, small font.

### `rw-badge`

```jsx
<span className="rw-badge rw-badge-success">Active</span>
<span className="rw-badge rw-badge-warning">Pending</span>
<span className="rw-badge rw-badge-danger">Cancelled</span>
<span className="rw-badge rw-badge-info">Info</span>
```

Pill-shaped, small font, color variants for status.

### `rw-chip`

```jsx
<span className="rw-chip is-active">Home</span>
<span className="rw-chip">Work</span>
```

32px tall pill, surface-2 background, brand-light when active.

### `rw-section-title`

```jsx
<p className="rw-section-title">Recent rides</p>
```

0.75rem, uppercase, wide letter-spacing, muted color.

### `rw-display`

```jsx
<h1 className="rw-display">Your daily commute, <em>shared</em> smarter.</h1>
```

Display serif font, clamp(2.2rem, 5vw, 4rem), tight line-height.

### `rw-stat`

```jsx
<div className="rw-stat">
  <p className="rw-stat-label">Rides this month</p>
  <p className="rw-stat-value">12</p>
</div>
```

Card with label (section-title style) on top and large number below.

### `rw-tag-new`

```jsx
<span className="rw-tag-new">New in 2.0</span>
```

Small pill, gold border and text, uppercase.

### `rw-fade-up`

```jsx
<div className="rw-fade-up">Content fades in on mount</div>
```

240ms fade + 8px slide up. Disabled when prefers-reduced-motion is set.

## Tailwind Equivalents

| CSS Token | Tailwind Class |
|---|---|
| `--brand` | `text-brand` / `bg-brand` |
| `--success` | `text-success` / `bg-success` |
| `--danger` | `text-danger` / `bg-danger` |
| `--radius-sm` | `rounded-sm` |
| `--radius-md` | `rounded-md` |
| `--radius-lg` | `rounded-lg` |
| `--radius-xl` | `rounded-xl` |
| `--shadow-sm` | `shadow-sm` |
| `--shadow-md` | `shadow-md` |
| `--shadow-lg` | `shadow-lg` |