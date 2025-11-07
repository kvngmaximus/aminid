import { useState } from "react";
import { Plus, Eye, Heart, TrendingUp, Settings, LogOut } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";

export default function AuthorDashboard() {
  const [activeTab, setActiveTab] = useState<"articles" | "analytics" | "earnings">("articles");

  const articles = [
    {
      id: "1",
      title: "The Art of Deep Work",
      status: "published",
      views: 1245,
      likes: 234,
      date: "2024-01-15",
      premium: false,
    },
    {
      id: "2",
      title: "Building Your Brand",
      status: "draft",
      views: 0,
      likes: 0,
      date: "2024-01-20",
      premium: true,
    },
  ];

  const analytics = [
    { metric: "Total Views", value: "2,450", change: "+15%" },
    { metric: "Total Likes", value: "567", change: "+23%" },
    { metric: "Average Read Time", value: "8.5 min", change: "+5%" },
    { metric: "Follower Growth", value: "+125", change: "This month" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-12">
            <h1 className="font-poppins font-bold text-4xl text-foreground">
              Author Dashboard
            </h1>
            <div className="flex gap-3">
              <Button>
                <Plus size={20} />
                New Article
              </Button>
              <Button variant="ghost" size="md">
                <Settings size={20} />
              </Button>
              <Button variant="ghost" size="md">
                <LogOut size={20} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {analytics.map((item) => (
              <div key={item.metric} className="bg-white rounded-xl p-6 border border-border">
                <p className="text-sm text-muted-foreground mb-2">{item.metric}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-poppins font-bold text-foreground">{item.value}</p>
                  <span className="text-xs text-green-500 font-semibold">{item.change}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mb-8 border-b border-border">
            {["articles", "analytics", "earnings"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-6 py-3 font-semibold transition-colors border-b-2 ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "articles" && "My Articles"}
                {tab === "analytics" && "Analytics"}
                {tab === "earnings" && "Earnings"}
              </button>
            ))}
          </div>

          {activeTab === "articles" && (
            <div className="space-y-4">
              {articles.map((article) => (
                <div key={article.id} className="bg-white rounded-xl p-6 border border-border hover:shadow-lg transition flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{article.title}</h3>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        article.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {article.status}
                      </span>
                      {article.premium && (
                        <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-semibold">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{article.date}</p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye size={16} />
                      <span>{article.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={16} />
                      <span>{article.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="bg-white rounded-xl p-8 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-poppins font-bold text-lg text-foreground mb-4">
                    Engagement Trends
                  </h3>
                  <div className="h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Chart visualization coming soon</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-poppins font-bold text-lg text-foreground mb-4">
                    Top Articles
                  </h3>
                  <ul className="space-y-3">
                    {articles.map((article) => (
                      <li key={article.id} className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-foreground">{article.title}</span>
                        <TrendingUp className="text-green-500" size={18} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "earnings" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary to-accent text-white rounded-xl p-8">
                <p className="text-white/80 mb-2">Total Earnings</p>
                <p className="text-4xl font-poppins font-bold">$1,245.50</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-border">
                  <p className="text-muted-foreground text-sm mb-2">This Month</p>
                  <p className="text-2xl font-poppins font-bold text-primary">$345.00</p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-border">
                  <p className="text-muted-foreground text-sm mb-2">Pending Payout</p>
                  <p className="text-2xl font-poppins font-bold text-accent">$125.50</p>
                </div>
              </div>
              <Button size="lg" className="w-full">
                Request Payout
              </Button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
