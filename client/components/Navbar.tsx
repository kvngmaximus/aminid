import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-poppins font-bold text-sm">A</span>
            </div>
            <span className="font-poppins font-bold text-lg text-primary hidden sm:inline">Aminid</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-primary transition">Home</Link>
            <Link to="/articles" className="text-foreground hover:text-primary transition">Articles</Link>
            <Link to="/authors" className="text-foreground hover:text-primary transition">Authors</Link>
            <Link to="/courses" className="text-foreground hover:text-primary transition">Courses</Link>
            <Link to="/my-courses" className="text-foreground hover:text-primary transition">My Courses</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="px-6 py-2 text-primary font-medium hover:bg-primary/5 rounded-lg transition"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-lg hover:shadow-lg transition"
            >
              Join Now
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-3 animate-fade-in-down">
            <Link to="/" className="block py-2 text-foreground hover:text-primary">Home</Link>
            <Link to="/articles" className="block py-2 text-foreground hover:text-primary">Articles</Link>
            <Link to="/authors" className="block py-2 text-foreground hover:text-primary">Authors</Link>
            <Link to="/courses" className="block py-2 text-foreground hover:text-primary">Courses</Link>
            <div className="flex gap-3 pt-3 border-t border-border">
              <Link to="/login" className="flex-1 py-2 text-center text-primary font-medium">Login</Link>
              <Link to="/signup" className="flex-1 py-2 text-center bg-gradient-btn text-white rounded-lg">Join</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
