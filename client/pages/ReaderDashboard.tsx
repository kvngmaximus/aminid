import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Heart, Settings, LogOut, Download, Play, CheckCircle, Clock, BookOpen, ArrowRight } from "lucide-react";
import ArticleCard from "@/components/ArticleCard";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabase";

interface EnrolledCourse {
  id: string;
  title: string;
  author: string;
  image: string;
  price: number;
  progress: number;
  currentModule: number;
  totalModules: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessed: string;
  estimatedTimeLeft: number;
}

export default function ReaderDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"saved" | "subscriptions" | "history" | "courses">("saved");
  const [guardMessage, setGuardMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        setGuardMessage("Please sign in to view your dashboard.");
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
        setGuardMessage(`Account ${profile.status}.`);
        navigate("/");
        return;
      }
      if (profile.user_type === "author") navigate("/dashboard/author");
      if (profile.user_type === "admin") navigate("/dashboard/admin");
    })();
  }, [navigate]);

  const [savedArticles, setSavedArticles] = useState<Array<{
    id: string;
    title: string;
    excerpt: string | null;
    author: string;
    authorImage: string | null;
    readTime: number;
    likes: number;
    image: string | null;
    isPremium: boolean;
    category?: string | null;
    contentBlocks?: Array<{ type: "paragraph" | "image"; content: string }>;
  }>>([]);
  

  const [subscriptions, setSubscriptions] = useState<Array<{ id: string; name: string; followers: number; premium: boolean }>>([]);

  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load reader data (saved articles, subscriptions, enrollments)
  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) return;
      const userId = session.user.id;

      try {
        setLoading(true);
        setError(null);

        // Saved Articles via bookmarks
        const { data: bookmarks, error: bmError } = await supabase
          .from("article_bookmarks")
          .select("article_id")
          .eq("user_id", userId);
        if (bmError) throw bmError;
        const articleIds = (bookmarks ?? []).map(b => b.article_id);

        let saved: Array<any> = [];
        if (articleIds.length) {
          const { data: articles, error: artError } = await supabase
            .from("articles")
            .select("id,title,excerpt,cover_url,category,premium,content,author_id")
            .in("id", articleIds)
            .eq("status", "published");
          if (artError) throw artError;

          const authorIds = Array.from(new Set((articles ?? []).map(a => a.author_id)));
          const { data: authors, error: authErr } = await supabase
            .from("profiles")
            .select("id,name,avatar_url")
            .in("id", authorIds);
          if (authErr) throw authErr;
          const authorMap = new Map((authors ?? []).map(a => [a.id, a]));

          const { data: likesRows, error: likesErr } = await supabase
            .from("article_likes")
            .select("article_id")
            .in("article_id", articleIds);
          if (likesErr) throw likesErr;
          const likeCount = new Map<string, number>();
          (likesRows ?? []).forEach(l => likeCount.set(l.article_id, (likeCount.get(l.article_id) ?? 0) + 1));

          saved = (articles ?? []).map(a => {
            let contentBlocks: Array<{ type: "paragraph" | "image"; content: string }> | undefined;
            try {
              contentBlocks = a.content ? JSON.parse(a.content) : undefined;
            } catch {}
            const text = contentBlocks?.filter(b => b.type === "paragraph").map(b => b.content).join(" ") ?? a.excerpt ?? "";
            const words = text.trim().split(/\s+/).length;
            const readTime = Math.max(1, Math.ceil(words / 200));
            const author = authorMap.get(a.author_id);
            return {
              id: a.id,
              title: a.title,
              excerpt: a.excerpt ?? "",
              author: author?.name ?? "Unknown",
              authorImage: author?.avatar_url ?? null,
              readTime,
              likes: likeCount.get(a.id) ?? 0,
              image: a.cover_url ?? null,
              isPremium: !!a.premium,
              category: a.category ?? null,
              contentBlocks,
            };
          });
        }
        setSavedArticles(saved);

        // Subscriptions (placeholder list of authors)
        const { data: authorProfiles } = await supabase
          .from("profiles")
          .select("id,name")
          .eq("user_type", "author")
          .limit(10);
        setSubscriptions((authorProfiles ?? []).map(p => ({ id: p.id, name: p.name ?? "Unnamed", followers: 0, premium: true })));

        // Enrollments
        const { data: enrolls, error: enrErr } = await supabase
          .from("course_enrollments")
          .select("course_id, progress, created_at")
          .eq("user_id", userId);
        if (enrErr) throw enrErr;
        const courseIds = (enrolls ?? []).map(e => e.course_id);
        let courses: EnrolledCourse[] = [];
        if (courseIds.length) {
          const { data: courseRows, error: courseErr } = await supabase
            .from("courses")
            .select("id,title,author_id,price")
            .in("id", courseIds)
            .eq("status", "published");
          if (courseErr) throw courseErr;

          const authorIds2 = Array.from(new Set((courseRows ?? []).map(c => c.author_id)));
          const { data: authors2 } = await supabase
            .from("profiles")
            .select("id,name")
            .in("id", authorIds2);
          const nameMap = new Map((authors2 ?? []).map(a => [a.id, a.name ?? "Unknown"]));

          const { data: modules } = await supabase
            .from("course_modules")
            .select("id,course_id")
            .in("course_id", courseIds);
          const moduleCount = new Map<string, number>();
          (modules ?? []).forEach(m => moduleCount.set(m.course_id, (moduleCount.get(m.course_id) ?? 0) + 1));

          const { data: lessons } = await supabase
            .from("course_lessons")
            .select("module_id")
            .in("module_id", (modules ?? []).map(m => m.id));
          const moduleLessonCount = new Map<string, number>();
          (lessons ?? []).forEach(l => moduleLessonCount.set(l.module_id, (moduleLessonCount.get(l.module_id) ?? 0) + 1));
          const totalLessonsByCourse = new Map<string, number>();
          (modules ?? []).forEach(m => {
            const cid = m.course_id as string;
            const lc = moduleLessonCount.get(m.id) ?? 0;
            totalLessonsByCourse.set(cid, (totalLessonsByCourse.get(cid) ?? 0) + lc);
          });

          courses = (courseRows ?? []).map(c => {
            const progress = (enrolls ?? []).find(e => e.course_id === c.id)?.progress ?? 0;
            const totalModules = moduleCount.get(c.id) ?? 0;
            const totalLessons = totalLessonsByCourse.get(c.id) ?? 0;
            const completedLessons = Math.round((progress / 100) * totalLessons);
            const currentModule = Math.max(1, Math.min(totalModules, Math.ceil((progress / 100) * Math.max(1, totalModules))));
            const estimatedTimeLeft = Number(((100 - progress) / 20).toFixed(1));
            return {
              id: c.id,
              title: c.title,
              author: nameMap.get(c.author_id) ?? "Unknown",
              image: "https://images.unsplash.com/photo-1516321318423-f06f70a504f0?w=400&h=200&fit=crop",
              price: Number(c.price ?? 0),
              progress: Number(progress),
              currentModule,
              totalModules,
              completedLessons,
              totalLessons,
              lastAccessed: "",
              estimatedTimeLeft,
            };
          });
        }
        setEnrolledCourses(courses);
      } catch (err: any) {
        setError(err.message ?? "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeCourses = useMemo(() => enrolledCourses.filter(c => c.progress < 100), [enrolledCourses]);
  const completedCourses = useMemo(() => enrolledCourses.filter(c => c.progress === 100), [enrolledCourses]);

  const handleContinueLearning = (courseId: string) => {
    navigate(`/courses/${courseId}?tab=curriculum`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Dashboard Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-poppins font-bold text-foreground">Aminid</Link>
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-semibold">Reader</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/reader/subscriptions") }>
              <Heart size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/reader/settings") }>
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
            <h1 className="font-poppins font-bold text-4xl text-foreground">Your Dashboard</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Saved Articles", value: savedArticles.length.toString(), icon: Bookmark },
              { label: "Subscribed Authors", value: subscriptions.length.toString(), icon: Heart },
              { label: "Active Courses", value: activeCourses.length.toString(), icon: BookOpen },
              { label: "Premium Plan", value: "Active", icon: Settings },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-6 border border-border">
                <stat.icon className="text-primary mb-3" size={24} />
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-poppins font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mb-8 border-b border-border overflow-x-auto">
            {["saved", "subscriptions", "courses", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-6 py-3 font-semibold transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "saved" && "Saved Articles"}
                {tab === "subscriptions" && "Subscriptions"}
                {tab === "courses" && "My Courses"}
                {tab === "history" && "Reading History"}
              </button>
            ))}
          </div>

          {activeTab === "saved" && (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loading && (
                <div className="col-span-full text-center text-muted-foreground">Loading saved articles…</div>
              )}
              {error && (
                <div className="col-span-full text-center text-red-600">{error}</div>
              )}
              {!loading && !error && savedArticles.length === 0 && (
                <div className="col-span-full text-center text-muted-foreground">No saved articles yet.</div>
              )}
              {!loading && !error && savedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  {...article}
                  onClick={() => navigate(`/articles/${article.id}`)}
                />
              ))}
            </div>
          )}

          {activeTab === "subscriptions" && (
            <div className="space-y-4">
              {loading && (
                <div className="text-center text-muted-foreground">Loading subscriptions…</div>
              )}
              {!loading && subscriptions.map((sub) => (
                <div key={sub.id} className="bg-white rounded-xl p-6 border border-border flex items-center justify-between hover:shadow-lg transition">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{sub.name}</h3>
                    <p className="text-sm text-muted-foreground">{sub.followers.toLocaleString()} followers</p>
                  </div>
                  {sub.premium && (
                    <div className="bg-accent/10 text-accent px-4 py-2 rounded-lg font-semibold text-sm">
                      Premium
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "courses" && (
            <div>
              {activeCourses.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-border text-center">
                  <BookOpen className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground text-lg mb-4">No active courses</p>
                  <Button onClick={() => navigate("/courses")}>
                    Browse All Courses
                    <ArrowRight size={16} />
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition">
                      <div className="relative overflow-hidden h-32">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <div className="absolute top-4 right-4">
                          <div className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-foreground">
                            {course.progress}% Done
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <h3 className="font-poppins font-bold text-lg text-foreground mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">{course.author}</p>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-foreground">
                              {course.completedLessons} of {course.totalLessons} lessons completed
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Module {course.currentModule}/{course.totalModules}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 pb-4 border-b border-border">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{course.estimatedTimeLeft}h remaining</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">•</span>
                            <span>Last accessed {course.lastAccessed}</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleContinueLearning(course.id)}
                          className="w-full"
                        >
                          <Play size={16} />
                          Continue Learning
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {completedCourses.length > 0 && (
                <div className="mt-12">
                  <h3 className="font-poppins font-bold text-2xl text-foreground mb-6">Completed Courses</h3>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedCourses.map((course) => (
                      <div key={course.id} className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition">
                        <div className="relative overflow-hidden h-32">
                          <img
                            src={course.image}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute top-4 right-4">
                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <CheckCircle size={12} />
                              Completed
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="font-poppins font-bold text-lg text-foreground mb-2">
                            {course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">{course.author}</p>
                          <Button variant="outline" className="w-full">
                            View Certificate
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="bg-white rounded-xl p-8 text-center border border-border">
              <h3 className="font-poppins font-bold text-lg text-foreground mb-2">
                Your reading history will appear here
              </h3>
              <p className="text-muted-foreground mb-6">
                Start reading articles to track your learning journey
              </p>
              <Link to="/articles">
                <Button size="lg">
                  Explore Articles
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
