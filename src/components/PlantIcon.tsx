interface PlantIconProps {
  size?: number;
  className?: string;
}

export default function PlantIcon({ size = 40, className }: PlantIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 30 L36 30 L33 42 Q33 44 31 44 L17 44 Q15 44 15 42 L12 30 Z"
        fill="var(--plant-pot)"
      />
      <path
        d="M24 30 Q27 22 23 14"
        stroke="var(--plant-stem)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse
        cx="17"
        cy="17"
        rx="7"
        ry="4.5"
        transform="rotate(-25 17 17)"
        fill="var(--plant-leaf)"
      />
      <ellipse
        cx="31"
        cy="13"
        rx="6.5"
        ry="4"
        transform="rotate(20 31 13)"
        fill="var(--plant-leaf)"
      />
    </svg>
  );
}