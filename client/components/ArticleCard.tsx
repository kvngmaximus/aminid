import { Clock, Heart, Star } from "lucide-react";

interface ArticleCardProps {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  authorImage: string;
  readTime: number;
  likes: number;
  image: string;
  isPremium?: boolean;
  isFeatured?: boolean;
  category?: string;
  onClick?: () => void;
  contentBlocks?: Array<{ type: "paragraph" | "image"; content: string }>;
}

export default function ArticleCard({
  id,
  title,
  excerpt,
  author,
  authorImage,
  readTime,
  likes,
  image,
  isPremium = false,
  isFeatured = false,
  category,
  onClick,
  contentBlocks,
}: ArticleCardProps) {
  // Get first inline image if contentBlocks exists
  const firstInlineImage = contentBlocks?.find(block => block.type === "image")?.content;
  const displayImage = firstInlineImage || image;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick?.();
      }}
    >
      <div className="relative overflow-hidden h-48 sm:h-56">
        <img
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="absolute top-4 right-4 flex gap-2">
          {isFeatured && (
            <div className="bg-gradient-to-r from-primary to-accent text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Star size={12} fill="white" /> Featured
            </div>
          )}
          {isPremium && (
            <div className="bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">
              Premium
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {category && (
          <p className="text-accent text-xs font-semibold uppercase tracking-wide mb-2">
            {category}
          </p>
        )}

        <h3 className="font-poppins font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition">
          {title}
        </h3>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {excerpt}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img
              src={authorImage}
              alt={author}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="font-medium text-foreground">{author}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{readTime} min read</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart size={14} />
            <span>{likes} likes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
