import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Textarea from "@/components/Textarea";

interface ContentBlock {
  id: string;
  type: "paragraph" | "image";
  content: string;
}

const articleData: Record<string, any> = {
  "1": {
    id: "1",
    title: "The Art of Deep Work in a Distracted World",
    author: "Sarah Amin",
    authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    authorBio: "Productivity expert and bestselling author",
    followers: 15420,
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=600&fit=crop",
    contentBlocks: [
      {
        id: "1",
        type: "paragraph",
        content: "Deep work is the ability to focus without distraction on cognitively demanding tasks. In today's world, this skill has become increasingly rare and valuable."
      },
      {
        id: "2",
        type: "image",
        content: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop"
      },
      {
        id: "3",
        type: "paragraph",
        content: "The challenge we face is that our environment has transformed in ways that make deep work harder than ever. Our devices are constantly pinging with notifications, our email inboxes are overflowing, and social media is engineered to capture and hold our attention."
      },
      {
        id: "4",
        type: "image",
        content: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop"
      },
      {
        id: "5",
        type: "paragraph",
        content: "Yet the ability to do deep work is what separates the exceptional performers from the merely competent. Whether you're a writer, programmer, designer, or scholar, your ability to concentrate is directly tied to the quality of your output."
      },
      {
        id: "6",
        type: "image",
        content: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop"
      },
      {
        id: "7",
        type: "paragraph",
        content: "This article explores practical strategies for reclaiming your focus and cultivating deep work in a distracted world. Through a combination of environmental design, behavioral habits, and mindset shifts, you can create the conditions for your best work."
      }
    ],
    category: "Productivity",
    readTime: 8,
    likes: 234,
    isArticleOfMonth: false,
    isPremium: false,
    publishedAt: "2024-01-15",
  },
};

export default function ArticleDetail() {
  const { id = "1" } = useParams();
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const article = articleData[id] || articleData["1"];

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Comment submitted: "${comment}"`);
    setComment("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link to="/articles" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition" />
            Back to Articles
          </Link>

          {article.isArticleOfMonth && (
            <div className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-lg inline-block mb-6 font-semibold text-sm">
              🏆 Article of the Month
            </div>
          )}

          <h1 className="font-poppins font-bold text-4xl sm:text-5xl text-foreground mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-8 border-b border-border">
            <div className="flex items-center gap-4">
              <img src={article.authorImage} alt={article.author} className="w-14 h-14 rounded-full object-cover" />
              <div>
                <h3 className="font-poppins font-bold text-foreground">{article.author}</h3>
                <p className="text-sm text-muted-foreground">{article.authorBio}</p>
              </div>
            </div>
            <Button size="lg" variant="primary">
              Follow Author
            </Button>
          </div>

          <img src={article.image} alt={article.title} className="w-full h-96 object-cover rounded-2xl mb-12" />

          <div className="prose prose-lg max-w-none mb-12">
            {article.contentBlocks && article.contentBlocks.length > 0 ? (
              article.contentBlocks.map((block: ContentBlock) => (
                <div key={block.id}>
                  {block.type === "paragraph" && (
                    <p className="text-foreground text-lg leading-relaxed mb-6">
                      {block.content}
                    </p>
                  )}
                  {block.type === "image" && block.content && (
                    <div className="my-8">
                      <img 
                        src={block.content} 
                        alt="Article content" 
                        className="w-full h-96 object-cover rounded-2xl"
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              article.content && article.content.split("\n\n").map((para: string, idx: number) => (
                <p key={idx} className="text-foreground text-lg leading-relaxed mb-6">
                  {para}
                </p>
              ))
            )}
          </div>

          <div className="flex flex-wrap gap-4 mb-12 pb-12 border-b border-border">
            <Button
              variant={liked ? "primary" : "outline"}
              onClick={() => setLiked(!liked)}
              className="group"
            >
              <Heart size={20} fill={liked ? "currentColor" : "none"} className={liked ? "" : "group-hover:fill-current"} />
              {article.likes + (liked ? 1 : 0)} Likes
            </Button>
            <Button variant="outline">
              <MessageCircle size={20} />
              12 Comments
            </Button>
            <Button variant="outline">
              <Share2 size={20} />
              Share
            </Button>
            <Button
              variant={bookmarked ? "primary" : "outline"}
              onClick={() => setBookmarked(!bookmarked)}
            >
              <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
              {bookmarked ? "Saved" : "Save"}
            </Button>
          </div>

          <div className="mb-12">
            <h2 className="font-poppins font-bold text-2xl text-foreground mb-6">Comments</h2>
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <Textarea
                placeholder="Share your thoughts..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="mb-4"
              />
              <Button type="submit" size="lg">
                Post Comment
              </Button>
            </form>

            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-border">
                  <div className="flex gap-4">
                    <img src={`https://images.unsplash.com/photo-150${i}003211169-0a1dd7228f2d?w=50&h=50&fit=crop`} alt="User" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">Reader {i}</h4>
                      <p className="text-sm text-muted-foreground mb-2">Great article! Really insightful perspective on deep work.</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
