import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { fmtUSD } from "@/lib/utils";
import { Trophy } from "lucide-react";

function LeaderboardPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("leaderboard").select("*").then(({ data }) => setRows(data ?? []));
  }, []);

  return (
    <AppShell>
      <div className="glass-gold p-5 mb-4 text-center fade-up">
        <Trophy className="mx-auto text-gold mb-2" />
        <h1 className="font-bold text-lg">{t("leaderboard")}</h1>
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.id} className="glass p-3 flex items-center gap-3 fade-up">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${i < 3 ? "bg-gradient-to-br from-yellow-300 to-amber-600 text-black" : "bg-white/5 text-muted-foreground"}`}>
              {i + 1}
            </div>
            <div className="flex-1 min-w-0 truncate font-semibold">{r.username}</div>
            <div className="text-sm text-gold font-mono">{fmtUSD(r.total_earned)}</div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export const Route = createFileRoute("/leaderboard")({ component: LeaderboardPage });
