
DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard WITH (security_invoker=true) AS
SELECT id, username, avatar_url, total_earned, balance
FROM public.profiles
WHERE banned = false
ORDER BY total_earned DESC
LIMIT 100;
GRANT SELECT ON public.leaderboard TO authenticated;

-- Need an RLS policy to let any authenticated user see the public leaderboard fields
CREATE POLICY "authenticated can read leaderboard fields" ON public.profiles
FOR SELECT TO authenticated USING (banned = false);

-- touch_updated_at: set search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Lock down has_role execution (only authenticated)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
