import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import Input from "@/components/Input";

const allArticles = [
  {
    id: "1",
    title: "The Art of Deep Work in a Distracted World",
    excerpt: "Learn how to maintain focus and productivity in an increasingly digital world.",
    author: "Sarah Amin",
    authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    readTime: 8,
    likes: 234,
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop",
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
  {
    id: "3",
    title: "The Psychology of Effective Learning",
    excerpt: "Understand how your brain learns best and optimize your study methods.",
    author: "Fatima Khan",
    authorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    readTime: 10,
    likes: 345,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop",
    category: "Learning",
  },
  {
    id: "4",
    title: "Advanced Content Strategy for Premium Writers",
    excerpt: "Monetize your expertise with premium content strategies.",
    author: "Ali Mohammed",
    authorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    readTime: 15,
    likes: 892,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
    isPremium: true,
    category: "Business",
  },
  {
    id: "5",
    title: "Ethical AI in Content Creation",
    excerpt: "Navigate the future of AI while maintaining authenticity.",
    author: "Zainab Amara",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    readTime: 14,
    likes: 654,
    image: "https://images.unsplash.com/photo-1677442d019cecf4d4ccf5d96a52f53f29e92242?w=600&h=400&fit=crop",
    isPremium: true,
    category: "Technology",
  },
];

type FilterType = "all" | "free" | "premium" | "popular";

export default function Articles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const categories = ["Productivity", "Business", "Learning", "Technology"];

  const filteredArticles = allArticles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "free" && !article.isPremium) ||
      (filter === "premium" && article.isPremium) ||
      (filter === "popular" && article.likes > 400);

    const matchesCategory = !selectedCategory || article.category === selectedCategory;

    return matchesSearch && matchesFilter && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1">
        <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-poppins font-bold text-4xl text-foreground mb-6">Articles & Stories</h1>
            <p className="text-muted-foreground text-lg mb-8">Discover insights from our community of brilliant writers</p>

            <div className="relative">
              <Search className="absolute left-4 top-3 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search articles..."
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
                {["all", "free", "premium", "popular"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type as FilterType)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filter === type
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {type === "all" && "All Articles"}
                    {type === "free" && "Free"}
                    {type === "premium" && "Premium"}
                    {type === "popular" && "Popular"}
                  </button>
                ))}
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((article) => (
                  <Link key={article.id} to={`/articles/${article.id}`}>
                    <ArticleCard {...article} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-poppins font-bold text-xl text-foreground mb-2">No articles found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
