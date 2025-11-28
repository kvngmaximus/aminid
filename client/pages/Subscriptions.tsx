import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Subscription = {
  id: string;
  plan_id: string;
  status: string;
  renews_at: string | null;
};

type Payment = {
  id: string;
  provider: string;
  provider_ref: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profileStatus, setProfileStatus] = useState<{ status: string; expires_at: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) { setError("Please sign in to view subscriptions."); setLoading(false); return; }

      const { data: subsData } = await supabase
        .from("subscriptions")
        .select("id,plan_id,status,renews_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status,subscription_expires_at")
        .eq("id", uid)
        .maybeSingle();

      const { data: payData } = await supabase
        .from("payments")
        .select("id,provider,provider_ref,amount_cents,currency,status,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(20);

      setSubs((subsData as Subscription[]) ?? []);
      setProfileStatus(profile ? { status: (profile as any).subscription_status, expires_at: (profile as any).subscription_expires_at ?? null } : null);
      setPayments((payData as Payment[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-poppins font-bold text-3xl text-foreground mb-6">Subscriptions & Receipts</h1>
          {loading && <div className="text-muted-foreground">Loading…</div>}
          {error && <div className="text-red-600">{error}</div>}

          {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white rounded-xl border border-border p-6">
                <h2 className="font-poppins font-semibold text-xl mb-4">Active Subscriptions</h2>
                {subs.length === 0 ? (
                  <div className="text-muted-foreground">
                    No subscriptions found
                    {profileStatus?.status === 'active' && (
                      <div className="mt-2 text-foreground">
                        Profile shows active subscription{profileStatus?.expires_at ? ` • Expires: ${new Date(profileStatus.expires_at).toLocaleDateString()}` : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subs.map((s) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-foreground">{s.plan_id}</div>
                          <div className="text-xs text-muted-foreground">
                            Status: {s.status} {s.renews_at ? `• Renews: ${new Date(s.renews_at).toLocaleDateString()}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-white rounded-xl border border-border p-6">
                <h2 className="font-poppins font-semibold text-xl mb-4">Payment Receipts</h2>
                {payments.length === 0 ? (
                  <div className="text-muted-foreground">No payments found</div>
                ) : (
                  <div className="divide-y divide-border">
                    {payments.map((p) => (
                      <div key={p.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-foreground">{p.provider} • {p.status}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleString()} • Ref: {p.provider_ref ?? "—"}
                          </div>
                        </div>
                        <div className="text-foreground font-semibold">
                          ₦{(p.amount_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
