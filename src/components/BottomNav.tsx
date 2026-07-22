import { LayoutDashboard, ClipboardList, Package, Settings, MapPin, Database } from "lucide-react";
import type { Lang, Strings } from "../locales";

export type Tab = "dashboard" | "orders" | "inventory" | "management" | "map" | "customers";

interface Props {
  lang: Lang;
  t: Strings;
  active: Tab;
  onChange: (tab: Tab) => void;
  isAdmin: boolean;
}

export default function BottomNav({ lang, t, active, onChange, isAdmin }: Props) {
  type TabKey = Tab;
  const tabs: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "dashboard", label: t.dashboard, icon: LayoutDashboard },
    { key: "orders", label: t.workOrders, icon: ClipboardList },
    { key: "map", label: isAdmin ? t.adminMap : t.techMap, icon: MapPin },
    { key: "inventory", label: t.inventory, icon: Package },
  ];
  if (isAdmin) {
    tabs.push({ key: "customers", label: t.customerDatabaseTitle, icon: Database });
    tabs.push({ key: "management", label: t.management, icon: Settings });
  }
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto flex max-w-3xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 transition ${
                isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {isActive && <span className="absolute bottom-0 h-0.5 w-10 rounded-t-full bg-blue-600" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
