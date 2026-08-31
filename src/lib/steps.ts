import { supabase } from "./supabase";
import type { Category, Step } from "./types";

export async function fetchSteps(limit?: number): Promise<Step[]> {
  if (!supabase) return [];
  let q = supabase
    .from("steps")
    .select("*")
    .order("created_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data as Step[]) ?? [];
}

export interface UpdateStepResult {
  ok: boolean;
  step?: Step;
  error?: string;
}

export async function updateStep(
  id: string,
  patch: { note?: string; category?: Category | null; mood?: number | null },
): Promise<UpdateStepResult> {
  if (!supabase) return { ok: false, error: "Supabase is not configured" };
  try {
    const { data, error } = await supabase
      .from("steps")
      .update({ ...patch })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) {
      console.error("[updateStep]", error);
      return { ok: false, error: error.message };
    }
    if (!data) return { ok: false, error: "No rows updated" };
    return { ok: true, step: data as Step };
  } catch (err) {
    console.error("[updateStep]", err);
    return { ok: false, error: "Unexpected error" };
  }
}

export async function deleteStep(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("steps").delete().eq("id", id);
  return !error;
}

export async function fetchPayments(userId: string): Promise<import("./types").Payment[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as import("./types").Payment[]) ?? [];
}

export async function deleteAllSteps(): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("steps")
    .delete()
    .eq("user_id", user.id);
  return !error;
}