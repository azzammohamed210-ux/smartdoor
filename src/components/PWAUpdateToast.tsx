import { useEffect, useState, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Rocket, X, RefreshCw } from "lucide-react";
import { translations, type Lang } from "../locales";

const CLEAR_CACHE_ON_UPDATE = async () => {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }
};

export default function PWAUpdateToast({ lang }: { lang: Lang }) {
  const t = translations[lang];
  const [showToast, setShowToast] = useState(false);
  const [updating, setUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) {
        setInterval(() => registration.update().catch(() => {}), 30000);
      }
    },
    onOfflineReady() {},
  });

  useEffect(() => {
    if (needRefresh) setShowToast(true);
  }, [needRefresh]);

  const handleUpdate = useCallback(async () => {
    setUpdating(true);
    try {
      await CLEAR_CACHE_ON_UPDATE();
      setNeedRefresh(false);
      setShowToast(false);
      updateServiceWorker(true);
    } catch {
      window.location.reload();
    }
  }, [setNeedRefresh, setShowToast, updateServiceWorker]);

  const handleDismiss = () => {
    setShowToast(false);
    setNeedRefresh(false);
  };

  if (!showToast) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-[slideUp_0.3s_ease-out] px-2"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3.5 shadow-2xl ring-1 ring-white/10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
          <Rocket className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            {lang === "ar" ? "تحديث جديد متاح - اضغط للتحديث" : "New update available - Tap to update"}
          </p>
          <p className="text-xs text-slate-400">
            {lang === "ar" ? "نسخة محسنة جاهزة للتثبيت" : "Improved version ready to install"}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl active:scale-95 disabled:opacity-60"
        >
          {updating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <span>{lang === "ar" ? "تحديث الآن" : "Update Now"}</span>
          )}
        </button>
      </div>
    </div>
  );
}
