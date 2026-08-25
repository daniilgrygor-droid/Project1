interface IconProps {
  size?: number;
  className?: string;
}

function base(size: number | undefined, className?: string) {
  return {
    width: size ?? 22,
    height: size ?? 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.45,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
}

export function SproutIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 21V11" />
      <path d="M12 11c0-3.2 2.2-6 6-6 0 3.2-2.2 6-6 6Z" />
      <path d="M12 13c0-2.4-1.7-4.2-4-4.2 0 2.4 1.7 4.2 4 4.2Z" />
      <path d="M9 21c0-1.1.9-2 2-2" opacity=".45" />
    </svg>
  );
}

export function SunIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 2.2v2M12 19.8v2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.2 12h2M19.8 12h2M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
    </svg>
  );
}

export function FootprintIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M8.2 4.2c1 .45 1.5 1.55 1.4 2.9-.1 1.3.15 2.35 1.1 3.2.6.6 1.35 1 1.35 2.1 0 1.5-1.3 2.5-2.9 2.1-1.6-.5-2.4-2-2.25-3.9.15-1.85.5-5.1 1.3-6.4Z" />
      <path d="M15.8 3.2c-1 .45-1.5 1.55-1.4 2.9.1 1.3-.15 2.35-1.1 3.2-.6.6-1.35 1-1.35 2.1 0 1.5 1.3 2.5 2.9 2.1 1.6-.5 2.4-2 2.25-3.9-.15-1.85-.5-5.1-1.3-6.4Z" />
    </svg>
  );
}

export function CupIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6.5 8.5h9v4.5a4.5 4.5 0 0 1-4.5 4.5h-1a4.5 4.5 0 0 1-4.5-4.5V8.5Z" />
      <path d="M15.5 9.5h1.2a2.2 2.2 0 0 1 0 4.4h-1.2" />
      <path d="M7 4c.7 .9 .7 2.1 0 3M10 4c.7 .9 .7 2.1 0 3" opacity=".7" />
    </svg>
  );
}

export function LeafIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 18.5C6 10.2 11.2 5 19 5c0 7.8-5.2 13.5-13 13.5Z" />
      <path d="M6 18.5c2.7-3.2 6-5.8 9.5-7.8" />
      <path d="M11.2 13.2c1.2-1 2.4-1.9 3.7-2.6" opacity=".55" />
    </svg>
  );
}

export function MoonIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M19.2 13.8A7.2 7.2 0 0 1 10.2 4.8a7.2 7.2 0 1 0 9 9Z" />
    </svg>
  );
}

export function EnvelopeIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m3.8 7.2 8.2 5.4 8.2-5.4" />
    </svg>
  );
}

export function DropletIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 3.2s5.2 5.8 5.2 10a5.2 5.2 0 0 1-10.4 0c0-4.2 5.2-10 5.2-10Z" />
      <path d="M10 12.8a2 2 0 0 0 1.2 1.8" opacity=".6" />
    </svg>
  );
}

export function HouseIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M4.8 10.8 12 5l7.2 5.8" />
      <path d="M6.8 10.2v8.3c0 .6.4 1 1 1h8.4c.6 0 1-.4 1-1v-8.3" />
      <path d="M9.5 19.5v-4h5v4" opacity=".7" />
    </svg>
  );
}

export function DotIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.1" opacity=".28" />
    </svg>
  );
}

export function BriefcaseIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3.5" y="7.5" width="17" height="11" rx="2" />
      <path d="M8.5 7.5V5.8a1.7 1.7 0 0 1 1.7-1.7h3.6a1.7 1.7 0 0 1 1.7 1.7v1.7" />
      <path d="M3.5 12h17" />
    </svg>
  );
}

export function BookIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M5 19.2A2.2 2.2 0 0 1 7.2 17H19" />
      <path d="M7.2 3.2H19v16H7.2A2.2 2.2 0 0 1 5 17V5.4A2.2 2.2 0 0 1 7.2 3.2Z" />
      <path d="M7.2 7.5H16" opacity=".45" />
    </svg>
  );
}

export function HeartIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M18.6 11.8 12 18.2 5.4 11.8a4.2 4.2 0 0 1 6-5.9A4.2 4.2 0 0 1 18.6 11.8Z" />
    </svg>
  );
}

export function PencilIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M15.8 3.5a2.4 2.4 0 0 1 3.4 3.4L8.2 17.9 3 19l1.1-5.2Z" />
      <path d="M13.6 5.7 18 10.1" opacity=".5" />
    </svg>
  );
}

export function SearchIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="11" cy="11" r="6" />
      <path d="m19 19-3.3-3.3" />
    </svg>
  );
}

export function GearIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="2.7" />
      <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.1 5.1l1.7 1.7M17.2 17.2l1.7 1.7M18.9 5.1 17.2 6.8M6.8 17.2 5.1 18.9" />
    </svg>
  );
}

export function SignOutIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M15 8l4 4-4 4" />
      <path d="M19 12H9" />
    </svg>
  );
}

export function CategoryIcon({ category, size }: { category: string; size?: number }) {
  switch (category) {
    case "body":
      return <DropletIcon size={size} />;
    case "work":
      return <BriefcaseIcon size={size} />;
    case "study":
      return <BookIcon size={size} />;
    case "home":
      return <HouseIcon size={size} />;
    case "rest":
      return <MoonIcon size={size} />;
    case "people":
      return <HeartIcon size={size} />;
    default:
      return <DotIcon size={size} />;
  }
}
