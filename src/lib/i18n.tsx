import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LangContext, type Lang } from "./langContext";

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    "hero.eyebrow": "For those coming back",
    "hero.title1": "Small steps",
    "hero.title2": "back to life",
    "hero.sub": "A quiet place to notice what you did today — one question, one warm reply, no streaks and no guilt.",
    "hero.cta": "Start free",
    "hero.how": "See how it works",
    "checkin.greeting.morning": "Good morning",
    "checkin.greeting.afternoon": "Good afternoon",
    "checkin.greeting.evening": "Good evening",
    "checkin.greeting.night": "Resting well",
    "checkin.question": "What's one small thing you did today?",
    "checkin.hint": "Any step counts — even the one that felt like “nothing”.",
    "checkin.mark": "Mark it",
    "checkin.showed": "I showed up today",
    "settings.lang": "Language",
    "settings.lang.hint": "Choose your language — the app will remember.",
  },
  uk: {
    "hero.eyebrow": "Для тих, хто повертається",
    "hero.title1": "Маленькі кроки",
    "hero.title2": "назад до життя",
    "hero.sub": "Тихе місце помітити, що ти зробив сьогодні — одне запитання, одна тепла відповідь, без streaks і провини.",
    "hero.cta": "Почати безкоштовно",
    "hero.how": "Як це працює",
    "checkin.greeting.morning": "Доброго ранку",
    "checkin.greeting.afternoon": "Добрий день",
    "checkin.greeting.evening": "Добрий вечір",
    "checkin.greeting.night": "Тихої ночі",
    "checkin.question": "Що маленького ти зробив сьогодні?",
    "checkin.hint": "Будь-який крок рахується — навіть «просто встав».",
    "checkin.mark": "Відмітити",
    "checkin.showed": "Я був тут сьогодні",
    "settings.lang": "Мова",
    "settings.lang.hint": "Обери мову — запам'ятаємо.",
  },
  ru: {
    "hero.eyebrow": "Для тех, кто возвращается",
    "hero.title1": "Маленькие шаги",
    "hero.title2": "назад к жизни",
    "hero.sub": "Тихое место заметить, что ты сделал сегодня — один вопрос, один тёплый ответ, без streaks и вины.",
    "hero.cta": "Начать бесплатно",
    "hero.how": "Как это работает",
    "checkin.greeting.morning": "Доброе утро",
    "checkin.greeting.afternoon": "Добрый день",
    "checkin.greeting.evening": "Добрый вечер",
    "checkin.greeting.night": "Тихой ночи",
    "checkin.question": "Что маленького ты сделал сегодня?",
    "checkin.hint": "Любой шаг считается — даже «просто встал».",
    "checkin.mark": "Отметить",
    "checkin.showed": "Я был здесь сегодня",
    "settings.lang": "Язык",
    "settings.lang.hint": "Выбери язык — запомним.",
  },
};

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("ss-lang") as Lang | null;
      if (stored && DICT[stored]) return stored;
      const nav = navigator.language.slice(0, 2) as Lang;
      if (DICT[nav]) return nav;
    } catch {}
    return "en";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("ss-lang", l);
    } catch {}
  }, []);

  const t = useCallback((k: string) => DICT[lang][k] ?? DICT.en[k] ?? k, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <LangContext.Provider value={{ lang, t, setLang }}>{children}</LangContext.Provider>;
}
