import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, LogOut, Heart } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { supabase } from "@/lib/supabase";

type Profile = { id: string; name: string | null; avatar_url: string | null };
type Subscription = { id: string; plan_id: string; status: string; renews_at: string | null };

export default function ReaderSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
      if (!me || me.status !== "active") { navigate("/"); return; }
      setProfile({ id: me.id, name: me.name, avatar_url: me.avatar_url });
      await loadSubs(uid);
    })();
  }, [navigate]);

  // Ensure buckets exist (best-effort)
  useEffect(() => {
    (async () => {
      try { await fetch("/api/storage/init", { method: "POST" }); } catch {}
    })();
  }, []);

  const loadSubs = async (uid: string) => {
    const { data } = await supabase
      .from("subscriptions")
      .select("id,plan_id,status,renews_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    setSubs((data as Subscription[]) || []);
  };

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

  const onAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
  };

  const uploadAvatar = async () => {
    if (!profile || !avatarFile) return;
    setUploading(true);
    setMessage(null);
    try {
      const mime = avatarFile.type || "image/jpeg";
      const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true, contentType: mime });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);
      if (updErr) throw updErr;
      setProfile(p => p ? { ...p, avatar_url: publicUrl } : p);
      setMessage("Avatar updated");
      setAvatarFile(null);
    } catch (err: any) {
      setMessage(err?.message ?? "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const cancel = async (id: string) => {
    await supabase.from("subscriptions").update({ status: "canceled" }).eq("id", id);
    if (profile?.id) await loadSubs(profile.id);
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/reader") }>{"\u2190"} Back</Button>
            <Link to="/" className="font-poppins font-bold text-foreground">Aminid</Link>
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-semibold">Reader</span>
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-poppins font-bold text-3xl text-foreground mb-6">Reader Settings</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-border p-6 space-y-4">
              <h2 className="font-poppins font-semibold text-xl">Profile</h2>
              <div>
                <label className="block text-sm font-semibold mb-2">Display Name</label>
                <Input value={profile?.name ?? ""} onChange={(e: any) => setProfile(p => p ? { ...p, name: e.target.value } : p)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Avatar URL</label>
                <Input value={profile?.avatar_url ?? ""} onChange={(e: any) => setProfile(p => p ? { ...p, avatar_url: e.target.value } : p)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Upload Avatar</label>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={onAvatarSelect} />
                  <Button size="sm" onClick={uploadAvatar} disabled={!avatarFile || uploading}>
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={save} disabled={saving}>Save Changes</Button>
                {message && <span className="text-sm text-muted-foreground">{message}</span>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex items-center gap-2">
                <Heart className="w-5 h-5 text-muted-foreground" />
                <span className="font-poppins font-semibold">Subscriptions</span>
              </div>
              <div className="divide-y divide-border">
                {subs.length === 0 ? (
                  <div className="p-6 text-muted-foreground">No subscriptions</div>
                ) : subs.map(s => (
                  <div key={s.id} className="p-6 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Plan: {s.plan_id}</div>
                      <div className="text-xs text-muted-foreground">Status: {s.status} {s.renews_at ? `· Renews ${new Date(s.renews_at).toLocaleDateString()}` : ''}</div>
                    </div>
                    {s.status === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => cancel(s.id)}>Cancel</Button>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-semibold">{s.status}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
