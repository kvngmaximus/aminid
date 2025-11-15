import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfo(null);
    const newErrors: typeof errors = {};

    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setInfo(error.message);
      return;
    }

    const user = data.user;
    if (!user) {
      setInfo("No user returned");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type,status")
      .eq("id", user.id)
      .single();

    const status = profile?.status ?? "active";
    if (status !== "active") {
      setInfo(`Account ${status}. Please contact support.`);
      return;
    }

    const type = (profile?.user_type as "reader" | "author" | "admin") ?? "reader";
    if (type === "author") navigate("/dashboard/author");
    else if (type === "admin") navigate("/dashboard/admin");
    else navigate("/dashboard/reader");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-poppins font-bold text-3xl text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your Aminid account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
            </div>

            <Button type="submit" size="lg" className="w-full group" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"} <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
            </Button>
          </form>

          {/* Developer Demo Accounts */}
          <div className="mt-8">
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-poppins font-bold text-lg text-foreground mb-2">Developer Demo Accounts</h3>
              <p className="text-sm text-muted-foreground mb-4">Use these credentials in development to sign in quickly.</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Reader</p>
                    <p className="text-xs text-muted-foreground">reader@aminid.com — password: aminid</p>
                  </div>
                  <Button variant="secondary" size="md" onClick={() => { setEmail("reader@aminid.com"); setPassword("aminid"); }}>Fill</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Author</p>
                    <p className="text-xs text-muted-foreground">author@aminid.com — password: aminid</p>
                  </div>
                  <Button variant="secondary" size="md" onClick={() => { setEmail("author@aminid.com"); setPassword("aminid"); }}>Fill</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Admin</p>
                    <p className="text-xs text-muted-foreground">admin@aminid.com — password: aminid</p>
                  </div>
                  <Button variant="secondary" size="md" onClick={() => { setEmail("admin@aminid.com"); setPassword("aminid"); }}>Fill</Button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>

          <div className="mt-8 pt-8 border-t border-border">
            <button className="w-full py-3 border border-border rounded-lg hover:bg-muted transition font-medium">
              Continue with Google
            </button>
          </div>

          {info && (
            <p className="text-center text-muted-foreground mt-4">{info}</p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
