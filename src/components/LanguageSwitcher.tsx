import { Globe } from "lucide-react";
import type { Lang } from "../locales";

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export default function LanguageSwitcher({ lang, setLang }: Props) {
  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25"
    >
      <Globe className="h-4 w-4" />
      <span>{lang === "ar" ? "EN" : "العربية"}</span>
    </button>
  );
}
