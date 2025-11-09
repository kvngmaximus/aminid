import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, CheckCircle, Clock, BookOpen, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

const enrolledCoursesData: EnrolledCourse[] = [
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

export default function MyCourses() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"active" | "completed" | "wishlist">("active");

  const activeCourses = enrolledCoursesData.filter(c => c.progress < 100);
  const completedCourses = enrolledCoursesData.filter(c => c.progress === 100);

  const handleContinueLearning = (courseId: string) => {
    navigate(`/courses/${courseId}?tab=curriculum`);
  };

  const CourseCard = ({ course }: { course: EnrolledCourse }) => (
    <div className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition">
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

        {/* Progress Bar */}
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
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-12">
            <h1 className="font-poppins font-bold text-4xl text-foreground mb-2">
              My Learning Journey
            </h1>
            <p className="text-muted-foreground text-lg">
              Continue learning and track your progress
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="text-primary" size={24} />
                <p className="text-sm text-muted-foreground">Active Courses</p>
              </div>
              <p className="text-3xl font-poppins font-bold text-foreground">{activeCourses.length}</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="text-green-500" size={24} />
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <p className="text-3xl font-poppins font-bold text-foreground">{completedCourses.length}</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-accent" size={24} />
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
              <p className="text-3xl font-poppins font-bold text-foreground">
                {Math.round(enrolledCoursesData.reduce((sum, c) => sum + (c.estimatedTimeLeft + (c.completedLessons / c.totalLessons) * 12), 0))}h
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-border">
            {["active", "completed", "wishlist"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "active" && "Active Courses"}
                {tab === "completed" && "Completed"}
                {tab === "wishlist" && "Wishlist"}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          {activeTab === "active" && (
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
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "completed" && (
            <div>
              {completedCourses.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-border text-center">
                  <CheckCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground text-lg">No completed courses yet</p>
                </div>
              ) : (
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
              )}
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="bg-white rounded-xl p-12 border border-border text-center">
              <BookOpen className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-muted-foreground text-lg">No wishlist items yet</p>
              <p className="text-sm text-muted-foreground mb-4">Save courses to your wishlist to access them later</p>
              <Button onClick={() => navigate("/courses")}>
                Browse Courses
              </Button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
