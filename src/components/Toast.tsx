import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { CheckCircle2, XCircle, Rocket, Coins, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  icon: "check" | "cancel" | "rocket" | "cash";
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, icon?: "check" | "cancel" | "rocket" | "cash") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let toastId = 0;

const NOTIFICATION_TITLES: Record<ToastType, { ar: string; en: string }> = {
  success: { ar: "نجاح", en: "Success" },
  error: { ar: "تنبيه", en: "Alert" },
  info: { ar: "إشعار", en: "Notice" },
};

function fireSystemNotification(message: string, type: ToastType) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "granted") {
    const title = NOTIFICATION_TITLES[type];
    try {
      new Notification(title.en, {
        body: message,
        icon: "/pwa-192x192.png",
        tag: "smart-door-oman",
      });
    } catch {
      // ignore notification errors
    }
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success", icon: "check" | "cancel" | "rocket" | "cash" = "check") => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, icon }]);
    fireSystemNotification(message, type);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2 px-4" style={{ pointerEvents: "none" }}>
        {toasts.map(t => {
          const colorMap = {
            success: "bg-emerald-600",
            error: "bg-red-600",
            info: "bg-blue-600",
          };
          const iconMap = {
            check: <CheckCircle2 className="h-5 w-5 text-white" />,
            cancel: <XCircle className="h-5 w-5 text-white" />,
            rocket: <Rocket className="h-5 w-5 text-white" />,
            cash: <Coins className="h-5 w-5 text-white" />,
          };
          return (
            <div
              key={t.id}
              onClick={() => dismiss(t.id)}
              className={`flex items-center gap-2.5 rounded-2xl ${colorMap[t.type]} px-4 py-3 shadow-2xl ring-1 ring-white/20 transition-all`}
              style={{ pointerEvents: "auto", animation: "toastSlideIn 0.3s ease-out" }}
            >
              {iconMap[t.icon]}
              <span className="text-sm font-semibold text-white whitespace-nowrap">{t.message}</span>
              <X className="h-4 w-4 text-white/60 hover:text-white" />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
