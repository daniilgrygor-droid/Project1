import { useId, type CSSProperties } from "react";

interface TreeProps {
  size?: number;
  className?: string;
  /** hero: a slightly taller, airier composition for the landing hero. */
  variant?: "hero" | "scene";
}

interface Blob {
  cx: number;
  cy: number;
  r: number;
  tone: "deep" | "dark" | "main" | "light";
}

// A broad, spreading broadleaf crown — wide horizontal span, the lower lobes
// droop on both sides, the crown pushes up and right. Built from overlapping
// foliage clusters in four muted sage tones with gaps between them, then
// passed through a low-frequency displacement filter so the edges come out
// lumpy and organic rather than clean circles.
const FOLIAGE: Blob[] = [
  // back / deep silhouette
  { cx: 250, cy: 190, r: 56, tone: "deep" },
  { cx: 180, cy: 218, r: 52, tone: "deep" },
  { cx: 330, cy: 216, r: 54, tone: "deep" },
  { cx: 250, cy: 252, r: 50, tone: "deep" },
  { cx: 140, cy: 268, r: 46, tone: "deep" },
  { cx: 366, cy: 268, r: 48, tone: "deep" },
  { cx: 158, cy: 332, r: 44, tone: "deep" },
  { cx: 350, cy: 336, r: 46, tone: "deep" },
  { cx: 122, cy: 296, r: 36, tone: "deep" },
  { cx: 386, cy: 296, r: 36, tone: "deep" },
  // dark (depth fill)
  { cx: 210, cy: 240, r: 46, tone: "dark" },
  { cx: 298, cy: 236, r: 46, tone: "dark" },
  { cx: 248, cy: 286, r: 44, tone: "dark" },
  { cx: 178, cy: 300, r: 42, tone: "dark" },
  { cx: 332, cy: 300, r: 42, tone: "dark" },
  { cx: 205, cy: 190, r: 40, tone: "dark" },
  { cx: 310, cy: 188, r: 40, tone: "dark" },
  { cx: 140, cy: 300, r: 36, tone: "dark" },
  { cx: 368, cy: 300, r: 36, tone: "dark" },
  // main (dominant mid layer)
  { cx: 225, cy: 260, r: 52, tone: "main" },
  { cx: 288, cy: 254, r: 52, tone: "main" },
  { cx: 258, cy: 218, r: 46, tone: "main" },
  { cx: 165, cy: 296, r: 46, tone: "main" },
  { cx: 352, cy: 298, r: 46, tone: "main" },
  { cx: 195, cy: 322, r: 42, tone: "main" },
  { cx: 322, cy: 324, r: 42, tone: "main" },
  { cx: 148, cy: 312, r: 36, tone: "main" },
  { cx: 360, cy: 314, r: 36, tone: "main" },
  { cx: 222, cy: 210, r: 40, tone: "main" },
  { cx: 296, cy: 204, r: 40, tone: "main" },
  // leaf clusters at the drooping branch tips
  { cx: 158, cy: 404, r: 16, tone: "main" },
  { cx: 350, cy: 406, r: 16, tone: "main" },
  // light (sunlit top)
  { cx: 236, cy: 198, r: 38, tone: "light" },
  { cx: 292, cy: 194, r: 38, tone: "light" },
  { cx: 258, cy: 178, r: 32, tone: "light" },
  { cx: 206, cy: 222, r: 28, tone: "light" },
  { cx: 322, cy: 218, r: 28, tone: "light" },
  { cx: 216, cy: 252, r: 26, tone: "light" },
  { cx: 304, cy: 246, r: 26, tone: "light" },
];

const TONE_FILL: Record<Blob["tone"], string> = {
  deep: "var(--tree-foliage-deep)",
  dark: "var(--tree-foliage-dark)",
  main: "var(--tree-foliage)",
  light: "var(--tree-foliage-light)",
};

// A few leaves that very occasionally detach and drift down through the
// canopy. Each has its own horizontal drift and end-rotation so the paths
// feel varied, never a single line — and never a full 360° spin.
const FALLERS: {
  cx: number;
  cy: number;
  rx: number;
  rot: number;
  drift: number;
  rotFall: number;
}[] = [
  { cx: 190, cy: 300, rx: 7, rot: -30, drift: -18, rotFall: 150 },
  { cx: 250, cy: 190, rx: 6, rot: 40, drift: 34, rotFall: -130 },
  { cx: 330, cy: 210, rx: 7.5, rot: -15, drift: 48, rotFall: 140 },
  { cx: 350, cy: 250, rx: 6.5, rot: 55, drift: -32, rotFall: -160 },
  { cx: 230, cy: 260, rx: 5.5, rot: 20, drift: 24, rotFall: 120 },
  { cx: 310, cy: 200, rx: 6.5, rot: -45, drift: 58, rotFall: -140 },
];

export default function Tree({
  size = 560,
  className,
  variant = "hero",
}: TreeProps) {
  const uid = useId().replace(/:/g, "");
  const groundGrad = `tree-ground-${uid}`;
  const trunkGrad = `tree-trunk-${uid}`;
  const softBlur = `tree-blur-${uid}`;
  const foliageRough = `tree-foliage-rough-${uid}`;

  return (
    <svg
      width={size}
      height={Math.round(size * 1.16)}
      viewBox="0 0 520 620"
      fill="none"
      className={`tree${variant === "scene" ? " tree--scene" : ""}${
        className ? ` ${className}` : ""
      }`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={groundGrad} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--tree-grass)" stopOpacity="0.9" />
          <stop offset="55%" stopColor="var(--tree-grass)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--tree-grass)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={trunkGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--tree-bark-dark)" />
          <stop offset="45%" stopColor="var(--tree-bark)" />
          <stop offset="100%" stopColor="var(--tree-bark-deep)" />
        </linearGradient>
        <filter id={softBlur} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        {/* low-frequency noise bends the foliage edges into organic lumps —
            the same blobs, but no longer perfect circles */}
        <filter
          id={foliageRough}
          x="-40%" y="-40%" width="180%" height="180%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.032 0.046"
            numOctaves="3"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="11"
            xChannelSelector="R"
            yChannelSelector="G"
            result="lumps"
          />
          <feGaussianBlur in="lumps" stdDeviation="0.55" />
        </filter>
      </defs>

      {/* soft shadow pooling on the ground — small and barely-there */}
      <ellipse
        cx="260"
        cy="565"
        rx="118"
        ry="13"
        fill="var(--plant-shadow)"
        filter={`url(#${softBlur})`}
      />

      {/* dissolving ground — grass mound fading into the background */}
      <g>
        <ellipse
          cx="260"
          cy="556"
          rx="248"
          ry="46"
          fill={`url(#${groundGrad})`}
        />
        <ellipse
          cx="260"
          cy="561"
          rx="156"
          ry="19"
          fill="var(--tree-grass-dark)"
          opacity="0.4"
        />
        {/* a few quiet stones and soil flecks near the base */}
        <ellipse cx="204" cy="560" rx="5" ry="2.4" fill="var(--tree-grass-dark)" opacity="0.35" />
        <ellipse cx="320" cy="561" rx="4" ry="2" fill="var(--tree-grass-dark)" opacity="0.3" />
        <ellipse cx="236" cy="564" rx="2.5" ry="1.6" fill="var(--tree-bark-deep)" opacity="0.28" />
        <ellipse cx="292" cy="563" rx="2.2" ry="1.5" fill="var(--tree-bark-deep)" opacity="0.26" />
        {/* a few blades of grass */}
        <g stroke="var(--tree-grass-dark)" strokeLinecap="round" fill="none" opacity="0.5">
          <path d="M238 564 C236 560 234 557 232 554" strokeWidth="1.5" />
          <path d="M272 564 C274 560 276 557 278 554" strokeWidth="1.5" />
          <path d="M246 566 C244 563 243 560 243 557" strokeWidth="1.2" />
        </g>
      </g>

      {/* trunk — thick, slightly curved, wide at the base with roots flaring */}
      <g className="tree-trunk">
        <path
          d="M213 566
             C209 546 208 524 213 498
             C219 464 224 436 231 414
             C237 394 243 378 249 366
             L254 354
             C260 368 265 386 271 406
             C278 436 284 468 290 500
             C294 524 296 548 300 564
             C304 566 306 567 309 568
             C296 570 281 571 266 571
             C251 571 239 570 226 567
             C222 567 217 566 213 566 Z"
          fill={`url(#${trunkGrad})`}
        />
        {/* roots flaring out at the base */}
        <g stroke="var(--tree-bark-deep)" strokeLinecap="round" fill="none">
          <path d="M222 562 C210 564 204 562 198 557" strokeWidth="7" opacity="0.55" />
          <path d="M298 562 C310 564 316 561 321 556" strokeWidth="7" opacity="0.55" />
          <path d="M231 566 C226 568 222 568 218 566" strokeWidth="4" opacity="0.4" />
          <path d="M288 566 C294 568 300 567 304 565" strokeWidth="4" opacity="0.4" />
        </g>
        {/* bark — a few quiet curved grooves */}
        <g stroke="var(--tree-bark-deep)" strokeLinecap="round" fill="none">
          <path d="M242 550 C244 516 246 482 250 450" strokeWidth="2.2" opacity="0.32" />
          <path d="M260 542 C262 502 265 464 268 430" strokeWidth="2.2" opacity="0.24" />
          <path d="M233 544 C235 522 236 500 238 480" strokeWidth="1.6" opacity="0.18" />
          <path d="M276 522 C277 492 279 462 281 440" strokeWidth="1.6" opacity="0.16" />
        </g>
      </g>

      {/* branches + canopy sway very gently around the base, with an
          occasional slow gust on top */}
      <g
        className="tree-wind"
        style={{ "--tree-origin": "260px 560px" } as CSSProperties}
      >
        <g
          className="tree-sway"
          style={{ "--tree-origin": "260px 560px" } as CSSProperties}
        >
          {/* branches — main arms up and out, lower branches drooping */}
          <g stroke="var(--tree-bark-dark)" strokeLinecap="round" fill="none">
            <path d="M252 400 C232 374 214 352 202 334" strokeWidth="13" />
            <path d="M262 402 C284 374 304 350 322 332" strokeWidth="13" />
            <path d="M244 366 C226 340 212 322 204 306" strokeWidth="9" />
            <path d="M268 368 C286 342 300 324 312 308" strokeWidth="9" />
            <path d="M255 350 C258 332 262 314 268 296" strokeWidth="8" />
            {/* drooping lower branches — the signature of a spreading tree */}
            <path d="M246 422 C226 410 208 404 192 400 C180 398 170 401 164 407" strokeWidth="7" />
            <path d="M262 422 C282 410 300 404 316 400 C328 398 338 401 344 407" strokeWidth="7" />
            {/* fine twigs reaching just past the canopy edge */}
            <path d="M204 306 C198 296 194 288 192 280" strokeWidth="3.5" />
            <path d="M312 308 C318 298 322 290 326 282" strokeWidth="3.5" />
            <path d="M268 296 C274 280 280 268 286 260" strokeWidth="3.5" />
          </g>

          {/* foliage breathes very slowly, as if taking air in */}
          <g className="tree-canopy" filter={`url(#${foliageRough})`}>
            <g>
              {FOLIAGE.filter((b) => b.tone !== "light").map((b, i) => (
                <circle
                  key={i}
                  cx={b.cx}
                  cy={b.cy}
                  r={b.r}
                  fill={TONE_FILL[b.tone]}
                />
              ))}
            </g>
            {/* lighter crown tips catch a bit more wind, on their own phase */}
            <g className="tree-foliage-inner">
              {FOLIAGE.filter((b) => b.tone === "light").map((b, i) => (
                <circle
                  key={`l-${i}`}
                  cx={b.cx}
                  cy={b.cy}
                  r={b.r}
                  fill={TONE_FILL[b.tone]}
                  opacity={0.92}
                />
              ))}
            </g>
          </g>
        </g>
      </g>

      {/* a few quiet leaves at the base and in the lower canopy */}
      <g fill="var(--tree-foliage-dark)">
        <ellipse cx="152" cy="352" rx="8" ry="4" transform="rotate(-25 152 352)" />
        <ellipse cx="180" cy="366" rx="7" ry="3.5" transform="rotate(30 180 366)" />
        <ellipse cx="356" cy="356" rx="8" ry="4" transform="rotate(20 356 356)" />
        <ellipse cx="214" cy="562" rx="6" ry="3" transform="rotate(-15 214 562)" opacity="0.7" />
        <ellipse cx="322" cy="563" rx="6.5" ry="3.2" transform="rotate(12 322 563)" opacity="0.7" />
      </g>

      {/* falling leaves — a rare, quiet event; disabled for reduced motion */}
      {FALLERS.map((f, i) => (
        <ellipse
          key={`fall-${i}`}
          className="tree-leaf-fall"
          style={
            {
              "--fall-i": String(i),
              "--fall-drift": `${f.drift}px`,
              "--fall-rot": `${f.rotFall}deg`,
            } as CSSProperties
          }
          cx={f.cx}
          cy={f.cy}
          rx={f.rx}
          ry={f.rx * 0.5}
          fill="var(--tree-foliage-dark)"
          transform={`rotate(${f.rot} ${f.cx} ${f.cy})`}
        />
      ))}
    </svg>
  );
}