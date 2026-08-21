import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const APP_URL = process.env.APP_URL || "https://small-steps-seven.vercel.app";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { customer_id } = req.body as { customer_id?: string };

  if (!customer_id) {
    return res.status(400).json({ error: "Missing customer_id" });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url: `${APP_URL}/settings`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[portal]", err);
    return res.status(500).json({ error: "Failed to create portal session" });
  }
}
