import { useState, useMemo, useEffect, useCallback } from "react";
import { X, Calendar, BarChart3, ClipboardList, CheckCircle2 } from "lucide-react";
import type { Lang, Strings } from "../locales";
import type { WorkOrder, Technician, Product } from "../types";
import { toArabicNumber, fetchAllCompletedOrders, fetchCashCollections, markCashCollected, type CashCollection } from "../lib/storage";

interface Props {
  lang: Lang;
  t: Strings;
  orders: WorkOrder[];
  technicians: Technician[];
  products: Product[];
  onClose: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info", icon?: "check" | "cancel" | "rocket" | "cash") => void;
}

type Mode = "today" | "date" | "full";

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toArabicDate(dateStr: string, lang: Lang): string {
  if (lang === "ar") {
    const [y, m, d] = dateStr.split("-");
    return `${toArabicNumber(parseInt(d))}/${toArabicNumber(parseInt(m))}/${toArabicNumber(parseInt(y))}`;
  }
  return dateStr;
}

export default function ConsumptionReportModal({ lang, t, orders, technicians, products, onClose, showToast }: Props) {
  const todayStr = toDateStr(new Date());
  const [mode, setMode] = useState<Mode>("today");
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [allCompleted, setAllCompleted] = useState<WorkOrder[]>([]);
  const [collections, setCollections] = useState<CashCollection[]>([]);
  const [collectingTechs, setCollectingTechs] = useState<Set<string>>(new Set());

  // Fetch ALL completed orders (including archived) + existing cash collections on mount
  useEffect(() => {
    (async () => {
      const [completed, cols] = await Promise.all([
        fetchAllCompletedOrders(),
        fetchCashCollections(),
      ]);
      setAllCompleted(completed);
      setCollections(cols);
    })();
  }, []);

  const refreshCollections = useCallback(async () => {
    const cols = await fetchCashCollections();
    setCollections(cols);
  }, []);

  // Filter by mode
  const filteredOrders = useMemo(() => {
    if (mode === "full") return allCompleted;
    const dateStr = mode === "today" ? todayStr : selectedDate;
    return allCompleted.filter(o => {
      const oDate = new Date(o.updated_at || o.created_at);
      return toDateStr(oDate) === dateStr;
    });
  }, [allCompleted, mode, todayStr, selectedDate]);

  // Per-technician breakdown
  const techBreakdown = useMemo(() => {
    const map = new Map<string, { tech: Technician; products: Map<string, { product: Product; qty: number }> }>();
    for (const o of filteredOrders) {
      if (!o.technician_id) continue;
      const tech = technicians.find(tc => tc.id === o.technician_id);
      if (!tech) continue;
      let entry = map.get(o.technician_id);
      if (!entry) {
        entry = { tech, products: new Map() };
        map.set(o.technician_id, entry);
      }
      const pids = o.product_ids && o.product_ids.length ? o.product_ids : (o.product_id ? [o.product_id] : []);
      for (const pid of pids) {
        const product = products.find(p => p.id === pid);
        if (!product) continue;
        let pe = entry.products.get(pid);
        if (!pe) {
          pe = { product, qty: 0 };
          entry.products.set(pid, pe);
        }
        pe.qty += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => a.tech.name.localeCompare(b.tech.name));
  }, [filteredOrders, technicians, products]);

  // Grand total per product
  const grandTotal = useMemo(() => {
    const map = new Map<string, { product: Product; qty: number }>();
    for (const o of filteredOrders) {
      const pids = o.product_ids && o.product_ids.length ? o.product_ids : (o.product_id ? [o.product_id] : []);
      for (const pid of pids) {
        const product = products.find(p => p.id === pid);
        if (!product) continue;
        let pe = map.get(pid);
        if (!pe) {
          pe = { product, qty: 0 };
          map.set(pid, pe);
        }
        pe.qty += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [filteredOrders, products]);

  // Cash amount per technician for the current view
  const techCashMap = useMemo(() => {
    const map = new Map<string, { total: number; orders: WorkOrder[] }>();
    for (const o of filteredOrders) {
      if (!o.technician_id || o.payment_method !== "cash") continue;
      let entry = map.get(o.technician_id);
      if (!entry) {
        entry = { total: 0, orders: [] };
        map.set(o.technician_id, entry);
      }
      entry.total += o.amount || 0;
      entry.orders.push(o);
    }
    return map;
  }, [filteredOrders]);

  // Check if a technician's cash is already collected for the current view
  const isTechCollected = useCallback((techId: string): boolean => {
    if (mode === "full") {
      return collections.some(c => c.technician_id === techId);
    }
    const dateStr = mode === "today" ? todayStr : selectedDate;
    return collections.some(c => c.technician_id === techId && c.collection_date === dateStr);
  }, [collections, mode, todayStr, selectedDate]);

  // Handle cash collection
  const handleCollect = async (techId: string) => {
    const cashData = techCashMap.get(techId);
    if (!cashData || cashData.orders.length === 0) return;
    setCollectingTechs(prev => new Set(prev).add(techId));
    const dateStr = mode === "today" ? todayStr : mode === "date" ? selectedDate : todayStr;
    for (const order of cashData.orders) {
      await markCashCollected(techId, order.id, order.amount, dateStr);
    }
    await refreshCollections();
    setCollectingTechs(prev => { const next = new Set(prev); next.delete(techId); return next; });
    const techName = technicians.find(tc => tc.id === techId)?.name || "";
    showToast(t.toastCashCollected.replace("{name}", techName), "success", "cash");
  };

  const totalInstallations = filteredOrders.length;
  const totalCashForView = Array.from(techCashMap.values()).reduce((s, e) => s + e.total, 0);

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm">
      <div className="my-4 w-full max-w-3xl rounded-3xl bg-slate-50 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">{t.consumptionReportTitle}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="space-y-3 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMode("today")}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "today" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.consumptionToday}
            </button>
            <button
              onClick={() => setMode("full")}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                mode === "full" ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.consumptionFullReport}
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setMode("date"); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Summary badge */}
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              {mode === "full"
                ? (lang === "ar" ? "جميع التواريخ" : "All dates")
                : mode === "today"
                  ? toArabicDate(todayStr, lang)
                  : toArabicDate(selectedDate, lang)}
              {" · "}
              {t.consumptionTotalInstallations}: {toArabicNumber(totalInstallations)}
            </span>
          </div>

          {/* Cash summary badge */}
          {totalCashForView > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5">
              <span className="text-sm font-bold text-amber-600">{lang === "ar" ? "ر.ع" : "OMR"}</span>
              <span className="text-sm font-medium text-amber-700">
                {mode === "full" ? t.cashTotalAllTime : t.cashTotalForDay}: {toArabicNumber(Number(totalCashForView.toFixed(3)))} {lang === "ar" ? "ر.ع" : "OMR"}
              </span>
            </div>
          )}
        </div>

        {/* Technician cards */}
        <div className="space-y-3 px-5 pb-4">
          {techBreakdown.length === 0 && grandTotal.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center text-slate-400 shadow-sm ring-1 ring-slate-100">
              {t.consumptionNoData}
            </div>
          ) : (
            <>
              {techBreakdown.map(({ tech, products: prodMap }) => {
                const entries = Array.from(prodMap.values()).sort((a, b) => b.qty - a.qty);
                const techTotal = entries.reduce((s, e) => s + e.qty, 0);
                const cashData = techCashMap.get(tech.id);
                const cashAmount = cashData?.total || 0;
                const hasCash = cashAmount > 0;
                const collected = isTechCollected(tech.id);
                const isCollecting = collectingTechs.has(tech.id);

                return (
                  <div key={tech.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
                    {/* Card header: technician name + cash button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold">
                          {tech.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-white">{tech.name}</span>
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                          {toArabicNumber(techTotal)} {lang === "ar" ? "تركيب" : "installs"}
                        </span>
                      </div>
                      {/* Cash collection button */}
                      {hasCash && (
                        <button
                          onClick={() => handleCollect(tech.id)}
                          disabled={collected || isCollecting}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition-all ${
                            collected
                              ? "bg-emerald-500 text-white shadow-emerald-300/50"
                              : "bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md active:scale-95"
                          } ${isCollecting ? "opacity-60" : ""}`}
                        >
                          {collected ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {t.cashCollected}: {toArabicNumber(Number(cashAmount.toFixed(3)))} {lang === "ar" ? "ر.ع" : "OMR"}
                            </>
                          ) : (
                            <>
                              <span className="font-bold">{lang === "ar" ? "ر.ع" : "OMR"}</span>
                              {t.cashCollection}: {toArabicNumber(Number(cashAmount.toFixed(3)))} {lang === "ar" ? "ر.ع" : "OMR"}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {/* Card body: products list */}
                    <div className="divide-y divide-slate-50">
                      {entries.map(({ product, qty }) => (
                        <div key={product.id} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">{product.name_ar}</span>
                            <span className="text-xs text-slate-400">{product.code}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700">
                              {toArabicNumber(qty)}
                            </span>
                            <span className="text-xs text-slate-400">{t.consumptionQuantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Grand total card */}
              {grandTotal.length > 0 && (
                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg ring-1 ring-slate-700">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                      <span className="font-bold text-white">
                        {mode === "full" ? t.consumptionGrandTotal : t.consumptionTotalInstallations}
                      </span>
                    </div>
                    <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                      {toArabicNumber(grandTotal.reduce((s, e) => s + e.qty, 0))} {lang === "ar" ? "وحدة" : "units"}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-700/50">
                    {grandTotal.map(({ product, qty }) => (
                      <div key={product.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">{product.name_ar}</span>
                          <span className="text-xs text-slate-500">{product.code}</span>
                        </div>
                        <span className="rounded-lg bg-blue-500/20 px-3 py-1 text-sm font-bold text-blue-300">
                          {toArabicNumber(qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
