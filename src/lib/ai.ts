import { supabase } from "./supabase";
import type { SaveStepResult, Step } from "./types";

const FALLBACK_TEXT =
  "Thank you for sharing that — sit with it for a moment.";

/**
 * Сохраняет отметку пользователя и запрашивает у Gemini личный тёплый ответ.
 *
 * Сначала пробует Supabase Edge Function `step-response` (она сама сохраняет
 * запись и возвращает готовый ответ). Если функция недоступна (не задеплоена
 * или нет ключей) — сохраняет запись напрямую, без AI-ответа, чтобы шаг
 * человека никогда не потерялся.
 */
export async function saveStep(
  note: string,
  showedUpOnly = false,
  meta?: { category?: string | null; mood?: number | null },
): Promise<SaveStepResult> {
  const trimmed = note.trim();
  if (!trimmed && !showedUpOnly) {
    return { ok: false, reason: "error", message: "The field is empty." };
  }

  if (!supabase) {
    return { ok: false, reason: "not-configured" };
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let plan: string | null = null;
  if (authUser) {
    const { data: p } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", authUser.id)
      .maybeSingle();
    plan = (p as { plan?: string } | null)?.plan ?? null;
  }

  try {
    const { data, error } = await supabase.functions.invoke<{
      step?: Step;
    }>("step-response", {
      body: {
        note: trimmed,
        showed_up_only: showedUpOnly,
        category: meta?.category ?? null,
        mood: meta?.mood ?? null,
        plan,
        private_replies: plan === "private",
      },
    });

    if (!error && data?.step) {
      return { ok: true, step: data.step, aiFailed: false };
    }
  } catch {
    // edge function не задеплоена — пробуем сохранить напрямую
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: "error", message: "Couldn't save it. Give it another try." };
  }

  const { data, error } = await supabase
    .from("steps")
    .insert({
      note: showedUpOnly ? "I showed up today" : trimmed,
      showed_up_only: showedUpOnly,
      category: meta?.category ?? null,
      mood: meta?.mood ?? null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return {
      ok: false,
      reason: "error",
      message: "Couldn't save it. Give it another try.",
    };
  }

  return {
    ok: true,
    step: data as Step,
    aiFailed: true,
    message: FALLBACK_TEXT,
  };
}
