import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_YEARLY = process.env.STRIPE_PRICE_ID!;
const PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY || "";
const APP_URL = process.env.APP_URL || "https://small-steps-seven.vercel.app";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id, email, interval } = req.body as {
    user_id?: string;
    email?: string;
    interval?: string;
  };

  if (!user_id || !email) {
    return res.status(400).json({ error: "Missing user_id or email" });
  }

  try {
    // Find or create Stripe customer
    const existing = await stripe.customers.list({ email, limit: 1 });
    let customer: Stripe.Customer;

    if (existing.data.length > 0) {
      customer = existing.data[0];
      // Update metadata if user_id changed
      if (customer.metadata.supabase_user_id !== user_id) {
        customer = await stripe.customers.update(customer.id, {
          metadata: { supabase_user_id: user_id },
        });
      }
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: user_id },
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
      metadata: { supabase_user_id: user_id },
      subscription_data: {
        metadata: { supabase_user_id: user_id },
      },
      payment_method_types: ["card"],
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[checkout]", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}
