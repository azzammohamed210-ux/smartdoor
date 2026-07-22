import { TrendingUp, ClipboardList, Users, AlertTriangle, MapPin, Download } from "lucide-react";
import type { Lang, Strings } from "../locales";
import type { WorkOrder, Product } from "../types";

interface Props {
  lang: Lang;
  t: Strings;
  orders: WorkOrder[];
  inventory: Product[];
  onOpenMap?: () => void;
  onBulkImport?: () => void;
  isAdmin?: boolean;
}

export default function DashboardView({ lang, t, orders, inventory, onOpenMap, onBulkImport, isAdmin }: Props) {
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
