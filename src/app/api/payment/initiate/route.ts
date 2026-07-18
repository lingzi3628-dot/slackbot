import { NextRequest, NextResponse } from "next/server";
import { PLANS, type PlanId } from "@/lib/premium-plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_PUBLIC = process.env.PAYSTACK_PUBLIC_KEY || "";

/**
 * POST /api/payment/initiate
 * Body: { planId: "pro" | "plus" | "ultra" | "business" | "enterprise", email: "user@example.com" }
 *
 * Initializes a Paystack transaction. Supports M-Pesa, cards, bank transfer.
 * Returns the authorization URL for the user to complete payment.
 */
export async function POST(req: NextRequest) {
  try {
    const { planId, email } = await req.json();

    if (!planId || !email) {
      return NextResponse.json({ error: "planId and email are required" }, { status: 400 });
    }

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan || plan.priceKES === 0) {
      return NextResponse.json({ error: "Invalid plan or free plan selected" }, { status: 400 });
    }

    // Paystack expects amount in the smallest currency unit (kobo for NGN,
    // but for KES it's cents — Paystack uses 100x for KES)
    const amountInCents = plan.priceKES * 100;

    const callbackUrl = `${req.nextUrl.origin}/api/payment/verify`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        authorization: `Bearer ${PAYSTACK_SECRET}`,
        "content-type": "application/json",
        cache: "no-cache",
      },
      body: JSON.stringify({
        email,
        amount: amountInCents,
        currency: "KES",
        callback_url: callbackUrl,
        metadata: {
          plan_id: planId,
          plan_name: plan.name,
          custom_fields: [
            { display_name: "Plan", variable_name: "plan", value: plan.name },
            { display_name: "Platform", variable_name: "platform", value: "SPYRO V1" },
          ],
        },
      }),
    });

    const data = await res.json();

    if (!data.status) {
      console.error("[payment/initiate] Paystack error:", data.message);
      return NextResponse.json({ error: data.message || "Payment initialization failed" }, { status: 400 });
    }

    return NextResponse.json({
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      accessCode: data.data.access_code,
      planId,
      planName: plan.name,
      amount: plan.priceKES,
      currency: "KES",
      publicKey: PAYSTACK_PUBLIC,
    });
  } catch (err) {
    console.error("[payment/initiate] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment initiation failed" },
      { status: 500 }
    );
  }
}
