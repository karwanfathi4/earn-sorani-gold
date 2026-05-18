import { Link, useLocation } from "@tanstack/react-router";
import { Home, Coins, Users, Wallet, User as UserIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const items = [
    { to: "/earn", icon: Coins, label: t("earn") },
    { to: "/referrals", icon: Users, label: t("referrals") },
    { to: "/withdraw", icon: Wallet, label: t("withdraw") },
    { to: "/profile", icon: UserIcon, label: t("profile") },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      <div className="glass max-w-md mx-auto flex justify-around items-center py-2 px-2 rounded-2xl">
        {items.map(({ to, icon: Icon, label }) => {
          const active = pathname.startsWith(to);
          return (
            <Link key={to} to={to} className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition",
              active ? "text-gold" : "text-muted-foreground hover:text-foreground"
            )}>
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
