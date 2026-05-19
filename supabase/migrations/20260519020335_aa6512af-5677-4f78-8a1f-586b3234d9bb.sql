UPDATE public.app_settings
SET demo_mode = false,
    ad_daily_limit = 200,
    ad_cooldown_seconds = 15,
    ad_reward = 0.02,
    daily_reward = 0.10,
    referral_reward = 1.00
WHERE id = 1;