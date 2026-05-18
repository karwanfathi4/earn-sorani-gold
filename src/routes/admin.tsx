import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { fmtUSD } from "@/lib/utils";
import { toast } from "sonner";

function AdminPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"withdrawals" | "users" | "settings" | "tasks">("withdrawals");
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  const load = async () => {
    const [w, u, s, ts] = await Promise.all([
      supabase.from("withdrawals").select("*, profile:profiles!withdrawals_user_id_fkey(username)").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("id, username, email, balance, total_earned, banned, created_at").order("total_earned", { ascending: false }).limit(100),
      supabase.from("app_settings").select("*").eq("id", 1).single(),
      supabase.from("tasks").select("*").order("created_at"),
    ]);
    setWithdrawals(w.data ?? []);
    setUsers(u.data ?? []);
    setSettings(s.data);
    setTasks(ts.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const updateWd = async (id: string, status: string, extra: any = {}) => {
    const { data: sess } = await supabase.auth.getSession();
    const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewards`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
      body: JSON.stringify({ action: "admin_update_withdrawal", id, status, ...extra }),
    }).then(r => r.json());
    if (r.error) { toast.error(r.error); return; }
    toast.success(t("success"));
    load();
  };

  const saveSettings = async () => {
    const { error } = await supabase.from("app_settings").update(settings).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    toast.success(t("success"));
  };

  const banUser = async (id: string, banned: boolean) => {
    await supabase.from("profiles").update({ banned }).eq("id", id);
    load();
  };

  const createTask = async () => {
    const title = prompt("Task title?"); if (!title) return;
    const reward = Number(prompt("Reward (USDT)?", "0.10") ?? 0);
    const url = prompt("URL (optional)?") || null;
    await supabase.from("tasks").insert({ title, reward, url, task_type: "link" });
    load();
  };
  const toggleTask = async (id: string, active: boolean) => {
    await supabase.from("tasks").update({ active: !active }).eq("id", id);
    load();
  };

  return (
    <AppShell requireAdmin>
      <h1 className="text-xl font-bold gold-gradient-text mb-3">{t("admin_panel")}</h1>
      <div className="flex gap-1 glass p-1 mb-4 overflow-x-auto">
        {(["withdrawals","users","tasks","settings"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 px-2 py-2 text-xs rounded-lg transition whitespace-nowrap ${tab === k ? "bg-gold text-black font-semibold" : "text-muted-foreground"}`}>
            {k === "withdrawals" ? t("pending_withdrawals") : k === "users" ? t("users") : k === "tasks" ? t("tasks") : t("settings")}
          </button>
        ))}
      </div>

      {tab === "withdrawals" && (
        <div className="space-y-2">
          {withdrawals.map((w) => (
            <div key={w.id} className="glass p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{w.profile?.username}</span>
                <span className="text-gold font-mono">{fmtUSD(w.amount)}</span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate">{w.wallet_address}</div>
              <div className="text-xs">Status: <b>{w.status}</b></div>
              {w.tx_hash && <div className="text-[10px] text-emerald-400 font-mono truncate">{w.tx_hash}</div>}
              {w.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <button onClick={() => updateWd(w.id, "approved")} className="btn-gold flex-1 py-1.5 text-xs">{t("approve")}</button>
                  <button onClick={() => updateWd(w.id, "rejected", { note: prompt("Reason?") || "" })} className="glass flex-1 py-1.5 text-xs">{t("reject")}</button>
                </div>
              )}
              {w.status === "approved" && (
                <button onClick={() => updateWd(w.id, "paid", { tx_hash: prompt("TX hash?") || "" })} className="btn-gold w-full py-1.5 text-xs mt-2">{t("mark_paid")}</button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="glass p-3 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{u.username}</div>
                <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                <div className="text-xs text-gold">{fmtUSD(u.balance)} · earned {fmtUSD(u.total_earned)}</div>
              </div>
              <button onClick={() => banUser(u.id, !u.banned)} className={u.banned ? "btn-gold px-2 py-1 text-xs" : "glass px-2 py-1 text-xs text-rose-400"}>
                {u.banned ? "Unban" : "Ban"}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "tasks" && (
        <div className="space-y-2">
          <button onClick={createTask} className="btn-gold w-full py-2 text-sm">+ New task</button>
          {tasks.map((task) => (
            <div key={task.id} className="glass p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">{task.title}</div>
                <div className="text-xs text-gold">{fmtUSD(task.reward)}</div>
              </div>
              <button onClick={() => toggleTask(task.id, task.active)} className="glass px-2 py-1 text-xs">{task.active ? "Disable" : "Enable"}</button>
            </div>
          ))}
        </div>
      )}

      {tab === "settings" && settings && (
        <div className="glass p-4 space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span>{t("demo_mode")}</span>
            <input type="checkbox" checked={settings.demo_mode} onChange={(e) => setSettings({ ...settings, demo_mode: e.target.checked })} />
          </label>
          {[
            ["ad_reward", t("ad_reward_amount")],
            ["daily_reward", t("daily_reward_amount")],
            ["referral_reward", t("referral_reward_amount")],
            ["min_withdrawal", t("min_withdrawal")],
            ["ad_daily_limit", "Daily ad limit"],
            ["ad_cooldown_seconds", "Ad cooldown (sec)"],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="text-xs text-muted-foreground">{label}</label>
              <input className="input-base mt-1" type="number" step="0.0001" value={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: Number(e.target.value) })} />
            </div>
          ))}
          <div>
            <label className="text-xs text-muted-foreground">Telegram channel URL</label>
            <input className="input-base mt-1" value={settings.telegram_channel ?? ""} onChange={(e) => setSettings({ ...settings, telegram_channel: e.target.value })} />
          </div>
          <button onClick={saveSettings} className="btn-gold w-full py-2.5">{t("save")}</button>
        </div>
      )}
    </AppShell>
  );
}

export const Route = createFileRoute("/admin")({ component: AdminPage });
