const KEY = "ss-ref";

export function saveReferralFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^[a-z0-9]{6,12}$/i.test(ref)) {
      localStorage.setItem(KEY, ref.toLowerCase());
    }
  } catch {}
}

export function getStoredReferral(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferral() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export async function applyReferral(userId: string) {
  const code = getStoredReferral();
  if (!code) return;
  try {
    const { supabase } = await import("./supabase");
    if (!supabase) return;
    const { data: referrer } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();
    if (!referrer || (referrer as { id: string }).id === userId) {
      clearStoredReferral();
      return;
    }
    await supabase
      .from("profiles")
      .update({ referred_by: (referrer as { id: string }).id })
      .eq("id", userId)
      .is("referred_by", null);
    clearStoredReferral();
    (window as unknown as { plausible?: (e: string, o?: unknown) => void }).plausible?.("referral_applied");
  } catch {}
}
