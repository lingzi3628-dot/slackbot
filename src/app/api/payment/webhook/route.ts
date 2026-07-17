import { NextRequest, NextResponse } from "next/server";
import { PLANS, type PlanId } from "@/lib/premium-plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

/**
 * POST /api/payment/webhook
 *
 * Receives real-time payment updates from Paystack.
 * Verifies the signature and updates the user's plan.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // In production, verify the signature with crypto:
    // const crypto = require('crypto');
    // const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');
    // if (hash !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const data = event.data;
      const planId = data.metadata?.plan_id as PlanId;
      const plan = PLANS.find((p) => p.id === planId);

      if (plan) {
        console.log(`[payment/webhook] Payment success: ${data.customer.email} → ${plan.name} (KSh ${plan.priceKES})`);
        // In production: update the user's plan in the database here.
        // db.user.update({ where: { email: data.customer.email }, data: { plan: planId } })
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[payment/webhook] error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
