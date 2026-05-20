import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Bell } from "lucide-react";

function ProfilePage() {
  const { t } = useI18n();
  const { profile, user, signOut, refreshProfile, isAdmin } = useAuth();
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    setWallet(profile?.usdt_trc20_wallet ?? "");
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").select("*").or(`user_id.eq.${user.id},user_id.is.null`).order("created_at", { ascending: false }).limit(20).then(({ data }) => setNotifs(data ?? []));
  }, [user]);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      usdt_trc20_wallet: wallet || null,
    }).eq("id", user!.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("success"));
    refreshProfile();
  };

  const promoteSelf = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewards`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
      body: JSON.stringify({ action: "promote_self_first_admin" }),
    }).then(r => r.json());
    if (r.error) { toast.error(r.error); return; }
    toast.success("You are admin now. Refresh.");
    window.location.reload();
  };

  return (
    <AppShell>
      <div className="glass p-5 mb-4 fade-up">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 flex items-center justify-center font-bold text-black text-xl">
            {profile?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold truncate">{profile?.username}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
          <button onClick={signOut} className="glass px-3 py-2 text-xs hover:bg-white/5"><LogOut size={14} /></button>
        </div>
      </div>

      <div className="glass p-4 mb-3 space-y-3 fade-up">
        <div>
          <label className="text-xs text-muted-foreground">{t("wallet_address")}</label>
          <input className="input-base mt-1 font-mono text-xs" placeholder="T..." value={wallet} onChange={(e) => setWallet(e.target.value)} />
        </div>
        <button onClick={save} disabled={busy} className="btn-gold w-full py-2.5 text-sm">{t("save")}</button>
      </div>

      {!isAdmin && (
        <button onClick={promoteSelf} className="glass w-full p-3 text-xs text-muted-foreground hover:text-gold transition fade-up">
          Bootstrap as first admin (only works once)
        </button>
      )}

      <h2 className="text-sm font-semibold text-muted-foreground mt-6 mb-2 px-1 flex items-center gap-2"><Bell size={14}/> {t("notifications")}</h2>
      <div className="space-y-2">
        {notifs.length === 0 && <div className="glass p-4 text-sm text-muted-foreground text-center">{t("no_notifications")}</div>}
        {notifs.map((n) => (
          <div key={n.id} className="glass p-3">
            <div className="text-sm font-semibold">{n.title}</div>
            {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
            <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/profile")({ component: ProfilePage });
