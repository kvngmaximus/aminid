import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Settings, LogOut, ShieldCheck } from "lucide-react";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabase";

type ProfileRow = { id: string; name: string | null; user_type: string; status: string };

export default function AdminUsers() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(false);

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
      if (!me || me.status !== "active" || me.user_type !== "admin") {
        navigate("/");
        return;
      }
      await loadUsers();
      const ch = supabase
        .channel("admin-users")
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadUsers)
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    })();
  }, [navigate]);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id,name,user_type,status")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as ProfileRow[]) || []);
    setLoading(false);
  };

  const filtered = rows.filter(r => (r.name ?? r.id).toLowerCase().includes(query.toLowerCase()));

  const updateRole = async (id: string, role: string) => {
    await supabase.from("profiles").update({ user_type: role }).eq("id", id);
  };
  const updateStatus = async (id: string, status: string) => {
    await supabase.from("profiles").update({ status }).eq("id", id);
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
            <h1 className="font-poppins font-bold text-3xl text-foreground">User Management</h1>
            <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2">
              <Search size={16} className="text-muted-foreground" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search users"
                className="bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {loading && (<div className="p-6 text-muted-foreground">Loading…</div>)}
              {!loading && filtered.length === 0 && (<div className="p-6 text-muted-foreground">No users found</div>)}
              {!loading && filtered.map(u => (
                <div key={u.id} className="p-6 flex items-center justify-between hover:bg-muted/50 transition">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold text-foreground">{u.name ?? u.id}</div>
                      <div className="text-xs text-muted-foreground">{u.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={u.user_type}
                      onChange={e => updateRole(u.id, e.target.value)}
                      className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="reader">reader</option>
                      <option value="author">author</option>
                      <option value="admin">admin</option>
                    </select>
                    <select
                      value={u.status}
                      onChange={e => updateStatus(u.id, e.target.value)}
                      className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                      <option value="disabled">disabled</option>
                    </select>
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
