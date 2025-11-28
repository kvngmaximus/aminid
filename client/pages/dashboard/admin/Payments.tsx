import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, Settings, LogOut } from "lucide-react";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabase";

type Payment = { id: string; user_id: string; amount_cents: number; currency: string; status: string; created_at: string };
type Profile = { id: string; name: string | null };

export default function AdminPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const session = s.session;
      if (!session) { navigate("/login"); return; }
      const { data: me } = await supabase
        .from("profiles").select("user_type,status").eq("id", session.user.id).single();
      if (!me || me.status !== "active" || me.user_type !== "admin") { navigate("/"); return; }
      await load();
      const ch = supabase
        .channel("admin-payments")
        .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, load)
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    })();
  }, [navigate]);

  const load = async () => {
    const { data } = await supabase
      .from("payments")
      .select("id,user_id,amount_cents,currency,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    const list = (data as Payment[]) || [];
    setPayments(list);
    const ids = Array.from(new Set(list.map(p => p.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,name").in("id", ids);
      const map: Record<string, string> = {};
      (profs as Profile[] || []).forEach(p => { map[p.id] = p.name || p.id; });
      setProfiles(map);
    }
  };

  const totalCents = useMemo(() => payments.reduce((sum, p) => sum + (p.amount_cents || 0), 0), [payments]);
  const pendingCount = useMemo(() => payments.filter(p => (p.status || '').toLowerCase().includes("pending")).length, [payments]);

  const processPending = async () => {
    await supabase.from("payments").update({ status: "processed" }).or("status.eq.pending,status.eq.received");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin")}>{"\u2190"} Back</Button>
            <Link to="/" className="font-poppins font-bold text-foreground">Aminid</Link>
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-semibold">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/settings") }>
              <Settings size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-poppins font-bold text-3xl text-foreground">Payment Control</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-6">
              <p className="text-muted-foreground text-sm mb-2">Total Transactions</p>
              <p className="text-3xl font-poppins font-bold text-primary">{payments.length}</p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-6">
              <p className="text-muted-foreground text-sm mb-2">Pending Payouts</p>
              <p className="text-3xl font-poppins font-bold text-accent">{pendingCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="font-poppins font-semibold">Payments</div>
              <div className="text-sm font-mono">Total: ₦{(totalCents/100).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
            <div className="divide-y divide-border">
              {payments.length === 0 ? (
                <div className="p-6 text-muted-foreground">No payments found</div>
              ) : payments.map(p => (
                <div key={p.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-foreground">{profiles[p.user_id] || p.user_id}</div>
                      <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">{p.status}</span>
                    <span className="text-sm font-mono">₦{(p.amount_cents/100).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button size="sm" onClick={processPending}>Process Pending Payouts</Button>
        </div>
      </div>
    </div>
  );
}
