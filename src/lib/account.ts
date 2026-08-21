import { supabase } from "./supabase";

/**
 * Deletes all user data (steps, profile, payments) and signs out.
 * The auth account remains but is effectively orphaned.
 * For full account deletion, an edge function with service_role is needed.
 */
export async function deleteAccount(): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Not configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // Delete all steps
  const { error: stepsErr } = await supabase
    .from("steps")
    .delete()
    .eq("user_id", user.id);

  if (stepsErr) return { ok: false, error: "Could not delete steps" };

  // Delete payments
  await supabase.from("payments").delete().eq("user_id", user.id);

  // Delete profile
  const { error: profErr } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (profErr) return { ok: false, error: "Could not delete profile" };

  // Sign out
  await supabase.auth.signOut();

  return { ok: true };
}

/**
 * Requests an email change. Supabase sends a confirmation to the new address.
 */
export async function requestEmailChange(
  newEmail: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Not configured" };

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    return { ok: false, error: error.message || "Could not update email" };
  }

  return { ok: true };
}
