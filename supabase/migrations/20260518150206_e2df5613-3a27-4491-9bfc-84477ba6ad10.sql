
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  balance NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_earned NUMERIC(18,4) NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.profiles(id),
  telegram_username TEXT,
  usdt_trc20_wallet TEXT,
  language TEXT NOT NULL DEFAULT 'ku',
  banned BOOLEAN NOT NULL DEFAULT false,
  last_daily_claim_at TIMESTAMPTZ,
  streak_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admin all profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Leaderboard view (public to authenticated users, only username + earnings)
CREATE VIEW public.leaderboard AS
SELECT id, username, avatar_url, total_earned, balance
FROM public.profiles
WHERE banned = false
ORDER BY total_earned DESC
LIMIT 100;
GRANT SELECT ON public.leaderboard TO authenticated;

-- Tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ku TEXT,
  description TEXT,
  description_ku TEXT,
  reward NUMERIC(18,4) NOT NULL DEFAULT 0,
  task_type TEXT NOT NULL DEFAULT 'link', -- link, telegram, ad, daily
  url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  cooldown_hours INT NOT NULL DEFAULT 24,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view active tasks" ON public.tasks FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage tasks" ON public.tasks FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Task completions
CREATE TABLE public.task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reward NUMERIC(18,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.task_completions (user_id, task_id, created_at);
CREATE POLICY "view own completions" ON public.task_completions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Ad views
CREATE TABLE public.ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward NUMERIC(18,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_views ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.ad_views (user_id, created_at);
CREATE POLICY "view own ad views" ON public.ad_views FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Referrals
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_paid NUMERIC(18,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.has_role(auth.uid(),'admin'));

-- Withdrawals
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(18,4) NOT NULL,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'TRC20',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, paid
  tx_hash TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.withdrawals (user_id, created_at);
CREATE POLICY "view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage withdrawals" ON public.withdrawals FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.notifications (user_id, created_at);
CREATE POLICY "view own notifs" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "update own notifs" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin manage notifs" ON public.notifications FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- App settings (single row, key/value-ish)
CREATE TABLE public.app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  demo_mode BOOLEAN NOT NULL DEFAULT true,
  ad_reward NUMERIC(18,4) NOT NULL DEFAULT 0.01,
  daily_reward NUMERIC(18,4) NOT NULL DEFAULT 0.05,
  referral_reward NUMERIC(18,4) NOT NULL DEFAULT 0.50,
  min_withdrawal NUMERIC(18,4) NOT NULL DEFAULT 0,
  telegram_channel TEXT DEFAULT 'https://t.me/yourchannel',
  ad_daily_limit INT NOT NULL DEFAULT 50,
  ad_cooldown_seconds INT NOT NULL DEFAULT 30,
  CONSTRAINT one_row CHECK (id = 1)
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "admin write settings" ON public.app_settings FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.app_settings (id) VALUES (1);

-- Trigger: create profile + assign user role + handle referral on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_username TEXT;
  v_ref_code TEXT;
  v_referrer UUID;
  v_ref_input TEXT;
BEGIN
  v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1), 'user_'||substr(NEW.id::text,1,6));
  -- ensure unique
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
    v_username := v_username || '_' || substr(NEW.id::text,1,4);
  END IF;
  v_ref_code := upper(substr(replace(NEW.id::text,'-',''),1,8));

  v_ref_input := NEW.raw_user_meta_data->>'ref';
  IF v_ref_input IS NOT NULL THEN
    SELECT id INTO v_referrer FROM public.profiles WHERE referral_code = upper(v_ref_input) LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, username, email, referral_code, referred_by, language)
  VALUES (NEW.id, v_username, NEW.email, v_ref_code, v_referrer, COALESCE(NEW.raw_user_meta_data->>'language','ku'));

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF v_referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id) VALUES (v_referrer, NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
