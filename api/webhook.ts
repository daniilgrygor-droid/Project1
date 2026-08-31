import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import Sentry from "./_sentry.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const APP_URL = process.env.APP_URL || "https://small-steps-seven.vercel.app";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                    process.env.SERVICE_ROLE_KEY;

function serviceClient() {
  return createClient(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)!,
    SERVICE_KEY!,
  );
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Stripe moved current_period_* onto subscription items in newer API
// versions; older payloads keep them on the subscription root. Read both.
type Periods = { current_period_start?: number; current_period_end?: number };

function subscriptionPeriods(sub: Stripe.Subscription): Periods {
  const item = sub.items.data[0] as Stripe.SubscriptionItem & Periods;
  const root = sub as unknown as Periods;
  return {
    current_period_start: item?.current_period_start ?? root.current_period_start,
    current_period_end: item?.current_period_end ?? root.current_period_end,
  };
}

function isoFromUnix(unix: number | undefined, fallbackMs: number): string {
  return unix
    ? new Date(unix * 1000).toISOString()
    : new Date(fallbackMs).toISOString();
}

function planForStatus(status: string | null | undefined): "private" | "free" {
  // Active + trialing keep Private; everything else degrades gracefully.
  if (status === "active" || status === "trialing") return "private";
  return "free";
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error("[webhook] No supabase_user_id in session metadata");
    return;
  }

  const subscriptionId = session.subscription as string;

  // Retrieve the subscription to get the real period_end for the profile.
  let periodEnd: string | null = null;
  let amount = session.amount_total ?? 0;
  let periods: Periods = {};
  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    amount = sub.items.data[0]?.price?.unit_amount ?? amount;
    periods = subscriptionPeriods(sub);
    periodEnd = new Date(
      (sub as unknown as { current_period_end?: number }).current_period_end ??
        Date.now() + 365 * 86400000,
    ).toISOString();
  }

  await serviceClient()
    .from("profiles")
    .update({
      plan: "private",
      plan_updated_at: new Date().toISOString(),
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
      period_end,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  await serviceClient().from("payments").insert({
    user_id: userId,
    email: session.customer_email || "",
    amount,
    currency: (session.currency || "usd").toUpperCase(),
    status: "confirmed",
    period_start: isoFromUnix(periods.current_period_start, Date.now()),
    period_end: isoFromUnix(periods.current_period_end, Date.now() + 365 * 86400000),
    confirmed_at: new Date().toISOString(),
    stripe_session_id: session.id,
  });

  console.log(`[webhook] Checkout completed for user ${userId}`);
}

// Renewals: every paid invoice after the first one (checkout already
// recorded the subscription_create invoice).
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.billing_reason === "subscription_create") return;

  const subRef = invoice as unknown as {
    subscription?: string | { id?: string } | null;
  };
  const subscriptionId =
    typeof subRef.subscription === "string"
      ? subRef.subscription
      : subRef.subscription?.id;
  if (!subscriptionId) return;

  const { data: profile } = await serviceClient()
    .from("profiles")
    .select("id, email")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  if (!profile) return;

  const line = invoice.lines?.data[0];
  const period = line?.period as { start?: number; end?: number } | undefined;

  await serviceClient().from("payments").insert({
    user_id: profile.id,
    email: invoice.customer_email || profile.email || "",
    amount: invoice.amount_paid ?? line?.amount ?? 0,
    currency: (invoice.currency || "usd").toUpperCase(),
    status: "confirmed",
    period_start: isoFromUnix(period?.start, Date.now()),
    period_end: isoFromUnix(period?.end, Date.now() + 365 * 86400000),
    confirmed_at: new Date().toISOString(),
    stripe_invoice_id: invoice.id,
  });

  console.log(
    `[webhook] Renewal recorded for user ${profile.id} (invoice ${invoice.id})`,
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  const nextPlan = planForStatus(subscription.status);

  await serviceClient()
    .from("profiles")
    .update({
      plan: nextPlan,
      plan_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (nextPlan === "free") {
    // Subscription lapsed/failed — clear the billing refs so the portal
    // doesn't point at a dead subscription.
    await serviceClient()
      .from("profiles")
      .update({
        stripe_subscription_id: null,
        period_end: null,
      })
      .eq("id", userId);
  }

  console.log(
    `[webhook] Subscription ${subscription.id} → ${subscription.status} for user ${userId} → ${nextPlan}`,
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) return;

  await serviceClient()
    .from("profiles")
    .update({
      plan: "free",
      plan_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stripe_subscription_id: null,
      stripe_customer_id: null,
      period_end: null,
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
    Sentry.captureException(err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
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
    Sentry.captureException(err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  return res.status(200).json({ received: true });
}
