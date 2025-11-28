import { useEffect, useState } from "react";
import { Plus, Eye, Heart, TrendingUp, Settings, LogOut, Trash2, Edit2, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/Button";
import ArticlePostModal from "@/components/ArticlePostModal";
import CourseCreateModal from "@/components/CourseCreateModal";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"articles" | "courses" | "analytics" | "earnings">("articles");
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [articles, setArticles] = useState([
    {
      id: "1",
      title: "The Art of Deep Work",
      status: "published",
      views: 1245,
      likes: 234,
      date: "2024-01-15",
      premium: false,
    },
    {
      id: "2",
      title: "Building Your Brand",
      status: "draft",
      views: 0,
      likes: 0,
      date: "2024-01-20",
      premium: true,
    },
  ]);

  const [courses, setCourses] = useState([
    {
      id: "1",
      title: "Mastering Deep Work & Focus",
      price: 49,
      students: 2845,
      rating: 4.8,
      status: "published",
      date: "2024-01-15",
    },
  ]);

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
      if (profile.user_type === "reader") navigate("/dashboard/reader");
      if (profile.user_type === "admin") navigate("/dashboard/admin");
    })();
  }, [navigate]);

  const analytics = [
    { metric: "Total Views", value: "2,450", change: "+15%" },
    { metric: "Total Likes", value: "567", change: "+23%" },
    { metric: "Average Read Time", value: "8.5 min", change: "+5%" },
    { metric: "Follower Growth", value: "+125", change: "This month" },
  ];

  const handleAddArticle = (article: any) => {
    if (editingArticle) {
      // Update existing article
      setArticles(articles.map(a => a.id === article.id ? article : a));
      setEditingArticle(null);
    } else {
      // Add new article
      setArticles([article, ...articles]);
    }
    setShowArticleModal(false);
  };

  const handleEditArticle = (article: any) => {
    setEditingArticle(article);
    setShowArticleModal(true);
  };

  const handleAddCourse = (course: any) => {
    if (editingCourse) {
      // Update existing course
      setCourses(courses.map(c => c.id === course.id ? course : c));
      setEditingCourse(null);
    } else {
      // Add new course
      setCourses([course, ...courses]);
    }
    setShowCourseModal(false);
  };

  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    setShowCourseModal(true);
  };

  const handleDeleteArticle = (id: string) => {
    setArticles(articles.filter(a => a.id !== id));
  };

  const handleDeleteCourse = (id: string) => {
    setCourses(courses.filter(c => c.id !== id));
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/account/subscriptions") }>
              <Heart size={18} />
            </Button>
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
            <h1 className="font-poppins font-bold text-4xl text-foreground">Author Dashboard</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {analytics.map((item) => (
              <div key={item.metric} className="bg-white rounded-xl p-6 border border-border">
                <p className="text-sm text-muted-foreground mb-2">{item.metric}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-poppins font-bold text-foreground">{item.value}</p>
                  <span className="text-xs text-green-500 font-semibold">{item.change}</span>
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
                      <p className="text-xs text-muted-foreground">{article.date}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mr-6">
                      <div className="flex items-center gap-1">
                        <Eye size={16} />
                        <span>{article.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart size={16} />
                        <span>{article.likes}</span>
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
                          <p className="text-xs text-muted-foreground">{course.date}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm text-muted-foreground mr-6">
                      <div className="flex items-center gap-1">
                        <TrendingUp size={16} />
                        <span>{course.students} enrolled</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-foreground">₦{Number(course.price || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-accent font-semibold">{course.rating}★</span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        course.status === "published"
                          ? "bg-green-100 text-green-700"
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
              <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl p-8">
                <p className="text-white/80 mb-2">Total Earnings</p>
                <p className="text-4xl font-poppins font-bold">₦1,245.50</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-border">
                  <p className="text-muted-foreground text-sm mb-2">This Month</p>
                  <p className="text-2xl font-poppins font-bold text-primary">₦345.00</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-border">
                  <p className="text-muted-foreground text-sm mb-2">Pending Payout</p>
                  <p className="text-2xl font-poppins font-bold text-accent">₦125.50</p>
                </div>
              </div>
              <Button size="lg" className="w-full">
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
