import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { translations, type Lang } from "../locales";

export default function PWAUpdateToast({ lang }: { lang: Lang }) {
  const _t = translations[lang];
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Check for updates every 60 seconds while the app is open
      setInterval(() => registration.update().catch(() => {}), 60000);
    },
    onOfflineReady() {},
  });

  // Auto-apply updates silently — no toast prompt.
  // When a new version is detected, clear old caches and reload immediately.
  useEffect(() => {
    if (!needRefresh) return;
    (async () => {
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        setNeedRefresh(false);
        await updateServiceWorker(true);
      } catch {
        window.location.reload();
      }
    })();
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  // Also check for updates when the window regains focus (user returns to the app)
  useEffect(() => {
    const onFocus = () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) =>
          regs.forEach((r) => r.update().catch(() => {}))
        );
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onFocus();
    });
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  return null;
}
