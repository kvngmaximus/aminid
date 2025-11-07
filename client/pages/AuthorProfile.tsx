import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Zap, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import Button from "@/components/Button";

const authorData: Record<string, any> = {
  "a1": {
    id: "a1",
    name: "Sarah Amin",
    bio: "Award-winning author & productivity expert dedicated to helping professionals achieve their best work.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    followers: 15420,
    isPremium: true,
    joinedDate: "2023-01-15",
    articles: 24,
    totalReads: 145230,
    badge: "month",
    about: "Sarah Amin is a renowned author specializing in productivity and personal development. With over 10 years of experience helping professionals and entrepreneurs maximize their potential.",
    courses: 5,
    articles: [
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
    ],
  },
};

export default function AuthorProfile() {
  const navigate = useNavigate();
  const { id = "a1" } = useParams();
  const [isFollowing, setIsFollowing] = useState(false);

  const author = authorData[id] || authorData["a1"];

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
                src={author.image}
                alt={author.name}
                className="w-32 h-32 sm:w-48 sm:h-48 rounded-full object-cover border-4 border-accent"
              />

              <div className="flex-1">
                <h1 className="font-poppins font-bold text-3xl sm:text-4xl text-foreground mb-2">
                  {author.name}
                </h1>

                <div className="flex flex-wrap gap-3 mb-4">
                  {author.isPremium && (
                    <div className="bg-accent/10 text-accent px-4 py-2 rounded-full font-semibold text-sm">
                      Premium Author
                    </div>
                  )}
                  {author.badge === "month" && (
                    <div className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-full font-semibold text-sm">
                      🌟 Author of Month
                    </div>
                  )}
                </div>

                <p className="text-muted-foreground text-lg mb-6">{author.bio}</p>

                <Button onClick={() => setIsFollowing(!isFollowing)} size="lg">
                  {isFollowing ? "Following" : "Follow Author"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-border">
              {[
                { label: "Followers", value: author.followers.toLocaleString(), icon: Zap },
                { label: "Articles", value: author.articles, icon: BookOpen },
                { label: "Total Reads", value: (author.totalReads / 1000).toFixed(0) + "K", icon: Zap },
                { label: "Courses", value: author.courses, icon: Zap },
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
                {author.about}
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-poppins font-bold text-3xl text-foreground mb-8">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {author.articles.map((article: any) => (
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
