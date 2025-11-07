import { Link } from "react-router-dom";
import { Mail, Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="font-poppins font-bold text-lg text-white">A</span>
              </div>
              <span className="font-poppins font-bold text-xl">Aminid</span>
            </div>
            <p className="text-white/80 text-sm">
              Where minds sharpen minds. A community for writers, readers, and lifelong learners.
            </p>
          </div>

          <div>
            <h3 className="font-poppins font-bold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-white/80 hover:text-white transition">Home</Link></li>
              <li><Link to="/articles" className="text-white/80 hover:text-white transition">Articles</Link></li>
              <li><Link to="/authors" className="text-white/80 hover:text-white transition">Authors</Link></li>
              <li><Link to="/courses" className="text-white/80 hover:text-white transition">Courses</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-poppins font-bold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-white/80 hover:text-white transition">About</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition">Blog</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition">Careers</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-poppins font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-white/80 hover:text-white transition">Privacy</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition">Terms</a></li>
              <li><a href="#" className="text-white/80 hover:text-white transition">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/80 text-sm">
              © {currentYear} Aminid. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="text-white/80 hover:text-white transition">
                <Mail size={20} />
              </a>
              <a href="#" className="text-white/80 hover:text-white transition">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-white/80 hover:text-white transition">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-white/80 hover:text-white transition">
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
