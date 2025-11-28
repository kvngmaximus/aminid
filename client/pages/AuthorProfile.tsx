import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabase";
type Profile = { id: string; name: string | null; avatar_url: string | null; bio?: string | null };
type ArticleItem = {
  id: string;
  title: string;
  excerpt: string | null;
  author: string;
  authorImage: string | null;
  readTime: number;
  likes: number;
  image: string | null;
  isPremium: boolean;
  category: string | null;
};

export default function AuthorProfile() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<number>(0);
  const [articles, setArticles] = useState<ArticleItem[]>([]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id ?? null;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id,name,avatar_url,bio")
        .eq("id", id)
        .single();
      if (!prof) return;
      setProfile(prof as Profile);

      const { data: follows } = await supabase
        .from("author_follows")
        .select("author_id,follower_id")
        .eq("author_id", id);
      const count = (follows ?? []).length;
      setFollowers(count);
      setIsFollowing((follows ?? []).some((f: any) => f.follower_id === uid));

      const { data: arts } = await supabase
        .from("articles")
        .select("id,title,excerpt,cover_url,category,premium,author_id")
        .eq("author_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(12);

      const mapped = (arts ?? []).map((a: any) => ({
        id: a.id,
        title: a.title,
        excerpt: a.excerpt,
        author: prof?.name ?? "",
        authorImage: prof?.avatar_url ?? null,
        readTime: 5,
        likes: 0,
        image: a.cover_url ?? null,
        isPremium: !!a.premium,
        category: a.category ?? null,
      }));
      setArticles(mapped);
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/authors" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition" />
            Back to Authors
          </Link>

          <div className="bg-white rounded-2xl p-8 sm:p-12 mb-12">
            <div className="flex flex-col sm:flex-row gap-8 mb-8">
              <img
                src={profile?.avatar_url ?? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"}
                alt={profile?.name ?? "Author"}
                className="w-32 h-32 sm:w-48 sm:h-48 rounded-full object-cover border-4 border-accent"
              />

              <div className="flex-1">
                <h1 className="font-poppins font-bold text-3xl sm:text-4xl text-foreground mb-2">
                  {profile?.name ?? "Author"}
                </h1>

                <p className="text-muted-foreground text-lg mb-6">{profile?.bio ?? ""}</p>

                <Button
                  onClick={async () => {
                    const { data: s } = await supabase.auth.getSession();
                    const uid = s.session?.user.id;
                    if (!uid || !id) { navigate("/login"); return; }
                    try {
                      if (isFollowing) {
                        await supabase
                          .from("author_follows")
                          .delete()
                          .eq("author_id", id)
                          .eq("follower_id", uid);
                        setIsFollowing(false);
                        setFollowers((f) => Math.max(0, f - 1));
                      } else {
                        await supabase
                          .from("author_follows")
                          .insert({ author_id: id, follower_id: uid });
                        setIsFollowing(true);
                        setFollowers((f) => f + 1);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  size="lg"
                >
                  {isFollowing ? "Following" : "Follow Author"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-border">
              {[
                { label: "Followers", value: followers.toLocaleString(), icon: Zap },
                { label: "Articles", value: articles.length, icon: BookOpen },
                { label: "Total Reads", value: "—", icon: Zap },
                { label: "Courses", value: "—", icon: Zap },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-poppins font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-12">
            <h2 className="font-poppins font-bold text-3xl text-foreground mb-8">About</h2>
            <div className="bg-white rounded-2xl p-8">
              <p className="text-foreground text-lg leading-relaxed">
                {/* Optional long bio/about field; showing profile.bio for now */}
                {profile?.bio ?? ""}
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-poppins font-bold text-3xl text-foreground mb-8">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  {...article}
                  onClick={() => navigate(`/articles/${article.id}`)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
