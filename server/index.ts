import "dotenv/config";
import express from "express";
import cors from "cors";
import { supabaseAdmin } from "./supabase";
import { handleDemo } from "./routes/demo";
import { postVerifyPayment, postWebhook } from "./routes/flw";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Flutterwave payment verification and webhook
  app.post("/api/payments/verify", postVerifyPayment);
  app.post("/api/payments/webhook", postWebhook);
  // Convenience non-/api path for Netlify function routing
  app.post("/flw/webhook", postWebhook);

  // Initialize Supabase Storage buckets for avatars and course covers
  app.post("/api/storage/init", async (_req, res) => {
    try {
      const ensureBucket = async (name: string) => {
        const { error } = await supabaseAdmin.storage.createBucket(name, { public: true });
        // Ignore bucket-exists errors (status 409)
        if (error && (error as any)?.status !== 409) throw error;
      };
      await ensureBucket("avatars");
      await ensureBucket("course-covers");
      return res.json({ ok: true, buckets: ["avatars", "course-covers"] });
    } catch (err: any) {
      console.error("[storage.init]", err);
      return res.status(500).json({ error: err?.message ?? "Failed to init storage" });
    }
  });

  return app;
}
