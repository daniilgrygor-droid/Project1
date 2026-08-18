interface SproutLoaderProps {
  label?: string;
}

/** A tiny sprout that sways while content grows in. */
export default function SproutLoader({
  label = "Growing…",
}: SproutLoaderProps) {
  return (
    <div className="sprout-loader" role="status">
      <svg
        className="sprout-loader-svg"
        viewBox="0 0 44 44"
        fill="none"
        aria-hidden="true"
      >
        <ellipse cx="22" cy="34" rx="6" ry="3.4" fill="var(--plant-soil)" opacity="0.45" />
        <path
          d="M22 35 Q23.5 28 20 21"
          stroke="var(--plant-stem)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M22 25 Q24.5 21.5 26 20"
          stroke="var(--plant-stem)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <ellipse
          cx="15.5"
          cy="17.5"
          rx="5.6"
          ry="3.4"
          transform="rotate(-30 15.5 17.5)"
          fill="var(--plant-leaf)"
        />
        <ellipse
          cx="27.5"
          cy="15.5"
          rx="5.1"
          ry="3.1"
          transform="rotate(22 27.5 15.5)"
          fill="var(--plant-leaf)"
        />
      </svg>
      <span className="sprout-loader-label">{label}</span>
    </div>
  );
}
