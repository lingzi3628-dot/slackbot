import { NextRequest, NextResponse } from "next/server";
import { PLANS, type PlanId } from "@/lib/premium-plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

/**
 * GET /api/payment/verify?reference=xxx&trxref=xxx
 *
 * Paystack redirects here after payment. Verifies the transaction
 * and returns the plan details on success.
 *
 * In production this would update the user's plan in the database.
 * For now, we store it in a cookie + return the plan info.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference") || searchParams.get("trxref");

    if (!reference) {
      return NextResponse.redirect(new URL("/?payment=failed", req.url));
    }

    // Verify the transaction with Paystack
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${PAYSTACK_SECRET}`,
        "content-type": "application/json",
      },
    });

    const data = await res.json();

    if (!data.status || data.data.status !== "success") {
      return NextResponse.redirect(new URL("/?payment=failed", req.url));
    }

    // Extract plan from metadata
    const planId = (data.data.metadata?.plan_id || data.data.metadata?.planId) as PlanId;
    const plan = PLANS.find((p) => p.id === planId);

    if (!plan) {
      return NextResponse.redirect(new URL("/?payment=failed", req.url));
    }

    // In production: update the user's plan in the database here.
    // For now, redirect to the premium page with success.
    const redirectUrl = new URL("/?payment=success", req.url);
    redirectUrl.searchParams.set("plan", planId);
    redirectUrl.searchParams.set("reference", reference);

    const response = NextResponse.redirect(redirectUrl);

    // Set a cookie with the plan (in production, this would be a DB update + session)
    response.cookies.set("spyro-plan", planId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[payment/verify] error:", err);
    return NextResponse.redirect(new URL("/?payment=failed", req.url));
  }
}
