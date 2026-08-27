export type PricingVariant = "A" | "B";

const KEY = "ss-ab-pricing";

export function getPricingVariant(): PricingVariant {
  try {
    const stored = localStorage.getItem(KEY) as PricingVariant | null;
    if (stored === "A" || stored === "B") return stored;
    const v: PricingVariant = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem(KEY, v);
    return v;
  } catch {
    return "A";
  }
}
