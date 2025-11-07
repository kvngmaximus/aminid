import { useState } from "react";
import { Users, FileText, Award, CreditCard, Settings, LogOut, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";

type AdminTab = "users" | "articles" | "recognition" | "payments" | "settings";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  const stats = [
    { label: "Total Users", value: "45,230", trend: "+12%" },
    { label: "Published Articles", value: "8,456", trend: "+8%" },
    { label: "Premium Members", value: "12,340", trend: "+23%" },
    { label: "Total Revenue", value: "$234,567", trend: "+34%" },
  ];

  const pendingArticles = [
    { id: 1, title: "How to Build Better Habits", author: "John Doe", status: "pending" },
    { id: 2, title: "Advanced Python Techniques", author: "Jane Smith", status: "pending" },
  ];

  const users = [
    { id: 1, name: "Sarah Amin", role: "Premium Author", status: "active" },
    { id: 2, name: "Ahmed Hassan", role: "Premium Author", status: "active" },
    { id: 3, name: "Regular Reader", role: "Free Reader", status: "active" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-12">
            <h1 className="font-poppins font-bold text-4xl text-foreground">
              Admin Control Panel
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-6 border border-border">
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-poppins font-bold text-foreground">{stat.value}</p>
                  <span className="text-xs text-green-500 font-semibold">{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
            {[
              { id: "users" as const, icon: Users, label: "User Management", count: 3 },
              { id: "articles" as const, icon: FileText, label: "Content Moderation", count: 2 },
              { id: "recognition" as const, icon: Award, label: "Recognition System", count: 0 },
              { id: "payments" as const, icon: CreditCard, label: "Payment Control", count: 0 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  activeTab === item.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary"
                }`}
              >
                <item.icon className={`w-8 h-8 mb-3 ${activeTab === item.id ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-poppins font-bold text-foreground mb-1">{item.label}</h3>
                {item.count > 0 && (
                  <p className="text-sm text-accent font-semibold">{item.count} pending</p>
                )}
              </button>
            ))}
          </div>

          {activeTab === "users" && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="font-poppins font-bold text-2xl text-foreground">User Management</h2>
              </div>
              <div className="divide-y divide-border">
                {users.map((user) => (
                  <div key={user.id} className="p-6 flex items-center justify-between hover:bg-muted/50 transition">
                    <div>
                      <h3 className="font-semibold text-foreground">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                        {user.status}
                      </span>
                      <Button variant="ghost" size="md">
                        <ChevronRight size={20} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "articles" && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="font-poppins font-bold text-2xl text-foreground">Content Moderation</h2>
              </div>
              <div className="divide-y divide-border">
                {pendingArticles.map((article) => (
                  <div key={article.id} className="p-6 flex items-center justify-between hover:bg-muted/50 transition">
                    <div>
                      <h3 className="font-semibold text-foreground">{article.title}</h3>
                      <p className="text-sm text-muted-foreground">by {article.author}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">
                        Pending
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Approve</Button>
                        <Button variant="outline" size="sm">Reject</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "recognition" && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-8 border border-border">
                <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">
                  Recognition Management
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-semibold text-foreground mb-3">
                      Author of the Month
                    </label>
                    <select className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>-- Select Author --</option>
                      <option>Sarah Amin</option>
                      <option>Ahmed Hassan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-foreground mb-3">
                      Author of the Year
                    </label>
                    <select className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>-- Select Author --</option>
                      <option>Ahmed Hassan</option>
                      <option>Sarah Amin</option>
                    </select>
                  </div>
                </div>
                <Button className="mt-6">Save Recognition</Button>
              </div>

              <div className="bg-white rounded-xl p-8 border border-border">
                <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">
                  Publish Bulletin
                </h2>
                <Button size="lg">Publish Monthly Bulletin</Button>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white rounded-xl p-8 border border-border">
              <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">
                Payment & Revenue Control
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block font-semibold text-foreground mb-3">
                    Revenue Share Ratio
                  </label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="0" max="100" defaultValue="60" className="flex-1" />
                    <span className="text-lg font-bold text-primary">Platform: 60% | Authors: 40%</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-6">
                    <p className="text-muted-foreground text-sm mb-2">Total Transactions</p>
                    <p className="text-3xl font-poppins font-bold text-primary">234</p>
                  </div>
                  <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-6">
                    <p className="text-muted-foreground text-sm mb-2">Pending Payouts</p>
                    <p className="text-3xl font-poppins font-bold text-accent">$12,450</p>
                  </div>
                </div>
                <Button size="lg">Process Pending Payouts</Button>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white rounded-xl p-8 border border-border">
              <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">
                Platform Settings
              </h2>
              <p className="text-muted-foreground mb-6">Configure platform-wide settings, themes, and announcements.</p>
              <Button size="lg">Configure Settings</Button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
