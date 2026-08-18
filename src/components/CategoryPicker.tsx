import { useRef, useState } from "react";
import { CATEGORIES } from "../lib/constants";
import type { Category } from "../lib/types";
import { CategoryIcon } from "./icons";

interface CategoryPickerProps {
  value: Category | null;
  onChange: (value: Category | null) => void;
  label?: string;
}

export default function CategoryPicker({
  value,
  onChange,
  label = "Category (optional)",
}: CategoryPickerProps) {
  const [pulse, setPulse] = useState<Category | "none" | null>(null);
  const pulseTimer = useRef<number | null>(null);

  const pick = (next: Category | null) => {
    onChange(next);
    setPulse(next === null ? "none" : next);
    if (pulseTimer.current != null) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setPulse(null), 240);
  };

  const cls = (active: boolean, id: Category | "none") =>
    `picker-option${active ? " picker-option--on" : ""}${
      pulse === id ? " just-selected" : ""
    }`;

  return (
    <div className="picker">
      <span className="picker-label">{label}</span>
      <div className="picker-options" role="radiogroup">
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          className={cls(value === null, "none")}
          onClick={() => pick(null)}
          title="No category"
        >
          <span className="picker-option-dot">—</span>
          <span>None</span>
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={value === c.id}
            className={cls(value === c.id, c.id)}
            onClick={() => pick(c.id)}
            title={c.label}
          >
            <span className="picker-option-dot">
              <CategoryIcon category={c.id} size={16} />
            </span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}