import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Zap, Users, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import AuthorCard from "@/components/AuthorCard";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Badge from "@/components/Badge";

export default function Index() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const featuredArticles = [
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
      isFeatured: true,
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
      isFeatured: true,
      category: "Personal Branding",
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
      isPremium: false,
      isFeatured: false,
      category: "Learning",
    },
  ];

  const premiumArticles = [
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

  const topAuthors = [
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
  ];

  const handleNewsletterSignup = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thanks for subscribing with: ${email}`);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center animate-fade-in-up">
            <Badge variant="accent" size="md" className="mb-6 justify-center">
              Welcome to Aminid
            </Badge>

            <h1 className="font-poppins font-bold text-4xl sm:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
              Where <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Minds Sharpen Minds</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Join an intellectual community where writers publish their best work, and readers discover transformative ideas. Learn, grow, and connect with brilliant minds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="group">
                  Start Reading <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline">
                  Become an Author
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="font-poppins font-bold text-3xl sm:text-4xl text-foreground mb-4">
              Featured Articles
            </h2>
            <p className="text-muted-foreground text-lg">
              Discover our most engaging and insightful content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredArticles.map((article) => (
              <div key={article.id} className="animate-fade-in-up" style={{ animationDelay: `${featuredArticles.indexOf(article) * 100}ms` }}>
                <ArticleCard {...article} onClick={() => navigate(`/articles/${article.id}`)} />
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/articles">
              <Button variant="outline" size="lg">
                View All Articles <ArrowRight size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Author Recognition Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="font-poppins font-bold text-3xl sm:text-4xl text-foreground mb-4">
              Celebrated Authors
            </h2>
            <p className="text-muted-foreground text-lg">
              Meet the brilliant minds shaping our community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {topAuthors.map((author) => (
              <div key={author.id} className="animate-fade-in-up">
                <AuthorCard {...author} />
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/authors">
              <Button variant="outline" size="lg">
                Explore All Authors <ArrowRight size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Articles Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="font-poppins font-bold text-3xl sm:text-4xl text-foreground mb-4">
              Premium Content
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              Exclusive insights from our premium authors
            </p>
            <Badge variant="primary" size="md" className="justify-center">
              Premium membership required
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {premiumArticles.map((article) => (
              <div key={article.id} className="animate-fade-in-up">
                <ArticleCard {...article} onClick={() => navigate(`/articles/${article.id}`)} />
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-10 text-center border border-primary/20">
            <h3 className="font-poppins font-bold text-2xl text-foreground mb-2">
              Unlock Premium Content
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Access hundreds of premium articles, courses, and exclusive community events with a premium subscription.
            </p>
            <Link to="/signup">
              <Button size="lg" className="group">
                Upgrade to Premium <Zap size={20} className="group-hover:scale-110 transition" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Stats Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-r from-primary to-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="animate-fade-in-up">
              <div className="text-4xl sm:text-5xl font-poppins font-bold mb-2">45K+</div>
              <p className="text-white/80">Active Readers</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <div className="text-4xl sm:text-5xl font-poppins font-bold mb-2">8K+</div>
              <p className="text-white/80">Published Articles</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className="text-4xl sm:text-5xl font-poppins font-bold mb-2">2K+</div>
              <p className="text-white/80">Expert Authors</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup Section */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-10 sm:p-16 text-center border border-primary/20 animate-fade-in-up">
            <BookOpen className="w-16 h-16 mx-auto mb-6 text-primary" />
            
            <h2 className="font-poppins font-bold text-2xl sm:text-3xl text-foreground mb-4">
              Never Miss an Insight
            </h2>
            
            <p className="text-muted-foreground text-lg mb-8">
              Get weekly curated articles, author spotlights, and exclusive community updates delivered to your inbox.
            </p>

            <form onSubmit={handleNewsletterSignup} className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" size="lg">
                Subscribe
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 bg-gradient-to-r from-primary to-accent text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h2 className="font-poppins font-bold text-3xl sm:text-4xl mb-6">
                Ready to Join the Community?
              </h2>
              <p className="text-white/90 text-lg mb-8">
                Whether you're here to learn, share, or grow, Aminid has everything you need to thrive.
              </p>
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 border-0">
                  Get Started Free <ArrowRight size={20} />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
                <Users size={32} className="mb-4" />
                <h3 className="font-poppins font-bold mb-2">Connect</h3>
                <p className="text-white/80 text-sm">Build relationships with amazing writers and readers</p>
              </div>
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20">
                <BookOpen size={32} className="mb-4" />
                <h3 className="font-poppins font-bold mb-2">Learn</h3>
                <p className="text-white/80 text-sm">Access premium courses and expert knowledge</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
