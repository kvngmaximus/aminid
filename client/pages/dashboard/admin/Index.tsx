import { useEffect, useMemo, useState } from "react";
import { Users, FileText, Award, CreditCard, Settings, LogOut, ChevronRight, BookOpenCheck, XCircle, Activity as ActivityIcon, Wallet, CheckCircle, BookOpen, Newspaper } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabase";

type AdminTab = "users" | "articles" | "courses" | "recognition" | "payments" | "settings";

type PendingArticle = { id: string; title: string; author_id: string; created_at: string };
type PendingCourse = { id: string; title: string; author_id: string; created_at: string };
type ActivityItem = {
  id: string;
  type: "payment" | "enrollment" | "article" | "course" | "recognition";
  title: string;
  subtitle?: string;
  created_at: string;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("articles");
  const [pendingArticles, setPendingArticles] = useState<PendingArticle[]>([]);
  const [pendingCourses, setPendingCourses] = useState<PendingCourse[]>([]);
  const [authorsMap, setAuthorsMap] = useState<Record<string, string>>({});
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [publishedArticles, setPublishedArticles] = useState<number>(0);
  const [premiumMembers, setPremiumMembers] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const stats = useMemo(() => ([
    { label: "Total Users", value: totalUsers.toLocaleString(), trend: "" },
    { label: "Published Articles", value: publishedArticles.toLocaleString(), trend: "" },
    { label: "Premium Members", value: premiumMembers.toLocaleString(), trend: "" },
    { label: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, trend: "" },
  ]), [totalUsers, publishedArticles, premiumMembers, totalRevenue]);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        navigate("/login");
        return;
      }
      const uid = session.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type,status")
        .eq("id", uid)
        .single();
      if (!profile) return;
      if (profile.status !== "active") {
        navigate("/");
        return;
      }
      if (profile.user_type === "author") navigate("/dashboard/author");
      if (profile.user_type === "reader") navigate("/dashboard/reader");

      await loadPending();
      await loadStats();
      await loadActivity();
    })();
  }, [navigate]);

  const loadPending = async () => {
    const { data: aRows } = await supabase
      .from("articles")
      .select("id,title,author_id,created_at")
      .eq("status", "pending_review")
      .order("created_at", { ascending: false });
    setPendingArticles((aRows as PendingArticle[]) || []);

    const { data: cRows } = await supabase
      .from("courses")
      .select("id,title,author_id,created_at")
      .eq("status", "pending_review")
      .order("created_at", { ascending: false });
    setPendingCourses((cRows as PendingCourse[]) || []);

    const authorIds = Array.from(new Set([...(aRows?.map(r => r.author_id) || []), ...(cRows?.map(r => r.author_id) || [])]));
    if (authorIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,name")
        .in("id", authorIds);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { map[p.id] = p.name || p.id; });
      setAuthorsMap(map);
    }
  };

  const loadStats = async () => {
    // Total active users
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    setTotalUsers(usersCount || 0);

    // Published articles
    const { count: articlesCount } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", "published");
    setPublishedArticles(articlesCount || 0);

    // Premium members (active subscriptions)
    const { count: subsCount } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    setPremiumMembers(subsCount || 0);

    // Total revenue (successful payments sum)
    const { data: payments } = await supabase
      .from("payments")
      .select("amount_cents,status")
      .eq("status", "successful");
    const naira = Math.round(((payments || []).reduce((sum: number, p: any) => sum + Number(p.amount_cents || 0), 0)) / 100);
    setTotalRevenue(naira);
  };

  const handleApproveArticle = async (id: string) => {
    await supabase.rpc("approve_article", { article_id: id });
    await loadPending();
  };
  const handleRejectArticle = async (id: string) => {
    await supabase.rpc("reject_article", { article_id: id });
    await loadPending();
  };
  const handleApproveCourse = async (id: string) => {
    await supabase.rpc("approve_course", { course_id: id });
    await loadPending();
  };
  const handleRejectCourse = async (id: string) => {
    await supabase.rpc("reject_course", { course_id: id });
    await loadPending();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    navigate("/login");
  };

  const loadActivity = async () => {
    try {
      const [payRes, enrollRes, artRes, courseRes, recRes] = await Promise.all([
        supabase.from("payments").select("id,user_id,amount_cents,status,created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("course_enrollments").select("id,user_id,course_id,created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("articles").select("id,title,status,created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("courses").select("id,title,status,created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("recognitions").select("id,type,created_at").order("created_at", { ascending: false }).limit(10),
      ]);

      const payments = (payRes.data || []).map((p: any) => ({
        id: p.id,
        type: "payment" as const,
        title: `Payment ₦${Math.round(Number(p.amount_cents || 0) / 100).toLocaleString()} (${(p.status || "").toLowerCase()})`,
        subtitle: p.user_id ? `User ${p.user_id.slice(0, 8)}` : undefined,
        created_at: p.created_at,
      }));

      const enrollments = (enrollRes.data || []).map((e: any) => ({
        id: e.id,
        type: "enrollment" as const,
        title: `Course enrollment`,
        subtitle: `${e.user_id ? `User ${e.user_id.slice(0,8)}` : "Unknown"} → ${e.course_id ? `Course ${e.course_id.slice(0,8)}` : "Unknown"}`,
        created_at: e.created_at,
      }));

      const articles = (artRes.data || []).map((a: any) => ({
        id: a.id,
        type: "article" as const,
        title: `${a.title || "Untitled article"}`,
        subtitle: (a.status || "").toLowerCase(),
        created_at: a.created_at,
      }));

      const courses = (courseRes.data || []).map((c: any) => ({
        id: c.id,
        type: "course" as const,
        title: `${c.title || "Untitled course"}`,
        subtitle: (c.status || "").toLowerCase(),
        created_at: c.created_at,
      }));

      const recognitions = (recRes.data || []).map((r: any) => ({
        id: r.id,
        type: "recognition" as const,
        title: `Recognition: ${(r.type || "").replace(/_/g, " ")}`,
        subtitle: undefined,
        created_at: r.created_at,
      }));

      const merged = [...payments, ...enrollments, ...articles, ...courses, ...recognitions]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);
      setActivities(merged);

      // Live updates for payments and recognitions (others can be added similarly)
      const ch = supabase
        .channel("admin-activity")
        .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, loadActivity)
        .on("postgres_changes", { event: "*", schema: "public", table: "recognitions" }, loadActivity)
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    } catch {}
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          <div className="flex items-center justify-between mb-12">
            <h1 className="font-poppins font-bold text-4xl text-foreground">Admin Control Panel</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-6 border border-border">
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-poppins font-bold text-foreground">{stat.value}</p>
                  {stat.trend && <span className="text-xs text-green-500 font-semibold">{stat.trend}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
            {[
              { id: "users" as const, icon: Users, label: "User Management", count: 0 },
              { id: "articles" as const, icon: FileText, label: "Content Moderation", count: pendingArticles.length },
              { id: "courses" as const, icon: BookOpenCheck, label: "Course Moderation", count: pendingCourses.length },
              { id: "recognition" as const, icon: Award, label: "Recognition System", count: 0 },
              { id: "payments" as const, icon: CreditCard, label: "Payment Control", count: 0 },
            ].map((item) => (
              <Link
                key={item.id}
                to={`/dashboard/admin/${item.id}`}
                className={`p-6 rounded-xl border-2 text-left transition-all block border-border hover:border-primary`}
              >
                <item.icon className={`w-8 h-8 mb-3 text-muted-foreground`} />
                <h3 className="font-poppins font-bold text-foreground mb-1">{item.label}</h3>
                {item.count > 0 && (
                  <p className="text-sm text-accent font-semibold">{item.count} pending</p>
                )}
              </Link>
            ))}
          </div>

          {(activeTab === "articles" || activeTab === "courses") && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="font-poppins font-bold text-2xl text-foreground flex items-center gap-2"><ActivityIcon className="w-6 h-6 text-primary" /> Recent Activity</h2>
                <Link to="/dashboard/admin/payments" className="text-sm text-primary inline-flex items-center gap-1">View Payments <ChevronRight size={16} /></Link>
              </div>
              <div className="divide-y divide-border">
                {activities.length === 0 ? (
                  <div className="p-6 text-muted-foreground">No recent activity</div>
                ) : (
                  activities.map((a) => (
                    <div key={a.id} className="p-6 flex items-center justify-between hover:bg-muted/50 transition">
                      <div className="flex items-center gap-3">
                        {a.type === "payment" && <Wallet className="w-5 h-5 text-muted-foreground" />}
                        {a.type === "enrollment" && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {a.type === "article" && <Newspaper className="w-5 h-5 text-muted-foreground" />}
                        {a.type === "course" && <BookOpen className="w-5 h-5 text-muted-foreground" />}
                        {a.type === "recognition" && <Award className="w-5 h-5 text-amber-600" />}
                        <div>
                          <div className="font-semibold text-foreground">{a.title}</div>
                          {a.subtitle && <div className="text-xs text-muted-foreground">{a.subtitle}</div>}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="font-poppins font-bold text-2xl text-foreground">User Management</h2>
              </div>
              <div className="p-6 text-muted-foreground">Coming soon</div>
            </div>
          )}

          {activeTab === "recognition" && (
            <div className="bg-white rounded-xl p-8 border border-border">
              <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">Recognition Management</h2>
              <div className="text-muted-foreground">Coming soon</div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white rounded-xl p-8 border border-border">
              <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">Payment & Revenue Control</h2>
              <div className="text-muted-foreground">Coming soon</div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white rounded-xl p-8 border border-border">
              <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">Platform Settings</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <XCircle size={18} />
                  <span>Settings panel coming soon</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
