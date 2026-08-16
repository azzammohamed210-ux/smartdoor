import { useMemo, useRef, useState } from "react";
import { Check, Download, Loader2, Send, X } from "lucide-react";
import type { Lang, Strings } from "../locales";
import { categoryLabels, translations, warrantyOptions } from "../locales";
import type { Product, WorkOrder } from "../types";
import { supabase } from "../lib/supabaseClient";
import { sendWhatsAppDirect } from "../services/whatsapp";

interface Props {
  lang: Lang;
  t: Strings;
  order: WorkOrder;
  products: Product[];
  onConfirm: () => void;
  onClose: () => void;
}

interface InvoiceItem {
  name: string;
  code: string;
  qty: number;
  unitPrice: string;
  total: string;
}

export default function InvoicePreviewModal({ lang, t, order, products, onClose }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [sending, setSending] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [sendError, setSendError] = useState("");

  const orderProducts = useMemo(() => {
    const ids = order.product_ids && order.product_ids.length > 0
      ? order.product_ids
      : order.product_id
        ? [order.product_id]
        : [];

    return products
      .filter((product) => ids.includes(product.id))
      .map((product) => ({ product, qty: 1, lineTotal: product.price }));
  }, [order.product_id, order.product_ids, products]);

  const grandTotal = orderProducts.reduce((sum, item) => sum + item.lineTotal, 0);
  const invoiceDate = new Date();
  const dateValue = invoiceDate.toLocaleDateString(lang === "ar" ? "ar-OM" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeValue = invoiceDate.toLocaleTimeString(lang === "ar" ? "ar-OM" : "en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
  const warrantyLabel = warrantyOptions.find((option) => option.value === String(order.warranty_months))?.[
    lang === "ar" ? "label_ar" : "label_en"
  ] || (lang === "ar" ? "سنة" : "1 year");
  const currency = "ر.ع";
  const invoiceItems: InvoiceItem[] = orderProducts.map(({ product, qty, lineTotal }) => ({
    name: product.name_ar,
    code: `${product.code} · ${categoryLabels[product.category]?.[lang] || ""}`,
    qty,
    unitPrice: product.price.toFixed(3),
    total: lineTotal.toFixed(3),
  }));
  const subtotal = grandTotal.toFixed(3);
  const companyName = lang === "ar" ? "محمد الزغل الرائدة ش م م" : t.appTitle;
  const paymentMethodLabel = order.payment_method === "bank" ? t.bankTransfer : t.cash;

  const generatePdf = async (): Promise<{ file: File; fileName: string } | null> => {
    if (!invoiceRef.current) return null;

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const target = invoiceRef.current;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const renderScale = (window.devicePixelRatio || 1) * 2;

    const canvas = await html2canvas(target, {
      scale: renderScale,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 794,
      windowHeight: 1123,
    });

    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    const imageScale = Math.min(1, pageHeight / imageHeight);
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageWidth * imageScale, imageHeight * imageScale);

    const safeId = (order.order_number || "order").replace(/[^a-zA-Z0-9_]/g, "_");
    const safePhone = (order.client_phone || "").replace(/[^0-9]/g, "");
    const fileName = `Invoice_${safeId}_${safePhone}.pdf`;
    const blob = pdf.output("blob");
    return { file: new File([blob], fileName, { type: "application/pdf" }), fileName };
  };

  const uploadInvoiceToStorage = async (file: File, fileName: string): Promise<{ url: string | null; error: string | null }> => {
    try {
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `invoices/${safeFileName}`;
      const { error: uploadError } = await supabase.storage
        .from("product-videos")
        .upload(storagePath, file, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("product-videos").getPublicUrl(storagePath);
      const publicUrl = data?.publicUrl || null;
      if (!publicUrl) throw new Error("Failed to get public URL after upload");
      return { url: publicUrl, error: null };
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      console.error("Invoice upload error:", detail);
      return { url: null, error: detail || "Unknown error" };
    }
  };

  const normalizePhoneForGreenApi = (phone: string): string => phone.replace(/[\s+]/g, "").replace(/[^\d]/g, "");

  const getDisplayError = (value: unknown, fallback: string): string => {
    if (!value) return fallback;
    if (typeof value === "string") return value.trim() || fallback;
    if (value instanceof Error) return value.message || fallback;
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const direct = record.error ?? record.message ?? record.details ?? record.detail;
      if (typeof direct === "string" && direct.trim()) return direct.trim();
      try {
        return JSON.stringify(value) || fallback;
      } catch {
        return fallback;
      }
    }
    return String(value) || fallback;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await generatePdf();
      if (!result) return;
      const url = URL.createObjectURL(result.file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error", error);
    } finally {
      setExporting(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setSendError("");
    setProgressMsg(t.sendingInvoice);
    try {
      const result = await generatePdf();
      if (!result) {
        setSendError(t.sendError);
        return;
      }
      const { url: invoiceUrl, error: uploadError } = await uploadInvoiceToStorage(result.file, result.fileName);
      if (!invoiceUrl) {
        setSendError(getDisplayError(uploadError, t.sendError));
        return;
      }
      const mediaItems = orderProducts
        .filter(({ product }) => product.video_url)
        .map(({ product }) => ({
          url: product.video_url as string,
          fileName: `Video_${product.name_ar}.mp4`,
          caption: lang === "ar" ? `فيديو شرح وطريقة استخدام: ${product.name_ar}` : `Product guide video: ${product.name_ar}`,
        }));
      const chatId = `${normalizePhoneForGreenApi(order.client_phone)}@c.us`;
      if (mediaItems.length > 0) setProgressMsg(t.sendingVideo(orderProducts[0]?.product.name_ar || ""));
      await sendWhatsAppDirect({
        chatId,
        invoiceUrl,
        invoiceCaption: translations[lang].whatsappMessage(order),
        media: mediaItems,
      });
      setProgressMsg(t.allSentSuccess);
      setExported(true);
      setTimeout(() => {
        setSending(false);
        setProgressMsg("");
      }, 2000);
    } catch (error: unknown) {
      console.error("Send error", error);
      setSendError(getDisplayError(error, t.sendError));
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" dir="rtl">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-slate-100 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between bg-white px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">{t.invoicePreviewTitle}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div style={{ width: '100%', overflowX: 'auto', background: '#f3f4f6', padding: '20px 0', direction: 'rtl' }}>
            <div
              ref={invoiceRef}
              id="invoice-sheet"
              style={{
                width: '210mm',
                height: '297mm',
                margin: '0 auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                background: '#ffffff',
              }}
            >
              <img
                src="/invoice-template.png"
                alt="Invoice Template"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            </div>
          </div>
          <style>{`
            @page {
              size: A4 portrait;
              margin: 0;
            }
            @media print {
              body {
                background: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
              #invoice-sheet {
                box-shadow: none !important;
                margin: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
              }
            }
          `}</style>
        </div>

        {sending && progressMsg && (
          <div className="border-t border-blue-200 bg-blue-50 px-5 py-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{progressMsg}</span>
            </div>
          </div>
        )}
        {!sending && exported && (
          <div className="border-t border-emerald-200 bg-emerald-50 px-5 py-3">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">{t.allSentSuccess}</span>
            </div>
          </div>
        )}
        {sendError && (
          <div className="border-t border-red-200 bg-red-50 px-5 py-3">
            <span className="text-sm font-medium text-red-600">{sendError}</span>
          </div>
        )}

        <div className="flex gap-3 border-t border-slate-200 bg-white p-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition hover:bg-slate-50">
            {t.cancel}
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || sending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            title={t.downloadInvoice}
          >
            {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
            <span className="hidden sm:inline">{t.downloadInvoice}</span>
          </button>
          <button
            onClick={handleSend}
            disabled={exporting || sending}
            className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
          >
            {sending ? (
              <><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">{progressMsg || "..."}</span></>
            ) : exported ? (
              <><Check className="h-5 w-5" />{t.allSentSuccess}</>
            ) : (
              <><Send className="h-5 w-5" />{t.sendToCustomer}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
