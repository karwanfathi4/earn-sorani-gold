import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { fmtUSD, isValidTrc20 } from "@/lib/utils";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

function WithdrawPage() {
  const { t } = useI18n();
  const { profile, refreshProfile, user } = useAuth();
  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { if (profile?.usdt_trc20_wallet) setWallet(profile.usdt_trc20_wallet); }, [profile?.usdt_trc20_wallet]);

  const loadHist = async () => {
    if (!user) return;
    const { data } = await supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setHistory(data ?? []);
  };
  useEffect(() => { loadHist(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidTrc20(wallet)) { toast.error(t("invalid_wallet")); return; }
    const amt = Number(amount);
    if (!(amt > 0) || amt > Number(profile?.balance ?? 0)) { toast.error(t("insufficient_balance")); return; }
    setBusy(true);
    toast.loading("Sending USDT on TRON network…", { id: "wd" });
    const { data: sess } = await supabase.auth.getSession();
    const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewards`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
      body: JSON.stringify({ action: "withdraw_now", amount: amt, wallet }),
    }).then(r => r.json());
    setBusy(false);
    toast.dismiss("wd");
    if (r.error) {
      toast.error(r.detail ? `${r.error}: ${String(r.detail).slice(0,120)}` : r.error);
      refreshProfile(); loadHist();
      return;
    }
    toast.success(`Paid! TX: ${String(r.tx_hash).slice(0,16)}…`, { duration: 8000 });
    setAmount("");
    refreshProfile();
    loadHist();
  };

  const statusColor: Record<string, string> = {
    pending: "text-yellow-400", approved: "text-blue-400", paid: "text-emerald-400", rejected: "text-rose-400",
  };

  return (
    <AppShell>
      <div className="glass-gold p-5 mb-4 fade-up">
        <Wallet className="text-gold mb-2" />
        <div className="text-xs text-muted-foreground">{t("balance")}</div>
        <div className="text-3xl font-bold gold-gradient-text">{fmtUSD(profile?.balance)}</div>
      </div>

      <form onSubmit={submit} className="glass p-4 space-y-3 fade-up">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t("request_withdraw")}</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">LIVE · INSTANT</span>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("wallet_address")} (USDT TRC20)</label>
          <input className="input-base mt-1 font-mono text-xs" placeholder="T..." value={wallet} onChange={(e) => setWallet(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("amount")} (USDT)</label>
          <input type="number" step="0.0001" min="0" className="input-base mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          Sends directly on the TRON blockchain. Arrives in your wallet (Binance / Trust / etc.) in seconds.
        </div>
        <button disabled={busy} className="btn-gold w-full py-3">{busy ? "Sending on-chain…" : "Cash out now"}</button>
      </form>

      <h2 className="text-sm font-semibold text-muted-foreground mt-6 mb-2 px-1">{t("history")}</h2>
      <div className="space-y-2">
        {history.length === 0 && <div className="glass p-4 text-sm text-muted-foreground text-center">—</div>}
        {history.map((h) => (
          <div key={h.id} className="glass p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{fmtUSD(h.amount)}</div>
              <div className={`text-xs ${statusColor[h.status] ?? ""}`}>{t(h.status as any)}</div>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono truncate mt-1">{h.wallet_address}</div>
            {h.tx_hash && <div className="text-[10px] text-emerald-400 font-mono truncate">TX: {h.tx_hash}</div>}
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/withdraw")({ component: WithdrawPage });
