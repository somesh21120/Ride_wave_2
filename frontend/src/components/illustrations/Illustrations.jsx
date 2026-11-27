/**
 * RideWave illustration set ("Wave" theme).
 *
 * Inline SVG React components drawn only with the app's CSS colour tokens, so every
 * illustration follows light and dark mode automatically. Decorative: aria-hidden.
 *
 * Usage:
 *   import { EmptyRides } from "../components/illustrations";
 *   <EmptyRides width={160} />
 *
 * Catalog and where each one is used: docs/ILLUSTRATIONS.md
 */

const C = {
  line: "var(--text-muted)",
  ink: "var(--text-secondary)",
  brand: "var(--brand)",
  brandLight: "var(--brand-light)",
  gold: "var(--gold)",
  ml: "var(--ai)",
  mlLight: "var(--ai-light)",
  surface: "var(--surface)",
  surface2: "var(--surface-2)",
  border: "var(--border)",
  success: "var(--success)",
  danger: "var(--danger)",
};

const Svg = ({ w, h, width, className, style, title, children }) => (
  <svg
    viewBox={`0 0 ${w} ${h}`}
    width={width ?? w}
    height={width ? (width * h) / w : h}
    className={className}
    style={{ display: "block", maxWidth: "100%", height: "auto", ...style }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden={title ? undefined : "true"}
    role={title ? "img" : undefined}
  >
    {title ? <title>{title}</title> : null}
    {children}
  </svg>
);

/* Small shared pieces */
const Ground = ({ cx = 100, cy = 136, rx = 80 }) => <ellipse cx={cx} cy={cy} rx={rx} ry="7" fill={C.surface2} />;
const PinDrop = ({ x, y, color = C.gold, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 -26c-7.2 0-12 5-12 11.6C-12 -6 0 4 0 4s12-10 12-18.4C12 -21 7.2-26 0-26z" fill={color} />
    <circle cx="0" cy="-14.5" r="4.4" fill={C.surface} />
  </g>
);
const PinDot = ({ x, y, color = C.brand }) => (
  <g>
    <circle cx={x} cy={y} r="9" fill={color} opacity="0.18" />
    <circle cx={x} cy={y} r="5.5" fill={color} />
    <circle cx={x} cy={y} r="2.2" fill={C.surface} />
  </g>
);
const Sparkle = ({ x, y, s = 1, color = C.gold }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 -6 1.5 -1.5 6 0 1.5 1.5 0 6 -1.5 1.5 -6 0 -1.5 -1.5z"
    fill={color}
  />
);
const Car = ({ x = 0, y = 0, s = 1, body = C.brand }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path
      d="M8 34h84a8 8 0 0 0 8-8v-7a9 9 0 0 0-7-8.8L74 6 60-6a12 12 0 0 0-8-3H30a12 12 0 0 0-9.6 4.8L10 9H8a8 8 0 0 0-8 8v9a8 8 0 0 0 8 8z"
      fill={body}
    />
    <path d="M27 9 34 -3h16l12 12z" fill={C.surface} opacity="0.85" />
    <circle cx="25" cy="34" r="10" fill={C.ink} />
    <circle cx="25" cy="34" r="4" fill={C.surface} />
    <circle cx="75" cy="34" r="10" fill={C.ink} />
    <circle cx="75" cy="34" r="4" fill={C.surface} />
    <rect x="90" y="15" width="8" height="4" rx="2" fill={C.gold} />
  </g>
);
const Person = ({ x, y, color = C.brand, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx="0" cy="-22" r="11" fill={color} />
    <path d="M-20 14c0-14 9-22 20-22s20 8 20 22z" fill={color} opacity="0.85" />
  </g>
);

/* ------------------------------------------------------------------ */
/* Empty states (200 x 150)                                            */
/* ------------------------------------------------------------------ */

/** No rides yet (passenger home, My Rides). */
export const EmptyRides = (p) => (
  <Svg w={200} h={150} {...p}>
    <Ground />
    <path d="M28 128C70 124 62 82 104 78s58-30 72-52" stroke={C.surface2} strokeWidth="18" strokeLinecap="round" />
    <path d="M28 128C70 124 62 82 104 78s58-30 72-52" stroke={C.line} strokeWidth="2" strokeDasharray="6 7" strokeLinecap="round" />
    <PinDot x={30} y={127} />
    <PinDrop x={176} y={30} />
    <Sparkle x={150} y={98} s={0.9} />
    <Sparkle x={58} y={46} s={0.7} color={C.brand} />
    <circle cx="120" cy="40" r="3" fill={C.border} />
  </Svg>
);

/** Driver online, no requests yet. */
export const EmptyRequests = (p) => (
  <Svg w={200} h={150} {...p}>
    <Ground />
    <path d="M136 46a40 40 0 0 1 18 30" stroke={C.brand} strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    <path d="M140 30a58 58 0 0 1 30 46" stroke={C.brand} strokeWidth="3" strokeLinecap="round" opacity="0.2" />
    <path d="M64 46a40 40 0 0 0-18 30" stroke={C.brand} strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    <path d="M60 30a58 58 0 0 0-30 46" stroke={C.brand} strokeWidth="3" strokeLinecap="round" opacity="0.2" />
    <circle cx="100" cy="82" r="34" fill={C.surface} stroke={C.ink} strokeWidth="6" />
    <circle cx="100" cy="82" r="10" fill={C.brandLight} stroke={C.brand} strokeWidth="3" />
    <path d="M70 76h20M110 76h20M100 92v22" stroke={C.ink} strokeWidth="6" strokeLinecap="round" />
    <Sparkle x={160} y={112} s={0.8} />
  </Svg>
);

/** No saved places yet. */
export const EmptySavedPlaces = (p) => (
  <Svg w={200} h={150} {...p}>
    <Ground />
    <path d="M42 46 78 34l44 12 36-12v84l-36 12-44-12-36 12z" fill={C.surface2} stroke={C.line} strokeWidth="2" strokeLinejoin="round" />
    <path d="M78 34v84M122 46v84" stroke={C.line} strokeWidth="2" />
    <path d="M52 94c18-6 30 6 48-4s26-20 48-10" stroke={C.brand} strokeWidth="2.5" strokeDasharray="5 6" strokeLinecap="round" />
    <g transform="translate(100 82)">
      <path d="M0 -34c-8 0-13.5 5.6-13.5 13C-13.5 -11 0 2 0 2s13.5-13 13.5-23c0-7.4-5.5-13-13.5-13z" fill={C.brand} />
      <path d="M0 -15.5 -5.2 -20.7a3.4 3.4 0 0 1 4.8-4.8L0 -25.1l.4-.4a3.4 3.4 0 0 1 4.8 4.8z" fill={C.surface} />
    </g>
    <circle cx="156" cy="40" r="13" fill={C.gold} />
    <path d="M156 33v14M149 40h14" stroke={C.surface} strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

/** Safety: no alerts, all clear (admin safety card). */
export const AllClear = (p) => (
  <Svg w={200} h={150} {...p}>
    <Ground />
    <path d="M100 22 140 36v30c0 28-17 46-40 56-23-10-40-28-40-56V36z" fill={C.brandLight} stroke={C.brand} strokeWidth="3" strokeLinejoin="round" />
    <path d="m82 72 13 13 24-26" stroke={C.brand} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <Sparkle x={156} y={44} s={1} />
    <Sparkle x={44} y={58} s={0.7} color={C.brand} />
    <circle cx="160" cy="98" r="3" fill={C.border} />
  </Svg>
);

/** Search found nothing (places search, admin filters). */
export const NoResults = (p) => (
  <Svg w={200} h={150} {...p}>
    <Ground />
    <rect x="36" y="26" width="104" height="92" rx="12" fill={C.surface2} stroke={C.line} strokeWidth="2" />
    <path d="M36 58h104M36 90h104M70 26v92M106 26v92" stroke={C.border} strokeWidth="2" />
    <circle cx="124" cy="80" r="26" fill={C.surface} stroke={C.ink} strokeWidth="6" />
    <circle cx="124" cy="80" r="17" fill={C.brandLight} />
    <path d="m143 99 22 22" stroke={C.ink} strokeWidth="9" strokeLinecap="round" />
    <path d="M112 74a14 14 0 0 1 10-8" stroke={C.surface} strokeWidth="3.5" strokeLinecap="round" />
  </Svg>
);

/** 404 page: the road ends at a signpost. */
export const NotFoundRoad = (p) => (
  <Svg w={200} h={150} {...p}>
    <Ground rx={86} />
    <path d="M70 136 92 52h16l22 84z" fill={C.surface2} />
    <path d="M100 132v-14M100 108v-12M100 86v-10M100 68v-8" stroke={C.line} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M144 132V52" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
    <path d="M126 44h38l8 10-8 10h-38z" fill={C.gold} />
    <text x="144" y="60" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="15" fontWeight="800" fill={C.surface}>?</text>
    <circle cx="58" cy="40" r="14" fill={C.gold} opacity="0.25" />
    <Sparkle x={40} y={92} s={0.7} color={C.brand} />
  </Svg>
);

/** Error boundary / something went wrong: traffic cone. */
export const SomethingWrong = (p) => (
  <Svg w={200} h={150} {...p}>
    <Ground />
    <rect x="62" y="118" width="76" height="12" rx="4" fill={C.ink} />
    <path d="M90 30h20l24 88H66z" fill={C.gold} />
    <path d="M84 52h32l5 18H79zM76 82h48l5 18H71z" fill={C.surface} opacity="0.9" />
    <path d="m150 40 10-10M154 54h12M146 28v-12" stroke={C.line} strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

/* ------------------------------------------------------------------ */
/* Feature art                                                         */
/* ------------------------------------------------------------------ */

/** Auth brand panel: city skyline with a shared route (360 x 220). */
export const AuthCity = (p) => (
  <Svg w={360} h={220} {...p}>
    <circle cx="282" cy="58" r="30" fill={C.gold} opacity="0.22" />
    <g fill={C.surface2} stroke={C.border} strokeWidth="1.5">
      <rect x="26" y="96" width="44" height="96" rx="4" />
      <rect x="76" y="70" width="38" height="122" rx="4" />
      <rect x="120" y="112" width="52" height="80" rx="4" />
      <rect x="178" y="84" width="34" height="108" rx="4" />
      <rect x="218" y="120" width="46" height="72" rx="4" />
      <rect x="270" y="98" width="40" height="94" rx="4" />
      <rect x="316" y="130" width="30" height="62" rx="4" />
    </g>
    <g fill={C.brandLight}>
      <rect x="36" y="108" width="8" height="8" rx="1.5" /><rect x="52" y="108" width="8" height="8" rx="1.5" />
      <rect x="36" y="126" width="8" height="8" rx="1.5" /><rect x="86" y="84" width="7" height="7" rx="1.5" />
      <rect x="99" y="84" width="7" height="7" rx="1.5" /><rect x="86" y="100" width="7" height="7" rx="1.5" />
      <rect x="186" y="96" width="7" height="7" rx="1.5" /><rect x="198" y="112" width="7" height="7" rx="1.5" />
      <rect x="280" y="110" width="8" height="8" rx="1.5" /><rect x="294" y="126" width="8" height="8" rx="1.5" />
    </g>
    <rect x="0" y="190" width="360" height="30" fill={C.surface2} />
    <path d="M24 204C90 204 110 168 176 168s96 30 160 30" stroke={C.brand} strokeWidth="4" strokeLinecap="round" />
    <path d="M24 204C90 204 110 168 176 168s96 30 160 30" stroke={C.surface} strokeWidth="1.5" strokeDasharray="4 8" strokeLinecap="round" />
    <PinDot x={30} y={204} />
    <PinDot x={176} y={168} color={C.gold} />
    <PinDrop x={330} y={196} color={C.brand} />
  </Svg>
);

/** Driver online card: car with signal waves (200 x 150). */
export const DriverOnline = (p) => (
  <Svg w={200} h={150} {...p}>
    <Ground cy={134} />
    <Car x={48} y={84} s={1.04} />
    <path d="M150 52a22 22 0 0 1 0 30M160 42a36 36 0 0 1 0 50" stroke={C.success} strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="146" cy="67" r="4.5" fill={C.success} />
    <Sparkle x={42} y={44} s={0.8} />
  </Svg>
);

/** Share trip: phone with a live map and a link badge (200 x 150). */
export const ShareTrip = (p) => (
  <Svg w={200} h={150} {...p}>
    <Ground />
    <rect x="64" y="14" width="72" height="122" rx="14" fill={C.surface} stroke={C.ink} strokeWidth="4" />
    <rect x="72" y="28" width="56" height="78" rx="6" fill={C.surface2} />
    <path d="M78 96c10-10 14-28 26-30s18-14 18-28" stroke={C.brand} strokeWidth="3" strokeLinecap="round" />
    <circle cx="78" cy="96" r="4" fill={C.brand} />
    <circle cx="122" cy="38" r="4" fill={C.gold} />
    <circle cx="104" cy="66" r="6" fill={C.brand} opacity="0.25" />
    <circle cx="104" cy="66" r="3" fill={C.brand} />
    <rect x="88" y="116" width="24" height="5" rx="2.5" fill={C.border} />
    <circle cx="150" cy="40" r="17" fill={C.gold} />
    <g transform="rotate(-45 150 40)" stroke={C.surface} strokeWidth="2.8" fill="none">
      <rect x="138" y="35" width="14" height="10" rx="5" />
      <rect x="148" y="35" width="14" height="10" rx="5" />
    </g>
  </Svg>
);

/* ------------------------------------------------------------------ */
/* ML Lab "Explain it step by step" (240 x 150)                        */
/* ------------------------------------------------------------------ */

/** Step 1: will these two riders share? */
export const ExplainQuestion = (p) => (
  <Svg w={240} h={150} {...p}>
    <ellipse cx="120" cy="138" rx="104" ry="7" fill={C.surface2} />
    <Person x={40} y={110} color={C.brand} />
    <Person x={200} y={110} color={C.gold} />
    <Car x={70} y={92} s={1} body={C.ink} />
    <path d="M62 84c8-16 24-22 38-22M178 84c-8-16-24-22-38-22" stroke={C.line} strokeWidth="2" strokeDasharray="4 5" strokeLinecap="round" />
    <rect x="98" y="10" width="44" height="34" rx="12" fill={C.mlLight} stroke={C.ml} strokeWidth="2" />
    <path d="m114 44 6 8 6-8" fill={C.mlLight} stroke={C.ml} strokeWidth="2" strokeLinejoin="round" />
    <path d="M114 44h12" stroke={C.mlLight} strokeWidth="3" />
    <text x="120" y="34" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="20" fontWeight="800" fill={C.ml}>?</text>
  </Svg>
);

/** Step 2: data collection, a table of offers with yes/no labels. */
export const ExplainData = (p) => (
  <Svg w={240} h={150} {...p}>
    <rect x="20" y="14" width="200" height="122" rx="12" fill={C.surface} stroke={C.border} strokeWidth="2" />
    <rect x="20" y="14" width="200" height="24" rx="12" fill={C.surface2} />
    <rect x="20" y="26" width="200" height="12" fill={C.surface2} />
    <g fill={C.line}>
      <rect x="34" y="23" width="28" height="6" rx="3" /><rect x="74" y="23" width="28" height="6" rx="3" /><rect x="114" y="23" width="28" height="6" rx="3" />
    </g>
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(0 ${50 + i * 21})`}>
        <rect x="34" y="0" width={18 + ((i * 7) % 12)} height="6" rx="3" fill={C.border} />
        <rect x="74" y="0" width={14 + ((i * 11) % 16)} height="6" rx="3" fill={C.border} />
        <rect x="114" y="0" width={20 + ((i * 5) % 10)} height="6" rx="3" fill={C.border} />
        <rect x="166" y="-4" width="40" height="14" rx="7" fill={i === 2 ? C.danger : C.success} opacity="0.18" />
        <circle cx="177" cy="3" r="3" fill={i === 2 ? C.danger : C.success} />
        <rect x="184" y="0" width="14" height="6" rx="3" fill={i === 2 ? C.danger : C.success} />
      </g>
    ))}
  </Svg>
);

/** Step 6: route mapping, many trips grouped into a few corridors. */
export const ExplainCorridors = (p) => (
  <Svg w={240} h={150} {...p}>
    <rect x="12" y="10" width="216" height="130" rx="14" fill={C.surface2} />
    <path d="M12 52h216M12 98h216M70 10v130M150 10v130" stroke={C.border} strokeWidth="2" />
    <g stroke={C.line} strokeWidth="1.5" strokeLinecap="round" opacity="0.8">
      <path d="M30 120c40-14 70-40 100-60s60-30 84-34" />
      <path d="M38 128c40-18 72-44 98-58s56-28 80-36" />
      <path d="M26 110c44-12 74-36 104-56s58-26 86-28" />
      <path d="M40 30c30 20 60 40 90 56s50 30 76 40" />
      <path d="M30 40c34 18 62 36 94 50s56 26 82 36" />
    </g>
    <path d="M30 120c40-14 70-40 100-60s60-30 84-34" stroke={C.ml} strokeWidth="7" strokeLinecap="round" opacity="0.85" />
    <path d="M36 34c32 20 60 38 92 52s54 28 80 38" stroke={C.brand} strokeWidth="7" strokeLinecap="round" opacity="0.75" />
    <circle cx="30" cy="120" r="6" fill={C.ml} /><circle cx="214" cy="26" r="6" fill={C.ml} />
    <circle cx="36" cy="34" r="6" fill={C.brand} /><circle cx="208" cy="124" r="6" fill={C.brand} />
  </Svg>
);

/** Catalog for docs and a dev preview. */
export const ILLUSTRATIONS = {
  EmptyRides, EmptyRequests, EmptySavedPlaces, AllClear, NoResults, NotFoundRoad, SomethingWrong,
  AuthCity, DriverOnline, ShareTrip, ExplainQuestion, ExplainData, ExplainCorridors,
};
