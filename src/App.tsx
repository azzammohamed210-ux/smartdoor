import { useEffect, useState, useRef } from "react";
import { LogOut, DoorOpen } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { translations, type Lang } from "./locales";
import { getCurrentUser, logout, fetchTechnicians, fetchProducts, fetchWorkOrders, isTechnicianActive, type MockUser } from "./lib/storage";
import type { Technician, Product, WorkOrder } from "./types";
import LanguageSwitcher from "./components/LanguageSwitcher";
import LoginScreen from "./components/LoginScreen";
import DashboardView from "./components/DashboardView";
import InvoicePreviewModal from "./components/InvoicePreviewModal";
import WorkOrdersView from "./components/WorkOrdersView";
import InventoryView from "./components/InventoryView";
import TechniciansView from "./components/TechniciansView";
import BottomNav, { type Tab } from "./components/BottomNav";
import MapView from "./components/MapView";
import BulkImportModal from "./components/BulkImportModal";
import CustomerDatabaseView from "./components/CustomerDatabaseView";
import PWAUpdateToast from "./components/PWAUpdateToast";

export default function App() {
  const [lang, setLang] = useState<Lang>("ar");
  const [user, setUser] = useState<MockUser | null>(getCurrentUser());
  const [tab, setTab] = useState<Tab>("dashboard");
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<WorkOrder | null>(null);
  const [deactivated, setDeactivated] = useState(false);

  const t = translations[lang];
  const isAdmin = user?.role === "admin";

  // Android hardware/browser back button handling.
  // Priority: open modals → sub-pages → dashboard (exit app).
  useEffect(() => {
    if (!user) return;
    const handler = (e: PopStateEvent) => {
      const anyModalOpen = invoiceOrder || showMap || showBulkImport || tab === "map";
      if (anyModalOpen) {
        // A modal/sub-view is open: close it and stay in app.
        if (invoiceOrder) setInvoiceOrder(null);
        else if (showBulkImport) setShowBulkImport(false);
        else if (showMap) setShowMap(false);
        else if (tab === "map") setTab("dashboard");
        // Restore history so the next back still works.
        history.pushState(null, "", location.href);
      } else if (tab !== "dashboard") {
        // On a sub-page: return to dashboard.
        setTab("dashboard");
        history.pushState(null, "", location.href);
      }
      // On dashboard: let the default back behavior exit the app/page.
    };
    // Seed a history entry so we can intercept back.
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [user, tab, invoiceOrder, showMap, showBulkImport]);

  const loadData = async () => {
    setLoading(true);
    const [techs, prods, ords] = await Promise.all([
      fetchTechnicians(),
      fetchProducts(),
      fetchWorkOrders(),
    ]);
    setTechnicians(techs);
    setProducts(prods);
    setOrders(ords);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Real-time subscriptions: reflect backend changes instantly across all devices
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("smartdoor-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "technicians" }, () => fetchTechnicians().then(setTechnicians))
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts().then(setProducts))
      .on("postgres_changes", { event: "*", schema: "public", table: "work_orders" }, () => fetchWorkOrders().then(setOrders))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const currentTech = technicians.find(tc => tc.email === user?.technicianEmail) || null;
  const visibleOrders = user?.role === "technician"
    ? orders.filter(o => currentTech && o.technician_id === currentTech.id)
    : orders;

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  // Real-time session validation: if a technician's account is deactivated
  // in the database while they're logged in, immediately terminate their session.
  useEffect(() => {
    if (!user || user.role !== "technician") return;
    let cancelled = false;
    const checkActive = async () => {
      const active = await isTechnicianActive(user.technicianEmail || user.email);
      if (!cancelled && !active) {
        logout();
        setUser(null);
        setDeactivated(true);
      }
    };
    checkActive();
    const interval = setInterval(checkActive, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  if (!user) {
    return (
      <>
        <div className="fixed top-4 ltr:right-4 rtl:left-4 z-50">
          <LanguageSwitcher lang={lang} setLang={setLang} />
        </div>
        <LoginScreen lang={lang} t={t} deactivated={deactivated} onLogin={(u) => { setDeactivated(false); setUser(u); }} />
      </>
    );
  }

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 pb-20">
      <header
        className="px-4 pb-6 pt-5 text-white sm:px-6"
        style={{ background: "linear-gradient(135deg, #1e75e6 0%, #0066fe 100%)" }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <DoorOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">{t.appTitle}</h1>
                <p className="text-xs text-blue-100">{t.appSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher lang={lang} setLang={setLang} />
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm text-blue-100">
            {t.welcome}، {user.name}
            <span className="mx-2 rounded-full bg-white/15 px-2 py-0.5 text-xs">
              {user.role === "admin" ? t.roleAdmin : t.roleTechnician}
            </span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {loading ? (
          <div className="py-20 text-center text-slate-400">...</div>
        ) : (
          <>
            {tab === "dashboard" && (
              <DashboardView
                lang={lang}
                t={t}
                orders={visibleOrders}
                inventory={products}
                onOpenMap={() => setShowMap(true)}
                onBulkImport={() => setShowBulkImport(true)}
                isAdmin={isAdmin}
                onRefresh={loadData}
                onInvoice={setInvoiceOrder}
              />
            )}
            {tab === "orders" && (
              <WorkOrdersView
                lang={lang}
                t={t}
                orders={visibleOrders}
                technicians={technicians}
                products={products}
                isAdmin={isAdmin}
                currentTechId={currentTech?.id}
                onRefresh={loadData}
              />
            )}
            {tab === "inventory" && (
              <InventoryView lang={lang} t={t} products={products} isAdmin={isAdmin} onRefresh={loadData} />
            )}
            {tab === "management" && isAdmin && (
              <div className="space-y-8">
                <TechniciansView lang={lang} t={t} technicians={technicians} onRefresh={loadData} />
                <InventoryView lang={lang} t={t} products={products} isAdmin={isAdmin} onRefresh={loadData} />
              </div>
            )}
            {tab === "customers" && isAdmin && (
              <CustomerDatabaseView
                lang={lang}
                t={t}
                technicians={technicians}
                products={products}
              />
            )}
          </>
        )}
      </main>

      <BottomNav lang={lang} t={t} active={tab} onChange={setTab} isAdmin={isAdmin} />

      {tab === "map" && (
        <MapView
          lang={lang}
          t={t}
          orders={visibleOrders}
          technician={currentTech}
          technicians={technicians}
          isAdmin={isAdmin}
          onClose={() => setTab("dashboard")}
        />
      )}

      {showMap && (
        <MapView
          lang={lang}
          t={t}
          orders={visibleOrders}
          technician={currentTech}
          technicians={technicians}
          isAdmin={isAdmin}
          onClose={() => setShowMap(false)}
        />
      )}

      {showBulkImport && isAdmin && (
        <BulkImportModal
          lang={lang}
          t={t}
          technicians={technicians}
          onClose={() => setShowBulkImport(false)}
          onDispatched={loadData}
        />
      )}

      <PWAUpdateToast lang={lang} />

      {invoiceOrder && (
        <InvoicePreviewModal
          lang={lang}
          t={t}
          order={invoiceOrder}
          products={products}
          onConfirm={() => setInvoiceOrder(null)}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
