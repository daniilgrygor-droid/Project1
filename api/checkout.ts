import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import Sentry from "./_sentry.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_YEARLY = process.env.STRIPE_PRICE_ID!;
const PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY || "";
const APP_URL = process.env.APP_URL || "https://small-steps-seven.vercel.app";

// --- Rate limiting (in-memory, per-user, 5 req / 5 min) ---
const RATE_LIMIT = 5;
const RATE_WINDOW = 5 * 60_000;
const hits = new Map<string, number[]>();

function rateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = hits.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  hits.set(userId, recent);
  return true;
}

async function getAuthUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabase = createClient(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)!,
    (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)!,
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

  // Only authenticated users may start a checkout — never trust the body.
  const user = await getAuthUser(req);
  if (!user || !user.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!rateLimit(user.id)) {
    return res.status(429).json({ error: "Too many requests — try again later" });
  }

  const { interval } = req.body as { interval?: string };

  try {
    // Find or create Stripe customer for THIS user only
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    let customer: Stripe.Customer;

    if (existing.data.length > 0) {
      customer = existing.data[0];
      if (customer.metadata.supabase_user_id !== user.id) {
        customer = await stripe.customers.update(customer.id, {
          metadata: { supabase_user_id: user.id },
        });
      }
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
    }

    // Create Checkout Session
    const priceId = interval === "month" && PRICE_MONTHLY ? PRICE_MONTHLY : PRICE_YEARLY;
    const session = await (stripe.checkout.sessions.create as any)({
      customer: customer.id,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/settings?upgraded=true`,
      cancel_url: `${APP_URL}/pricing?cancelled=true`,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      payment_method_types: ["card"],
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[checkout]", err);
    Sentry.captureException(err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
