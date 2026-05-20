import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";

function TermsPage() {
  const { t, lang } = useI18n();
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-300 to-amber-600 flex items-center justify-center font-bold text-black text-sm">G</div>
          <span className="font-bold text-sm gold-gradient-text">GoldEarn</span>
        </Link>
        <LangToggle />
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="glass p-6">
          <h1 className="text-2xl font-bold gold-gradient-text mb-4">{t("terms")}</h1>
          {lang === "ku" ? (
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>بە بەکارهێنانی GoldEarn، تۆ ڕازی دەبیت بەم مەرجانە. پلاتفۆرمەکە تەنها باڵانسی ڕاستەقینەی قابل دەرکردن پیشان دەدات.</p>
              <p>هیچ گەرەنتیەک نییە بۆ بڕی پارەی بەدەستهاتوو. هەر هەژمارێک کە سپام یاخود بۆت بەکاربهێنێت، ڕاستەوخۆ هەڵدەوەشێتەوە.</p>
              <p>دەرکردنی USDT TRC20 ڕاستەوخۆ لەسەر بلاکچەینە؛ شێوازەکانی تر دەچنە ڕیزی بەڕێوەبەر بۆ پارەدان لە هەژماری خاوەن.</p>
              <p>زانیاری کەسی تۆ بە پارێزراوی هەڵدەگیرێت و بۆ هیچ لایەنێکی سێیەم ناڕەوانێت.</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>By using GoldEarn you agree to these terms. The platform displays only real withdrawable balances.</p>
              <p>No guarantee is made on the amount you can earn. Any account that uses spam or bots is removed immediately.</p>
              <p>USDT TRC20 withdrawals are sent live on-chain; other withdrawal methods go to the admin queue for manual payment by the owner.</p>
              <p>Your personal data is stored securely and never shared with third parties.</p>
            </div>
          )}
          <Link to="/" className="btn-gold inline-block mt-6 px-5 py-2">Home</Link>
        </div>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/terms")({ component: TermsPage });
