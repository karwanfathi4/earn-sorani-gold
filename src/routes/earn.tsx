import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { fmtUSD } from "@/lib/utils";
import { toast } from "sonner";
import { Coins, Flame, Play, CheckCircle2 } from "lucide-react";

function EarnPage() {
  const { t } = useI18n();
  const { user, profile, refreshProfile } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completed, setCompleted] = useState<Record<string, string>>({});
  const [adBusy, setAdBusy] = useState(false);
  const [dailyBusy, setDailyBusy] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [autoAds, setAutoAds] = useState(false);
  const [adsToday, setAdsToday] = useState(0);
  const [adEarningsToday, setAdEarningsToday] = useState(0);
  const adReward = Number(settings?.ad_reward ?? 0.001);
  const adCooldown = Math.max(30, Number(settings?.ad_cooldown_seconds ?? 30));
  const adDailyLimit = Math.min(100, Number(settings?.ad_daily_limit ?? 100));

  const loadAll = async () => {
    const todayIso = new Date(Date.now() - 86400000).toISOString();
    const [s, ts, comps, adRows] = await Promise.all([
      supabase.from("app_settings").select("*").eq("id", 1).single(),
      supabase.from("tasks").select("*").eq("active", true).order("created_at"),
      user ? supabase.from("task_completions").select("task_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as any[] }),
      user ? supabase.from("ad_views").select("reward").eq("user_id", user.id).gte("created_at", todayIso) : Promise.resolve({ data: [] as any[] }),
    ]);
    setSettings(s.data);
    setTasks(ts.data ?? []);
    const map: Record<string, string> = {};
    (comps as any).data?.forEach((c: any) => { if (!map[c.task_id]) map[c.task_id] = c.created_at; });
    setCompleted(map);
    const todayAds = (adRows as any).data ?? [];
    setAdsToday(todayAds.length);
    setAdEarningsToday(todayAds.reduce((sum: number, row: any) => sum + Number(row.reward ?? 0), 0));
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

  const watchAd = async () => {
    setAdBusy(true);
    // Brief simulated ad playback (replace with real AdSense rewarded later)
    await new Promise((res) => setTimeout(res, 1500));
    const r = await call({ action: "watch_ad" });
    setAdBusy(false);
    if (r.error) {
      if (r.error === "limit") { setAutoAds(false); toast.error(t("ad_limit_reached")); return; }
      if (r.error !== "cooldown") toast.error(r.error);
      return;
    }
    if (!autoAds) toast.success(`+${fmtUSD(r.reward, 3)}`);
    setAdsToday((n) => n + 1);
    setAdEarningsToday((n) => n + Number(r.reward ?? 0));
    setAdCountdown(adCooldown);
    refreshProfile();
  };

  useEffect(() => {
    if (adCountdown <= 0) return;
    const i = setInterval(() => setAdCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(i);
  }, [adCountdown]);

  // Auto-watch loop: when ON, fires watch_ad as soon as cooldown hits 0
  useEffect(() => {
    if (!autoAds || adsToday >= adDailyLimit) return;
    if (adBusy || adCountdown > 0) return;
    const t = setTimeout(() => { watchAd(); }, 600);
    return () => clearTimeout(t);
  }, [autoAds, adBusy, adCountdown, adsToday, adDailyLimit]);


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
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span>{t("total_earned")}: <b className="text-foreground">{fmtUSD(profile?.total_earned)}</b></span>
          <span className="flex items-center gap-1"><Flame size={12} className="text-orange-400" /> {profile?.streak_days ?? 0} {t("days")}</span>
        </div>
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

      {/* Rewarded ad */}
      <div className="glass p-4 mb-3 fade-up">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold"><Play size={16} className="text-gold" /> Rewarded Ad</div>
            <div className="text-xs text-muted-foreground mt-1">+{fmtUSD(adReward, 3)} every {adCooldown}s · today {fmtUSD(adEarningsToday, 3)}</div>
          </div>
          <button onClick={watchAd} disabled={adBusy || adCountdown > 0 || autoAds || adsToday >= adDailyLimit} className="btn-gold px-4 py-2 text-sm">
            {adBusy ? "▶ ..." : adCountdown > 0 ? `${adCountdown}s` : t("watch_ad")}
          </button>
        </div>
        <button
          onClick={() => setAutoAds((v) => !v)}
          className={`mt-3 w-full py-2 rounded-xl text-sm font-semibold transition ${autoAds ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-white/5 text-foreground border border-white/10 hover:bg-white/10"}`}
        >
            {autoAds ? `● AUTO ON · ${adsToday}/${adDailyLimit} ads · +${fmtUSD(adEarningsToday, 3)} today` : "Start Auto-Watch (capped)"}
        </button>
        <div className="mt-3 h-20 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-[10px] text-muted-foreground text-center px-3">
          <span>{autoAds ? (adsToday >= adDailyLimit ? "daily cap reached" : `reward timer running · ad ${adsToday + 1}`) : "rewarded ad slot"}</span>
          <span className="mt-1 text-[9px]">Real ad networks only pay when a legitimate ad is available and viewed.</span>
        </div>
      </div>

      {/* Tasks */}
      <h2 className="text-sm font-semibold text-muted-foreground mt-6 mb-2 px-1">{t("tasks")}</h2>
      <div className="space-y-2">
        {tasks.length === 0 && (
          <div className="glass p-4 text-sm text-muted-foreground text-center">—</div>
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
    </AppShell>
  );
}

export const Route = createFileRoute("/earn")({ component: EarnPage });
