import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import Input from "@/components/Input";
import { supabase } from "@/lib/supabase";

type FilterType = "all" | "free" | "premium" | "popular";

type DbArticle = {
  id: string;
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  premium: boolean | null;
  status: string | null;
  author_id: string | null;
  category?: string | null;
  content?: string | null;
};

type UIArticle = {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  authorImage: string;
  readTime: number;
  likes: number;
  image: string;
  isPremium?: boolean;
  category?: string;
};

export default function Articles() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [articles, setArticles] = useState<UIArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    articles.forEach((a) => a.category && cats.add(a.category));
    return cats.size ? Array.from(cats) : ["Productivity", "Business", "Learning", "Technology"];
  }, [articles]);

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("articles")
        .select("id,title,excerpt,cover_url,premium,status,author_id,category,content")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const rows: DbArticle[] = (data || []) as DbArticle[];
      const authorIds = Array.from(new Set(rows.map((r) => r.author_id).filter(Boolean))) as string[];
      let authorsById: Record<string, { name: string; avatar_url: string | null }> = {};
      if (authorIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id,name,avatar_url")
          .in("id", authorIds);
        (profiles || []).forEach((p: any) => {
          authorsById[p.id] = { name: p.name || "Unknown Author", avatar_url: p.avatar_url || null };
        });
      }

      const ui: UIArticle[] = rows.map((r) => {
        const authorInfo = r.author_id ? authorsById[r.author_id] : undefined;
        const estimatedReadTime = (() => {
          const text = r.content || r.excerpt || "";
          const words = text.split(/\s+/).length;
          return Math.max(3, Math.round(words / 200));
        })();
        return {
          id: r.id,
          title: r.title,
          excerpt: r.excerpt || "",
          author: authorInfo?.name || "Unknown Author",
          authorImage:
            authorInfo?.avatar_url ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
          readTime: estimatedReadTime,
          likes: 0,
          image:
            r.cover_url ||
            "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop",
          isPremium: !!r.premium,
          category: r.category || undefined,
        };
      });

      setArticles(ui);
      setLoading(false);
    };

    loadArticles();
  }, []);

  const filteredArticles = articles.filter((article) => {
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

      <div className="flex-1 relative">
        <div>
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
              {error && (
                <div className="text-red-600 mb-6">{error}</div>
              )}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : filteredArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      {...article}
                      onClick={() => navigate(`/articles/${article.id}`)}
                    />
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
      </div>

      <Footer />
    </div>
  );
}
