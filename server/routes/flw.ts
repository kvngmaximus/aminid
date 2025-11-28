import type { RequestHandler } from "express";
import { supabaseAdmin } from "../supabase";

// Prefer server-specific env vars; fall back to Vite-prefixed ones if present
const FLW_SECRET_KEY = (process.env.FLW_SECRET_KEY || process.env.VITE_FLW_SECRET_KEY) as string;
const FLW_WEBHOOK_SECRET = (process.env.FLW_WEBHOOK_SECRET || process.env.VITE_FLW_WEBHOOK_SECRET) as string;

type Purpose = "reader_subscription" | "author_premium" | "course_purchase";

async function verifyTransaction(transactionId: number) {
  if (!FLW_SECRET_KEY) {
    throw new Error("Server misconfigured: missing Flutterwave secret key");
  }
  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flutterwave verify failed: ${res.status} ${text}`);
  }
  return (await res.json()) as any;
}

export const postVerifyPayment: RequestHandler = async (req, res) => {
  try {
    const { transaction_id, tx_ref, purpose, user_id, course_id } = req.body as {
      transaction_id: number;
      tx_ref: string;
      purpose: Purpose;
      user_id: string;
      course_id?: string;
    };
    if (!transaction_id || !tx_ref || !purpose || !user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!FLW_SECRET_KEY) {
      return res.status(500).json({ ok: false, error: "Server misconfigured: missing Flutterwave secret key" });
    }

    const verify = await verifyTransaction(transaction_id);
    if (verify?.status !== "success" || verify?.data?.status !== "successful") {
      return res.status(400).json({ error: "Payment not successful", verify });
    }

    const data = verify.data;
    const amountNgn = Number(data.amount ?? 0);
    const currency = String(data.currency ?? "NGN");

    // Record payment
    await supabaseAdmin.from("payments").insert({
      user_id,
      provider: "flutterwave",
      provider_ref: String(data.id ?? tx_ref),
      amount_cents: Math.round(amountNgn * 100),
      currency,
      status: String(data.status),
      event: verify,
    });

    // Activate subscription or premium author or enroll course
    const now = new Date();
    const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (purpose === "reader_subscription") {
      await supabaseAdmin.from("subscriptions").upsert({
        user_id,
        plan_id: "reader_monthly",
        status: "active",
        renews_at: renewsAt.toISOString(),
      }, { onConflict: "user_id,plan_id" });
      // Reflect subscription status on profile for quick access gating
      await supabaseAdmin
        .from("profiles")
        .update({ subscription_status: "active", subscription_expires_at: renewsAt.toISOString() })
        .eq("id", user_id);
    } else if (purpose === "author_premium") {
      await supabaseAdmin.from("subscriptions").upsert({
        user_id,
        plan_id: "author_monthly",
        status: "active",
        renews_at: renewsAt.toISOString(),
      }, { onConflict: "user_id,plan_id" });
      await supabaseAdmin.from("authors").update({ premium: true }).eq("user_id", user_id);
      // Authors are subscribers too; mark profile
      await supabaseAdmin
        .from("profiles")
        .update({ subscription_status: "active", subscription_expires_at: renewsAt.toISOString() })
        .eq("id", user_id);
    } else if (purpose === "course_purchase" && course_id) {
      // Enroll the user in the purchased course
      const { data: existing } = await supabaseAdmin
        .from("course_enrollments")
        .select("id")
        .eq("user_id", user_id)
        .eq("course_id", course_id)
        .maybeSingle();
      if (!existing) {
        await supabaseAdmin.from("course_enrollments").insert({ user_id, course_id, progress: 0 });
      }
    }
    return res.status(200).json({ ok: true, verify, purpose, course_id, enrolled: purpose === "course_purchase" });
  } catch (err: any) {
    console.error("[flw.verify]", err);
    return res.status(500).json({ error: err.message ?? "Internal error" });
  }
};

export const postWebhook: RequestHandler = async (req, res) => {
  try {
    const signature = req.headers["verif-hash"] || req.headers["verif-hash".toLowerCase()];
    if (!FLW_WEBHOOK_SECRET || signature !== FLW_WEBHOOK_SECRET) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }
    const event = req.body;
    const data = event?.data ?? {};
    const status = String(data.status ?? event?.status ?? "");

    // tx_ref encodes purpose, user_id, optional course_id
    // expected format: purpose:user_id[:course_id]:random
    const txRef: string = String(data.tx_ref ?? "");
    const parts = txRef.split(":");
    const purpose: Purpose | undefined = parts[0] as any;
    const user_id: string | undefined = parts[1];
    const course_id: string | undefined = parts.length > 3 ? parts[2] : undefined; // when present
    const amount = Number(data.amount ?? 0);
    const currency = String(data.currency ?? "NGN");

    if (purpose && user_id) {
      await supabaseAdmin.from("payments").insert({
        user_id,
        provider: "flutterwave",
        provider_ref: String(data.id ?? txRef),
        amount_cents: Math.round(amount * 100),
        currency,
        status,
        event,
      });

      if (status === "successful") {
        const now = new Date();
        const renewsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (purpose === "reader_subscription") {
          await supabaseAdmin.from("subscriptions").upsert({
            user_id,
            plan_id: "reader_monthly",
            status: "active",
            renews_at: renewsAt.toISOString(),
          }, { onConflict: "user_id,plan_id" });
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "active", subscription_expires_at: renewsAt.toISOString() })
            .eq("id", user_id);
        } else if (purpose === "author_premium") {
          await supabaseAdmin.from("subscriptions").upsert({
            user_id,
            plan_id: "author_monthly",
            status: "active",
            renews_at: renewsAt.toISOString(),
          }, { onConflict: "user_id,plan_id" });
          await supabaseAdmin.from("authors").update({ premium: true }).eq("user_id", user_id);
          await supabaseAdmin
            .from("profiles")
            .update({ subscription_status: "active", subscription_expires_at: renewsAt.toISOString() })
            .eq("id", user_id);
        } else if (purpose === "course_purchase" && course_id) {
          const { data: existing } = await supabaseAdmin
            .from("course_enrollments")
            .select("id")
            .eq("user_id", user_id)
            .eq("course_id", course_id)
            .maybeSingle();
          if (!existing) {
            await supabaseAdmin.from("course_enrollments").insert({ user_id, course_id, progress: 0 });
          }
        }
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[flw.webhook]", err);
    return res.status(500).json({ error: err.message ?? "Internal error" });
  }
};
