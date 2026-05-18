import { useI18n } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "ku" ? "en" : "ku")}
      className="glass px-3 py-1.5 text-xs hover:bg-white/5 transition"
      aria-label="toggle language"
    >
      {lang === "ku" ? "EN" : "کوردی"}
    </button>
  );
}
