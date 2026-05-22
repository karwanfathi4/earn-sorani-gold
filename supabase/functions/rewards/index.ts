// Securely awards rewards for daily claim, ad views, task completions.
// Anti-spam: rate-limits ads, enforces daily once-per-24h, enforces task cooldowns.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "unauthorized" }, 401);

    // Verify user
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const uid = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    // Settings
    const { data: settings } = await admin.from("app_settings").select("*").eq("id", 1).single();
    if (!settings) return json({ error: "settings missing" }, 500);

    // Profile
    const { data: profile } = await admin.from("profiles").select("*").eq("id", uid).single();
    if (!profile) return json({ error: "no profile" }, 404);
    if (profile.banned) return json({ error: "banned" }, 403);

    if (action === "daily") {
      const last = profile.last_daily_claim_at ? new Date(profile.last_daily_claim_at) : null;
      const now = new Date();
      if (last && now.getTime() - last.getTime() < 20 * 60 * 60 * 1000) {
        return json({ error: "already_claimed" }, 429);
      }
      // streak: if last claim was within 48h, increment; else reset to 1
      let streak = 1;
      if (last && now.getTime() - last.getTime() < 48 * 60 * 60 * 1000) streak = (profile.streak_days ?? 0) + 1;
      const reward = Number(settings.daily_reward) * (1 + Math.min(streak, 7) * 0.05);
      await admin.from("profiles").update({
        balance: Number(profile.balance) + reward,
        total_earned: Number(profile.total_earned) + reward,
        last_daily_claim_at: now.toISOString(),
        streak_days: streak,
      }).eq("id", uid);
      await admin.from("notifications").insert({ user_id: uid, title: "Daily reward", body: `+$${reward.toFixed(4)}` });
      return json({ ok: true, reward, streak });
    }

    if (action === "watch_ad") {
      // Disabled. Simulated/auto ad earnings are not legitimate and were removed.
      // A real rewarded-ad provider (AdSense / AdMob / Adsterra / etc.) must
      // verify the impression server-side via SSV callback before any payout.
      return json({ error: "ads_disabled", detail: "Ad rewards are disabled until a verified provider SSV callback is wired up." }, 410);
    }

    if (action === "complete_task") {
      const taskId = body.task_id as string;
      if (!taskId) return json({ error: "task_id required" }, 400);
      const { data: task } = await admin.from("tasks").select("*").eq("id", taskId).eq("active", true).single();
      if (!task) return json({ error: "task not found" }, 404);
      // cooldown
      const since = new Date(Date.now() - task.cooldown_hours * 3600000).toISOString();
      const { count: recent } = await admin.from("task_completions").select("*", { count: "exact", head: true }).eq("user_id", uid).eq("task_id", taskId).gte("created_at", since);
      if ((recent ?? 0) > 0) return json({ error: "cooldown" }, 429);
      const reward = Number(task.reward);
      await admin.from("task_completions").insert({ user_id: uid, task_id: taskId, reward });
      await admin.from("profiles").update({
        balance: Number(profile.balance) + reward,
        total_earned: Number(profile.total_earned) + reward,
      }).eq("id", uid);
      return json({ ok: true, reward });
    }

    if (action === "request_withdrawal") {
      return json({ error: "manual_methods_removed", detail: "Only USDT-TRC20 live cashout is enabled." }, 400);
    }

    if (action === "withdraw_now") {
      // Real USDT-TRC20 cashout: pay immediately when the payout wallet is funded;
      // otherwise keep the user's funds locked in a pending withdrawal for manual/admin payout.
      const amount = Number(body.amount);
      const wallet = String(body.wallet || "").trim();
      if (!/^T[A-Za-z0-9]{33}$/.test(wallet)) return json({ error: "invalid_wallet" }, 400);
      if (!(amount > 0)) return json({ error: "invalid_amount" }, 400);
      if (Number(profile.balance) < amount) return json({ error: "insufficient" }, 400);

      const PK = Deno.env.get("TRON_PRIVATE_KEY");
      if (!PK) return json({ error: "payout_not_configured" }, 500);

      const { count: pending } = await admin.from("withdrawals").select("*", { count: "exact", head: true }).eq("user_id", uid).in("status", ["pending", "processing", "approved"]);
      if ((pending ?? 0) > 0) return json({ error: "already_pending" }, 429);

      // Lock funds immediately
      await admin.from("profiles").update({ balance: Number(profile.balance) - amount, usdt_trc20_wallet: wallet }).eq("id", uid);
      const { data: wd, error: wdErr } = await admin.from("withdrawals").insert({ user_id: uid, amount, wallet_address: wallet, network: "TRC20", status: "processing" }).select().single();
      if (wdErr) {
        const { data: p2 } = await admin.from("profiles").select("balance").eq("id", uid).single();
        if (p2) await admin.from("profiles").update({ balance: Number(p2.balance) + amount }).eq("id", uid);
        return json({ error: "withdrawal_create_failed", detail: wdErr.message }, 500);
      }

      try {
        const tronMod: any = await import("https://esm.sh/tronweb@6.0.0");
        const TronWeb = tronMod.TronWeb ?? tronMod.default ?? tronMod;
        const headers: Record<string, string> = {};
        const apiKey = Deno.env.get("TRONGRID_API_KEY");
        if (apiKey) headers["TRON-PRO-API-KEY"] = apiKey;
        const normalizedPrivateKey = PK.trim().replace(/^0x/i, "");
        const tronWeb = new TronWeb({ fullHost: "https://api.trongrid.io", headers, privateKey: normalizedPrivateKey });
        if (!tronWeb.isAddress(wallet)) throw new Error("invalid_wallet");
        const senderAddress = tronWeb.address.fromPrivateKey(normalizedPrivateKey);
        const senderExists = await tronWeb.trx.getAccount(senderAddress);
        if (!senderExists?.address) {
          throw new Error("hot_wallet_not_activated: send a small amount of TRX to the payout wallet first");
        }
        const trxBalance = await tronWeb.trx.getBalance(senderAddress);
        if (Number(trxBalance) < 30_000_000) {
          throw new Error("hot_wallet_needs_trx_for_network_fees");
        }
        const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
        const contract = await tronWeb.contract().at(USDT_CONTRACT);
        const valueInSun = Math.floor(amount * 1_000_000); // USDT has 6 decimals
        const usdtBalance = await contract.methods.balanceOf(senderAddress).call();
        if (Number(usdtBalance) < valueInSun) {
          throw new Error("hot_wallet_needs_usdt_for_payouts");
        }
        const tx: string = await contract.methods.transfer(wallet, valueInSun).send({ feeLimit: 100_000_000 });

        await admin.from("withdrawals").update({ status: "paid", tx_hash: tx, processed_at: new Date().toISOString() }).eq("id", wd!.id);
        await admin.from("notifications").insert({ user_id: uid, title: "Withdrawal paid ✅", body: `${amount} USDT sent. TX: ${tx}` });
        return json({ ok: true, tx_hash: tx, withdrawal_id: wd!.id });
      } catch (err) {
        const detail = String(err);
        console.error("payout queued", err);

        if (detail.includes("invalid_wallet")) {
          const { data: p2 } = await admin.from("profiles").select("balance").eq("id", uid).single();
          if (p2) await admin.from("profiles").update({ balance: Number(p2.balance) + amount }).eq("id", uid);
          await admin.from("withdrawals").update({ status: "rejected", admin_note: detail.slice(0, 500), processed_at: new Date().toISOString() }).eq("id", wd!.id);
          return json({ error: "invalid_wallet", detail }, 400);
        }

        await admin.from("withdrawals").update({
          status: "pending",
          admin_note: `Queued for payout: ${detail}`.slice(0, 500),
        }).eq("id", wd!.id);
        await admin.from("notifications").insert({
          user_id: uid,
          title: "Withdrawal queued",
          body: `${amount} USDT is locked for payout to your TRC20 wallet.`,
        });
        return json({ ok: true, queued: true, withdrawal_id: wd!.id, detail });
      }
    }

    if (action === "admin_update_withdrawal") {
      // verify admin
      const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", uid);
      if (!roles?.some((r: any) => r.role === "admin")) return json({ error: "forbidden" }, 403);
      const id = body.id as string;
      const status = body.status as string;
      const note = body.note as string | undefined;
      const tx_hash = body.tx_hash as string | undefined;
      const { data: wd } = await admin.from("withdrawals").select("*").eq("id", id).single();
      if (!wd) return json({ error: "not_found" }, 404);
      // If rejecting a pending one, refund balance
      if (["pending", "approved", "processing"].includes(wd.status) && status === "rejected") {
        const { data: p } = await admin.from("profiles").select("balance").eq("id", wd.user_id).single();
        if (p) await admin.from("profiles").update({ balance: Number(p.balance) + Number(wd.amount) }).eq("id", wd.user_id);
      }
      await admin.from("withdrawals").update({
        status, admin_note: note ?? wd.admin_note, tx_hash: tx_hash ?? wd.tx_hash, processed_at: new Date().toISOString(),
      }).eq("id", id);
      await admin.from("notifications").insert({
        user_id: wd.user_id,
        title: `Withdrawal ${status}`,
        body: status === "paid" && tx_hash ? `TX: ${tx_hash}` : (note ?? null),
      });
      return json({ ok: true });
    }

    if (action === "promote_self_first_admin") {
      // bootstrap: only succeeds if there are zero admins
      const { count } = await admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
      if ((count ?? 0) > 0) return json({ error: "already_set" }, 403);
      await admin.from("user_roles").insert({ user_id: uid, role: "admin" });
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
