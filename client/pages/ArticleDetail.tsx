import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import Navbar from "@/components/Navbar";
import Paywall from "@/components/Paywall";
import Footer from "@/components/Footer";
import Button from "@/components/Button";
import Textarea from "@/components/Textarea";
import { supabase } from "@/lib/supabase";
import { useSubscriptionStatus } from "@/hooks/use-subscription";
import { payWithFlutterwave } from "@/lib/payments";

interface ContentBlock {
  id: string;
  type: "paragraph" | "image";
  content: string;
}

interface FullArticle {
  id: string;
  title: string;
  author: string;
  authorImage: string;
  authorBio?: string;
  followers?: number;
  image: string;
  contentBlocks?: ContentBlock[];
  content?: string;
  category?: string;
  readTime?: number;
  likes?: number;
  isArticleOfMonth?: boolean;
  isPremium?: boolean;
  publishedAt?: string;
}

export default function ArticleDetail() {
  const { id = "" } = useParams();
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState<boolean>(false);
  const [comments, setComments] = useState<Array<{ id: string; content: string; user_id: string; created_at: string; user_name?: string; user_avatar?: string }>>([]);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [article, setArticle] = useState<FullArticle | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const readingSecondsRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const { active: hasSubscription, loading: subLoading, userId } = useSubscriptionStatus();

  useEffect(() => {
    const loadArticle = async () => {
      if (!id) return;
      setLoading(true);
      setError("");
      const { data: sessionRes } = await supabase.auth.getSession();
      const uid = sessionRes.session?.user?.id ?? null;
      setIsAuthed(!!uid);
      if (uid) {
        const { data: me } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", uid)
          .maybeSingle();
        setIsAdmin((me as any)?.user_type === "admin");
      } else {
        setIsAdmin(false);
      }
      const { data, error } = await supabase
        .from("articles")
        .select("id,title,excerpt,cover_url,premium,status,author_id,category,content,created_at")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("Article not found");
        setLoading(false);
        return;
      }

      let authorName = "Unknown Author";
      let authorImage = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";
      let authorBio = "";
      if (data.author_id) {
        setAuthorId(data.author_id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("name,avatar_url,bio")
          .eq("id", data.author_id)
          .maybeSingle();
        if (profile) {
          authorName = profile.name || authorName;
          authorImage = profile.avatar_url || authorImage;
          authorBio = profile.bio || authorBio;
        }
        if (uid) {
          const { data: follow } = await supabase
            .from("author_follows")
            .select("id")
            .eq("author_id", data.author_id)
            .eq("follower_id", uid)
            .maybeSingle();
          setIsFollowingAuthor(!!follow);
        }
      }

      let contentBlocks: ContentBlock[] | undefined;
      let contentText: string | undefined;
      try {
        if (data.content) {
          const parsed = JSON.parse(data.content);
          if (Array.isArray(parsed)) contentBlocks = parsed as ContentBlock[];
          else if (typeof parsed === "string") contentText = parsed;
        }
      } catch {
        contentText = data.content || data.excerpt || "";
      }

      const words = (contentText || JSON.stringify(contentBlocks || [])).split(/\s+/).length;
      const readTime = Math.max(3, Math.round(words / 200));

      const { count: likeCount } = await supabase
        .from("article_likes")
        .select("id", { count: "exact", head: true })
        .eq("article_id", id);
      if (uid) {
        const { data: myLike } = await supabase
          .from("article_likes")
          .select("id")
          .eq("article_id", id)
          .eq("user_id", uid)
          .maybeSingle();
        setLiked(!!myLike);
        const { data: myBookmark } = await supabase
          .from("article_bookmarks")
          .select("id")
          .eq("article_id", id)
          .eq("user_id", uid)
          .maybeSingle();
        setBookmarked(!!myBookmark);
      }

      const { data: commentsRows } = await supabase
        .from("article_comments")
        .select("id,content,user_id,created_at")
        .eq("article_id", id)
        .order("created_at", { ascending: false });
      let enrichedComments: Array<{ id: string; content: string; user_id: string; created_at: string; user_name?: string; user_avatar?: string }> = (commentsRows || []) as any;
      const cUserIds = Array.from(new Set((enrichedComments || []).map((c: any) => c.user_id).filter(Boolean)));
      if (cUserIds.length) {
        const { data: cUsers } = await supabase
          .from("profiles")
          .select("id,name,avatar_url")
          .in("id", cUserIds);
        const map: Record<string, { name?: string; avatar_url?: string | null }> = {};
        (cUsers || []).forEach((u: any) => (map[u.id] = { name: u.name, avatar_url: u.avatar_url }));
        enrichedComments = enrichedComments.map((c: any) => ({
          ...c,
          user_name: map[c.user_id]?.name,
          user_avatar: map[c.user_id]?.avatar_url ?? undefined,
        }));
      }
      setComments(enrichedComments);

      setArticle({
        id: data.id,
        title: data.title,
        author: authorName,
        authorImage,
        authorBio,
        followers: undefined,
        image:
          data.cover_url ||
          "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&h=600&fit=crop",
        contentBlocks,
        content: contentText,
        category: data.category || undefined,
        readTime,
        likes: likeCount ?? 0,
        isArticleOfMonth: false,
        isPremium: !!data.premium,
        publishedAt: (data as any).created_at || undefined,
      });
      // Record a view; if RPC isn't available, fall back to direct table update
      try {
        await supabase.rpc("record_article_view", { p_article_id: id, p_views: 1 });
      } catch (e) {
        const today = new Date().toISOString().slice(0, 10);
        const { data: existing } = await supabase
          .from("article_views_daily")
          .select("views")
          .eq("article_id", id)
          .eq("view_date", today)
          .maybeSingle();
        if (existing) {
          await supabase
            .from("article_views_daily")
            .update({ views: (existing as any).views + 1 })
            .eq("article_id", id)
            .eq("view_date", today);
        } else {
          await supabase
            .from("article_views_daily")
            .insert({ article_id: id, view_date: today, views: 1 });
        }
      }
      setLoading(false);
    };

    loadArticle();
  }, [id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: sessionRes } = await supabase.auth.getSession();
    const uid = sessionRes.session?.user?.id;
    if (!uid) {
      alert("Please sign in to post comments.");
      return;
    }
    if (!comment.trim()) return;
    const { data, error } = await supabase
      .from("article_comments")
      .insert({ article_id: id, user_id: uid, content: comment.trim() })
      .select("id,content,user_id,created_at")
      .maybeSingle();
    if (error) {
      alert(error.message);
      return;
    }
    setComments([{ ...data!, user_name: undefined, user_avatar: undefined }, ...comments]);
    setComment("");
  };

  // Reading time tracking: accumulate seconds while tab is visible and persist on unmount
  useEffect(() => {
    const start = () => {
      if (timerRef.current != null) return;
      timerRef.current = window.setInterval(() => {
        readingSecondsRef.current += 5;
      }, 5000);
    };
    const stop = () => {
      if (timerRef.current != null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
      void commitRead();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function commitRead() {
    try {
      const seconds = readingSecondsRef.current;
      if (!seconds || seconds < 5) return;
      const { data: sessionRes } = await supabase.auth.getSession();
      const uid = sessionRes.session?.user?.id;
      if (!uid) return;

      // Try RPC first; fall back to direct upsert/update
      try {
        await supabase.rpc("record_article_read", { p_article_id: id, p_seconds: Math.max(5, seconds) });
        return;
      } catch {}

      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase
        .from("article_reads_daily")
        .select("seconds,sessions")
        .eq("article_id", id)
        .eq("user_id", uid)
        .eq("read_date", today)
        .maybeSingle();
      if (existing) {
        const prev = existing as any;
        await supabase
          .from("article_reads_daily")
          .update({ seconds: (prev.seconds || 0) + seconds, sessions: (prev.sessions || 0) + 1 })
          .eq("article_id", id)
          .eq("user_id", uid)
          .eq("read_date", today);
      } else {
        await supabase
          .from("article_reads_daily")
          .insert({ article_id: id, user_id: uid, read_date: today, seconds: seconds, sessions: 1 });
      }
    } catch {}
  }

  const toggleLike = async () => {
    const { data: sessionRes } = await supabase.auth.getSession();
    const uid = sessionRes.session?.user?.id;
    if (!uid) {
      alert("Please sign in to like articles.");
      return;
    }
    try {
      if (liked) {
        await supabase.from("article_likes").delete().eq("article_id", id).eq("user_id", uid);
        setLiked(false);
      } else {
        await supabase.from("article_likes").insert({ article_id: id, user_id: uid });
        setLiked(true);
      }
    } catch (e: any) {
      alert(e.message ?? "Failed to update like");
    }
  };

  const toggleBookmark = async () => {
    const { data: sessionRes } = await supabase.auth.getSession();
    const uid = sessionRes.session?.user?.id;
    if (!uid) {
      alert("Please sign in to save articles.");
      return;
    }
    try {
      if (bookmarked) {
        await supabase.from("article_bookmarks").delete().eq("article_id", id).eq("user_id", uid);
        setBookmarked(false);
      } else {
        await supabase.from("article_bookmarks").insert({ article_id: id, user_id: uid });
        setBookmarked(true);
      }
    } catch (e: any) {
      alert(e.message ?? "Failed to update bookmark");
    }
  };

  const toggleFollowAuthor = async () => {
    const { data: sessionRes } = await supabase.auth.getSession();
    const uid = sessionRes.session?.user?.id;
    if (!uid || !authorId) {
      alert("Please sign in to follow authors.");
      return;
    }
    try {
      if (isFollowingAuthor) {
        await supabase
          .from("author_follows")
          .delete()
          .eq("author_id", authorId)
          .eq("follower_id", uid);
        setIsFollowingAuthor(false);
      } else {
        await supabase.from("author_follows").insert({ author_id: authorId, follower_id: uid });
        setIsFollowingAuthor(true);
      }
    } catch (e: any) {
      alert(e.message ?? "Failed to update follow");
    }
  };

  // Gating helpers:
  // - If unauthenticated, gate content (sign-in overlay)
  // - If authenticated and article is premium but no active subscription, gate content (subscribe overlay)
  const isPremium = !!article?.isPremium;
  const gatedByAuth = !isAuthed;
  const gatedBySubscription = !!isAuthed && isPremium && !subLoading && !hasSubscription && !isAdmin;
  const isGated = gatedByAuth || gatedBySubscription;
  const blocks = article?.contentBlocks ?? [];
  const paragraphs = article?.content ? article.content.split("\n\n") : [];
  const visibleBlocksCount = isGated ? Math.ceil(blocks.length / 2) : blocks.length;
  const visibleBlocks = blocks.slice(0, visibleBlocksCount);
  const gatedBlocks = blocks.slice(visibleBlocksCount);
  const visibleParasCount = isGated ? Math.ceil(paragraphs.length / 2) : paragraphs.length;
  const visibleParas = paragraphs.slice(0, visibleParasCount);
  const gatedParas = paragraphs.slice(visibleParasCount);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 relative">
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
          <Link to="/articles" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition" />
            Back to Articles
          </Link>

          {error && (
            <div className="text-red-600 mb-6">{error}</div>
          )}

          {loading && (
            <div className="h-10 w-48 bg-muted animate-pulse rounded mb-6" />
          )}

          {article?.isArticleOfMonth && (
            <div className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 rounded-lg inline-block mb-6 font-semibold text-sm">
              🏆 Article of the Month
            </div>
          )}

          <h1 className="font-poppins font-bold text-4xl sm:text-5xl text-foreground mb-4 leading-tight">
            {article?.title || ""}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-8 border-b border-border">
            <div className="flex items-center gap-4">
              <img src={article?.authorImage || ""} alt={article?.author || "Author"} className="w-14 h-14 rounded-full object-cover" />
              <div>
                <h3 className="font-poppins font-bold text-foreground">{article?.author || ""}</h3>
                <p className="text-sm text-muted-foreground">{article?.authorBio || ""}</p>
              </div>
            </div>
            <Button size="lg" variant={isFollowingAuthor ? "outline" : "primary"} onClick={toggleFollowAuthor}>
              {isFollowingAuthor ? "Following" : "Follow Author"}
            </Button>
          </div>

          {article?.image && (
            <img src={article.image} alt={article.title} className="w-full h-96 object-cover rounded-2xl mb-12" />
          )}

          <div className="prose prose-lg max-w-none mb-12">
            {blocks.length > 0 ? (
              <>
                {visibleBlocks.map((block: ContentBlock) => (
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
                ))}
                {isGated && gatedBlocks.length > 0 && (
                  <div className="relative">
                    <div className="blur-sm select-none pointer-events-none">
                      {gatedBlocks.map((block: ContentBlock) => (
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
                      ))}
                    </div>
                    {gatedByAuth ? (
                      <div className="absolute inset-0 z-40 flex items-center justify-center">
                        <div className="text-center max-w-md p-6 bg-white rounded-xl border border-border shadow">
                          <h3 className="font-poppins font-bold text-xl text-foreground mb-2">Sign in to continue reading</h3>
                          <p className="text-muted-foreground mb-4">Create an account or sign in to unlock the full article.</p>
                          <div className="flex gap-3 justify-center">
                            <a href="/login" className="px-4 py-2 rounded-lg bg-primary text-white">Sign In</a>
                            <a href="/signup" className="px-4 py-2 rounded-lg bg-muted text-foreground">Sign Up</a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      gatedBySubscription && <Paywall purpose="reader_subscription" amountNgn={2500} />
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {visibleParas.map((para: string, idx: number) => (
                  <p key={idx} className="text-foreground text-lg leading-relaxed mb-6">
                    {para}
                  </p>
                ))}
                {isGated && gatedParas.length > 0 && (
                  <div className="relative">
                    <div className="blur-sm select-none pointer-events-none">
                      {gatedParas.map((para: string, idx: number) => (
                        <p key={`gated-${idx}`} className="text-foreground text-lg leading-relaxed mb-6">
                          {para}
                        </p>
                      ))}
                    </div>
                    {gatedByAuth ? (
                      <div className="absolute inset-0 z-40 flex items-center justify-center">
                        <div className="text-center max-w-md p-6 bg-white rounded-xl border border-border shadow">
                          <h3 className="font-poppins font-bold text-xl text-foreground mb-2">Sign in to continue reading</h3>
                          <p className="text-muted-foreground mb-4">Create an account or sign in to unlock the full article.</p>
                          <div className="flex gap-3 justify-center">
                            <a href="/login" className="px-4 py-2 rounded-lg bg-primary text-white">Sign In</a>
                            <a href="/signup" className="px-4 py-2 rounded-lg bg-muted text-foreground">Sign Up</a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      gatedBySubscription && <Paywall purpose="reader_subscription" amountNgn={2500} />
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-4 mb-12 pb-12 border-b border-border">
            <Button
              variant={liked ? "primary" : "outline"}
              onClick={toggleLike}
              className="group"
            >
              <Heart size={20} fill={liked ? "currentColor" : "none"} className={liked ? "" : "group-hover:fill-current"} />
              {(article?.likes || 0) + (liked ? 1 : 0)} Likes
            </Button>
            <Button variant="outline">
              <MessageCircle size={20} />
              {comments.length} Comments
            </Button>
            <Button variant="outline">
              <Share2 size={20} />
              Share
            </Button>
            <Button
              variant={bookmarked ? "primary" : "outline"}
              onClick={toggleBookmark}
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
              {comments.map((c) => (
                <div key={c.id} className="bg-white rounded-xl p-6 border border-border">
                  <div className="flex gap-4">
                    <img src={c.user_avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop"} alt="User" className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{c.user_name || "Reader"}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{c.content}</p>
                      <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
              {!comments.length && (
                <div className="bg-white rounded-xl p-6 border border-border text-center text-muted-foreground">No comments yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Overlay moved into content section to only block the blurred part */}
      </div>

      <Footer />
    </div>
  );
}
