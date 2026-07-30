import { useState } from "react";
import { X, Save, Check } from "lucide-react";
import type { Lang, Strings } from "../locales";
import { checklistItems, warrantyOptions } from "../locales";
import type { WorkOrder, Technician, Product, OrderStatus } from "../types";
import { updateWorkOrder } from "../lib/storage";

interface Props {
  lang: Lang;
  t: Strings;
  order: WorkOrder;
  technicians: Technician[];
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
}

const STATUSES: { key: OrderStatus; labelKey: keyof Strings }[] = [
  { key: "pending", labelKey: "pending" },
  { key: "in_progress", labelKey: "inProgress" },
  { key: "completed", labelKey: "completed" },
  { key: "cancelled", labelKey: "cancelled" },
];

export default function ManagerEditModal({ lang, t, order, technicians, products, onClose, onSaved }: Props) {
  const [technicianId, setTechnicianId] = useState(order.technician_id || "");
  const [clientName, setClientName] = useState(order.client_name || "");
  const [clientPhone, setClientPhone] = useState(order.client_phone || "");
  const [clientLocationName, setClientLocationName] = useState(order.client_location_name || "");
  const [gpsLink, setGpsLink] = useState(order.gps_link || "");
  const [productIds, setProductIds] = useState<string[]>(order.product_ids || (order.product_id ? [order.product_id] : []));
  const [amount, setAmount] = useState(order.amount?.toString() || "");
  const [warranty, setWarranty] = useState(order.warranty_months?.toString() || "12");
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method || "cash");
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [checklist, setChecklist] = useState<string[]>(order.checklist || []);
  const [notes, setNotes] = useState(order.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleProduct = (id: string) => {
    setProductIds((prev) => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]));
  };

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));
  };

  const handleSave = async () => {
    setError("");
    if (!clientPhone.trim()) { setError(t.clientPhone); return; }
    setSaving(true);
    try {
      const selectedProducts = products.filter(p => productIds.includes(p.id));
      const combinedName = selectedProducts.map(p => p.name_ar).join(" + ");
      const combinedCode = selectedProducts.map(p => p.code).join(" + ");
      const primaryProductId = productIds[0] || "";
      const techName = technicians.find(tc => tc.id === technicianId)?.name;
      const patch: Partial<WorkOrder> = {
        technician_id: technicianId || undefined,
        technician_name: techName,
        client_name: clientName,
        client_phone: clientPhone.trim(),
        client_location_name: clientLocationName,
        gps_link: gpsLink,
        product_id: primaryProductId,
        product_ids: productIds,
        product_name: combinedName || undefined,
        product_code: combinedCode || undefined,
        amount: parseFloat(amount) || 0,
        warranty_months: parseInt(warranty) || 0,
        payment_method: paymentMethod,
        status,
        checklist,
        notes,
      };
      await updateWorkOrder(order.id, patch);
      setSaved(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1200);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{t.managerEditOrder}</h3>
            <p className="mt-0.5 text-xs text-slate-400">{order.order_number}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.status}</label>
            <div className="grid grid-cols-4 gap-2">
              {STATUSES.map((s) => {
                const active = status === s.key;
                const colorMap: Record<OrderStatus, string> = {
                  pending: "bg-amber-500 border-amber-500 text-white",
                  in_progress: "bg-blue-500 border-blue-500 text-white",
                  completed: "bg-emerald-500 border-emerald-500 text-white",
                  cancelled: "bg-rose-500 border-rose-500 text-white",
                };
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setStatus(s.key)}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                      active ? colorMap[s.key] : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {t[s.labelKey] as string}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Technician */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.assignTechnician}</label>
            <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} className={inputCls}>
              <option value="">{t.selectTechnician}</option>
              {technicians.map((tc) => (
                <option key={tc.id} value={tc.id}>{tc.name}</option>
              ))}
            </select>
          </div>

          {/* Client name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.clientName}</label>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
          </div>

          {/* Client phone */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.clientPhone} *</label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9+]*"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value.replace(/[^0-9+]/g, ""))}
              className={inputCls}
              placeholder="+9689XXXXXXXX"
              dir="ltr"
            />
          </div>

          {/* Location */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.clientLocation}</label>
            <input value={clientLocationName} onChange={(e) => setClientLocationName(e.target.value)} className={inputCls} placeholder="مسقط، عمان" />
          </div>

          {/* GPS */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.gpsLink}</label>
            <input value={gpsLink} onChange={(e) => setGpsLink(e.target.value)} className={inputCls} placeholder="23.5880, 58.3829 أو رابط جوجل" dir="ltr" />
          </div>

          {/* Products */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.product}</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {products.map((p) => {
                const checked = productIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      checked ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${checked ? "bg-blue-600 text-white" : "bg-slate-200"}`}>
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="flex flex-col items-start">
                      <span>{p.name_ar}</span>
                      <span className="text-xs text-slate-400">{p.code}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount + Warranty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t.amountOmr}</label>
              <input type="number" inputMode="decimal" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} dir="ltr" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t.warranty}</label>
              <select value={warranty} onChange={(e) => setWarranty(e.target.value)} className={inputCls}>
                {warrantyOptions.map((w) => (
                  <option key={w.value} value={w.value}>{lang === "ar" ? w.label_ar : w.label_en}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.paymentMethod}</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
              <option value="cash">{t.cash}</option>
              <option value="bank">{t.bankTransfer}</option>
            </select>
          </div>

          {/* Checklist */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.maintenanceChecklist}</label>
            <div className="grid grid-cols-3 gap-2">
              {checklistItems.map((c) => {
                const checked = checklist.includes(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleChecklist(c.key)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-medium transition ${
                      checked ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded ${checked ? "bg-emerald-500 text-white" : "bg-slate-200"}`}>
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    {lang === "ar" ? c.label_ar : c.label_en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.maintenanceNotes}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-medium text-slate-600 transition hover:bg-slate-50">
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "..." : t.saveChanges}
            </button>
          </div>
        </div>
      </div>

      {saved && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-base font-semibold text-slate-800">{t.changesSaved}</span>
          </div>
        </div>
      )}
    </div>
  );
}
