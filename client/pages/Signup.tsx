import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, PenTool } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabase";

type Role = "reader" | "author";

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("reader");
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo(null);
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { role, name: formData.name },
      },
    });
    setLoading(false);

    if (error) {
      setInfo(error.message);
      return;
    }

    // If email confirmations are enabled, session may not be present.
    if (!data.session) {
      setInfo("Signup successful. Please check your email to confirm.");
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });
      return;
    }

    // Session exists → route by profile user_type
    const user = data.user;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .single();
      const userType = (profile?.user_type as Role | "admin") ?? role;
      if (userType === "author") navigate("/dashboard/author");
      else if (userType === "admin") navigate("/dashboard/admin");
      else navigate("/dashboard/reader");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="font-poppins font-bold text-3xl text-foreground mb-2">Join Aminid</h1>
            <p className="text-muted-foreground">Select your role to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {[
              { id: "reader" as const, icon: BookOpen, label: "I'm a Reader", desc: "Discover and learn" },
              { id: "author" as const, icon: PenTool, label: "I'm an Author", desc: "Share my work" },
            ].map(({ id, icon: Icon, label, desc }) => (
              <button
                key={id}
                onClick={() => setRole(id)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  role === id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Icon className={`w-8 h-8 mb-3 ${role === id ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-poppins font-bold text-foreground">{label}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              error={errors.name}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              error={errors.confirmPassword}
            />

            <label className="flex items-center gap-2">
              <input type="checkbox" required className="rounded border-border" />
              <span className="text-sm text-muted-foreground">
                I agree to the <a href="#" className="text-primary hover:underline">Terms & Conditions</a>
              </span>
            </label>

            <Button type="submit" size="lg" className="w-full group" disabled={loading}>
              {loading ? "Creating..." : "Create Account"} <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
            </Button>
          </form>

          {info && (
            <p className="text-center text-muted-foreground mt-4">{info}</p>
          )}

          <p className="text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
