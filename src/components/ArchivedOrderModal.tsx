import { useState } from "react";
import { X, Phone, MessageCircle, MapPin, FileText, Printer, Download, User, Wrench, Calendar, CreditCard, Shield } from "lucide-react";
import type { Lang, Strings } from "../locales";
import { translations, warrantyOptions, categoryLabels } from "../locales";
import type { WorkOrder, Product } from "../types";
import { buildWhatsappUrl } from "../lib/invoice";
import InvoicePreviewModal from "./InvoicePreviewModal";

interface Props {
  lang: Lang;
  t: Strings;
  order: WorkOrder;
  products: Product[];
  onClose: () => void;
}

export default function ArchivedOrderModal({ lang, t, order, products, onClose }: Props) {
  const [showInvoice, setShowInvoice] = useState(false);
  const product = products.find(p => p.id === order.product_id);
  const warrantyLabel = warrantyOptions.find(w => w.value === String(order.warranty_months))?.[lang === "ar" ? "label_ar" : "label_en"] || (lang === "ar" ? "سنة" : "1 year");
  const dateStr = new Date(order.created_at).toLocaleDateString(lang === "ar" ? "ar-OM" : "en-GB");
  const archivedStr = new Date(order.archived_at || order.created_at).toLocaleDateString(lang === "ar" ? "ar-OM" : "en-GB");
  const whatsappMsg = translations[lang].whatsappMessage(order);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:rounded-3xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-white px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t.orderDetails}</h3>
                <p className="text-xs text-slate-400">{order.order_number}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {/* Customer Profile */}
            <Section title={t.customerProfile} icon={<User className="h-4 w-4" />}>
              <DetailRow label={t.clientName} value={order.client_name || "-"} />
              <DetailRow label={t.clientPhone} value={order.client_phone} />
              {order.client_location_name && <DetailRow label={t.clientLocation} value={order.client_location_name} />}
              {order.gps_link && (
                <a
                  href={order.gps_link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                >
                  <MapPin className="h-4 w-4" />
                  {t.openGoogleMaps}
                </a>
              )}
            </Section>

            {/* Work Order Info */}
            <Section title={t.workOrderInfo} icon={<Wrench className="h-4 w-4" />}>
              <DetailRow label={t.invoiceId} value={order.order_number} />
              <DetailRow label={t.invoiceDate} value={dateStr} />
              <DetailRow label={t.technician} value={order.technician_name || "-"} />
              {order.product_name && (
                <DetailRow label={t.product} value={`${order.product_name} ${order.product_code ? `(${order.product_code})` : ""}`} />
              )}
              {product && (
                <DetailRow label={t.amountOmr} value={`${order.amount.toFixed(3)} ${lang === "ar" ? "ر.ع" : "OMR"}`} />
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  <CreditCard className="h-3 w-3" />
                  {order.payment_method === "cash" ? t.cash : t.bankTransfer}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  <Shield className="h-3 w-3" />
                  {warrantyLabel}
                </span>
              </div>
            </Section>

            {/* Archive info */}
            <Section title={t.archivedOn} icon={<Calendar className="h-4 w-4" />}>
              <DetailRow label={t.archivedOn} value={archivedStr} />
              <div className="mt-2">
                <StatusBadge status={order.status} t={t} />
              </div>
            </Section>

            {/* Notes */}
            {order.notes && (
              <Section title={t.maintenanceNotes} icon={<FileText className="h-4 w-4" />}>
                <p className="text-sm text-slate-600">{order.notes}</p>
              </Section>
            )}

            {/* Images */}
            {order.id_image_url && (
              <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                <p className="mb-2 text-xs font-medium text-slate-500">{t.idImageAttached}</p>
                <img src={order.id_image_url} alt="ID" className="w-full rounded-xl border border-slate-200 object-contain" style={{ maxHeight: 200 }} />
              </div>
            )}
            {order.final_photo_url && (
              <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                <p className="mb-2 text-xs font-medium text-slate-500">{t.finalPhotoAttached}</p>
                <img src={order.final_photo_url} alt="final" className="w-full rounded-xl border border-slate-200 object-contain" style={{ maxHeight: 200 }} />
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="flex gap-2 border-t border-slate-200 bg-white p-4">
            <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition hover:bg-slate-50">
              {t.cancel}
            </button>
            <a
              href={`https://wa.me/${order.client_phone.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
              title={t.sendWhatsapp}
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a
              href={`tel:${order.client_phone}`}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-100"
              title={t.call}
            >
              <Phone className="h-5 w-5" />
            </a>
            <button
              onClick={handlePrint}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              title={t.printInvoice}
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowInvoice(true)}
              className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              <FileText className="h-5 w-5" />
              {t.viewInvoice}
            </button>
          </div>
        </div>
      </div>

      {showInvoice && (
        <InvoicePreviewModal
          lang={lang}
          t={t}
          order={order}
          products={products}
          onConfirm={() => setShowInvoice(false)}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-slate-400">{icon}</span>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
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
