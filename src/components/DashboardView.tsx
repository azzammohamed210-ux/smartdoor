import { useState, useRef } from "react";
import { TrendingUp, ClipboardList, Users, AlertTriangle, MapPin, Download, Archive, CheckCircle2, Phone, FileText } from "lucide-react";
import type { Lang, Strings } from "../locales";
import type { WorkOrder, Product } from "../types";
import { archiveOrders } from "../lib/storage";
import { toArabicNumber } from "../lib/storage";

interface Props {
  lang: Lang;
  t: Strings;
  orders: WorkOrder[];
  inventory: Product[];
  onOpenMap?: () => void;
  onBulkImport?: () => void;
  isAdmin?: boolean;
  onRefresh?: () => void;
  onInvoice?: (o: WorkOrder) => void;
}

export default function DashboardView({ lang, t, orders, inventory, onOpenMap, onBulkImport, isAdmin, onRefresh, onInvoice }: Props) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [archiving, setArchiving] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const completed = orders.filter(o => o.status === "completed");
  const revenue = completed.reduce((s, o) => s + (o.amount || 0), 0);
  const cash = completed.filter(o => o.payment_method === "cash").reduce((s, o) => s + (o.amount || 0), 0);
  const bank = completed.filter(o => o.payment_method === "bank").reduce((s, o) => s + (o.amount || 0), 0);
  const lowStock = inventory.filter(p => p.total_stock <= p.reorder_level);
  const activeTech = new Set(orders.filter(o => o.status === "in_progress").map(o => o.technician_id)).size;

  const statusCounts = {
    pending: orders.filter(o => o.status === "pending").length,
    in_progress: orders.filter(o => o.status === "in_progress").length,
    completed: completed.length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  };
  const totalStatus = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

  const metrics = [
    { label: t.totalRevenue, value: `${revenue.toFixed(3)} ${lang === "ar" ? "ر.ع" : "OMR"}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: t.totalWorkOrders, value: String(orders.length), icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t.activeTechnicians, value: String(activeTech), icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
    { label: t.lowStockAlerts, value: String(lowStock.length), icon: AlertTriangle, color: "text-slate-500", bg: "bg-slate-100" },
  ];

  const statusBars = [
    { label: t.pending, count: statusCounts.pending, color: "bg-amber-400" },
    { label: t.inProgress, count: statusCounts.in_progress, color: "bg-blue-500" },
    { label: t.completed, count: statusCounts.completed, color: "bg-emerald-500" },
    { label: t.cancelled, count: statusCounts.cancelled, color: "bg-rose-400" },
  ];

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(completed.map(o => o.id)));
  const clearSelection = () => { setSelected(new Set()); setSelectMode(false); };

  const startLongPress = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setSelectMode(true);
      toggleSelect(id);
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleArchive = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(t.archiveSelectedConfirm)) return;
    setArchiving(true);
    try {
      await archiveOrders(Array.from(selected));
      clearSelection();
      onRefresh?.();
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-6">
      {isAdmin && onBulkImport && (
        <button
          onClick={onBulkImport}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 font-semibold text-white shadow-lg transition hover:shadow-xl"
        >
          <Download className="h-5 w-5" />
          {t.bulkImport}
        </button>
      )}
      {onOpenMap && (
        <button
          onClick={onOpenMap}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 transition hover:shadow-md"
        >
          <MapPin className="h-5 w-5" />
          {t.workOrderMap}
        </button>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${m.bg}`}>
                  <Icon className={`h-5 w-5 ${m.color}`} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-900">{m.value}</p>
              <p className="mt-1 text-sm text-slate-500">{m.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-4 font-semibold text-slate-800">{t.revenueBreakdown}</h3>
          <div className="space-y-4">
            <RevenueRow label={t.cash} value={cash} total={revenue} color="bg-emerald-500" />
            <RevenueRow label={t.bankTransfer} value={bank} total={revenue} color="bg-blue-500" />
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">{t.totalRevenue}</span>
            <span className="font-bold text-slate-900">{revenue.toFixed(3)} {lang === "ar" ? "ر.ع" : "OMR"}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-4 font-semibold text-slate-800">{t.orderStatusDistribution}</h3>
          <div className="space-y-3">
            {statusBars.map((s) => (
              <div key={s.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600">{s.label}</span>
                  <span className="font-medium text-slate-900">{s.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.count / totalStatus) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {completed.length > 0 && (
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">{t.completedOrders}</h3>
            {isAdmin && !selectMode && (
              <button
                onClick={() => setSelectMode(true)}
                className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
              >
                {t.selectOrders}
              </button>
            )}
            {selectMode && (
              <div className="flex gap-2">
                <button onClick={selectAll} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200">
                  {t.filterAll}
                </button>
                <button onClick={clearSelection} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200">
                  {t.cancel}
                </button>
              </div>
            )}
          </div>

          {selectMode && selected.size > 0 && (
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
            >
              <Archive className="h-4 w-4" />
              {archiving ? "..." : `${t.archiveSelected} (${toArabicNumber(selected.size)})`}
            </button>
          )}

          <div className="space-y-2">
            {completed.map((o) => {
              const isSel = selected.has(o.id);
              return (
                <div
                  key={o.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                    selectMode && isSel ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200" : "border-emerald-200 bg-emerald-50/40"
                  }`}
                  onClick={selectMode ? () => toggleSelect(o.id) : undefined}
                  onTouchStart={() => !selectMode && startLongPress(o.id)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onMouseDown={() => !selectMode && startLongPress(o.id)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  style={{ userSelect: selectMode ? "none" : undefined }}
                >
                  {selectMode && (
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${isSel ? "bg-emerald-500 text-white" : "bg-slate-200"}`}>
                      {isSel && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
                    <CheckCircle2 className="h-3 w-3" />
                    {t.completed}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{o.order_number}</p>
                    <p className="truncate text-xs text-slate-500">{o.client_name || o.client_phone}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{(o.amount || 0).toFixed(3)}</span>
                  {!selectMode && (
                    <div className="flex gap-1.5">
                      <a href={`tel:${o.client_phone}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100" title={t.call} onClick={(e) => e.stopPropagation()}>
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      {onInvoice ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onInvoice(o); }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition hover:bg-emerald-200"
                          title={t.viewInvoice}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <a
                          href={`https://wa.me/${o.client_phone.replace(/[^\d]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition hover:bg-emerald-200"
                          title={t.whatsapp}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RevenueRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{value.toFixed(3)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
