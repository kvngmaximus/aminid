import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings as SettingsIcon, LogOut } from "lucide-react";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import { supabase } from "@/lib/supabase";

type Profile = { id: string; name: string | null; avatar_url: string | null };
type AuthorBank = {
  bank_name: string | null;
  bank_code: string | null;
  account_name: string | null;
  account_number: string | null;
  payout_currency: string | null;
  payout_method: string | null;
  country: string | null;
  tax_id: string | null;
  paypal_email: string | null;
  mobile_money_number: string | null;
};

export default function AuthorSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [bio, setBio] = useState<string>("");
  const [bank, setBank] = useState<AuthorBank>({
    bank_name: "",
    bank_code: "",
    account_name: "",
    account_number: "",
    payout_currency: "NGN",
    payout_method: "bank_transfer",
    country: "",
    tax_id: "",
    paypal_email: "",
    mobile_money_number: "",
  });

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const session = s.session;
      if (!session) { navigate("/login"); return; }
      const uid = session.user.id;
      const { data: me } = await supabase
        .from("profiles")
        .select("id,name,avatar_url,user_type,status,bio")
        .eq("id", uid)
        .single();
      if (!me || me.status !== "active" || !['author','admin'].includes(me.user_type)) { navigate("/"); return; }
      setProfile({ id: me.id, name: me.name, avatar_url: me.avatar_url });
      setBio(me.bio ?? "");
      // Load author's payout/bank details
      const { data: a } = await supabase
        .from("authors")
        .select("bank_name,bank_code,account_name,account_number,payout_currency,payout_method,country,tax_id,paypal_email,mobile_money_number")
        .eq("user_id", uid)
        .single();
      if (a) {
        setBank({
          bank_name: a.bank_name ?? "",
          bank_code: a.bank_code ?? "",
          account_name: a.account_name ?? "",
          account_number: a.account_number ?? "",
          payout_currency: a.payout_currency ?? "NGN",
          payout_method: a.payout_method ?? "bank_transfer",
          country: a.country ?? "",
          tax_id: a.tax_id ?? "",
          paypal_email: a.paypal_email ?? "",
          mobile_money_number: a.mobile_money_number ?? "",
        });
      }
    })();
  }, [navigate]);

  // Ensure buckets exist (best-effort)
  useEffect(() => {
    (async () => {
      try { await fetch("/api/storage/init", { method: "POST" }); } catch {}
    })();
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from("profiles")
      .update({ name: profile.name, avatar_url: profile.avatar_url, bio })
      .eq("id", profile.id);
    let errMsg = error?.message;
    const { error: bankErr } = await supabase
      .from("authors")
      .update({
        bank_name: bank.bank_name,
        bank_code: bank.bank_code,
        account_name: bank.account_name,
        account_number: bank.account_number,
        payout_currency: bank.payout_currency,
        payout_method: bank.payout_method,
        country: bank.country,
        tax_id: bank.tax_id,
        paypal_email: bank.paypal_email,
        mobile_money_number: bank.mobile_money_number,
      })
      .eq("user_id", profile.id);
    errMsg = errMsg || bankErr?.message;
    setSaving(false);
    setMessage(errMsg ? errMsg : "Settings saved");
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

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-20 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/author")}>{"\u2190"} Back</Button>
            <Link to="/" className="font-poppins font-bold text-foreground">Aminid</Link>
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-semibold">Author</span>
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
          <h1 className="font-poppins font-bold text-3xl text-foreground mb-6">Author Settings</h1>
          <div className="bg-white rounded-xl border border-border p-6 space-y-4">
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
            <div>
              <label className="block text-sm font-semibold mb-2">Bio</label>
              <Textarea rows={4} value={bio} onChange={(e: any) => setBio(e.target.value)} placeholder="Tell readers about you" />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving}>Save Changes</Button>
              {message && <span className="text-sm text-muted-foreground">{message}</span>}
            </div>
          </div>

          <div className="mt-8 bg-white rounded-xl border border-border p-6 space-y-4">
            <h2 className="font-poppins font-semibold text-xl mb-2">Payout & Bank Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Bank Name</label>
                <Input value={bank.bank_name ?? ""} onChange={(e: any) => setBank({ ...bank, bank_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Bank Code (optional)</label>
                <Input value={bank.bank_code ?? ""} onChange={(e: any) => setBank({ ...bank, bank_code: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Account Name</label>
                <Input value={bank.account_name ?? ""} onChange={(e: any) => setBank({ ...bank, account_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Account Number</label>
                <Input value={bank.account_number ?? ""} onChange={(e: any) => setBank({ ...bank, account_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Country</label>
                <Input value={bank.country ?? ""} onChange={(e: any) => setBank({ ...bank, country: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Payout Currency</label>
                <Input value={bank.payout_currency ?? "NGN"} onChange={(e: any) => setBank({ ...bank, payout_currency: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Payout Method</label>
                <Input value={bank.payout_method ?? "bank_transfer"} onChange={(e: any) => setBank({ ...bank, payout_method: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Tax ID (optional)</label>
                <Input value={bank.tax_id ?? ""} onChange={(e: any) => setBank({ ...bank, tax_id: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">PayPal Email (optional)</label>
                <Input value={bank.paypal_email ?? ""} onChange={(e: any) => setBank({ ...bank, paypal_email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Mobile Money Number (optional)</label>
                <Input value={bank.mobile_money_number ?? ""} onChange={(e: any) => setBank({ ...bank, mobile_money_number: e.target.value })} />
              </div>
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
