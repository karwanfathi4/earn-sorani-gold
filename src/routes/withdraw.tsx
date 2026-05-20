import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { fmtUSD, isValidTrc20 } from "@/lib/utils";
import { toast } from "sonner";
import { Wallet } from "lucide-react";

const withdrawalMethods = [
  { id: "usdt_trc20", label: "USDT-TRC20", helper: "Live on-chain payout to Binance, Trust Wallet, or any TRON USDT address." },
  { id: "switch", label: "Switch", helper: "Manual request — admin pays from Switch and marks it paid." },
  { id: "superqi", label: "SuperQi", helper: "Manual request — admin pays from SuperQi and marks it paid." },
  { id: "asiacell", label: "Asiacell SIM", helper: "Manual request — admin sends balance/recharge and marks it paid." },
  { id: "pubg_uc", label: "PUBG Mobile UC", helper: "Manual request — admin sends UC for the Player ID." },
] as const;

const pubgUcRows = [
  ["60 UC", "$1.00"],
  ["325 UC", "$5.00"],
  ["660 UC", "$10.00"],
  ["1,800 UC", "$25.00"],
  ["3,850 UC", "$50.00"],
  ["8,100 UC", "$100.00"],
];

function WithdrawPage() {
  const { t } = useI18n();
  const { profile, refreshProfile, user } = useAuth();
  const [method, setMethod] = useState<(typeof withdrawalMethods)[number]["id"]>("usdt_trc20");
  const [wallet, setWallet] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const selectedMethod = withdrawalMethods.find((m) => m.id === method)!;

  const loadHist = async () => {
    if (!user) return;
    const { data } = await supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setHistory(data ?? []);
  };
  useEffect(() => { loadHist(); }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === "usdt_trc20" && !isValidTrc20(wallet)) { toast.error(t("invalid_wallet")); return; }
    if (method !== "usdt_trc20" && wallet.trim().length < 3) { toast.error("Enter the account / phone / Player ID first"); return; }
    const amt = Number(amount);
    if (!(amt > 0) || amt > Number(profile?.balance ?? 0)) { toast.error(t("insufficient_balance")); return; }
    setBusy(true);
    toast.loading(method === "usdt_trc20" ? "Sending USDT on TRON network…" : "Sending request to admin queue…", { id: "wd" });
    const { data: sess } = await supabase.auth.getSession();
    const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewards`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
      body: JSON.stringify({ action: method === "usdt_trc20" ? "withdraw_now" : "request_withdrawal", amount: amt, wallet, method }),
    }).then(r => r.json());
    setBusy(false);
    toast.dismiss("wd");
    if (r.error) {
      toast.error(r.detail ? `${r.error}: ${String(r.detail).slice(0,120)}` : r.error);
      refreshProfile(); loadHist();
      return;
    }
    toast.success(r.tx_hash ? `Paid! TX: ${String(r.tx_hash).slice(0,16)}…` : "Request sent to admin queue", { duration: 8000 });
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
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">{method === "usdt_trc20" ? "LIVE · ON-CHAIN" : "ADMIN QUEUE"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {withdrawalMethods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { setMethod(m.id); setWallet(""); }}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${method === m.id ? "border-gold bg-gold/15 text-gold" : "border-white/10 bg-white/5 text-muted-foreground"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{method === "usdt_trc20" ? `${t("wallet_address")} (USDT TRC20)` : `${selectedMethod.label} account details`}</label>
          <input className="input-base mt-1 font-mono text-xs" placeholder={method === "usdt_trc20" ? "T..." : "Account / phone / PUBG Player ID"} value={wallet} onChange={(e) => setWallet(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">{t("amount")} (USDT)</label>
          <input type="number" step="0.0001" min="0" className="input-base mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          {selectedMethod.helper}
        </div>
        {method === "pubg_uc" && (
          <div className="rounded-xl border border-white/10 overflow-hidden text-xs">
            {pubgUcRows.map(([uc, price]) => (
              <div key={uc} className="flex items-center justify-between px-3 py-2 border-b border-white/5 last:border-b-0">
                <span>{uc}</span>
                <span className="text-gold font-mono">{price}</span>
              </div>
            ))}
          </div>
        )}
        <button disabled={busy} className="btn-gold w-full py-3">{busy ? (method === "usdt_trc20" ? "Sending on-chain…" : "Submitting request…") : "Cash out now"}</button>
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
            <div className="text-[10px] text-gold mt-1">{h.network ?? "TRC20"}</div>
            <div className="text-[10px] text-muted-foreground font-mono truncate mt-1">{h.wallet_address}</div>
            {h.tx_hash && <div className="text-[10px] text-emerald-400 font-mono truncate">TX: {h.tx_hash}</div>}
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/withdraw")({ component: WithdrawPage });
