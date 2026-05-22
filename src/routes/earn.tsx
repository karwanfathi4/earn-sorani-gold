import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { fmtUSD } from "@/lib/utils";
import { toast } from "sonner";
import { Coins, Flame, CheckCircle2, Users, Wallet } from "lucide-react";
import { Link } from "@tanstack/react-router";

function EarnPage() {
  const { t } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completed, setCompleted] = useState<Record<string, string>>({});
  const [dailyBusy, setDailyBusy] = useState(false);

  const loadAll = async () => {
    const [s, ts, comps] = await Promise.all([
      supabase.from("app_settings").select("*").eq("id", 1).single(),
      supabase.from("tasks").select("*").eq("active", true).order("created_at"),
      user
        ? supabase.from("task_completions").select("task_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]);
    setSettings(s.data);
    setTasks(ts.data ?? []);
    const map: Record<string, string> = {};
    (comps as any).data?.forEach((c: any) => { if (!map[c.task_id]) map[c.task_id] = c.created_at; });
    setCompleted(map);
  };

  useEffect(() => { loadAll(); }, [user]);

  const call = async (body: any) => {
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewards`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return r.json();
  };

  const claimDaily = async () => {
    setDailyBusy(true);
    const r = await call({ action: "daily" });
    setDailyBusy(false);
    if (r.error) {
      toast.error(r.error === "already_claimed" ? t("claimed") : r.error);
      return;
    }
    toast.success(`+${fmtUSD(r.reward)} · 🔥${r.streak}`);
    refreshProfile();
  };

  const completeTask = async (taskId: string, url: string | null) => {
    if (url) window.open(url, "_blank");
    await new Promise((res) => setTimeout(res, 2000));
    const r = await call({ action: "complete_task", task_id: taskId });
    if (r.error) { toast.error(r.error); return; }
    toast.success(`+${fmtUSD(r.reward)}`);
    setCompleted((c) => ({ ...c, [taskId]: new Date().toISOString() }));
    refreshProfile();
  };

  const lastClaim = profile?.last_daily_claim_at ? new Date(profile.last_daily_claim_at) : null;
  const canClaim = !lastClaim || Date.now() - lastClaim.getTime() >= 20 * 60 * 60 * 1000;

  return (
    <AppShell>
      <div className="glass-gold p-5 mb-4 fade-up">
        <div className="text-xs text-muted-foreground">{t("balance")}</div>
        <div className="text-4xl font-bold gold-gradient-text">{fmtUSD(profile?.balance)}</div>
        <div className="text-[11px] text-muted-foreground mt-1">Exact: {fmtUSD(profile?.balance, 4)} withdrawable USDT</div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span>{t("total_earned")}: <b className="text-foreground">{fmtUSD(profile?.total_earned)}</b></span>
          <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" /> {profile?.streak_days ?? 0} {t("days")}</span>
        </div>
        <Link to="/withdraw" className="btn-gold w-full mt-4 py-2 text-sm flex items-center justify-center gap-2">
          <Wallet size={14} /> Cash out USDT (TRC20)
        </Link>
      </div>

      {/* Daily reward */}
      <div className="glass p-4 mb-3 flex items-center justify-between fade-up">
        <div>
          <div className="flex items-center gap-2 font-semibold"><Coins size={16} className="text-gold" /> {t("daily_reward")}</div>
          <div className="text-xs text-muted-foreground mt-1">+{fmtUSD(settings?.daily_reward)} {profile?.streak_days ? `· 🔥${profile.streak_days}` : ""}</div>
        </div>
        <button onClick={claimDaily} disabled={!canClaim || dailyBusy} className="btn-gold px-4 py-2 text-sm">
          {dailyBusy ? "..." : canClaim ? t("claim") : t("claimed")}
        </button>
      </div>

      {/* Referrals */}
      <Link to="/referrals" className="glass p-4 mb-3 flex items-center justify-between fade-up hover:bg-white/5">
        <div>
          <div className="flex items-center gap-2 font-semibold"><Users size={16} className="text-gold" /> {t("referrals")}</div>
          <div className="text-xs text-muted-foreground mt-1">+{fmtUSD(settings?.referral_reward)} per verified signup</div>
        </div>
        <span className="text-xs text-gold">Open →</span>
      </Link>

      {/* Tasks */}
      <h2 className="text-sm font-semibold text-muted-foreground mt-6 mb-2 px-1">{t("tasks")}</h2>
      <div className="space-y-2">
        {tasks.length === 0 && (
          <div className="glass p-4 text-sm text-muted-foreground text-center">No tasks available right now. Check back soon.</div>
        )}
        {tasks.map((task) => {
          const isDone = !!completed[task.id];
          return (
            <div key={task.id} className="glass p-4 flex items-center justify-between fade-up">
              <div className="min-w-0 flex-1 pe-3">
                <div className="font-semibold text-sm truncate">{task.title}</div>
                <div className="text-xs text-muted-foreground">+{fmtUSD(task.reward)}</div>
              </div>
              <button
                onClick={() => completeTask(task.id, task.url)}
                disabled={isDone}
                className={isDone ? "glass px-3 py-2 text-xs text-gold flex items-center gap-1" : "btn-gold px-4 py-2 text-xs"}
              >
                {isDone ? <><CheckCircle2 size={14}/> {t("completed")}</> : t("complete")}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-6 px-4 leading-relaxed">
        All balances shown are real, on-chain withdrawable USDT. No simulated ads, no auto-clickers, no fake earnings.
      </p>
    </AppShell>
  );
}

export const Route = createFileRoute("/earn")({ component: EarnPage });
