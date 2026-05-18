import { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { BottomNav } from "./BottomNav";
import { LangToggle } from "./LangToggle";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";

export function AppShell({ children, requireAdmin }: { children: ReactNode; requireAdmin?: boolean }) {
  const { user, loading, isAdmin, profile } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("loading")}</div>;
  }
  if (!user) return <Navigate to="/auth" />;
  if (requireAdmin && !isAdmin) return <Navigate to="/earn" />;

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link to="/earn" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-300 to-amber-600 flex items-center justify-center font-bold text-black text-sm">G</div>
          <span className="font-bold text-sm gold-gradient-text">GoldEarn</span>
        </Link>
        <div className="flex items-center gap-2">
          {isAdmin && <Link to="/admin" className="text-xs text-gold glass px-2 py-1">{t("admin")}</Link>}
          <Link to="/leaderboard" className="text-xs glass px-2 py-1 hover:bg-white/5">🏆</Link>
          <LangToggle />
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
