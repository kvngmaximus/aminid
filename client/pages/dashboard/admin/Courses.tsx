import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpenCheck, Settings, LogOut, Eye, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabase";

type Row = { id: string; title: string; author_id: string; created_at: string; status: string };

export default function AdminCourses() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [authors, setAuthors] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) { navigate("/login"); return; }
      const { data: me } = await supabase
        .from("profiles")
        .select("user_type,status")
        .eq("id", session.user.id)
        .single();
      if (!me || me.status !== "active" || me.user_type !== "admin") { navigate("/"); return; }
      await load();
      const ch = supabase
        .channel("admin-courses")
        .on("postgres_changes", { event: "*", schema: "public", table: "courses" }, load)
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    })();
  }, [navigate]);

  const load = async () => {
    const { data: cRows } = await supabase
      .from("courses")
      .select("id,title,author_id,created_at,status")
      .order("created_at", { ascending: false })
      .limit(200);
    const courseRows = (cRows as Row[]) || [];
    setRows(courseRows);
    const ids = Array.from(new Set(courseRows.map(r => r.author_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,name").in("id", ids);
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p.name || p.id; });
      setAuthors(map);
    }
  };

  const approve = async (id: string) => {
    await supabase.from("courses").update({ status: "published" }).eq("id", id);
  };
  const reject = async (id: string) => {
    await supabase.from("courses").update({ status: "rejected" }).eq("id", id);
  };
  const pause = async (id: string) => {
    await supabase.from("courses").update({ status: "paused" }).eq("id", id);
  };
  const resume = async (id: string) => {
    await supabase.from("courses").update({ status: "published" }).eq("id", id);
  };
  const remove = async (id: string) => {
    await supabase.from("courses").delete().eq("id", id);
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin")}>{"\u2190"} Back</Button>
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
            <h1 className="font-poppins font-bold text-3xl text-foreground">Course Moderation</h1>
          </div>

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">All Courses</div>
            <div className="divide-y divide-border">
              {rows.length === 0 ? (
                <div className="p-6 text-muted-foreground">No courses found</div>
              ) : rows.map(r => (
                <div key={r.id} className="p-6 flex items-center justify-between hover:bg-muted/50 transition">
                  <div className="flex items-center gap-3">
                    <BookOpenCheck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-foreground">{r.title}</div>
                      <div className="text-xs text-muted-foreground">by {authors[r.author_id] || r.author_id}</div>
                      <div className="text-xs mt-1">
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 font-semibold">{r.status || "unknown"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/courses/${r.id}`)} title="View"><Eye className="w-4 h-4" /></Button>
                    {r.status === "pending_review" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => approve(r.id)}>Approve</Button>
                        <Button variant="outline" size="sm" onClick={() => reject(r.id)}>Reject</Button>
                      </>
                    )}
                    {r.status === "published" && (
                      <Button variant="outline" size="sm" onClick={() => pause(r.id)}><PauseCircle className="w-4 h-4 mr-1" />Pause</Button>
                    )}
                    {r.status === "paused" && (
                      <Button variant="outline" size="sm" onClick={() => resume(r.id)}><PlayCircle className="w-4 h-4 mr-1" />Resume</Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 mr-1" />Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
