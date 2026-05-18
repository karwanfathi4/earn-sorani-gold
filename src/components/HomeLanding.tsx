import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Coins, Users, Wallet, TrendingUp, ShieldCheck, Send } from "lucide-react";
import { LangToggle } from "@/components/LangToggle";

export function HomeLanding() {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-300 to-amber-600 flex items-center justify-center font-bold text-black">G</div>
          <span className="font-bold text-lg gold-gradient-text">GoldEarn</span>
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          {user ? (
            <Link to="/earn" className="btn-gold px-4 py-2 text-sm">{t("earn")}</Link>
          ) : (
            <Link to="/auth" className="btn-gold px-4 py-2 text-sm">{t("sign_in")}</Link>
          )}
        </div>
      </header>

      <main className="px-4 sm:px-8 max-w-6xl mx-auto">
        <section className="text-center py-12 sm:py-20 fade-up">
          <div className="inline-flex items-center gap-2 glass-gold px-4 py-1.5 text-xs mb-6 text-gold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            USDT TRC20 · Real-time payouts
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight">
            <span className="gold-gradient-text">{t("app_name")}</span>
            <br />
            <span className="text-foreground">{t("tagline")}</span>
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl mx-auto">{t("sub_tagline")}</p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Link to={user ? "/earn" : "/auth"} className="btn-gold px-7 py-3">{t("get_started")}</Link>
            <Link to="/leaderboard" className="glass px-7 py-3 hover:bg-white/5">{t("leaderboard")}</Link>
          </div>
        </section>

        <section className="grid sm:grid-cols-3 gap-4 my-12">
          {[
            { icon: TrendingUp, t: t("watch_ad"), d: t("ad_reward") },
            { icon: Users, t: t("referrals"), d: t("referral_reward_desc") },
            { icon: Wallet, t: t("withdraw"), d: "USDT TRC20" },
          ].map((f, i) => (
            <div key={i} className="glass p-6 fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <f.icon className="text-gold mb-3" size={28} />
              <h3 className="font-semibold text-lg">{f.t}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
            </div>
          ))}
        </section>

        <section className="glass-gold p-6 my-8 text-center">
          <Send className="inline text-gold mb-2" />
          <p className="text-sm">{t("telegram_channel")}</p>
          <a href="https://t.me/yourchannel" target="_blank" rel="noopener noreferrer" className="btn-gold inline-block mt-3 px-5 py-2 text-sm">{t("join")}</a>
        </section>

        <footer className="text-center py-8 text-xs text-muted-foreground border-t border-white/5 mt-8">
          <Link to="/terms" className="hover:text-gold">{t("terms")}</Link>
          <p className="mt-2">© 2026 GoldEarn</p>
        </footer>
      </main>
    </div>
  );
}
