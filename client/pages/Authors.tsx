import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthorCard from "@/components/AuthorCard";
import Input from "@/components/Input";
import { supabase } from "@/lib/supabase";
type AuthorItem = {
  id: string;
  name: string;
  bio: string;
  image: string;
  followers: number;
  isPremium?: boolean;
  badge?: "month" | "year" | "featured";
  isFollowing?: boolean;
};

type SortType = "followers" | "recent" | "trending";

export default function Authors() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("followers");
  const [filterPremium, setFilterPremium] = useState(false);
  const [items, setItems] = useState<AuthorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const { data: sessionRes } = await supabase.auth.getSession();
      const uid = sessionRes.session?.user?.id ?? null;
      setUserId(uid);

      try {
        const [artRes, courseRes] = await Promise.all([
          supabase.from("articles").select("author_id").eq("status", "published"),
          supabase.from("courses").select("author_id").eq("status", "published"),
        ]);
        const authorIds = Array.from(new Set([
          ...((artRes.data ?? []).map((r: any) => r.author_id).filter(Boolean)),
          ...((courseRes.data ?? []).map((r: any) => r.author_id).filter(Boolean)),
        ]));

        if (!authorIds.length) {
          setItems([]);
          setLoading(false);
          return;
        }

        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("id,name,avatar_url,bio")
          .in("id", authorIds);
        if (profErr) throw profErr;

        const { data: follows } = await supabase
          .from("author_follows")
          .select("author_id,follower_id")
          .in("author_id", authorIds);

        const followerCount = new Map<string, number>();
        const followingSet = new Set<string>();
        (follows ?? []).forEach((row: any) => {
          followerCount.set(row.author_id, (followerCount.get(row.author_id) ?? 0) + 1);
          if (uid && row.follower_id === uid) followingSet.add(row.author_id);
        });

        const mapped: AuthorItem[] = (profiles ?? []).map((p: any) => ({
          id: p.id,
          name: p.name ?? "Unknown",
          bio: p.bio ?? "",
          image:
            p.avatar_url ??
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
          followers: followerCount.get(p.id) ?? 0,
          isPremium: undefined,
          badge: undefined,
          isFollowing: followingSet.has(p.id),
        }));

        const filtered = mapped
          .filter((author) =>
            author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            author.bio.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .filter((author) => !filterPremium || author.isPremium)
          .sort((a, b) => {
            if (sortBy === "followers") return b.followers - a.followers;
            if (sortBy === "trending") return Math.random() - 0.5;
            return 0;
          });
        setItems(filtered);
      } catch (err: any) {
        setError(err.message ?? "Failed to load authors");
      } finally {
        setLoading(false);
      }
    })();
  }, [searchQuery, sortBy, filterPremium]);


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1">
        <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="font-poppins font-bold text-4xl text-foreground mb-6">Discover Authors</h1>
            <p className="text-muted-foreground text-lg mb-8">
              Explore our community of brilliant minds and follow those who inspire you
            </p>

            <div className="relative">
              <Search className="absolute left-4 top-3 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="Search authors..."
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
                {["followers", "recent", "trending"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSortBy(type as SortType)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      sortBy === type
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {type === "followers" && "Most Followed"}
                    {type === "recent" && "Recent"}
                    {type === "trending" && "Trending"}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterPremium}
                  onChange={(e) => setFilterPremium(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-foreground font-medium">Premium Authors Only</span>
              </label>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="text-center py-10 text-red-600">{error}</div>
            )}
            {items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((author) => (
                  <AuthorCard
                    key={author.id}
                    id={author.id}
                    name={author.name}
                    bio={author.bio}
                    image={author.image}
                    followers={author.followers}
                    isPremium={author.isPremium}
                    badge={author.badge}
                    isFollowing={author.isFollowing}
                    onClick={() => navigate(`/authors/${author.id}`)}
                    onFollowClick={async () => {
                      const { data: sessionRes } = await supabase.auth.getSession();
                      const uid = sessionRes.session?.user?.id;
                      if (!uid) {
                        alert("Please sign in to follow authors.");
                        return;
                      }
                      try {
                        if (author.isFollowing) {
                          await supabase
                            .from("author_follows")
                            .delete()
                            .eq("author_id", author.id)
                            .eq("follower_id", uid);
                          setItems((prev) => prev.map((a) => a.id === author.id ? { ...a, isFollowing: false, followers: Math.max(0, (a.followers ?? 0) - 1) } : a));
                        } else {
                          await supabase
                            .from("author_follows")
                            .insert({ author_id: author.id, follower_id: uid });
                          setItems((prev) => prev.map((a) => a.id === author.id ? { ...a, isFollowing: true, followers: (a.followers ?? 0) + 1 } : a));
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <h3 className="font-poppins font-bold text-xl text-foreground mb-2">No authors found</h3>
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
