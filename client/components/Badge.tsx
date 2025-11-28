import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "accent" | "success" | "warning" | "destructive";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Badge({ children, variant = "primary", size = "md", className = "" }: BadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  const variantClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
    success: "bg-green-500/10 text-green-700",
    warning: "bg-yellow-500/10 text-yellow-700",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <span className={`inline-block font-medium rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
