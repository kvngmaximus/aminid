import { Link } from "react-router-dom";
import { Clock, Users, Star } from "lucide-react";
import Button from "./Button";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  author: string;
  authorImage: string;
  price: number;
  image: string;
  rating?: number;
  students: number;
  duration?: number;
  level?: "Beginner" | "Intermediate" | "Advanced";
  isPremium?: boolean;
}

export default function CourseCard({
  id,
  title,
  description,
  author,
  authorImage,
  price,
  image,
  rating,
  students,
  duration,
  level,
  isPremium = true,
}: CourseCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div className="relative overflow-hidden h-48">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {level && (
          <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">
            {level}
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="font-poppins font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition">
          {title}
        </h3>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
          <img
            src={authorImage}
            alt={author}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">{author}</p>
          </div>
          {typeof rating === "number" && (
            <div className="flex items-center gap-1 text-accent">
              <Star size={16} fill="currentColor" />
              <span className="text-sm font-semibold">{rating}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-6">
          {typeof duration === "number" && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{duration} hours</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{students.toLocaleString()} enrolled</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-2xl font-poppins font-bold text-primary">
            ₦{Number(price || 0).toLocaleString()}
          </div>
          <Link to={`/courses/${id}`} className="flex-1">
            <Button size="md" className="w-full">
              Enroll Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
