import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Play, Users, Star, Clock, BookOpen, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import { payWithFlutterwave } from "@/lib/payments";
import { supabase } from "@/lib/supabase";
type UIModule = {
  id: string;
  title: string;
  lessons: number;
  durationHours: number;
  completed: boolean;
};

type UICourse = {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  author: string;
  authorImage: string;
  authorBio?: string;
  price: number;
  image: string;
  rating?: number;
  students: number;
  durationHours?: number;
  modulesCount?: number;
  level?: string;
  curriculum: UIModule[];
  features?: string[];
};

export default function CourseDetail() {
  const { id = "" } = useParams();
  const [enrolled, setEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum">("overview");
  const [course, setCourse] = useState<UICourse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      const { data: sessionRes } = await supabase.auth.getSession();
      const uid = sessionRes.session?.user?.id ?? null;
      setIsAuthed(!!uid);
      if (uid) {
        const { data: me } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", uid)
          .maybeSingle();
        setIsAdmin((me as any)?.user_type === "admin");
      } else {
        setIsAdmin(false);
      }

      try {
        const { data: courseRow, error: cErr } = await supabase
          .from("courses")
          .select("id,title,description,author_id,price,status,created_at")
          .eq("id", id)
          .maybeSingle();
        if (cErr) throw cErr;
        if (!courseRow) throw new Error("Course not found");

        let authorName = "Unknown";
        let authorImage = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";
        let authorBio = "";
        if (courseRow.author_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name,avatar_url,bio")
            .eq("id", courseRow.author_id)
            .maybeSingle();
          if (profile) {
            authorName = profile.name ?? authorName;
            authorImage = profile.avatar_url ?? authorImage;
            authorBio = profile.bio ?? authorBio;
          }
        }

        const { data: modules } = await supabase
          .from("modules")
          .select("id,title,course_id,created_at")
          .eq("course_id", id)
          .order("created_at", { ascending: true });
        const moduleIds = (modules ?? []).map((m: any) => m.id);
        const { data: lessons } = moduleIds.length
          ? await supabase
              .from("lessons")
              .select("id,title,module_id,duration_minutes")
              .in("module_id", moduleIds)
          : { data: [] as any[] };

        const { data: progresses } = uid && (lessons ?? []).length
          ? await supabase
              .from("lesson_progress")
              .select("lesson_id,status")
              .in("lesson_id", (lessons ?? []).map((l: any) => l.id))
              .eq("user_id", uid)
          : { data: [] as any[] };
        const completedLessonIds = new Set<string>();
        (progresses ?? []).forEach((p: any) => {
          if (p.status === "completed") completedLessonIds.add(p.lesson_id);
        });

        const curriculum: UIModule[] = (modules ?? []).map((m: any) => {
          const ml = (lessons ?? []).filter((l: any) => l.module_id === m.id);
          const lessonsCount = ml.length;
          const durationMinutes = ml.reduce((sum: number, l: any) => sum + Number(l.duration_minutes ?? 0), 0);
          const allCompleted = lessonsCount > 0 && ml.every((l: any) => completedLessonIds.has(l.id));
          return {
            id: m.id,
            title: m.title,
            lessons: lessonsCount,
            durationHours: Math.round((durationMinutes / 60) * 10) / 10,
            completed: !!allCompleted,
          };
        });

        if (uid) {
          const { data: enroll } = await supabase
            .from("course_enrollments")
            .select("id")
            .eq("course_id", id)
            .eq("user_id", uid)
            .maybeSingle();
          setEnrolled(!!enroll);
        }

        const { data: enrolls } = await supabase
          .from("course_enrollments")
          .select("course_id")
          .eq("course_id", id);
        const students = (enrolls ?? []).length;

        setCourse({
          id: courseRow.id,
          title: courseRow.title,
          description: courseRow.description ?? "",
          fullDescription: courseRow.description ?? "",
          author: authorName,
          authorImage,
          authorBio,
          price: Number(courseRow.price ?? 0),
          image:
            "https://images.unsplash.com/photo-1516321318423-f06f70a504f0?w=1200&h=600&fit=crop",
          rating: undefined,
          students,
          durationHours: curriculum.reduce((sum, m) => sum + (m.durationHours ?? 0), 0),
          modulesCount: curriculum.length,
          level: undefined,
          curriculum,
          features: [],
        });
      } catch (err: any) {
        setError(err.message ?? "Failed to load course");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleEnroll = async () => {
    const { data: sessionRes } = await supabase.auth.getSession();
    const uid = sessionRes.session?.user?.id;
    if (!uid) {
      alert("Please sign in to enroll.");
      return;
    }
    // If the course has a price, route to purchase flow instead of free enroll
    if ((course?.price ?? 0) > 0) {
      await handlePurchase();
      return;
    }
    try {
      await supabase.from("course_enrollments").insert({ course_id: id, user_id: uid });
      setEnrolled(true);
      alert("Successfully enrolled in the course!");
    } catch (e: any) {
      alert(e.message ?? "Failed to enroll");
    }
  };

  const handlePurchase = async () => {
    const { data: sessionRes } = await supabase.auth.getSession();
    const uid = sessionRes.session?.user?.id;
    if (!uid) {
      alert("Please sign in to purchase.");
      return;
    }
    const email = sessionRes.session?.user?.email ?? "";
    const name = (sessionRes.session?.user?.user_metadata?.name as string) ?? "";
    try {
      await payWithFlutterwave({
        purpose: "course_purchase",
        amount: Number(course?.price ?? 0),
        currency: "NGN",
        user: { id: uid, email, name },
        courseId: id,
        onVerified: (res) => {
          if (res?.ok && res?.enrolled) {
            setEnrolled(true);
            alert("Payment verified and enrollment activated. Enjoy your course!");
          } else {
            console.log("[course] verification response", res);
          }
        },
      });
    } catch (e: any) {
      alert(e.message ?? "Payment failed to initialize");
    }
  };

  const completedLessons = (course?.curriculum ?? []).reduce(
    (sum: number, module: any) => sum + (module.completed ? module.lessons : 0),
    0
  );
  const totalLessons = (course?.curriculum ?? []).reduce(
    (sum: number, module: any) => sum + module.lessons,
    0
  );
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const completedModules = (course?.curriculum ?? []).filter((m: any) => m.completed).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/courses" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition" />
            Back to Courses
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              {error && <div className="text-red-600 mb-6">{error}</div>}
              {loading && <div className="h-10 w-48 bg-muted animate-pulse rounded mb-6" />}
              {course?.image && (
                <img src={course.image} alt={course.title} className="w-full h-96 object-cover rounded-2xl mb-8" />
              )}

              {/* Tabs */}
              <div className="flex gap-4 mb-8 border-b border-border">
                {["overview", "curriculum"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "overview" && "Overview"}
                    {tab === "curriculum" && "Curriculum"}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <>
                  <h1 className="font-poppins font-bold text-4xl text-foreground mb-4">
                    {course?.title || ""}
                  </h1>

                  <p className="text-lg text-muted-foreground mb-8">
                    {course?.fullDescription || ""}
                  </p>

                  <div className="flex flex-wrap gap-6 mb-12 pb-12 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Star className="text-accent" fill="currentColor" size={20} />
                      <div>
                        <p className="font-semibold text-foreground">{course?.rating ?? "—"}</p>
                        <p className="text-sm text-muted-foreground">{(course?.students ?? 0).toLocaleString()} students</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="text-primary" size={20} />
                      <div>
                        <p className="font-semibold text-foreground">{course?.durationHours ?? 0} hours</p>
                        <p className="text-sm text-muted-foreground">Total duration</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <BookOpen className="text-accent" size={20} />
                      <div>
                        <p className="font-semibold text-foreground">{course?.modulesCount ?? 0} modules</p>
                        <p className="text-sm text-muted-foreground">Course content</p>
                      </div>
                    </div>
                  </div>

                  <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">Course Curriculum</h2>
                  <div className="space-y-4">
                    {(course?.curriculum ?? []).map((module: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-xl p-6 border border-border hover:border-primary transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              {module.completed ? (
                                <CheckCircle className="text-green-500" size={20} />
                              ) : (
                                <Play className="text-primary" size={20} />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{module.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {module.lessons} lessons • {module.durationHours}h
                              </p>
                            </div>
                          </div>
                          {module.completed && <CheckCircle className="text-green-500" size={20} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Curriculum Tab */}
              {activeTab === "curriculum" && (
                <>
                  <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">Course Curriculum</h2>
                  <div className="space-y-4">
                    {(course?.curriculum ?? []).map((module: any, idx: number) => (
                      <div key={idx} className="bg-white rounded-xl p-6 border border-border hover:border-primary transition">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex-shrink-0">
                                {module.completed ? (
                                  <CheckCircle className="text-green-500" size={24} />
                                ) : (
                                  <Play className="text-primary" size={24} />
                                )}
                              </div>
                              <div>
                                <h3 className="font-poppins font-bold text-foreground text-lg">{module.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {module.lessons} lessons • {module.durationHours}h
                                </p>
                              </div>
                            </div>
                            {module.completed && (
                              <div className="ml-12 text-sm text-green-600 font-semibold">✓ Completed</div>
                            )}
                          </div>
                          <Button
                            variant={module.completed ? "outline" : "primary"}
                            size="sm"
                            className={module.completed ? "text-green-600 border-green-200" : ""}
                          >
                            {module.completed ? "✓ Completed" : "Continue"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              {enrolled ? (
                <div className="bg-white rounded-2xl p-8 sticky top-24 border border-border space-y-6">
                  <div>
                    <h3 className="font-poppins font-bold text-foreground mb-4">Your Progress</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-foreground">
                            {completedLessons} of {totalLessons} lessons
                          </span>
                          <span className="text-sm font-bold text-primary">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Modules Completed</span>
                          <span className="font-semibold text-foreground">{completedModules}/{course?.modulesCount ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button size="lg" className="w-full">
                    <Play size={18} />
                    Continue Learning
                  </Button>

                  {!!course?.features?.length && (
                    <div className="pt-6 border-t border-border">
                      <h4 className="font-poppins font-bold text-foreground mb-4">What you'll learn:</h4>
                      <ul className="space-y-3">
                        {course.features!.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                            <span className="text-foreground text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 sticky top-24 border border-border">
                  <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
                    <img
                      src={course?.authorImage || ""}
                      alt={course?.author || "Author"}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-foreground">{course?.author || ""}</h4>
                      <p className="text-xs text-muted-foreground">{course?.authorBio || ""}</p>
                    </div>
                  </div>

                  <div className="text-3xl font-poppins font-bold text-primary mb-6">
                    ₦{Number(course?.price ?? 0).toLocaleString()}
                  </div>

                  <Button onClick={(course?.price ?? 0) > 0 ? handlePurchase : handleEnroll} size="lg" className="w-full mb-4">
                    {(course?.price ?? 0) > 0 ? "Buy Now" : "Enroll Now"}
                  </Button>

                  {!!course?.features?.length && (
                    <>
                      <h3 className="font-poppins font-bold text-foreground mb-4">What you'll learn:</h3>
                      <ul className="space-y-3">
                        {course.features!.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                            <span className="text-foreground text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {!isAuthed && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
              <div className="text-center max-w-md p-6 bg-white rounded-xl border border-border shadow">
                <h3 className="font-poppins font-bold text-xl text-foreground mb-2">Sign in to view course details</h3>
                <p className="text-muted-foreground mb-4">Please sign in or create an account to access full content.</p>
                <div className="flex gap-3 justify-center">
                  <Link to="/login" className="px-4 py-2 rounded-lg bg-primary text-white">Sign In</Link>
                  <Link to="/signup" className="px-4 py-2 rounded-lg bg-muted text-foreground">Sign Up</Link>
                </div>
              </div>
            </div>
          )}

          {/* Removed overlay paywall: details are viewable; purchase/enroll actions remain in sidebar */}
        </div>
      </div>

      <Footer />
    </div>
  );
}
