import { useEffect, useState } from "react";
import { Plus, Eye, Heart, TrendingUp, Settings, LogOut, Trash2, Edit2, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import ArticlePostModal from "@/components/ArticlePostModal";
import CourseCreateModal from "@/components/CourseCreateModal";
import { supabase } from "@/lib/supabase";
import { createArticle, updateArticle, createCourse, updateCourse, deleteArticle, deleteCourse } from "@/lib/crud";

type ArticleRow = {
  id: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  premium: boolean;
  status: "draft" | "pending_review" | "published" | "rejected";
  created_at: string;
  likes_count?: number;
  views_total?: number;
};

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: "draft" | "pending_review" | "published" | "rejected";
  created_at: string;
  enrollments_count?: number;
};

type MetricItem = { metric: string; value: string; change: string };

export default function AuthorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"articles" | "courses" | "analytics" | "earnings">("articles");
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPremiumAuthor, setIsPremiumAuthor] = useState<boolean>(false);
  const [earnings, setEarnings] = useState<{ totalCents: number; thisMonthCents: number; pendingCents: number; currency: string }>({ totalCents: 0, thisMonthCents: 0, pendingCents: 0, currency: "NGN" });
  const [analytics, setAnalytics] = useState<MetricItem[]>([
    { metric: "Total Views", value: "—", change: "" },
    { metric: "Total Likes", value: "—", change: "" },
    { metric: "Average Read Time", value: "—", change: "" },
    { metric: "Follower Growth", value: "—", change: "" },
  ]);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        navigate("/login");
        return;
      }
      const uid = session.user.id;
      setUserId(uid);
      const { data: authorRow } = await supabase
        .from("authors")
        .select("premium")
        .eq("user_id", uid)
        .single();
      setIsPremiumAuthor(!!authorRow?.premium);
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
      if (profile.user_type === "reader") navigate("/dashboard/reader");
      if (profile.user_type === "admin") navigate("/dashboard/admin");

      await loadContent(uid);
    })();
  }, [navigate]);

  const loadContent = async (uid: string) => {
    const { data: aRows } = await supabase
      .from("articles")
      .select("id,title,excerpt,cover_url,premium,status,created_at,likes_count,views_total")
      .eq("author_id", uid)
      .order("created_at", { ascending: false });
    setArticles((aRows as ArticleRow[]) || []);

    const { data: cRows } = await supabase
      .from("courses")
      .select("id,title,description,price,status,created_at,enrollments_count")
      .eq("author_id", uid)
      .order("created_at", { ascending: false });
    setCourses((cRows as CourseRow[]) || []);

    await loadAnalytics(uid, (aRows as ArticleRow[]) || []);
    await loadEarnings(uid, (cRows as CourseRow[]) || []);
  };

  const loadAnalytics = async (uid: string, articleRows?: ArticleRow[]) => {
    try {
      const rows = articleRows && articleRows.length ? articleRows : ((await supabase
        .from("articles")
        .select("id,likes_count,views_total,created_at")
        .eq("author_id", uid)).data as ArticleRow[] | null) || [];

      const articleIds = rows.map(r => r.id);
      const totalViews = rows.reduce((sum, r) => sum + (r.views_total || 0), 0);
      const totalLikes = rows.reduce((sum, r) => sum + (r.likes_count || 0), 0);

      // Period windows
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Views last 7 days vs previous 7 days
      let views7 = 0, viewsPrev7 = 0;
      if (articleIds.length) {
        const { data: v7 } = await supabase
          .from("article_views_daily")
          .select("views,view_date")
          .in("article_id", articleIds)
          .gte("view_date", sevenDaysAgo.toISOString().slice(0, 10));
        views7 = (v7 || []).reduce((sum, r: any) => sum + (r.views || 0), 0);

        const { data: vPrev7 } = await supabase
          .from("article_views_daily")
          .select("views,view_date")
          .in("article_id", articleIds)
          .gte("view_date", fourteenDaysAgo.toISOString().slice(0, 10))
          .lt("view_date", sevenDaysAgo.toISOString().slice(0, 10));
        viewsPrev7 = (vPrev7 || []).reduce((sum, r: any) => sum + (r.views || 0), 0);
      }
      const viewsChangePct = viewsPrev7 > 0 ? Math.round(((views7 - viewsPrev7) / viewsPrev7) * 100) : (views7 > 0 ? 100 : 0);

      // Likes last 30 days
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      let likes30 = 0;
      if (articleIds.length) {
        const { data: likesRows } = await supabase
          .from("article_likes")
          .select("id,created_at")
          .in("article_id", articleIds)
          .gte("created_at", thirtyDaysAgo.toISOString());
        likes30 = (likesRows || []).length;
      }

      // Average read time (last 30 days): seconds / sessions
      let secondsSum = 0, sessionsSum = 0;
      if (articleIds.length) {
        const { data: readsRows } = await supabase
          .from("article_reads_daily")
          .select("seconds,sessions")
          .in("article_id", articleIds)
          .gte("read_date", thirtyDaysAgo.toISOString().slice(0, 10));
        (readsRows || []).forEach((r: any) => {
          secondsSum += r.seconds || 0;
          sessionsSum += r.sessions || 0;
        });
      }
      const avgSeconds = sessionsSum > 0 ? Math.round((secondsSum / sessionsSum)) : 0;
      const avgMinutesStr = avgSeconds > 0 ? `${(avgSeconds / 60).toFixed(1)} min` : "—";

      // Follower growth: this month
      const { data: followsRows } = await supabase
        .from("author_follows")
        .select("id,created_at")
        .eq("author_id", uid)
        .gte("created_at", startOfMonth.toISOString());
      const followerGrowth = (followsRows || []).length;

      setAnalytics([
        { metric: "Total Views", value: totalViews.toLocaleString(), change: views7 ? `${viewsChangePct >= 0 ? "+" : ""}${viewsChangePct}% vs prev 7d` : "" },
        { metric: "Total Likes", value: totalLikes.toLocaleString(), change: likes30 ? `${likes30} in last 30d` : "" },
        { metric: "Average Read Time", value: avgMinutesStr, change: sessionsSum ? `${sessionsSum.toLocaleString()} sessions` : "" },
        { metric: "Follower Growth", value: followerGrowth ? `+${followerGrowth}` : "—", change: followerGrowth ? "This month" : "" },
      ]);
    } catch (e) {
      setAnalytics([
        { metric: "Total Views", value: "—", change: "" },
        { metric: "Total Likes", value: "—", change: "" },
        { metric: "Average Read Time", value: "—", change: "" },
        { metric: "Follower Growth", value: "—", change: "" },
      ]);
    }
  };

  const loadEarnings = async (uid: string, courseRows?: CourseRow[]) => {
    try {
      const myCourses = courseRows && courseRows.length ? courseRows : ((await supabase
        .from("courses")
        .select("id,price,status")
        .eq("author_id", uid)).data as CourseRow[] | null) || [];
      const publishedCourseIds = myCourses.filter(c => c.status === "published").map(c => c.id);
      const priceMap = new Map(myCourses.map(c => [c.id, Number(c.price || 0)]));
      let totalCents = 0;
      let thisMonthCents = 0;
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      if (publishedCourseIds.length) {
        const { data: enrolls } = await supabase
          .from("course_enrollments")
          .select("course_id,created_at")
          .in("course_id", publishedCourseIds)
          .limit(10000);
        (enrolls || []).forEach((e: any) => {
          const price = priceMap.get(e.course_id) ?? 0;
          totalCents += Math.round(price * 100);
          if (e.created_at && new Date(e.created_at) >= startOfMonth) {
            thisMonthCents += Math.round(price * 100);
          }
        });
      }
      // Pending payout = this month's earnings (simple monthly cycle)
      setEarnings({ totalCents, thisMonthCents, pendingCents: thisMonthCents, currency: "NGN" });
    } catch (e) {
      setEarnings({ totalCents: 0, thisMonthCents: 0, pendingCents: 0, currency: "NGN" });
    }
  };

  // analytics is now state populated by loadAnalytics

  const handleAddArticle = async (article: any) => {
    if (!userId) return;
    if (editingArticle) {
      const { error } = await updateArticle({
        id: editingArticle.id,
        title: article.title,
        excerpt: article.excerpt,
        category: article.category,
        contentBlocks: article.contentBlocks ?? [],
        coverImage: article.coverImage ?? null,
        isPremium: !!article.isPremium,
      });
      if (!error) {
        setEditingArticle(null);
        await loadContent(userId);
      }
    } else {
      const { error } = await createArticle(userId, {
        title: article.title,
        excerpt: article.excerpt,
        category: article.category,
        contentBlocks: article.contentBlocks ?? [],
        coverImage: article.coverImage ?? null,
        isPremium: !!article.isPremium,
      });
      if (!error) await loadContent(userId);
    }
    setShowArticleModal(false);
  };

  const handleEditArticle = (article: ArticleRow) => {
    setEditingArticle(article);
    setShowArticleModal(true);
  };

  const handleAddCourse = async (course: any) => {
    if (!userId) return;
    if (editingCourse) {
      const { error } = await updateCourse({
        id: editingCourse.id,
        title: course.title,
        description: course.description,
        price: Number(course.price ?? 0),
      });
      if (!error) {
        setEditingCourse(null);
        await loadContent(userId);
      }
    } else {
      const { error } = await createCourse(userId, {
        title: course.title,
        description: course.description,
        price: Number(course.price ?? 0),
        modules: Array.isArray(course.modules)
          ? course.modules.map((m: any) => ({
              title: m.title,
              description: m.description ?? null,
              videoUrl: m.videoUrl ?? null,
            }))
          : [],
      });
      if (!error) await loadContent(userId);
    }
    setShowCourseModal(false);
  };

  const handleEditCourse = (course: CourseRow) => {
    setEditingCourse(course);
    setShowCourseModal(true);
  };

  const handleDeleteArticle = async (id: string) => {
    const ok = window.confirm("Delete this article? This cannot be undone.");
    if (!ok) return;
    await deleteArticle(id);
    if (userId) await loadContent(userId);
  };

  const handleDeleteCourse = async (id: string) => {
    const ok = window.confirm("Delete this course? This cannot be undone.");
    if (!ok) return;
    await deleteCourse(id);
    if (userId) await loadContent(userId);
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
            <Link to="/" className="font-poppins font-bold text-foreground">Aminid</Link>
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-semibold">Author</span>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowArticleModal(true)} size="sm">
              <Plus size={16} />
              New Article
            </Button>
            <Button onClick={() => setShowCourseModal(true)} size="sm" variant="secondary">
              <Plus size={16} />
              New Course
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/author/settings") }>
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
            <h1 className="font-poppins font-bold text-4xl text-foreground">Author Dashboard</h1>
          </div>

          {!isPremiumAuthor && (
            <div className="mb-8 bg-white rounded-xl p-6 border border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-1">Premium Author</h3>
                <p className="text-sm text-muted-foreground">Publish without limits and access revenue tools.</p>
              </div>
              <Button
                size="md"
                variant="secondary"
                onClick={async () => {
                  const { data: sessionData } = await supabase.auth.getSession();
                  const uid = sessionData.session?.user?.id;
                  if (!uid) { navigate("/login"); return; }
                  const { payWithFlutterwave } = await import("@/lib/payments");
                  await payWithFlutterwave({
                    purpose: "author_premium",
                    amount: 10000,
                    currency: "NGN",
                    user: { id: uid },
                    onVerified: (res) => {
                      if (res?.ok) setIsPremiumAuthor(true);
                    },
                  });
                }}
              >
                Upgrade — ₦10,000/month
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {analytics.map((item) => (
              <div key={item.metric} className="bg-white rounded-xl p-6 border border-border">
                <p className="text-sm text-muted-foreground mb-2">{item.metric}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-poppins font-bold text-foreground">{item.value}</p>
                  {item.change && <span className="text-xs text-green-500 font-semibold">{item.change}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mb-8 border-b border-border overflow-x-auto">
            {["articles", "courses", "analytics", "earnings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "articles" && "My Articles"}
                {tab === "courses" && "My Courses"}
                {tab === "analytics" && "Analytics"}
                {tab === "earnings" && "Earnings"}
              </button>
            ))}
          </div>

          {activeTab === "articles" && (
            <div className="space-y-4">
              {articles.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-border text-center">
                  <p className="text-muted-foreground text-lg mb-4">No articles yet</p>
                  <Button onClick={() => setShowArticleModal(true)}>
                    <Plus size={20} />
                    Create Your First Article
                  </Button>
                </div>
              ) : (
                articles.map((article) => (
                  <div key={article.id} className="bg-white rounded-xl p-6 border border-border hover:shadow-lg transition flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{article.title}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          article.status === "published"
                            ? "bg-green-100 text-green-700"
                            : article.status === "pending_review"
                            ? "bg-yellow-100 text-yellow-700"
                            : article.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {article.status}
                        </span>
                        {article.premium && (
                          <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-semibold">
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{new Date(article.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mr-6">
                      <div className="flex items-center gap-1">
                        <Eye size={16} />
                        <span>{(article.views_total ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart size={16} />
                        <span>{(article.likes_count ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditArticle(article)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteArticle(article.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "courses" && (
            <div className="space-y-4">
              {courses.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-border text-center">
                  <p className="text-muted-foreground text-lg mb-4">No courses yet</p>
                  <Button onClick={() => setShowCourseModal(true)}>
                    <Plus size={20} />
                    Create Your First Course
                  </Button>
                </div>
              ) : (
                courses.map((course) => (
                  <div key={course.id} className="bg-white rounded-xl p-6 border border-border hover:shadow-lg transition flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <BookOpen size={20} className="text-primary" />
                        <div>
                          <h3 className="font-semibold text-foreground">{course.title}</h3>
                          <p className="text-xs text-muted-foreground">{new Date(course.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm text-muted-foreground mr-6">
                      <div className="flex items-center gap-1">
                        <TrendingUp size={16} />
                        <span>{(course.enrollments_count ?? 0).toLocaleString()} enrolled</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-foreground">₦{Number(course.price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        course.status === "published"
                          ? "bg-green-100 text-green-700"
                          : course.status === "pending_review"
                          ? "bg-yellow-100 text-yellow-700"
                          : course.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {course.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCourse(course)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCourse(course.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="bg-white rounded-xl p-8 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-poppins font-bold text-lg text-foreground mb-4">
                    Engagement Trends
                  </h3>
                  <div className="h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Chart visualization coming soon</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-lg text-foreground mb-4">
                    Top Articles
                  </h3>
                  <ul className="space-y-3">
                    {articles.slice(0, 5).map((article) => (
                      <li key={article.id} className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-foreground">{article.title}</span>
                        <TrendingUp className="text-green-500" size={18} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "earnings" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-8 border border-border">
                <p className="text-muted-foreground mb-2">Total Earnings</p>
                <p className="text-4xl font-bold text-foreground">₦{(earnings.totalCents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-border">
                  <p className="text-muted-foreground text-sm mb-2">This Month</p>
                  <p className="text-2xl font-bold text-foreground">₦{(earnings.thisMonthCents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-border">
                  <p className="text-muted-foreground text-sm mb-2">Pending Payout</p>
                  <p className="text-2xl font-bold text-foreground">₦{(earnings.pendingCents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              </div>
              <Button size="lg" className="w-full" disabled={earnings.pendingCents <= 0} onClick={() => {
                alert("Payout requested. Admin will process monthly payouts.");
              }}>
                Request Payout
              </Button>
            </div>
          )}
        </div>
      </div>

      <ArticlePostModal
        isOpen={showArticleModal}
        onClose={() => {
          setShowArticleModal(false);
          setEditingArticle(null);
        }}
        onSubmit={handleAddArticle}
        editingArticle={editingArticle}
      />

      <CourseCreateModal
        isOpen={showCourseModal}
        onClose={() => {
          setShowCourseModal(false);
          setEditingCourse(null);
        }}
        onSubmit={handleAddCourse}
        editingCourse={editingCourse}
      />

    </div>
  );
}