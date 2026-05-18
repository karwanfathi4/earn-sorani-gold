import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { LangToggle } from "@/components/LangToggle";
import { toast } from "sonner";

function AuthPage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      const r = u.searchParams.get("ref");
      if (r) setRef(r.toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (!loading && user) nav({ to: "/earn" });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (username.trim().length < 3) throw new Error("Username too short");
        if (password.length < 6) throw new Error("Password too short");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username.trim(), ref: ref.trim() || null },
          },
        });
        if (error) throw error;
        toast.success(t("success"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      nav({ to: "/earn" });
    } catch (err: any) {
      toast.error(err.message || t("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 max-w-md w-full mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-300 to-amber-600 flex items-center justify-center font-bold text-black text-sm">G</div>
          <span className="font-bold text-sm gold-gradient-text">GoldEarn</span>
        </Link>
        <LangToggle />
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="glass w-full max-w-md p-6 fade-up">
          <h1 className="text-2xl font-bold mb-1">{mode === "login" ? t("welcome_back") : t("register_to_start")}</h1>
          <p className="text-sm text-muted-foreground mb-6">{mode === "login" ? t("sign_in") : t("sign_up")}</p>
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input className="input-base" placeholder={t("username")} value={username} onChange={(e) => setUsername(e.target.value)} required />
            )}
            <input className="input-base" type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="input-base" type="password" placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            {mode === "signup" && (
              <input className="input-base" placeholder={t("referral_code")} value={ref} onChange={(e) => setRef(e.target.value.toUpperCase())} />
            )}
            <button disabled={busy} className="btn-gold w-full py-3">
              {busy ? t("loading") : (mode === "login" ? t("sign_in") : t("create_account"))}
            </button>
          </form>
          <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-muted-foreground mt-5 w-full text-center hover:text-gold transition">
            {mode === "login" ? t("no_account") + " " + t("sign_up") : t("have_account") + " " + t("sign_in")}
          </button>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/auth")({ component: AuthPage });
