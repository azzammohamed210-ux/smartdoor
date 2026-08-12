import { useState, useMemo } from "react";
import { Search, Pencil, Plus, Folder, BarChart3 } from "lucide-react";
import type { Lang, Strings } from "../locales";
import { categoryLabels } from "../locales";
import type { Product, WorkOrder, Technician } from "../types";
import ProductEditModal from "./ProductEditModal";
import ConsumptionReportModal from "./ConsumptionReportModal";

interface Props {
  lang: Lang;
  t: Strings;
  products: Product[];
  orders: WorkOrder[];
  technicians: Technician[];
  isAdmin: boolean;
  onRefresh: () => void;
}

type CatFilter = "all" | "lock" | "door";

export default function InventoryView({ lang, t, products, orders, technicians, isAdmin, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<CatFilter>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showConsumption, setShowConsumption] = useState(false);

  const filtered = useMemo(() => {
    let r = products;
    if (catFilter !== "all") r = r.filter(p => p.category === catFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(p =>
        p.name_ar.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (categoryLabels[p.category]?.ar || "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [products, catFilter, search]);

  const catPills: { key: CatFilter; label: string }[] = [
    { key: "all", label: t.categoryAll },
    { key: "lock", label: t.categoryLock },
    { key: "door", label: t.categoryDoor },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{t.manageProducts}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConsumption(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:shadow-lg"
          >
            <BarChart3 className="h-4 w-4" />
            {t.inventoryConsumptionReport}
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              {t.addProduct}
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ltr:left-4 rtl:right-4" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchProducts}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ltr:pl-11 rtl:pr-11 ltr:pr-4 rtl:pl-4"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {catPills.map((p) => (
          <button
            key={p.key}
            onClick={() => setCatFilter(p.key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
              catFilter === p.key
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((p) => {
          const isOut = p.total_stock === 0;
          const isLow = p.total_stock > 0 && p.total_stock <= p.reorder_level;
          const stockPct = Math.min(100, (p.total_stock / Math.max(p.reorder_level * 2, 10)) * 100);
          const catLabel = categoryLabels[p.category]?.[lang] || p.category;
          return (
            <div key={p.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start justify-between">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  <Folder className="h-3 w-3" />
                  {catLabel}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setEditing(p)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                    title={t.editProduct}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-3">
                <p className="font-semibold text-slate-900">{p.name_ar}</p>
                <p className="text-xs text-slate-400">{p.code}</p>
              </div>
              <p className="mt-2 text-lg font-bold text-blue-600">{p.price.toFixed(3)} {lang === "ar" ? "ر.ع" : "OMR"}</p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-500">{t.availableStock}</span>
                  <span className="font-medium text-slate-700">{p.total_stock}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${isOut ? "bg-rose-400" : isLow ? "bg-amber-400" : "bg-emerald-500"}`}
                    style={{ width: `${stockPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-white p-12 text-center text-slate-400 shadow-sm ring-1 ring-slate-100">
          {lang === "ar" ? "لا توجد منتجات" : "No products"}
        </div>
      )}

      {(editing || showAdd) && (
        <ProductEditModal
          lang={lang}
          t={t}
          product={editing}
          onClose={() => { setEditing(null); setShowAdd(false); }}
          onRefresh={onRefresh}
        />
      )}

      {showConsumption && (
        <ConsumptionReportModal
          lang={lang}
          t={t}
          orders={orders}
          technicians={technicians}
          products={products}
          onClose={() => setShowConsumption(false)}
        />
      )}
    </div>
  );
}
