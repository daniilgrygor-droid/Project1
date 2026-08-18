export const TEXT_SIZES = [
  { id: "default", px: "16px", label: "Default" },
  { id: "larger", px: "18px", label: "Larger" },
  { id: "largest", px: "20px", label: "Largest" },
] as const;

export type TextSizeId = (typeof TEXT_SIZES)[number]["id"];

const KEY = "ss-text-size";

export function readTextSize(): TextSizeId {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "larger" || v === "largest") return v;
    return "default";
  } catch {
    return "default";
  }
}

export function applyTextSize(id: TextSizeId) {
  const px = TEXT_SIZES.find((t) => t.id === id)?.px ?? "16px";
  document.documentElement.style.setProperty("--base-font-size", px);
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* storage unavailable — skip */
  }
}
