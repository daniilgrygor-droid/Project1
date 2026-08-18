import { useRef, useState } from "react";
import { MOODS } from "../lib/constants";

interface MoodPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
  label?: string;
}

export default function MoodPicker({
  value,
  onChange,
  label = "How are you feeling? (optional)",
}: MoodPickerProps) {
  const [pulse, setPulse] = useState<number | null>(null);
  const pulseTimer = useRef<number | null>(null);

  const pick = (next: number) => {
    onChange(next);
    setPulse(next);
    if (pulseTimer.current != null) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setPulse(null), 240);
  };

  return (
    <div className="picker">
      <span className="picker-label">{label}</span>
      <div className="mood-row" role="radiogroup">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={value === m.value}
            aria-label={m.label}
            className={`mood-option${value === m.value ? " mood-option--on" : ""}${
              pulse === m.value ? " just-selected" : ""
            }`}
            onClick={() => pick(m.value)}
            title={m.label}
          >
            <span className="mood-emoji">{m.emoji}</span>
            <span className="mood-caption">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}