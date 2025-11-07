import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthorCard from "@/components/AuthorCard";
import Input from "@/components/Input";

const allAuthors = [
  {
    id: "a1",
    name: "Sarah Amin",
    bio: "Award-winning author & productivity expert",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    followers: 15420,
    isPremium: true,
    badge: "month" as const,
  },
  {
    id: "a2",
    name: "Ahmed Hassan",
    bio: "Bestselling author on personal development",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    followers: 28950,
    isPremium: true,
    badge: "year" as const,
  },
  {
    id: "a3",
    name: "Fatima Khan",
    bio: "Psychology researcher & educator",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    followers: 9230,
    isPremium: true,
  },
  {
    id: "a4",
    name: "Ali Mohammed",
    bio: "Entrepreneur & business strategist",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    followers: 12560,
    isPremium: true,
  },
  {
    id: "a5",
    name: "Zainab Amara",
    bio: "Tech innovator & AI researcher",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    followers: 8750,
    isPremium: true,
  },
  {
    id: "a6",
    name: "Omar Khalid",
    bio: "Travel writer & cultural explorer",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    followers: 6420,
    isPremium: false,
  },
];

type SortType = "followers" | "recent" | "trending";

export default function Authors() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("followers");
  const [filterPremium, setFilterPremium] = useState(false);

  const filteredAuthors = allAuthors
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
            {filteredAuthors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAuthors.map((author) => (
                  <AuthorCard key={author.id} {...author} />
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
