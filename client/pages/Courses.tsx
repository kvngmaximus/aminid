import { useState } from "react";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import Input from "@/components/Input";

const allCourses = [
  {
    id: "1",
    title: "Mastering Deep Work & Focus",
    description: "Learn scientifically-proven techniques to eliminate distractions and achieve flow state.",
    author: "Sarah Amin",
    authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    price: 49,
    image: "https://images.unsplash.com/photo-1516321318423-f06f70a504f0?w=600&h=400&fit=crop",
    rating: 4.8,
    students: 2845,
    duration: 12,
    level: "Beginner",
  },
  {
    id: "2",
    title: "Content Strategy for Premium Writers",
    description: "Build a sustainable income from your writing through strategic content planning.",
    author: "Ahmed Hassan",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    price: 69,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
    rating: 4.9,
    students: 3421,
    duration: 18,
    level: "Intermediate",
  },
  {
    id: "3",
    title: "Psychology of Learning & Retention",
    description: "Understand how memory works and optimize your learning for better retention.",
    author: "Fatima Khan",
    authorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    price: 59,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop",
    rating: 4.7,
    students: 1923,
    duration: 15,
    level: "Beginner",
  },
  {
    id: "4",
    title: "Advanced Analytics & Data Visualization",
    description: "Master data storytelling and advanced visualization techniques.",
    author: "Ali Mohammed",
    authorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    price: 79,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    rating: 4.9,
    students: 4156,
    duration: 24,
    level: "Advanced",
  },
  {
    id: "5",
    title: "AI Writing Assistant Masterclass",
    description: "Harness AI tools to enhance your writing without compromising authenticity.",
    author: "Zainab Amara",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    price: 59,
    image: "https://images.unsplash.com/photo-1677442d019cecf4d4ccf5d96a52f53f29e92242?w=600&h=400&fit=crop",
    rating: 4.8,
    students: 2134,
    duration: 16,
    level: "Intermediate",
  },
  {
    id: "6",
    title: "Building Your Author Brand",
    description: "Create a distinctive author brand that resonates with your target audience.",
    author: "Sarah Amin",
    authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    price: 44,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
    rating: 4.6,
    students: 3567,
    duration: 10,
    level: "Beginner",
  },
];

type SortType = "newest" | "popular" | "rating" | "price-low" | "price-high";

export default function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("popular");
  const [selectedLevel, setSelectedLevel] = useState<string>("");

  const levels = ["Beginner", "Intermediate", "Advanced"];

  const filteredCourses = allCourses
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

      <div className="flex-1">
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
            {filteredCourses.length > 0 ? (
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
