import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Play, Users, Star, Clock, BookOpen, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";

const courseData: Record<string, any> = {
  "1": {
    id: "1",
    title: "Mastering Deep Work & Focus",
    description: "Learn scientifically-proven techniques to eliminate distractions and achieve flow state.",
    fullDescription: "This comprehensive course teaches you how to master deep work and achieve flow state. Through a combination of scientific research and practical exercises, you'll learn to eliminate distractions, manage your energy, and produce your best work.",
    author: "Sarah Amin",
    authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    authorBio: "Award-winning productivity expert with 15+ years of experience",
    price: 49,
    image: "https://images.unsplash.com/photo-1516321318423-f06f70a504f0?w=1200&h=600&fit=crop",
    rating: 4.8,
    students: 2845,
    duration: 12,
    modules: 8,
    level: "Beginner",
    curriculum: [
      { title: "Introduction to Deep Work", lessons: 3, duration: 1, completed: true },
      { title: "Understanding Your Brain", lessons: 4, duration: 2, completed: true },
      { title: "Environment & Optimization", lessons: 5, duration: 2, completed: true },
      { title: "Time Management Techniques", lessons: 6, duration: 3, completed: false },
      { title: "Building Sustainable Habits", lessons: 4, duration: 2, completed: false },
      { title: "Measuring Your Progress", lessons: 3, duration: 1, completed: false },
      { title: "Real-World Case Studies", lessons: 5, duration: 1, completed: false },
      { title: "Capstone Project", lessons: 1, duration: 0, completed: false },
    ],
    features: [
      "12 hours of video content",
      "8 in-depth modules",
      "Downloadable resources",
      "Interactive exercises",
      "Certificate of completion",
      "Lifetime access",
      "Community forum access",
    ],
  },
};

export default function CourseDetail() {
  const { id = "1" } = useParams();
  const [enrolled, setEnrolled] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum">("overview");

  const course = courseData[id] || courseData["1"];

  const handleEnroll = () => {
    setEnrolled(true);
    alert("Successfully enrolled in the course!");
  };

  const completedLessons = course.curriculum.reduce(
    (sum: number, module: any) => sum + (module.completed ? module.lessons : 0),
    0
  );
  const totalLessons = course.curriculum.reduce(
    (sum: number, module: any) => sum + module.lessons,
    0
  );
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
  const completedModules = course.curriculum.filter((m: any) => m.completed).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/courses" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition" />
            Back to Courses
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <img src={course.image} alt={course.title} className="w-full h-96 object-cover rounded-2xl mb-8" />

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
                    {course.title}
                  </h1>

                  <p className="text-lg text-muted-foreground mb-8">
                    {course.fullDescription}
                  </p>

                  <div className="flex flex-wrap gap-6 mb-12 pb-12 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Star className="text-accent" fill="currentColor" size={20} />
                      <div>
                        <p className="font-semibold text-foreground">{course.rating}</p>
                        <p className="text-sm text-muted-foreground">{course.students.toLocaleString()} students</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="text-primary" size={20} />
                      <div>
                        <p className="font-semibold text-foreground">{course.duration} hours</p>
                        <p className="text-sm text-muted-foreground">Total duration</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <BookOpen className="text-accent" size={20} />
                      <div>
                        <p className="font-semibold text-foreground">{course.modules} modules</p>
                        <p className="text-sm text-muted-foreground">Course content</p>
                      </div>
                    </div>
                  </div>

                  <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">Course Curriculum</h2>
                  <div className="space-y-4">
                    {course.curriculum.map((module: any, idx: number) => (
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
                                {module.lessons} lessons • {module.duration}h
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
                    {course.curriculum.map((module: any, idx: number) => (
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
                                  {module.lessons} lessons • {module.duration}h
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
                          <span className="font-semibold text-foreground">{completedModules}/{course.modules}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Accessed</span>
                          <span className="font-semibold text-foreground">2 hours ago</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Time Remaining</span>
                          <span className="font-semibold text-foreground">
                            {Math.round((totalLessons - completedLessons) / (totalLessons / course.duration))}h
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button size="lg" className="w-full">
                    <Play size={18} />
                    Continue Learning
                  </Button>

                  <div className="pt-6 border-t border-border">
                    <h4 className="font-poppins font-bold text-foreground mb-4">What you'll learn:</h4>
                    <ul className="space-y-3">
                      {course.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                          <span className="text-foreground text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 sticky top-24 border border-border">
                  <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
                    <img
                      src={course.authorImage}
                      alt={course.author}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-foreground">{course.author}</h4>
                      <p className="text-xs text-muted-foreground">{course.authorBio}</p>
                    </div>
                  </div>

                  <div className="text-3xl font-poppins font-bold text-primary mb-6">
                    ${course.price}
                  </div>

                  <Button onClick={handleEnroll} size="lg" className="w-full mb-4">
                    Enroll Now
                  </Button>

                  <h3 className="font-poppins font-bold text-foreground mb-4">What you'll learn:</h3>
                  <ul className="space-y-3">
                    {course.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                        <span className="text-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
