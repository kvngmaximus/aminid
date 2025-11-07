import { Link } from "react-router-dom";
import { Star, Award } from "lucide-react";

interface AuthorCardProps {
  id: string;
  name: string;
  bio: string;
  image: string;
  followers: number;
  isPremium?: boolean;
  badge?: "month" | "year" | "featured";
}

export default function AuthorCard({
  id,
  name,
  bio,
  image,
  followers,
  isPremium = false,
  badge,
}: AuthorCardProps) {
  const getBadge = () => {
    if (badge === "month") {
      return (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-accent text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Star size={12} fill="white" /> Author of Month
        </div>
      );
    }
    if (badge === "year") {
      return (
        <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Award size={12} fill="white" /> Author of Year
        </div>
      );
    }
    return null;
  };

  return (
    <Link to={`/authors/${id}`}>
      <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group relative p-6 text-center">
        {badge && getBadge()}
        
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={image}
            alt={name}
            className="w-full h-full rounded-full object-cover border-4 border-accent group-hover:border-primary transition-colors"
          />
        </div>

        <h3 className="font-poppins font-bold text-lg text-foreground mb-1 group-hover:text-primary transition">
          {name}
        </h3>

        {isPremium && (
          <div className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-semibold mb-3">
            Premium Author
          </div>
        )}

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 h-10">
          {bio}
        </p>

        <div className="text-center text-sm font-semibold text-primary">
          {followers.toLocaleString()} followers
        </div>

        <button className="w-full mt-4 py-2 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-lg hover:shadow-lg transition-shadow text-sm">
          Follow
        </button>
      </div>
    </Link>
  );
}
