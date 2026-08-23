import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const APP_URL = process.env.APP_URL || "https://small-steps-seven.vercel.app";

async function getAuthUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Only authenticated users may open the portal — customer_id is resolved
  // from the DB for THIS user, never from the request body.
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return res.status(404).json({ error: "No subscription found" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${APP_URL}/settings`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[portal]", err);
    return res.status(500).json({ error: "Failed to create portal session" });
  }
}
