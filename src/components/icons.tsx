interface IconProps {
  size?: number;
}

function base(size: number | undefined) {
  return {
    width: size ?? 22,
    height: size ?? 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

export function SproutIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 21v-7" />
      <path d="M12 14c0-4 2.5-7 7-7 0 4-2.5 7-7 7Z" />
      <path d="M12 11c0-3-2-5-5-5 0 3 2 5 5 5Z" />
    </svg>
  );
}

export function SunIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function FootprintIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M7 3.5c1.2.5 1.8 1.8 1.7 3.3-.1 1.5.2 2.7 1.3 3.7.7.7 1.7 1.2 1.7 2.5 0 1.8-1.6 3-3.5 2.5C6 14.9 5 13 5.2 10.9 5.4 8.8 5.8 5 7 3.5Z" />
      <path d="M17 2.5c-1.2.5-1.8 1.8-1.7 3.3.1 1.5-.2 2.7-1.3 3.7-.7.7-1.7 1.2-1.7 2.5 0 1.8 1.6 3 3.5 2.5 1.9-.6 2.9-2.5 2.7-4.6-.2-2.1-.6-5.9-1.5-7.4Z" />
    </svg>
  );
}

export function CupIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M6 8h10v5a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V8Z" />
      <path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M6 3c1 1.2 1 2.8 0 4M9.5 3c1 1.2 1 2.8 0 4" />
    </svg>
  );
}

export function LeafIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15Z" />
      <path d="M5 19c3-4 7-7 11-9" />
    </svg>
  );
}

export function MoonIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  );
}

export function EnvelopeIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function DropletIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
      <path d="M9.5 13.5a2.5 2.5 0 0 0 1.5 2.3" />
    </svg>
  );
}

export function HouseIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function DotIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BriefcaseIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

export function BookIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

export function HeartIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 1 1 7.5-6.6 5 5 0 1 1 7.5 6.6Z" />
    </svg>
  );
}

export function PencilIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

export function SearchIcon({ size }: IconProps) {
  return (
    <svg {...base(size)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export type StepKind =
  | "walk"
  | "mail"
  | "rest"
  | "food"
  | "water"
  | "nature"
  | "home"
  | "other";

const KEYWORDS: Record<Exclude<StepKind, "other">, string[]> = {
  walk: [
    "walk", "walked", "walking", "outside", "stroll", "run", "ran", "running",
    "jog", "fresh air", "stepped out", "went out", "went for", "park", "hike",
    "bike", "biking", "cycling", "cycle",
  ],
  mail: [
    "email", "emails", "mail", "letter", "letters", "message", "messages",
    "replied", "answered", "wrote", "sent", "called", "phone call", "text",
    "texts", "texted",
  ],
  rest: [
    "bed", "sleep", "slept", "sleeper", "nap", "rest", "rested", "woke",
    "got up", "got out", "laid down", "lied down", "breathe", "deep breath",
    "break from",
  ],
  food: [
    "eat", "ate", "eaten", "meal", "meals", "food", "breakfast", "lunch",
    "dinner", "coffee", "tea", "cook", "cooked", "cooking", "snack", "snacked",
    "groceries",
  ],
  water: [
    "shower", "wash", "washed", "bath", "bathroom", "brush", "brushed",
    "teeth", "hair", "skin", "drink water", "glass of water", "hydrate",
    "hydration",
  ],
  nature: [
    "plant", "plants", "watered", "watering", "flower", "flowers", "tree",
    "trees", "leaf", "leaves", "grow", "grew", "growing", "bird", "birds",
    "sun", "air", "sky",
  ],
  home: [
    "clean", "cleaned", "cleaning", "laundry", "dishes", "tidy", "tidied",
    "organized", "organised", "organizing", "took out", "make bed",
    "made bed", "folded", "vacuum",
  ],
};

export function inferStepKind(text: string): StepKind {
  const t = text.toLowerCase();
  for (const kind of Object.keys(KEYWORDS) as Exclude<StepKind, "other">[]) {
    if (
      KEYWORDS[kind].some((word) => new RegExp(`\\b${word}\\b`, "i").test(t))
    ) {
      return kind;
    }
  }
  return "other";
}

export function StepKindIcon({ kind, size }: { kind: StepKind; size?: number }) {
  switch (kind) {
    case "walk":
      return <FootprintIcon size={size} />;
    case "mail":
      return <EnvelopeIcon size={size} />;
    case "rest":
      return <MoonIcon size={size} />;
    case "food":
      return <CupIcon size={size} />;
    case "water":
      return <DropletIcon size={size} />;
    case "nature":
      return <LeafIcon size={size} />;
    case "home":
      return <HouseIcon size={size} />;
    default:
      return <DotIcon size={size} />;
  }
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
