import { useState, useMemo, useCallback, useRef } from "react";
import { Plus, Phone, MessageCircle, MapPin, Play, CheckCircle2, Search, Trash2, FileText } from "lucide-react";
import type { Lang, Strings } from "../locales";
import type { WorkOrder, Technician, Product } from "../types";
import OrderDetailsModal from "./OrderDetailsModal";
import ManagerEditModal from "./ManagerEditModal";
import InvoicePreviewModal from "./InvoicePreviewModal";
import { toArabicNumber, deleteOrder, startWork } from "../lib/storage";

interface Props {
  lang: Lang;
  t: Strings;
  orders: WorkOrder[];
  technicians: Technician[];
  products: Product[];
  isAdmin: boolean;
  currentTechId?: string;
  onRefresh: () => void;
}

type StatusFilter = "all" | "pending" | "in_progress" | "completed";

export default function WorkOrdersView({ lang, t, orders, technicians, products, isAdmin, currentTechId, onRefresh }: Props) {
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [managerEdit, setManagerEdit] = useState<WorkOrder | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [toast, setToast] = useState<string>("");
  const [invoiceOrder, setInvoiceOrder] = useState<WorkOrder | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const routeSequence = useMemo(() => {
    const map = new Map<string, number>();
    const sorted = [...orders].sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
    sorted.forEach((o) => {
      if (o.technician_id && o.status !== "cancelled") {
        const next = (map.get(o.technician_id) || 0) + 1;
        map.set(o.technician_id, next);
      }
    });
    return map;
  }, [orders]);

  const routeOf = useCallback((o: WorkOrder): number | null => {
    if (!o.technician_id || o.status === "cancelled") return null;
    return routeSequence.get(o.technician_id) ? [...orders].filter(x => x.technician_id === o.technician_id && x.status !== "cancelled").sort((a,b)=>(a.created_at||"").localeCompare(b.created_at||"")).findIndex(x => x.id === o.id) + 1 : null;
  }, [orders, routeSequence]);

  const startLongPress = (o: WorkOrder) => {
    longPressTimer.current = setTimeout(() => {
      setManagerEdit(o);
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const filtered = useMemo(() => {
    let r = orders;
    if (statusFilter !== "all") r = r.filter(o => o.status === statusFilter);
    if (techFilter !== "all") r = r.filter(o => o.technician_id === techFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        (o.client_name || "").toLowerCase().includes(q) ||
        o.client_phone.toLowerCase().includes(q) ||
        (o.technician_name || "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [orders, statusFilter, techFilter, search]);

  const statusPills: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t.filterAll },
    { key: "pending", label: t.pending },
    { key: "in_progress", label: t.inProgress },
    { key: "completed", label: t.completed },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{t.workOrders}</h2>
        {isAdmin && (
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            {t.newOrder}
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-4 rtl:right-4" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchOrders}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ltr:pl-11 rtl:pr-11 ltr:pr-4 rtl:pl-4"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusPills.map((p) => (
          <button
            key={p.key}
            onClick={() => setStatusFilter(p.key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
              statusFilter === p.key
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isAdmin && technicians.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
          <button
            onClick={() => setTechFilter("all")}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              techFilter === "all" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {t.filterAll}
          </button>
          {technicians.map((tc) => (
            <button
              key={tc.id}
              onClick={() => setTechFilter(tc.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                techFilter === tc.id ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tc.name}
            </button>
          ))}
        </div>
      )}

      {isAdmin && filtered.length > 0 && (
        <p className="px-1 pb-1 text-center text-xs text-slate-400">{t.longPressEditHint}</p>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center text-slate-400 shadow-sm ring-1 ring-slate-100">
          {t.noOrders}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const seq = routeOf(o);
            return (
            <div
              key={o.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition active:scale-[0.99]"
              onTouchStart={() => isAdmin && startLongPress(o)}
              onTouchEnd={cancelLongPress}
              onTouchMove={cancelLongPress}
              onMouseDown={() => isAdmin && startLongPress(o)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{o.order_number}</span>
                      <StatusBadge status={o.status} t={t} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {o.client_name || o.client_phone}
                      {o.technician_name && ` · ${o.technician_name}`}
                    </p>
                    {o.product_name && (
                      <p className="mt-0.5 text-xs text-slate-400">{o.product_name} {o.product_code && `(${o.product_code})`}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={`tel:${o.client_phone}`} className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100" title={t.call}>
                      <Phone className="h-4 w-4" />
                    </a>
                    {o.status === "completed" ? (
                      <button
                        onClick={() => setInvoiceOrder(o)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                        title={t.viewInvoice}
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    ) : (
                      <a
                        href={`https://wa.me/${o.client_phone.replace(/[^\d]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                        title={t.whatsapp}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        if (o.gps_link) {
                          window.open(o.gps_link, "_blank", "noreferrer");
                        } else {
                          showToast(t.noLocationLink);
                        }
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition hover:bg-amber-100"
                      title={t.map}
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                    {o.status !== "completed" && o.status !== "cancelled" && (
                      <button
                        onClick={() => setSelected(o)}
                        className="flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 text-sm font-medium text-white shadow-sm transition hover:shadow-md"
                      >
                        {o.status === "pending" ? <Play className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {o.status === "pending" ? t.startWork : t.completeOrder}
                      </button>
                    )}
                    {o.status === "cancelled" && (
                      <button
                        onClick={() => {
                          if (window.confirm(t.confirmDeleteOrder)) {
                            deleteOrder(o.id).then(onRefresh);
                          }
                        }}
                        className="flex h-9 items-center gap-1.5 rounded-lg bg-red-500 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-red-600"
                        title={t.deleteOrder}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t.deleteOrder}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {seq !== null && (
                <div className="border-t border-slate-100 bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {t.routeLabel} {toArabicNumber(seq)}
                  </span>
                </div>
              )}
            </div>
          );})}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}

      {showNew && isAdmin && (
        <OrderDetailsModal
          mode="create"
          lang={lang}
          t={t}
          order={null}
          technicians={technicians}
          products={products}
          currentTechId={currentTechId}
          onClose={() => setShowNew(false)}
          onRefresh={onRefresh}
        />
      )}
      {selected && (
        <OrderDetailsModal
          mode="edit"
          lang={lang}
          t={t}
          order={selected}
          technicians={technicians}
          products={products}
          currentTechId={currentTechId}
          onClose={() => { setSelected(null); onRefresh(); }}
          onRefresh={onRefresh}
        />
      )}
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
      {managerEdit && (
        <ManagerEditModal
          lang={lang}
          t={t}
          order={managerEdit}
          technicians={technicians}
          products={products}
          onClose={() => setManagerEdit(null)}
          onSaved={() => onRefresh()}
        />
      )}
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: Strings }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: t.pending, cls: "bg-amber-100 text-amber-700" },
    in_progress: { label: t.inProgress, cls: "bg-blue-100 text-blue-700" },
    completed: { label: t.completed, cls: "bg-emerald-100 text-emerald-700" },
    cancelled: { label: t.cancelled, cls: "bg-rose-100 text-rose-700" },
  };
  const s = map[status] || map.pending;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
