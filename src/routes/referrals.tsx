import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Check, Users, Share2 } from "lucide-react";
import { toast } from "sonner";
import { fmtUSD } from "@/lib/utils";

function ReferralsPage() {
  const { t } = useI18n();
  const { user, profile } = useAuth();
  const [refs, setRefs] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("referrals").select("*, referred:profiles!referrals_referred_id_fkey(username, total_earned)").eq("referrer_id", user.id).then(({ data }) => setRefs(data ?? []));
  }, [user]);

  const link = typeof window !== "undefined" && profile ? `${window.location.origin}/auth?ref=${profile.referral_code}` : "";

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(t("copied"));
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    if (navigator.share) await navigator.share({ title: "GoldEarn", text: t("invite_friends"), url: link });
    else copy();
  };

  return (
    <AppShell>
      <div className="glass-gold p-5 mb-4 text-center fade-up">
        <Users className="mx-auto text-gold mb-2" />
        <h1 className="font-bold text-lg">{t("invite_friends")}</h1>
        <p className="text-xs text-muted-foreground mt-1">{t("referral_reward_desc")}</p>
      </div>

      <div className="glass p-4 mb-3 fade-up">
        <div className="text-xs text-muted-foreground mb-2">{t("referral_link")}</div>
        <div className="flex items-center gap-2">
          <input className="input-base flex-1 text-xs truncate" readOnly value={link} />
          <button onClick={copy} className="btn-gold px-3 py-2.5" aria-label="copy">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button onClick={share} className="glass px-3 py-2.5 hover:bg-white/5" aria-label="share">
            <Share2 size={16} />
          </button>
        </div>
        <div className="text-xs text-muted-foreground mt-3">Code: <span className="text-gold font-mono">{profile?.referral_code}</span></div>
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground mt-4 mb-2 px-1">{t("your_referrals")} · {refs.length}</h2>
      <div className="space-y-2">
        {refs.length === 0 && <div className="glass p-4 text-sm text-muted-foreground text-center">—</div>}
        {refs.map((r) => (
          <div key={r.id} className="glass p-3 flex items-center justify-between">
            <div className="text-sm">{r.referred?.username ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{fmtUSD(r.referred?.total_earned)}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/referrals")({ component: ReferralsPage });
