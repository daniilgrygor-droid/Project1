import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PLANT_STAGES, plantStageIndexFor } from "../lib/constants";

interface PlantProps {
  steps: number;
  size?: number;
  showLabel?: boolean;
  /** Clickable contexts (e.g. the check-in widget) get the hover reactions. */
  interactive?: boolean;
}

// Colors come from CSS variables so the illustration adapts to the theme.
const POT_BODY = "var(--plant-pot)";
const POT_RIM = "var(--plant-pot-rim)";
const SOIL = "var(--plant-soil)";
const STEM = "var(--plant-stem)";
const LEAF = "var(--plant-leaf)";
const VEIN = "var(--plant-vein)";

// Terracotta accent (project --accent-secondary) for the flower stages.
const FLOWER = "var(--plant-flower)";
const FLOWER_DARK = "var(--plant-flower-dark)";

// Stem path per stage: starts at the soil (100,178), ends at the stage's tip.
// A single Q curve keeps the stroke a uniform 5px — no wedge-shaped taper.
// s = how far along the full curve (P0(100,178) Q(108,135) → (97,95)) the stem reaches.
const STEM_ENDS: Record<number, { qx: number; qy: number; ex: number; ey: number } | null> = {
  0: null, // seed — no stem yet
  1: { qx: 102.24, qy: 165.96, ex: 102.99, ey: 154.16 }, // sprout
  2: { qx: 104.0, qy: 156.5, ex: 103.25, ey: 135.75 }, // small plant
  3: { qx: 106.0, qy: 145.75, ex: 101.31, ey: 115.19 }, // growing plant
  4: { qx: 108.0, qy: 135.0, ex: 97.0, ey: 95.0 }, // flower
  5: { qx: 108.0, qy: 135.0, ex: 97.0, ey: 95.0 }, // mature plant
};

// Three leaves, bottom → top, at clearly different heights. Each has its own
// petiole (2px line) so it reads as attached to the stem, not floating.
const LEAVES = [
  {
    petiole: "M102 150 L118 142",
    cx: 128,
    cy: 138,
    rx: 12.5,
    ry: 7,
    rot: -20,
    vein: "M119 140 L137 133",
  },
  {
    petiole: "M102 130 L64 112",
    cx: 62,
    cy: 108,
    rx: 12,
    ry: 7,
    rot: 35,
    vein: "M74 111 L53 101",
  },
  {
    petiole: "M97 73 L114 71",
    cx: 121,
    cy: 67,
    rx: 11.5,
    ry: 6.5,
    rot: -28,
    vein: "M113 70 L128 62",
  },
];

// Which leaves are visible at each stage (indices into LEAVES).
const STAGE_LEAVES: Record<number, number[]> = {
  0: [],
  1: [], // sprout: cotyledons only
  2: [0], // small plant: + leaf 1
  3: [0, 1], // growing plant: leaves 1 + 2
  4: [0, 1, 2], // flower: all three
  5: [0, 1, 2], // mature plant: all three
};

// Mature stage: a young crown of small leaves fans out above the flower —
// the first hint of the tree waiting further along the path.
const MATURE_CLUSTER = [
  { petiole: "M97 73 L112 60", cx: 118, cy: 56, rx: 8, ry: 4.6, rot: 14 },
  { petiole: "M97 73 L86 58", cx: 80, cy: 54, rx: 7.5, ry: 4.2, rot: -22 },
  { petiole: "M97 73 L99 52", cx: 101, cy: 49, rx: 7, ry: 4, rot: 4 },
  { petiole: "M97 73 L108 46", cx: 111, cy: 45, rx: 6.5, ry: 3.8, rot: -8 },
];

// The sprout's first two seed leaves, spread open at the tip.
const COTYLEDONS: Record<number, { petiole: string; cx: number; cy: number; rx: number; ry: number; rot: number }[]> = {
  1: [
    { petiole: "M103 153 L95 148", cx: 90, cy: 145, rx: 7, ry: 4.5, rot: 30 },
    { petiole: "M103 153 L111 148", cx: 115, cy: 146, rx: 7, ry: 4.5, rot: -30 },
  ],
  2: [
    { petiole: "M103 135 L94 129", cx: 89, cy: 126, rx: 8, ry: 5, rot: 32 },
    { petiole: "M103 135 L112 129", cx: 117, cy: 127, rx: 8, ry: 5, rot: -32 },
  ],
};

const FLOWER_CX = 97;
const FLOWER_CY = 87;

export default function Plant({
  steps,
  size = 300,
  showLabel = true,
  interactive = false,
}: PlantProps) {
  const stage = plantStageIndexFor(steps); // -1 (nothing) .. 5 (mature)
  const blurId = useId().replace(/:/g, "");

  // Crossfade between stage renders (skipped for reduced motion).
  const reduceMotion = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion.current = mq.matches;
    const onChange = (e: MediaQueryListEvent) => {
      reduceMotion.current = e.matches;
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const prevStageRef = useRef(stage);
  const [fading, setFading] = useState<{ prev: number; key: number } | null>(null);

  useEffect(() => {
    const prev = prevStageRef.current;
    if (prev !== stage && prev >= 0 && stage >= 0 && !reduceMotion.current) {
      setFading({ prev, key: Date.now() });
    }
    prevStageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => setFading(null), 420);
    return () => clearTimeout(t);
  }, [fading]);

  const plantBody = (st: number) => {
    if (st <= 0) {
      // A seed resting in the soil.
      return (
        <g>
          <ellipse
            cx="100"
            cy="176"
            rx="6"
            ry="8.5"
            fill={LEAF}
            transform="rotate(-20 100 176)"
          />
          <path
            d="M103 183 q 3 5 1 9"
            stroke={STEM}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        </g>
      );
    }

    const stem = STEM_ENDS[st] ?? STEM_ENDS[5];
    const leaves = STAGE_LEAVES[st] ?? [];

    return (
      <g>
        {/* the whole stem — one narrow, uniformly-thick curve */}
        {stem && (
          <path
            d={`M100 178 Q${stem.qx} ${stem.qy} ${stem.ex} ${stem.ey}`}
            stroke={STEM}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* cotyledons for the sprout stages */}
        {(COTYLEDONS[st] ?? []).map((c, i) => (
          <g key={`cot-${i}`} style={{ "--leaf-i": String(i) } as CSSProperties}>
            <path d={c.petiole} stroke={STEM} strokeWidth="2" strokeLinecap="round" fill="none" />
            <g className="plant-leaf-hover">
              <g className="plant-leaf-idle">
                <ellipse
                  cx={c.cx}
                  cy={c.cy}
                  rx={c.rx}
                  ry={c.ry}
                  fill={LEAF}
                  transform={`rotate(${c.rot} ${c.cx} ${c.cy})`}
                />
              </g>
            </g>
          </g>
        ))}

        {/* true leaves, each on its own petiole with a vein */}
        {leaves.map((li, i) => {
          const L = LEAVES[li];
          return (
            <g key={`leaf-${li}`} style={{ "--leaf-i": String(i) } as CSSProperties}>
              <path d={L.petiole} stroke={STEM} strokeWidth="2" strokeLinecap="round" fill="none" />
              <g className="plant-leaf-hover">
                <g className="plant-leaf-idle">
                  <ellipse
                    cx={L.cx}
                    cy={L.cy}
                    rx={L.rx}
                    ry={L.ry}
                    fill={LEAF}
                    transform={`rotate(${L.rot} ${L.cx} ${L.cy})`}
                  />
                  <path d={L.vein} stroke={VEIN} strokeWidth="1" strokeLinecap="round" fill="none" />
                </g>
              </g>
            </g>
          );
        })}

        {/* mature stage: a young crown of small leaves hints at the tree */}
        {st === 5 &&
          MATURE_CLUSTER.map((c, i) => (
            <g
              key={`crown-${i}`}
              style={{ "--leaf-i": String(3 + i) } as CSSProperties}
            >
              <path
                d={c.petiole}
                stroke={STEM}
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
              <g className="plant-leaf-hover">
                <g className="plant-leaf-idle">
                  <ellipse
                    cx={c.cx}
                    cy={c.cy}
                    rx={c.rx}
                    ry={c.ry}
                    fill={LEAF}
                    transform={`rotate(${c.rot} ${c.cx} ${c.cy})`}
                  />
                </g>
              </g>
            </g>
          ))}

        {/* open flower for the flower + mature stages */}
        {st >= 4 && (
          <g>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx={FLOWER_CX}
                cy={FLOWER_CY}
                rx="5"
                ry="8"
                fill={FLOWER}
                transform={`rotate(${a} ${FLOWER_CX} ${FLOWER_CY})`}
              />
            ))}
            <circle cx={FLOWER_CX} cy={FLOWER_CY} r="4" fill={FLOWER_DARK} />
          </g>
        )}

        {/* mature plant grows a second, closed bud on a side stemlet */}
        {st >= 5 && (
          <g>
            <path d="M98 118 Q 92 114 87 112" stroke={STEM} strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M87 111 C 84 109 82 105 83 101 C 87 99 91 101 90 106 Z" fill={FLOWER} />
          </g>
        )}
      </g>
    );
  };

  return (
    <svg
      width={size}
      height={Math.round(size * 1.3)}
      viewBox="0 0 200 260"
      role="img"
      aria-label="A plant that grows with your small steps"
      className={interactive ? "plant-hover" : undefined}
    >
      <defs>
        <filter id={blurId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* soft shadow under the pot */}
      <ellipse
        cx="100"
        cy="248"
        rx="55"
        ry="6"
        fill="var(--plant-shadow)"
        filter={`url(#${blurId})`}
      />

      {/* pot body — trapezoid, wider at top, rounded bottom corners */}
      <path
        d="M45 175 L155 175 L140 245 Q140 251 134 251 L66 251 Q60 251 60 245 Z"
        fill={POT_BODY}
      />

      {/* pot rim — one tone darker, same taper, 12px tall */}
      <path d="M45 175 L155 175 L152.4 187 L47.6 187 Z" fill={POT_RIM} />

      {/* soil — a thin strip tucked under the rim, with a soft shadow line so it reads as recessed */}
      <ellipse cx="100" cy="176" rx="53" ry="3" fill="var(--plant-soil-shadow)" />
      <ellipse cx="100" cy="178" rx="52" ry="2.5" fill={SOIL} />

      {/* the growing plant (crossfaded between stages) */}
      {fading && (
        <g className="plant-fade-out" key={`out-${fading.key}`} aria-hidden="true">
          {plantBody(fading.prev)}
        </g>
      )}
      <g className="plant-fade-in" key={`in-${stage}`}>
        {plantBody(stage)}
      </g>

      {showLabel && (
        <text
          x="100"
          y="257"
          textAnchor="middle"
          fontSize="10"
          fill="var(--plant-label)"
          fontFamily="Georgia, serif"
          fontStyle="italic"
        >
          {stage < 0 ? "waiting…" : PLANT_STAGES[stage]?.label}
        </text>
      )}
    </svg>
  );
}
