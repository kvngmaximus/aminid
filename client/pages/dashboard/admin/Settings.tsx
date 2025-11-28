import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, LogOut } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { supabase } from "@/lib/supabase";

type Profile = { id: string; name: string | null; avatar_url: string | null };

export default function AdminSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const session = s.session;
      if (!session) { navigate("/login"); return; }
      const uid = session.user.id;
      const { data: me } = await supabase
        .from("profiles")
        .select("id,name,avatar_url,user_type,status")
        .eq("id", uid)
        .single();
      if (!me || me.status !== "active" || me.user_type !== "admin") { navigate("/"); return; }
      setProfile({ id: me.id, name: me.name, avatar_url: me.avatar_url });
    })();
  }, [navigate]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from("profiles")
      .update({ name: profile.name, avatar_url: profile.avatar_url })
      .eq("id", profile.id);
    setSaving(false);
    setMessage(error ? error.message : "Settings saved");
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
            <Button variant="ghost" size="sm" disabled>
              <SettingsIcon size={18} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-poppins font-bold text-3xl text-foreground mb-6">Admin Settings</h1>
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Display Name</label>
              <Input value={profile?.name ?? ""} onChange={(e: any) => setProfile(p => p ? { ...p, name: e.target.value } : p)} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Avatar URL</label>
              <Input value={profile?.avatar_url ?? ""} onChange={(e: any) => setProfile(p => p ? { ...p, avatar_url: e.target.value } : p)} />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving}>Save Changes</Button>
              {message && <span className="text-sm text-muted-foreground">{message}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
