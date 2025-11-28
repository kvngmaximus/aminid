import { useEffect, useMemo, useState } from "react";
import { Users, FileText, Award, CreditCard, Settings, LogOut, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

type AdminTab = "users" | "articles" | "recognition" | "payments" | "settings";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalUsers: undefined as number | undefined,
    publishedArticles: undefined as number | undefined,
    premiumMembers: undefined as number | undefined,
    totalRevenue: undefined as number | undefined,
  });
  const [users, setUsers] = useState<Array<{ id: string; name: string; role: string; status: string }>>([]);
  const [pendingArticles, setPendingArticles] = useState<Array<{ id: string; title: string; author: string; status: string }>>([]);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    navigate("/login");
  };

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        navigate("/login");
        return;
      }
      const userId = session.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type,status")
        .eq("id", userId)
        .single();
      if (!profile) return;
      if (profile.status !== "active") {
        navigate("/");
        return;
      }
      if (profile.user_type === "author") {
        navigate("/dashboard/author");
        return;
      }
      if (profile.user_type === "reader") {
        navigate("/dashboard/reader");
        return;
      }
      // Load data regardless; RLS will restrict non-admin queries safely
      await loadAdminData();
      subscribeRealtime();
    })();
  }, [navigate]);

  const loadAdminData = async () => {
    setLoading(true);
    // Counts (robust: don't rely on head-only; fallback to data length)
    const usersRes = await supabase
      .from("profiles")
      .select("id", { count: "exact" });
    const usersCount = (usersRes.count ?? (usersRes.data?.length ?? 0));

    const articlesRes = await supabase
      .from("articles")
      .select("id", { count: "exact" })
      .eq("status", "published");
    const publishedCount = (articlesRes.count ?? (articlesRes.data?.length ?? 0));

    // Premium members (active subscriptions)
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("user_id,status")
      .eq("status", "active");
    const premiumMembers = new Set((subs || []).map((s: any) => s.user_id)).size;

    // Revenue (succeeded payments)
    const { data: payments } = await supabase
      .from("payments")
      .select("amount,status")
      .eq("status", "succeeded");
    const totalRevenue = (payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    setStats({
      totalUsers: usersCount ?? 0,
      publishedArticles: publishedCount ?? 0,
      premiumMembers,
      totalRevenue,
    });

    // Pending articles
    const { data: pending } = await supabase
      .from("articles")
      .select("id,title,author_id,status")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);

    // Resolve authors
    const authorIds = Array.from(new Set((pending || []).map((a: any) => a.author_id).filter(Boolean)));
    let authorsById: Record<string, string> = {};
    if (authorIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,name")
        .in("id", authorIds);
      (profiles || []).forEach((p: any) => {
        authorsById[p.id] = p.name || "Unknown";
      });
    }
    setPendingArticles((pending || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      author: authorsById[a.author_id] || "Unknown",
      status: a.status || "pending",
    })));

    // Recent users
    const { data: recentUsers } = await supabase
      .from("profiles")
      .select("id,name,user_type,status")
      .order("created_at", { ascending: false })
      .limit(20);
    setUsers((recentUsers || []).map((u: any) => ({
      id: u.id,
      name: u.name || "Unknown",
      role: u.user_type || "user",
      status: u.status || "active",
    })));
    setLoading(false);
  };

  const subscribeRealtime = () => {
    const channel = supabase
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => loadAdminData())
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => loadAdminData())
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () => loadAdminData())
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => loadAdminData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Dashboard Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-poppins font-bold text-foreground">Aminid</Link>
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-semibold">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
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
          <div className="flex items-center justify-between mb-12">
            <h1 className="font-poppins font-bold text-4xl text-foreground">Admin Control Panel</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Total Users", value: stats.totalUsers ?? undefined },
              { label: "Published Articles", value: stats.publishedArticles ?? undefined },
              { label: "Premium Members", value: stats.premiumMembers ?? undefined },
              { label: "Total Revenue", value: stats.totalRevenue ?? undefined },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-6 border border-border">
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-poppins font-bold text-foreground">
                    {stat.value === undefined ? "—" :
                      stat.label === "Total Revenue" ? `₦${Number(stat.value).toLocaleString()}` : Number(stat.value).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { id: "users" as const, icon: Users, label: "User Management", count: 3 },
              { id: "articles" as const, icon: FileText, label: "Content Moderation", count: 2 },
              { id: "recognition" as const, icon: Award, label: "Recognition System", count: 0 },
              { id: "payments" as const, icon: CreditCard, label: "Payment Control", count: 0 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  activeTab === item.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary"
                }`}
              >
                <item.icon className={`w-8 h-8 mb-3 ${activeTab === item.id ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-poppins font-bold text-foreground mb-1">{item.label}</h3>
                {item.count > 0 && (
                  <p className="text-sm text-accent font-semibold">{item.count} pending</p>
                )}
              </button>
            ))}
          </div>

          {activeTab === "users" && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="font-poppins font-bold text-2xl text-foreground">User Management</h2>
              </div>
              <div className="divide-y divide-border">
                {users.map((user) => (
                  <div key={user.id} className="p-6 flex items-center justify-between hover:bg-muted/50 transition">
                    <div>
                      <h3 className="font-semibold text-foreground">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                        {user.status}
                      </span>
                      <Button variant="ghost" size="md">
                        <ChevronRight size={20} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "articles" && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="font-poppins font-bold text-2xl text-foreground">Content Moderation</h2>
              </div>
              <div className="divide-y divide-border">
                {pendingArticles.map((article) => (
                  <div key={article.id} className="p-6 flex items-center justify-between hover:bg-muted/50 transition">
                    <div>
                      <h3 className="font-semibold text-foreground">{article.title}</h3>
                      <p className="text-sm text-muted-foreground">by {article.author}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">
                        Pending
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Approve</Button>
                        <Button variant="outline" size="sm">Reject</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "recognition" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-8 border border-border">
                <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">
                  Recognition Management
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold text-foreground mb-3">
                      Author of the Month
                    </label>
                    <select className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>-- Select Author --</option>
                      <option>Sarah Amin</option>
                      <option>Ahmed Hassan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-3">
                      Author of the Year
                    </label>
                    <select className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>-- Select Author --</option>
                      <option>Ahmed Hassan</option>
                      <option>Sarah Amin</option>
                    </select>
                  </div>
                </div>
                <Button className="mt-6">Save Recognition</Button>
              </div>

              <div className="bg-white rounded-xl p-8 border border-border">
                <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">
                  Publish Bulletin
                </h2>
                <Button size="lg">Publish Monthly Bulletin</Button>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white rounded-xl p-8 border border-border">
              <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">
                Payment & Revenue Control
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block font-semibold text-foreground mb-3">
                    Revenue Share Ratio
                  </label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="0" max="100" defaultValue="60" className="flex-1" />
                    <span className="text-lg font-bold text-primary">Platform: 60% | Authors: 40%</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-6">
                    <p className="text-muted-foreground text-sm mb-2">Total Transactions</p>
                    <p className="text-3xl font-poppins font-bold text-primary">234</p>
                  </div>
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-6">
                    <p className="text-muted-foreground text-sm mb-2">Pending Payouts</p>
                    <p className="text-3xl font-poppins font-bold text-accent">₦12,450</p>
                  </div>
                </div>
                <Button size="lg">Process Pending Payouts</Button>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white rounded-xl p-8 border border-border">
              <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">
                Platform Settings
              </h2>
              <p className="text-muted-foreground mb-6">Configure platform-wide settings, themes, and announcements.</p>
              <Button size="lg">Configure Settings</Button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
