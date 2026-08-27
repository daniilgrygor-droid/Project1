import { createContext } from "react";

type Lang = "en" | "uk" | "ru";

export const LangContext = createContext<{ lang: Lang; t: (k: string) => string; setLang: (l: Lang) => void }>({
  lang: "en",
  t: (k) => k,
  setLang: () => {},
});

export type { Lang };
