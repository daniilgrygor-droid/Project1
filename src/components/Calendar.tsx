import { useMemo, useState } from "react";
import type { Step } from "../lib/types";
import { dayKey } from "../lib/constants";
import { groupByDay } from "../lib/stats";
import { SproutIcon, LeafIcon, DotIcon } from "./icons";

interface CalendarProps {
  steps: Step[];
  onPickDay: (dayKey: string) => void;
  selectedDay: string | null;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function Calendar({ steps, onPickDay, selectedDay }: CalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });

  const byDay = useMemo(() => groupByDay(steps), [steps]);

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    // Monday-first
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const arr: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(new Date(cursor.y, cursor.m, d));
    }
    return arr;
  }, [cursor]);

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const move = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const todayKey = dayKey(new Date().toISOString());

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" className="calendar-nav" onClick={() => move(-1)} aria-label="Previous month">
          ‹
        </button>
        <span className="calendar-month">{monthLabel}</span>
        <button type="button" className="calendar-nav" onClick={() => move(1)} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="calendar-grid calendar-grid--head">
        {WEEKDAYS.map((w) => (
          <span key={w} className="calendar-dow">
            {w}
          </span>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((date, i) => {
          if (!date) return <span key={`x${i}`} className="calendar-cell calendar-cell--empty" />;
          const key = dayKey(date.toISOString());
          const daySteps = byDay.get(key);
          const count = daySteps?.length ?? 0;
          const isSelected = selectedDay === key;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              className={`calendar-cell${isSelected ? " calendar-cell--selected" : ""}`}
              onClick={() => onPickDay(key)}
              aria-label={`${key}${count ? `, ${count} step${count === 1 ? "" : "s"}` : ", no steps"}`}
            >
              <span className={`calendar-day-num${isToday ? " calendar-day-num--today" : ""}`}>
                {date.getDate()}
              </span>
              {count === 0 && (
                // Rule: quiet days stay visually neutral — never red/orange/warning.
                <span className="calendar-empty-dot">
                  <DotIcon size={8} />
                </span>
              )}
              {count === 1 && <LeafIcon size={14} />}
              {count >= 2 && <SproutIcon size={16} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}