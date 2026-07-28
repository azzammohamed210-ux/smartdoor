import { useState, useMemo, useEffect, useRef } from "react";
import { Search, Database, Phone, MapPin, ChevronDown, ChevronUp, FileText, Calendar, Filter, X, Trash2, CheckCircle2, Circle, CheckSquare, Square } from "lucide-react";
import type { Lang, Strings } from "../locales";
import type { WorkOrder, Technician, Product } from "../types";
import { fetchArchivedOrders, deleteOrders, toArabicNumber } from "../lib/storage";
import ArchivedOrderModal from "./ArchivedOrderModal";

interface Props {
  lang: Lang;
  t: Strings;
  technicians: Technician[];
  products: Product[];
}

type SortKey = "date" | "name" | "amount";
type SortDir = "asc" | "desc";

export default function CustomerDatabaseView({ lang, t, technicians, products }: Props) {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<WorkOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const load = async () => {
    setLoading(true);
    setOrders(await fetchArchivedOrders());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let r = [...orders];
    if (statusFilter !== "all") r = r.filter(o => o.status === statusFilter);
    if (techFilter !== "all") r = r.filter(o => o.technician_id === techFilter);
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      r = r.filter(o => new Date(o.archived_at || o.created_at).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000;
      r = r.filter(o => new Date(o.archived_at || o.created_at).getTime() <= to);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(o =>
        (o.client_name || "").toLowerCase().includes(q) ||
        o.client_phone.toLowerCase().includes(q) ||
        (o.technician_name || "").toLowerCase().includes(q) ||
        o.order_number.toLowerCase().includes(q)
      );
    }
    r.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        cmp = new Date(a.archived_at || a.created_at).getTime() - new Date(b.archived_at || b.created_at).getTime();
      } else if (sortKey === "name") {
        cmp = (a.client_name || "").localeCompare(b.client_name || "");
      } else if (sortKey === "amount") {
        cmp = a.amount - b.amount;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [orders, statusFilter, techFilter, dateFrom, dateTo, search, sortKey, sortDir]);

  const totalAmount = filtered.reduce((sum, o) => sum + (o.amount || 0), 0);
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const statusOptions = [
    { key: "all", label: t.filterAll },
    { key: "completed", label: t.completed },
    { key: "cancelled", label: t.cancelled },
  ];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(o => o.id)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteOrders(Array.from(selectedIds));
      setShowDeleteConfirm(false);
      exitSelectMode();
      await load();
    } catch (e) {
      console.error("Bulk delete error", e);
    } finally {
      setDeleting(false);
    }
  };

  const startLongPress = (id: string) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setSelectMode(true);
      setSelectedIds(new Set([id]));
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleCardClick = (o: WorkOrder) => {
    cancelLongPress();
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (selectMode) {
      toggleSelect(o.id);
    } else {
      setSelected(o);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selection action bar */}
      {selectMode && (
        <div className="sticky top-0 z-30 flex items-center justify-between gap-3 rounded-2xl bg-blue-600 px-4 py-3 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <button
              onClick={exitSelectMode}
              className="rounded-full bg-white/15 p-1.5 transition hover:bg-white/25"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">
              {t.selectedCount.replace("{count}", toArabicNumber(selectedIds.size))}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium transition hover:bg-white/25"
            >
              {selectedIds.size === filtered.length && filtered.length > 0 ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {selectedIds.size === filtered.length && filtered.length > 0 ? t.deselectAll : t.selectAll}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1.5 text-sm font-bold text-white shadow-md transition hover:bg-rose-600 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {t.deletePermanently}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">{t.customerDatabaseTitle}</h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {t.recordsCount}: {toArabicNumber(filtered.length)}
        </span>
      </div>

      {/* Live search */}
      <div className="relative">
        <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-4 rtl:right-4" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchCustomers}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ltr:pl-11 rtl:pr-11 ltr:pr-4 rtl:pl-4"
        />
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            showFilters ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          {t.sortBy}
        </button>
        {/* Sort buttons */}
        <div className="flex gap-1">
          {([
            { key: "date" as SortKey, label: t.sortDate },
            { key: "name" as SortKey, label: t.sortName },
            { key: "amount" as SortKey, label: t.sortAmount },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => toggleSort(s.key)}
              className={`flex items-center gap-0.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                sortKey === s.key ? "bg-blue-50 text-blue-700" : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              {s.label}
              {sortKey === s.key && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
            </button>
          ))}
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          {/* Status pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {statusOptions.map(p => (
              <button
                key={p.key}
                onClick={() => setStatusFilter(p.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  statusFilter === p.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Technician filter */}
          {technicians.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setTechFilter("all")}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  techFilter === "all" ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t.filterAll}
              </button>
              {technicians.map(tc => (
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

          {/* Date range */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">{t.dateFrom}</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500">{t.dateTo}</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-400"
              />
            </div>
            {(dateFrom || dateTo || statusFilter !== "all" || techFilter !== "all") && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setStatusFilter("all"); setTechFilter("all"); }}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-3 w-3" />
                {t.cancel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Total amount summary */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-3 ring-1 ring-slate-100">
          <span className="text-sm font-medium text-slate-600">{t.totalAmount}</span>
          <span className="text-lg font-bold text-blue-600">
            {toArabicNumber(Number(totalAmount.toFixed(3)))} {lang === "ar" ? "ر.ع" : "OMR"}
          </span>
        </div>
      )}

      {/* Long-press hint */}
      {!selectMode && filtered.length > 0 && (
        <p className="text-center text-xs text-slate-400">{t.longPressHint}</p>
      )}

      {/* Records */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100">
          <Database className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-400">{t.noArchivedOrders}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const isSelected = selectedIds.has(o.id);
            return (
              <div
                key={o.id}
                onClick={() => handleCardClick(o)}
                onPointerDown={() => startLongPress(o.id)}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                className={`relative w-full cursor-pointer overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 transition hover:shadow-md ${
                  selectMode && isSelected ? "ring-2 ring-blue-500 bg-blue-50/30" : "ring-slate-100 hover:ring-blue-200"
                }`}
              >
                {selectMode && (
                  <div className="absolute top-3 ltr:right-3 rtl:left-3 z-10">
                    {isSelected ? (
                      <CheckCircle2 className="h-6 w-6 text-blue-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-slate-300" />
                    )}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{o.client_name || o.client_phone}</span>
                        <StatusBadge status={o.status} t={t} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {o.order_number}
                        {o.technician_name && ` · ${o.technician_name}`}
                      </p>
                      {o.product_name && (
                        <p className="mt-0.5 text-xs text-slate-400">{o.product_name} {o.product_code && `(${o.product_code})`}</p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(o.archived_at || o.created_at).toLocaleDateString(lang === "ar" ? "ar-OM" : "en-GB")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-lg font-bold text-blue-600">
                        {toArabicNumber(Number(o.amount.toFixed(3)))} {lang === "ar" ? "ر.ع" : "OMR"}
                      </span>
                      <div className="flex gap-1.5">
                        <a
                          href={`tel:${o.client_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                        {o.gps_link && (
                          <a
                            href={o.gps_link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition hover:bg-amber-100"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                <Trash2 className="h-7 w-7 text-rose-600" />
              </div>
            </div>
            <p className="mb-6 text-center text-sm font-medium leading-relaxed text-slate-700">
              {t.bulkDeleteConfirm}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-rose-600 py-3 font-bold text-white shadow-lg transition hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "..." : t.deletePermanently}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <ArchivedOrderModal
          lang={lang}
          t={t}
          order={selected}
          products={products}
          onClose={() => setSelected(null)}
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
  const s = map[status] || map.completed;
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
