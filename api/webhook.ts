import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error("[webhook] No supabase_user_id in session metadata");
    return;
  }

  const subscriptionId = session.subscription as string;

  // Update profile to private
  await supabase
    .from("profiles")
    .update({
      plan: "private",
      plan_updated_at: new Date().toISOString(),
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  // Record payment
  await supabase.from("payments").insert({
    user_id: userId,
    email: session.customer_email || "",
    amount: session.amount_total || 4800,
    currency: (session.currency || "usd").toUpperCase(),
    status: "confirmed",
    period_start: new Date().toISOString(),
    period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
    confirmed_at: new Date().toISOString(),
    stripe_session_id: session.id,
  });

  console.log(`[webhook] Checkout completed for user ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  const isActive = subscription.status === "active";

  await supabase
    .from("profiles")
    .update({
      plan: isActive ? "private" : "free",
      plan_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  console.log(
    `[webhook] Subscription ${subscription.id} → ${subscription.status} for user ${userId}`,
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  await supabase
    .from("profiles")
    .update({
      plan: "free",
      plan_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  console.log(`[webhook] Subscription deleted for user ${userId}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      JSON.stringify(req.body),
      sig,
      webhookSecret,
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      default:
        // Unhandled event type
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  return res.status(200).json({ received: true });
}
