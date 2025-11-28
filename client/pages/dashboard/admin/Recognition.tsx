import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Award, Settings, LogOut } from "lucide-react";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabase";

type Bulletin = { id: string; title: string; created_at: string };

export default function AdminRecognition() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const session = s.session;
      if (!session) { navigate("/login"); return; }
      const { data: me } = await supabase
        .from("profiles").select("user_type,status").eq("id", session.user.id).single();
      if (!me || me.status !== "active" || me.user_type !== "admin") { navigate("/"); return; }
      await loadBulletins();
      // Listen to recognitions only (end-to-end)
      const chRecognitions = supabase
        .channel("admin-recognitions")
        .on("postgres_changes", { event: "*", schema: "public", table: "recognitions" }, loadBulletins)
        .subscribe();
      return () => { supabase.removeChannel(chRecognitions); };
    })();
  }, [navigate]);

  const loadBulletins = async () => {
    const { data: recData } = await supabase
      .from("recognitions")
      .select("id,title,created_at")
      .eq("type", "bulletin")
      .order("created_at", { ascending: false })
      .limit(20);
    setBulletins((recData as Bulletin[]) || []);
  };

  const publish = async () => {
    if (!title.trim() || !content.trim()) return;
    const { data: s } = await supabase.auth.getSession();
    const userId = s.session?.user.id;
    if (!userId) return;
    // Publish to recognitions table
    const { error: recInsertErr } = await supabase.from("recognitions").insert({
      author_id: userId,
      title,
      content,
      type: "bulletin",
      status: "published",
    });
    if (recInsertErr) console.error(recInsertErr);
    setTitle("");
    setContent("");
    await loadBulletins();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 bg-white border-b border-border">
        <div className="max-w-7xl mx.auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin") }>{"\u2190"} Back</Button>
            <Link to="/" className="font-poppins font-bold text-foreground">Aminid</Link>
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-semibold">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/settings") }>
              <Settings size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-poppins font-bold text-3xl text-foreground">Recognition System</h1>
          </div>

          <div className="bg-white rounded-xl border border-border p-6 mb-8">
            <h2 className="font-poppins font-semibold text-xl mb-4">Publish Monthly Bulletin</h2>
            <div className="grid gap-3">
              <input
                className="border border-border rounded px-3 py-2"
                placeholder="Bulletin title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="border border-border rounded px-3 py-2 h-32"
                placeholder="Bulletin content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div>
                <Button onClick={publish} size="sm">Publish</Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">Recent Bulletins</div>
            <div className="divide-y divide-border">
              {bulletins.length === 0 ? (
                <div className="p-6 text-muted-foreground">No bulletins yet</div>
              ) : bulletins.map(b => (
                <div key={b.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-foreground">{b.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <Link to={`/articles/${b.id}`} className="text-primary text-sm">View</Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
