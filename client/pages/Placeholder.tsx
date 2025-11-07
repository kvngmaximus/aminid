import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Button from "@/components/Button";

interface PlaceholderProps {
  title: string;
  description: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-8 opacity-50">
            <span className="text-4xl">🚀</span>
          </div>

          <h1 className="font-poppins font-bold text-4xl text-foreground mb-4">
            {title}
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            {description}
          </p>

          <p className="text-muted-foreground mb-8">
            This page is being built. Check back soon or continue exploring Aminid!
          </p>

          <Link to="/">
            <Button size="lg" className="group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
