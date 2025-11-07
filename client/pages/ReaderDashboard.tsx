import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Heart, Settings, LogOut, Download } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import Button from "@/components/Button";

export default function ReaderDashboard() {
  const [activeTab, setActiveTab] = useState<"saved" | "subscriptions" | "history">("saved");

  const savedArticles = [
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
  ];

  const subscriptions = [
    { id: "a1", name: "Sarah Amin", followers: 15420, premium: true },
    { id: "a2", name: "Ahmed Hassan", followers: 28950, premium: true },
    { id: "a3", name: "Fatima Khan", followers: 9230, premium: true },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-12">
            <h1 className="font-poppins font-bold text-4xl text-foreground">
              Your Dashboard
            </h1>
            <div className="flex gap-3">
              <Button variant="ghost" size="md">
                <Settings size={20} />
              </Button>
              <Button variant="ghost" size="md">
                <LogOut size={20} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Saved Articles", value: "12", icon: Bookmark },
              { label: "Subscribed Authors", value: "8", icon: Heart },
              { label: "Total Read Time", value: "42h", icon: Settings },
              { label: "Premium Plan", value: "Active", icon: Settings },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-6 border border-border">
                <stat.icon className="text-primary mb-3" size={24} />
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-poppins font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mb-8 border-b border-border">
            {["saved", "subscriptions", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "saved" && "Saved Articles"}
                {tab === "subscriptions" && "Subscriptions"}
                {tab === "history" && "Reading History"}
              </button>
            ))}
          </div>

          {activeTab === "saved" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedArticles.map((article) => (
                <Link key={article.id} to={`/articles/${article.id}`}>
                  <ArticleCard {...article} />
                </Link>
              ))}
            </div>
          )}

          {activeTab === "subscriptions" && (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="bg-white rounded-xl p-6 border border-border flex items-center justify-between hover:shadow-lg transition">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{sub.name}</h3>
                    <p className="text-sm text-muted-foreground">{sub.followers.toLocaleString()} followers</p>
                  </div>
                  {sub.premium && (
                    <div className="bg-accent/10 text-accent px-4 py-2 rounded-lg font-semibold text-sm">
                      Premium
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "history" && (
            <div className="bg-white rounded-xl p-8 text-center border border-border">
              <h3 className="font-poppins font-bold text-lg text-foreground mb-2">
                Your reading history will appear here
              </h3>
              <p className="text-muted-foreground mb-6">
                Start reading articles to track your learning journey
              </p>
              <Link to="/articles">
                <Button size="lg">
                  Explore Articles
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
