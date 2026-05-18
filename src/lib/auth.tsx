import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  username: string;
  balance: number;
  total_earned: number;
  referral_code: string;
  telegram_username: string | null;
  usdt_trc20_wallet: string | null;
  language: string;
  streak_days: number;
  last_daily_claim_at: string | null;
  avatar_url: string | null;
}

interface Ctx {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile(prof as any);
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setIsAdmin(!!roles?.some((r: any) => r.role === "admin"));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Realtime balance updates
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("profile-" + user.id)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => setProfile(payload.new as any)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <AuthCtx.Provider
      value={{
        session,
        user,
        profile,
        isAdmin,
        loading,
        refreshProfile: async () => { if (user) await loadProfile(user.id); },
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
