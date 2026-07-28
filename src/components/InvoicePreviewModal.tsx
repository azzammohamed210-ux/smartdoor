import { useRef, useState } from "react";
import { X, Download, MessageCircle, Check } from "lucide-react";
import type { Lang, Strings } from "../locales";
import { translations, categoryLabels, warrantyOptions } from "../locales";
import type { WorkOrder, Product } from "../types";
import { buildWhatsappUrl } from "../lib/invoice";

interface Props {
  lang: Lang;
  t: Strings;
  order: WorkOrder;
  products: Product[];
  onConfirm: () => void;
  onClose: () => void;
}

export default function InvoicePreviewModal({ lang, t, order, products, onConfirm, onClose }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const product = products.find(p => p.id === order.product_id);
  const dateStr = new Date().toLocaleString(lang === "ar" ? "ar-OM" : "en-GB");
  const warrantyLabel = warrantyOptions.find(w => w.value === String(order.warranty_months))?.[lang === "ar" ? "label_ar" : "label_en"] || (lang === "ar" ? "سنة" : "1 year");

  const generatePdf = async (): Promise<{ file: File; fileName: string } | null> => {
    if (!previewRef.current) return null;
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const imgW = pageW - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;
    const scale = Math.min(1, (pageH - margin * 2) / imgH);
    const finalW = imgW * scale;
    const finalH = imgH * scale;
    const offsetX = (pageW - finalW) / 2;
    const offsetY = (pageH - finalH) / 2;
    pdf.addImage(imgData, "PNG", offsetX, offsetY, finalW, finalH);
    const safeName = (order.client_name || "client").replace(/[\\/:*?"<>|]/g, "_");
    const fileName = `الفاتورة_${safeName}_${order.client_phone}.pdf`;
    const blob = pdf.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    return { file, fileName };
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await generatePdf();
      if (result) {
        const url = URL.createObjectURL(result.file);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Export error", e);
    } finally {
      setExporting(false);
    }
  };

  const handleSend = async () => {
    setExporting(true);
    try {
      const result = await generatePdf();
      if (!result) return;
      const url = URL.createObjectURL(result.file);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(url);
      const msg = translations[lang].whatsappMessage(order);
      const waUrl = buildWhatsappUrl(order.client_phone, msg);
      window.open(waUrl, "_blank");
      setExported(true);
    } catch (e) {
      console.error("Send error", e);
    } finally {
      setExporting(false);
    }
  };

  const checkedSet = new Set(order.checklist || []);
  void checkedSet;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-slate-100 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between bg-white px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">{t.invoicePreviewTitle}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div
            ref={previewRef}
            className="mx-auto max-w-md overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200"
            style={{ maxHeight: "100%", borderRadius: "20px" }}
          >
            <div className="px-5 pb-4 pt-5 text-white" style={{ background: "linear-gradient(135deg, #1e75e6 0%, #0066fe 100%)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{t.appTitle}</h2>
                  <p className="mt-0.5 text-xs text-blue-100">{t.appSubtitle}</p>
                </div>
                <div className="rounded-xl bg-white/15 px-3 py-1.5 text-center backdrop-blur">
                  <p className="text-[10px] text-blue-100">{t.invoice}</p>
                  <p className="text-sm font-bold text-white">{order.order_number}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-slate-200">
              <div className="bg-white p-3">
                <p className="text-[10px] text-slate-400">{t.invoiceId}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{order.order_number}</p>
              </div>
              <div className="bg-white p-3">
                <p className="text-[10px] text-slate-400">{t.invoiceDate}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{dateStr}</p>
              </div>
            </div>

            <div className="border-t-2 border-slate-800 p-3">
              <div className="space-y-2">
                <Row label={t.clientName} value={order.client_name || "-"} />
                <Row label={t.clientPhone} value={order.client_phone} />
                {order.client_location_name && <Row label={t.clientLocation} value={order.client_location_name} />}
              </div>
            </div>

            <div className="border-t-2 border-slate-800 p-3">
              <h4 className="mb-2 text-sm font-bold text-slate-800">{t.product}</h4>
              <div className="rounded-xl border border-slate-200 p-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{product?.name_ar || "-"}</p>
                    <p className="text-xs text-slate-400">{product?.code} · {product ? categoryLabels[product.category]?.[lang] : ""}</p>
                  </div>
                  <p className="text-lg font-bold text-blue-600">{product?.price.toFixed(3)} {lang === "ar" ? "ر.ع" : "OMR"}</p>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-slate-800 p-3">
              <h4 className="mb-2 text-sm font-bold text-slate-800">{t.paymentMethod}</h4>
              <div className="rounded-xl border border-slate-200 p-2.5">
                <p className="text-sm font-semibold text-slate-900">{order.payment_method === "bank" ? t.bankTransfer : t.cash}</p>
              </div>
            </div>

            <div className="border-t-2 border-slate-800 p-3">
              <h4 className="mb-1.5 text-sm font-bold text-slate-800">{t.warrantyTerms}</h4>
              <div className="rounded-xl border border-slate-200 p-2.5">
                <div className="space-y-1">
                  {t.warrantyNote.split("\n").map((line, i) => (
                    <p key={i} className="text-[11px] leading-snug text-slate-700">{line}</p>
                  ))}
                </div>
              </div>
            </div>

            {order.id_image_url && (
              <div className="border-t-2 border-slate-800 p-3">
                <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {t.idImageAttached}
                </div>
                <img src={order.id_image_url} alt="ID" className="mt-1 w-full rounded-xl border border-slate-200 object-contain" style={{ maxHeight: 140 }} />
              </div>
            )}

            {order.payment_method === "bank" && order.receipt_image_url && (
              <div className="border-t-2 border-slate-800 p-3">
                <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {t.receiptAttached}
                </div>
                <img src={order.receipt_image_url} alt="receipt" className="mt-1 w-full rounded-xl border border-slate-200 object-contain" style={{ maxHeight: 140 }} />
              </div>
            )}

            {order.final_photo_url && (
              <div className="border-t-2 border-slate-800 p-3">
                <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {t.finalPhotoAttached}
                </div>
                <img src={order.final_photo_url} alt="final" className="mt-1 w-full rounded-xl border border-slate-200 object-contain" style={{ maxHeight: 140 }} />
              </div>
            )}

            <div className="px-4 py-2.5 text-white" style={{ background: "linear-gradient(135deg, #1e75e6 0%, #0066fe 100%)" }}>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] text-blue-100">{t.totalRevenue}</p>
                  <p className="text-lg font-bold leading-tight whitespace-nowrap">{order.amount.toFixed(3)} {lang === "ar" ? "ر.ع" : "OMR"}</p>
                </div>
                <div className="min-w-0 text-right">
                  <p className="text-[11px] text-blue-100">{t.warranty}</p>
                  <p className="text-sm font-bold leading-tight whitespace-nowrap">{warrantyLabel}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 px-4 py-2 text-center">
              <p className="text-[11px] text-slate-400">{t.appTitle}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{t.appSubtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-200 bg-white p-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition hover:bg-slate-50">
            {t.cancel}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            title={t.downloadInvoice}
          >
            <Download className="h-5 w-5" />
            <span className="hidden sm:inline">{t.downloadInvoice}</span>
          </button>
          <button
            onClick={handleSend}
            disabled={exporting}
            className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
          >
            {exporting ? (
              <>...</>
            ) : exported ? (
              <>
                <Check className="h-5 w-5" />
                {t.sendToCustomer}
              </>
            ) : (
              <>
                <MessageCircle className="h-5 w-5" />
                {t.sendToCustomer}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}
