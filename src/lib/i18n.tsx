import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "ku" | "en";

const dict = {
  ku: {
    app_name: "GoldEarn",
    tagline: "گەشتی کاسبی کریپتۆکەت لێرە دەست پێ بکە",
    sub_tagline: "بەخێر بێیت بۆ پلاتفۆرمی سەرەکی بۆ کاسبی USDT بە بینینی ڕیکلام، تەواوکردنی ئەرک، و بانگکردنی هاوڕێیان.",
    get_started: "دەستپێبکە",
    sign_in: "چوونەژوورەوە",
    sign_up: "خۆتۆمارکردن",
    logout: "چوونەدەرەوە",
    email: "ئیمەیڵ",
    password: "وشەی نهێنی",
    username: "ناوی بەکارهێنەر",
    referral_code: "کۆدی بانگکردن (ئارەزوومەندانە)",
    confirm: "پشتڕاستکردنەوە",
    create_account: "هەژمار دروست بکە",
    have_account: "هەژمارت هەیە؟",
    no_account: "هەژمارت نییە؟",
    home: "سەرەتا",
    earn: "کاسبی",
    referrals: "بانگکردن",
    withdraw: "دەرکردنی پارە",
    profile: "پڕۆفایل",
    admin: "بەڕێوەبردن",
    leaderboard: "ڕیزبەندی",
    terms: "مەرجەکان و تایبەتمەندی",
    balance: "بەکیلۆ",
    total_earned: "کۆی ئەوەی بەدەستهاتووە",
    today: "ئەمڕۆ",
    streak: "زنجیرە",
    days: "ڕۆژ",
    daily_reward: "خەڵاتی ڕۆژانە",
    claim: "وەرگرتن",
    claimed: "وەرگیراوە",
    watch_ad: "بینینی ڕیکلام",
    ad_reward: "خەڵات بۆ هەر ڕیکلامێک",
    tasks: "ئەرکەکان",
    complete: "تەواوکردن",
    completed: "تەواوکراوە",
    referral_link: "بەستەری بانگکردنەکەت",
    copy: "کۆپی",
    copied: "کۆپی کرا",
    invite_friends: "هاوڕێکانت بانگ بکە و قازانج بکە",
    referral_reward_desc: "بۆ هەر هاوڕێیەک کە دێت و خۆی تۆمار دەکات، خەڵات وەردەگریت.",
    your_referrals: "بانگکراوەکانت",
    request_withdraw: "داواکاری دەرکردنی پارە",
    wallet_address: "ناونیشانی جزدانی USDT (TRC20)",
    amount: "بڕی پارە",
    network: "ڕایەڵە",
    submit: "ناردن",
    pending: "چاوەڕێ",
    approved: "ڕەزامەندی",
    rejected: "ڕەتکراوەتەوە",
    paid: "پارەکە نێردراوە",
    history: "مێژوو",
    save: "هەڵگرتن",
    language: "زمان",
    telegram_channel: "بەژدار ببە لە کەناڵی تێلێگرام",
    join: "بەژدار ببە",
    rank: "ڕیز",
    user: "بەکارهێنەر",
    earnings: "داهات",
    notifications: "ئاگاداریەکان",
    no_notifications: "هیچ ئاگاداریەک نییە",
    demo_mode_on: "دۆخی نموونە چالاکە — خەڵاتەکان نموونەن",
    insufficient_balance: "بەکیلۆکەت کەمە",
    invalid_wallet: "ناونیشانی جزدان دروست نییە",
    success: "سەرکەوتوو",
    error: "هەڵە",
    loading: "چاوەڕێبە...",
    ad_cooldown: "تکایە چاوەڕێبە بۆ ڕیکلامی داهاتوو",
    ad_limit_reached: "سنووری ڕۆژانەی ڕیکلامەکان تەواوبووە",
    requested: "ناردرا",
    admin_panel: "پانێڵی بەڕێوەبەر",
    pending_withdrawals: "دەرکردنە چاوەڕێیەکان",
    approve: "ڕەزامەندی",
    reject: "ڕەتکردنەوە",
    mark_paid: "وەک پارەنێردراو نیشان بدە",
    users: "بەکارهێنەران",
    settings: "ڕێکخستنەکان",
    demo_mode: "دۆخی نموونە",
    ad_reward_amount: "بڕی خەڵاتی ڕیکلام",
    daily_reward_amount: "بڕی خەڵاتی ڕۆژانە",
    referral_reward_amount: "بڕی خەڵاتی بانگکردن",
    min_withdrawal: "کەمترین بڕ بۆ دەرکردن",
    welcome_back: "بەخێرهاتنەوە",
    register_to_start: "خۆت تۆمار بکە بۆ دەست پێکردن",
  },
  en: {
    app_name: "GoldEarn",
    tagline: "Start your crypto earning journey here",
    sub_tagline: "Welcome to the premium platform for earning USDT by watching ads, completing tasks, and inviting friends.",
    get_started: "Get Started",
    sign_in: "Sign In",
    sign_up: "Sign Up",
    logout: "Logout",
    email: "Email",
    password: "Password",
    username: "Username",
    referral_code: "Referral code (optional)",
    confirm: "Confirm",
    create_account: "Create account",
    have_account: "Already have an account?",
    no_account: "Don't have an account?",
    home: "Home",
    earn: "Earn",
    referrals: "Referrals",
    withdraw: "Withdraw",
    profile: "Profile",
    admin: "Admin",
    leaderboard: "Leaderboard",
    terms: "Terms & Privacy",
    balance: "Balance",
    total_earned: "Total Earned",
    today: "Today",
    streak: "Streak",
    days: "days",
    daily_reward: "Daily Reward",
    claim: "Claim",
    claimed: "Claimed",
    watch_ad: "Watch Ad",
    ad_reward: "Reward per ad",
    tasks: "Tasks",
    complete: "Complete",
    completed: "Completed",
    referral_link: "Your Referral Link",
    copy: "Copy",
    copied: "Copied",
    invite_friends: "Invite friends, earn more",
    referral_reward_desc: "Earn a reward for every friend who signs up using your link.",
    your_referrals: "Your Referrals",
    request_withdraw: "Request Withdrawal",
    wallet_address: "USDT Wallet Address (TRC20)",
    amount: "Amount",
    network: "Network",
    submit: "Submit",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    paid: "Paid",
    history: "History",
    save: "Save",
    language: "Language",
    telegram_channel: "Join our Telegram channel",
    join: "Join",
    rank: "Rank",
    user: "User",
    earnings: "Earnings",
    notifications: "Notifications",
    no_notifications: "No notifications",
    demo_mode_on: "Demo mode is ON — rewards are simulated",
    insufficient_balance: "Insufficient balance",
    invalid_wallet: "Invalid wallet address",
    success: "Success",
    error: "Error",
    loading: "Loading...",
    ad_cooldown: "Please wait before the next ad",
    ad_limit_reached: "Daily ad limit reached",
    requested: "Submitted",
    admin_panel: "Admin Panel",
    pending_withdrawals: "Pending Withdrawals",
    approve: "Approve",
    reject: "Reject",
    mark_paid: "Mark as paid",
    users: "Users",
    settings: "Settings",
    demo_mode: "Demo mode",
    ad_reward_amount: "Ad reward amount",
    daily_reward_amount: "Daily reward amount",
    referral_reward_amount: "Referral reward amount",
    min_withdrawal: "Minimum withdrawal",
    welcome_back: "Welcome back",
    register_to_start: "Create an account to start earning",
  },
} as const;

type Key = keyof typeof dict["en"];

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
  dir: "rtl" | "ltr";
}

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ku");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (saved === "ku" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ku" ? "rtl" : "ltr";
    }
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (k: Key) => (dict[lang] as Record<string, string>)[k] ?? k;

  return (
    <I18nCtx.Provider value={{ lang, setLang, t, dir: lang === "ku" ? "rtl" : "ltr" }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}
