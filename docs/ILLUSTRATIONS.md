# Illustrations

13 inline SVG illustrations drawn in the "Wave" palette. They are React components that use only the CSS colour tokens (`--brand`, `--gold`, `--ai`, `--surface-2`, ...), so they switch to dark mode by themselves. No image files, no new packages.

Preview of all of them in light and dark mode: `docs/illustrations-preview.png`.

```jsx
import { EmptyRides } from "../components/illustrations";

<EmptyRides width={160} />          // decorative (aria-hidden)
<EmptyRides width={160} title="No rides yet" />  // announced to screen readers
```
Props: `width` (height follows the aspect ratio), `className`, `style`, `title`. Never edit colours inside the drawings; change the tokens instead.

| Component | Size (w x h) | Use it in | Task |
|---|---|---|---|
| `EmptyRides` | 200 x 150 | Passenger home and My Rides when there are no rides | F6, F9 |
| `EmptyRequests` | 200 x 150 | Driver dashboard, online but no requests yet | F6, F8 |
| `EmptySavedPlaces` | 200 x 150 | Saved places manager when empty | F6 |
| `AllClear` | 200 x 150 | Admin "Safety alerts" card when there are no alerts | F5, F6 |
| `NoResults` | 200 x 150 | Place search with no results, admin tables with no matches | F6 |
| `NotFoundRoad` | 200 x 150 | 404 page | F9 |
| `SomethingWrong` | 200 x 150 | `ErrorBoundary` fallback, failed API loads | F6 |
| `AuthCity` | 360 x 220 | Brand panel of `components/auth/AuthLayout.jsx` (replace the small corridor drawing) | F9 |
| `DriverOnline` | 200 x 150 | Driver online/offline toggle card (show when online) | F8 |
| `ShareTrip` | 200 x 150 | Top of the SOS / share sheet and the expired state of `/trip/:token` | F5 |
| `ExplainQuestion` | 240 x 150 | ML Lab explain mode, step 1 "The question" | F4 |
| `ExplainData` | 240 x 150 | ML Lab explain mode, step 2 "Data collection" (beside the real table) | F4 |
| `ExplainCorridors` | 240 x 150 | ML Lab explain mode, step 6 "Route mapping" | F4 |

Layout rule for empty states (DESIGN_SPEC section 7): illustration 120 to 160 px wide, centred, then one sentence in `--text-secondary`, then one button. Add `className="rw-fade-up"` so it eases in.
