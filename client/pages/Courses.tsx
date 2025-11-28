import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import Input from "@/components/Input";
import { supabase } from "@/lib/supabase";
// Removed paywall gating on Courses page per request

type UICourse = {
  id: string;
  title: string;
  description: string;
  author: string;
  authorImage: string;
  price: number;
  image: string;
  rating: number;
  students: number;
  duration: number;
  level: "Beginner" | "Intermediate" | "Advanced";
};

type SortType = "newest" | "popular" | "rating" | "price-low" | "price-high";

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("popular");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [items, setItems] = useState<UICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Courses page should be visible without auth or subscription

  const levels = ["Beginner", "Intermediate", "Advanced"];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: courseRows, error: courseErr } = await supabase
          .from("courses")
          .select("id,title,description,author_id,price,status,created_at")
          .eq("status", "published")
          .order("created_at", { ascending: false });
        if (courseErr) throw courseErr;

        const authorIds = Array.from(new Set((courseRows ?? []).map(c => c.author_id)));
        const { data: authors } = await supabase
          .from("profiles")
          .select("id,name,avatar_url")
          .in("id", authorIds);
        const authorMap = new Map((authors ?? []).map(a => [a.id, a]));

        // Optional: compute students by counting enrollments per course
        const courseIds = (courseRows ?? []).map(c => c.id);
        const { data: enrolls } = await supabase
          .from("course_enrollments")
          .select("course_id")
          .in("course_id", courseIds);
        const studentCount = new Map<string, number>();
        (enrolls ?? []).forEach(e => studentCount.set(e.course_id, (studentCount.get(e.course_id) ?? 0) + 1));

        const mapped: UICourse[] = (courseRows ?? []).map(c => {
          const author = authorMap.get(c.author_id);
          // Use cover if available in future; keep safe fallback for asset only
          const image = "https://images.unsplash.com/photo-1516321318423-f06f70a504f0?w=600&h=400&fit=crop";
          return {
            id: c.id,
            title: c.title,
            description: c.description ?? "",
            author: author?.name ?? "Unknown",
            authorImage: author?.avatar_url ?? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
            price: Number(c.price ?? 0),
            image,
            rating: undefined,
            students: studentCount.get(c.id) ?? 0,
            duration: undefined,
            level: undefined as any,
          };
        });
        setItems(mapped);
      } catch (err: any) {
        setError(err.message ?? "Failed to load courses");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredCourses = items
    .filter((course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((course) => !selectedLevel || course.level === selectedLevel)
    .sort((a, b) => {
      if (sortBy === "popular") return b.students - a.students;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0;
    });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 relative">
        <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-poppins font-bold text-4xl text-foreground mb-6">Premium Courses</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Learn from industry experts with our comprehensive course library
            </p>

            <div className="relative">
              <Search className="absolute left-4 top-3 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
          </div>
        </section>

        {/* Courses listing is browseable without subscription; paywall only on CourseDetail */}

        <section className="py-12 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {["newest", "popular", "rating", "price-low", "price-high"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSortBy(type as SortType)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      sortBy === type
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {type === "newest" && "Newest"}
                    {type === "popular" && "Most Popular"}
                    {type === "rating" && "Top Rated"}
                    {type === "price-low" && "Price: Low to High"}
                    {type === "price-high" && "Price: High to Low"}
                  </button>
                ))}
              </div>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Levels</option>
                {levels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading && (
              <div className="text-center py-10 text-muted-foreground">Loading courses…</div>
            )}
            {error && (
              <div className="text-center py-10 text-red-600">{error}</div>
            )}
            {!loading && !error && filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} {...course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <h3 className="font-poppins font-bold text-xl text-foreground mb-2">No courses found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
