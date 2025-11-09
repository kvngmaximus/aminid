import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Heart, Settings, LogOut, Download, Play, CheckCircle, Clock, BookOpen, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import Button from "@/components/Button";

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

  const savedArticles = [
    {
      id: "1",
      title: "The Art of Deep Work in a Distracted World",
      excerpt: "Learn how to maintain focus and productivity in an increasingly digital world.",
      author: "Sarah Amin",
      authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      readTime: 8,
      likes: 234,
      image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop",
      isPremium: false,
      category: "Productivity",
    },
    {
      id: "2",
      title: "Building a Personal Brand as a Writer",
      excerpt: "Strategies to establish yourself as a thought leader in your niche.",
      author: "Ahmed Hassan",
      authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      readTime: 12,
      likes: 567,
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
      isPremium: true,
      category: "Business",
    },
  ];

  const subscriptions = [
    { id: "a1", name: "Sarah Amin", followers: 15420, premium: true },
    { id: "a2", name: "Ahmed Hassan", followers: 28950, premium: true },
    { id: "a3", name: "Fatima Khan", followers: 9230, premium: true },
  ];

  const enrolledCourses: EnrolledCourse[] = [
    {
      id: "1",
      title: "Mastering Deep Work & Focus",
      author: "Sarah Amin",
      image: "https://images.unsplash.com/photo-1516321318423-f06f70a504f0?w=400&h=200&fit=crop",
      price: 49,
      progress: 65,
      currentModule: 4,
      totalModules: 8,
      completedLessons: 18,
      totalLessons: 32,
      lastAccessed: "2 hours ago",
      estimatedTimeLeft: 4.5,
    },
    {
      id: "2",
      title: "Advanced Python Programming",
      author: "John Developer",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=200&fit=crop",
      price: 79,
      progress: 30,
      currentModule: 2,
      totalModules: 10,
      completedLessons: 8,
      totalLessons: 42,
      lastAccessed: "1 week ago",
      estimatedTimeLeft: 8.5,
    },
    {
      id: "3",
      title: "UI/UX Design Fundamentals",
      author: "Emma Designer",
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop",
      price: 59,
      progress: 90,
      currentModule: 8,
      totalModules: 8,
      completedLessons: 29,
      totalLessons: 31,
      lastAccessed: "3 days ago",
      estimatedTimeLeft: 0.5,
    },
  ];

  const activeCourses = enrolledCourses.filter(c => c.progress < 100);
  const completedCourses = enrolledCourses.filter(c => c.progress === 100);

  const handleContinueLearning = (courseId: string) => {
    navigate(`/courses/${courseId}?tab=curriculum`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-12">
            <h1 className="font-poppins font-bold text-4xl text-foreground">
              Your Dashboard
            </h1>
            <div className="flex gap-3">
              <Button variant="ghost" size="md">
                <Settings size={20} />
              </Button>
              <Button variant="ghost" size="md">
                <LogOut size={20} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Saved Articles", value: "12", icon: Bookmark },
              { label: "Subscribed Authors", value: "8", icon: Heart },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedArticles.map((article) => (
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
              {subscriptions.map((sub) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <Footer />
    </div>
  );
}
