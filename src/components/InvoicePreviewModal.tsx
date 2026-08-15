import { useRef, useState, useMemo } from "react";
import { X, Download, MessageCircle, Check, Loader2, Send } from "lucide-react";
import type { Lang, Strings } from "../locales";
import { translations, categoryLabels, warrantyOptions } from "../locales";
import type { WorkOrder, Product } from "../types";
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

export default function InvoicePreviewModal({ lang, t, order, products, onConfirm, onClose }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [sending, setSending] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [sendError, setSendError] = useState("");

  const orderProducts = useMemo(() => {
    const ids = order.product_ids && order.product_ids.length > 0 ? order.product_ids : (order.product_id ? [order.product_id] : []);
    return products
      .filter(p => ids.includes(p.id))
      .map(p => ({ product: p, qty: 1, lineTotal: p.price }));
  }, [order.product_ids, order.product_id, products]);
  const grandTotal = orderProducts.reduce((sum, p) => sum + p.lineTotal, 0);
  const dateStr = new Date().toLocaleString(lang === "ar" ? "ar-OM" : "en-GB");
  const warrantyLabel = warrantyOptions.find(w => w.value === String(order.warranty_months))?.[lang === "ar" ? "label_ar" : "label_en"] || (lang === "ar" ? "سنة" : "1 year");

  const generatePdf = async (): Promise<{ file: File; fileName: string } | null> => {
    if (!invoiceRef.current) return null;
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const target = invoiceRef.current;
    const origMaxWidth = target.style.maxWidth;
    const origWidth = target.style.width;
    const origHeight = target.style.height;
    target.style.maxWidth = "794px";
    target.style.width = "794px";
    target.style.height = "1123px";

    const attachments = target.querySelector("#attachments-section") as HTMLElement | null;
    if (attachments) attachments.style.display = "none";
    await new Promise((r) => requestAnimationFrame(r));
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
        windowHeight: 1123,
      });
    } finally {
      if (attachments) attachments.style.display = "";
      target.style.maxWidth = origMaxWidth;
      target.style.width = origWidth;
      target.style.height = origHeight;
    }
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const scale = Math.min(1, pageH / imgH);
    const finalW = imgW * scale;
    const finalH = imgH * scale;
    pdf.addImage(imgData, "PNG", 0, 0, finalW, finalH);
    const safeId = (order.order_number || "order").replace(/[^a-zA-Z0-9_]/g, "_");
    const safePhone = (order.client_phone || "").replace(/[^0-9]/g, "");
    const fileName = `Invoice_${safeId}_${safePhone}.pdf`;
    const blob = pdf.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    return { file, fileName };
  };

  const uploadInvoiceToStorage = async (file: File, fileName: string): Promise<{ url: string | null; error: string | null }> => {
    try {
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `invoices/${safeFileName}`;
      const { error: uploadError } = await supabase.storage
        .from("product-videos")
        .upload(storagePath, file, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("product-videos")
        .getPublicUrl(storagePath);
      const publicUrl = urlData?.publicUrl || null;
      if (!publicUrl) throw new Error("Failed to get public URL after upload");
      return { url: publicUrl, error: null };
    } catch (e: any) {
      const detail = e?.message || String(e) || "Unknown error";
      console.error("Invoice upload error:", detail);
      return { url: null, error: detail };
    }
  };

  const normalizePhoneForGreenApi = (phone: string): string => {
    return (phone || "").replace(/[\s+]/g, "").replace(/[^\d]/g, "");
  };

  const getDisplayError = (value: unknown, fallback: string): string => {
    if (!value) return fallback;

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed || fallback;
    }

    if (value instanceof Error) {
      return value.message || fallback;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;

      const direct = record.error ?? record.message ?? record.details ?? record.detail;
      if (typeof direct === "string" && direct.trim()) return direct.trim();

      const nestedResults = Array.isArray(record.results)
        ? record.results
            .map((item) => {
              if (!item || typeof item !== "object") return "";
              const itemRecord = item as Record<string, unknown>;
              const detail = itemRecord.detail ?? itemRecord.message ?? itemRecord.error;
              return typeof detail === "string" && detail.trim() ? detail.trim() : "";
            })
            .filter(Boolean)
        : [];

      if (nestedResults.length) return nestedResults.join(" | ");

      try {
        const jsonText = JSON.stringify(value);
        return jsonText && jsonText !== "{}" ? jsonText : fallback;
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
    setSending(true);
    setSendError("");
    setProgressMsg(t.sendingInvoice);
    try {
      const result = await generatePdf();
      if (!result) {
        setSendError(t.sendError);
        setSending(false);
        return;
      }

      // Upload invoice PDF to Supabase Storage to get a public URL
      const { url: invoiceUrl, error: invUploadErr } = await uploadInvoiceToStorage(result.file, result.fileName);
      if (!invoiceUrl) {
        setSendError(getDisplayError(invUploadErr, t.sendError));
        setSending(false);
        return;
      }

      // Build the list of product videos to send
      const mediaItems = orderProducts
        .filter(({ product }) => product.video_url)
        .map(({ product }) => ({
          url: product.video_url!,
          fileName: `Video_${product.name_ar}.mp4`,
          caption: lang === "ar"
            ? `🎬 فيديو شرح وطريقة استخدام: ${product.name_ar}`
            : `🎬 Product guide video: ${product.name_ar}`,
        }));

      // Build the invoice caption
      const invoiceCaption = translations[lang].whatsappMessage(order);

      // Format chatId for Green API without '+' or spaces
      const cleanPhone = normalizePhoneForGreenApi(order.client_phone);
      const chatId = `${cleanPhone}@c.us`;

      // Update progress message for first video if any
      if (mediaItems.length > 0) {
        setProgressMsg(t.sendingVideo(orderProducts.find(({ product }) => product.video_url)?.product.name_ar || ""));
      }

      try {
        await sendWhatsAppDirect({
          chatId,
          invoiceUrl,
          invoiceCaption,
          media: mediaItems,
        });
      } catch (error: any) {
        const showText = error?.message || error?.toString() || t.sendError;
        alert(showText);
        setSendError(showText);
        setSending(false);
        return;
      }

      // Also download the invoice locally for the user's records
      const dlUrl = URL.createObjectURL(result.file);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(dlUrl);

      setProgressMsg(t.allSentSuccess);
      setExported(true);
      setTimeout(() => {
        setSending(false);
        setProgressMsg("");
      }, 2000);
    } catch (e: any) {
      console.error("Send error", e);
      setSendError(getDisplayError(e, t.sendError));
      setSending(false);
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
          <div className="mx-auto bg-white shadow-2xl ring-1 ring-slate-200" style={{ width: "794px", maxWidth: "100%", overflow: "hidden" }}>
            <div
              ref={invoiceRef}
              dir="rtl"
              className="mx-auto flex w-full flex-col overflow-hidden bg-white text-slate-900"
              style={{ width: "794px", height: "1123px", maxWidth: "100%", borderRadius: 0, pageBreakInside: "avoid", fontFamily: "Arial, sans-serif" }}
            >
              <header className="shrink-0 border-b-4 border-blue-600 bg-[#f0f7ff] px-9 pb-5 pt-6" style={{ height: 188 }}>
                <div className="flex h-full items-center justify-between gap-8">
                  <div className="w-[31%] text-right">
                    <p className="text-sm font-bold leading-6 text-slate-900">{t.appTitle}</p>
                    <p className="text-xs font-semibold leading-5 text-slate-700">{t.appSubtitle}</p>
                    <p className="mt-1 text-[11px] font-bold text-slate-700">{t.invoice}: {order.order_number}</p>
                  </div>
                  <div className="flex w-[34%] flex-col items-center justify-center text-slate-800">
                    <div className="text-[76px] font-black leading-[0.72] tracking-[-12px] text-slate-700">MZ</div>
                    <p className="mt-3 text-[10px] font-medium tracking-wide text-slate-600">{t.appSubtitle}</p>
                  </div>
                  <div className="w-[31%] text-left">
                    <div className="mb-3 inline-block bg-[#0c2f64] px-4 py-2 text-[10px] font-bold tracking-[0.18em] text-white" style={{ borderRadius: 0 }}>INVOICE</div>
                    <h1 className="text-xl font-extrabold text-[#0c2f64]">{t.invoice}</h1>
                    <p className="mt-2 text-[11px] font-bold text-blue-700">{order.order_number}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{t.invoiceDate}: {dateStr}</p>
                  </div>
                </div>
              </header>

              <main className="flex min-h-0 flex-1 flex-col px-9 py-5">
                <div className="mb-5 grid shrink-0 grid-cols-2 gap-4">
                  <section className="border border-slate-200 bg-[#f7faff] p-4 text-right" style={{ height: 106, borderRadius: 0 }}>
                    <h2 className="mb-3 border-r-4 border-blue-500 pr-3 text-sm font-bold text-blue-700">{t.clientName}</h2>
                    <p className="text-base font-extrabold text-slate-900">{order.client_name || "-"}</p>
                    <p className="mt-2 text-[11px] text-slate-600">{t.clientPhone}: {order.client_phone}</p>
                  </section>
                  <section className="border border-slate-200 bg-[#f7faff] p-4 text-right" style={{ height: 106, borderRadius: 0 }}>
                    <h2 className="mb-3 border-r-4 border-blue-500 pr-3 text-sm font-bold text-blue-700">{t.paymentMethod}</h2>
                    <p className="text-base font-extrabold text-slate-900">{order.payment_method === "bank" ? t.bankTransfer : t.cash}</p>
                    <p className="mt-2 text-[11px] text-slate-600">{t.invoiceDate}: {dateStr}</p>
                  </section>
                </div>

                <section className="mb-4 shrink-0" style={{ pageBreakInside: "avoid" }}>
                  <div className="mb-2 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-blue-600">ORDER DETAILS</p>
                      <h2 className="mt-1 text-lg font-extrabold text-slate-900">{t.product}</h2>
                    </div>
                    <span className="text-[11px] text-slate-500">{orderProducts.length} {t.invoiceQty}</span>
                  </div>
                  <table className="w-full border-collapse text-right" style={{ border: "1px solid #dfe6ef", tableLayout: "fixed" }}>
                    <thead>
                      <tr className="bg-[#0c2f64] text-white">
                        <th style={{ width: "46%", padding: "11px 12px", fontSize: 12 }}>{t.invoiceProduct}</th>
                        <th style={{ width: "14%", padding: "11px 12px", fontSize: 12 }}>{t.invoiceQty}</th>
                        <th style={{ width: "20%", padding: "11px 12px", fontSize: 12 }}>{t.invoiceUnitPrice}</th>
                        <th style={{ width: "20%", padding: "11px 12px", fontSize: 12 }}>{t.invoiceLineTotal}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderProducts.length === 0 ? (
                        <tr><td colSpan={4} className="text-center text-slate-400" style={{ padding: "12px", fontSize: 12 }}>-</td></tr>
                      ) : orderProducts.map(({ product, qty, lineTotal }) => (
                        <tr key={product.id} className="border-b border-slate-200 odd:bg-white even:bg-[#f7faff]">
                          <td style={{ padding: "11px 12px", fontSize: 12 }}><p className="font-bold">{product.name_ar}</p><p className="mt-1 text-[10px] text-slate-500">{product.code} · {categoryLabels[product.category]?.[lang] || ""}</p></td>
                          <td className="text-center" style={{ padding: "11px 12px", fontSize: 12 }}>{qty}</td>
                          <td style={{ padding: "11px 12px", fontSize: 12 }}>{product.price.toFixed(3)} {lang === "ar" ? "ر.ع" : "OMR"}</td>
                          <td className="font-bold text-slate-900" style={{ padding: "11px 12px", fontSize: 12 }}>{lineTotal.toFixed(3)} {lang === "ar" ? "ر.ع" : "OMR"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <div className="grid min-h-0 flex-1 grid-cols-[1.35fr_0.9fr] gap-4" style={{ pageBreakInside: "avoid" }}>
                  <section className="border border-blue-200 bg-[#f3f8ff] p-4 text-right" style={{ borderRadius: 0 }}>
                    <h2 className="mb-3 border-r-4 border-blue-500 pr-3 text-base font-extrabold text-blue-800">{t.warrantyTerms}</h2>
                    <div className="space-y-2 text-[10px] leading-[1.55] text-slate-700">
                      {t.warrantyNote.split("\n").map((line, i) => <p key={i}>{line}</p>)}
                    </div>
                  </section>
                  <section className="border border-slate-200 p-4 text-right" style={{ borderRadius: 0 }}>
                    <h2 className="mb-4 border-r-4 border-blue-500 pr-3 text-base font-extrabold text-slate-900">{t.totalRevenue}</h2>
                    <div className="space-y-3 text-[11px] text-slate-600">
                      <div className="flex justify-between gap-3"><span>{t.totalRevenue}</span><strong>{grandTotal.toFixed(3)} {lang === "ar" ? "ر.ع" : "OMR"}</strong></div>
                      <div className="flex justify-between gap-3"><span>{t.paymentMethod}</span><strong>{order.payment_method === "bank" ? t.bankTransfer : t.cash}</strong></div>
                    </div>
                    <div className="mt-5 bg-[#0c2f64] p-5 text-white" style={{ borderRadius: 0 }}>
                      <p className="text-[10px] font-semibold text-blue-100">{t.totalRevenue}</p>
                      <p className="mt-2 text-2xl font-extrabold">{grandTotal.toFixed(3)} {lang === "ar" ? "ر.ع" : "OMR"}</p>
                      <p className="mt-2 text-[10px] text-blue-100">{t.warranty}: {warrantyLabel}</p>
                    </div>
                  </section>
                </div>
              </main>

              <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-[#f7faff] px-9 py-3 text-[10px] text-slate-600" style={{ height: 42, borderRadius: 0 }}>
                <span>{t.appSubtitle}</span>
                <strong className="text-[#0c2f64]">{t.appTitle}</strong>
              </footer>
            </div>
          </div>
        </div>

        {/* Progress bar / status */}
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
            <Download className="h-5 w-5" />
            <span className="hidden sm:inline">{t.downloadInvoice}</span>
          </button>
          <button
            onClick={handleSend}
            disabled={exporting || sending}
            className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">{progressMsg || "..."}</span>
              </>
            ) : exported ? (
              <>
                <Check className="h-5 w-5" />
                {t.allSentSuccess}
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
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
    <div className="flex justify-between" style={{ padding: "4px 0" }}>
      <span className="text-slate-400" style={{ fontSize: 12 }}>{label}</span>
      <span className="font-medium text-slate-900" style={{ fontSize: 12 }}>{value}</span>
    </div>
  );
}
