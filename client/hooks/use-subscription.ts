import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useSubscriptionStatus() {
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let profileChannel: any | null = null;
    let subsChannel: any | null = null;

    (async () => {
      setLoading(true);
      const { data: sessionRes } = await supabase.auth.getSession();
      const uid = sessionRes.session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) { setActive(false); setLoading(false); return; }

      async function computeActive() {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("status,renews_at,plan_id")
          .eq("user_id", uid);
        let hasActive = (subs ?? []).some((s: any) => s.status === "active");
        if (!hasActive) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("subscription_status,subscription_expires_at")
            .eq("id", uid)
            .maybeSingle();
          if (profile?.subscription_status === "active") {
            const expires = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at).getTime() : 0;
            hasActive = expires > Date.now();
          }
        }
        setActive(hasActive);
      }

      await computeActive();

      // Subscribe to changes so UI updates immediately after payment verification
      profileChannel = supabase
        .channel(`profile-subscription-${uid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` }, () => {
          void computeActive();
        })
        .subscribe();

      subsChannel = supabase
        .channel(`subs-${uid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${uid}` }, () => {
          void computeActive();
        })
        .subscribe();

      setLoading(false);
    })();

    return () => {
      try { if (profileChannel) supabase.removeChannel(profileChannel); } catch {}
      try { if (subsChannel) supabase.removeChannel(subsChannel); } catch {}
    };
  }, []);

  return { loading, active, userId };
}
