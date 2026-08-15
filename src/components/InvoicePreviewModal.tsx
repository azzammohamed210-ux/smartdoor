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
  const currency = lang === "ar" ? "ر.ع" : "OMR";
  const invoiceItems: InvoiceItem[] = orderProducts.map(({ product, qty, lineTotal }) => ({
    name: product.name_ar,
    code: `${product.code} - ${categoryLabels[product.category]?.[lang] || ""}`,
    qty,
    unitPrice: product.price.toFixed(3),
    total: lineTotal.toFixed(3),
  }));
  const subtotal = grandTotal.toFixed(3);
  const itemCountLabel = lang === "ar" ? "بنود" : "items";
  const companyName = lang === "ar" ? "محمد الزغل الرائدة ش م م" : t.appTitle;
  const companySubtitle = lang === "ar" ? "Projects Mohammad Alzaghal Investment" : t.appSubtitle;

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
    const attachments = target.querySelector("#attachments-section") as HTMLElement | null;
    if (attachments) attachments.style.display = "none";

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const renderScale = (window.devicePixelRatio || 1) * 2;

    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(target, {
        scale: renderScale,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
        windowHeight: 1123,
      });
    } finally {
      if (attachments) attachments.style.display = "";
    }

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
          <div className="w-full overflow-x-auto">
            <div className="mx-auto w-fit">
              <div
                ref={invoiceRef}
                dir="rtl"
                className="relative flex min-w-[210mm] w-[210mm] min-h-[297mm] flex-col justify-between bg-white p-8 font-sans text-gray-800 shadow-md"
                style={{ pageBreakInside: "avoid" }}
              >
                <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-50 opacity-60 blur-2xl" />
                <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-blue-50 opacity-60 blur-xl" />

                <div className="relative z-10 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                      <div className="text-right text-xs leading-relaxed text-gray-700">
                        <h2 className="mb-1 text-sm font-bold text-gray-900">{companyName}</h2>
                        <p><span className="font-semibold">رقم السجل التجاري:</span> 1559756</p>
                        <p><span className="font-semibold">رمز بريدي:</span> 110</p>
                      </div>

                      <div className="text-center">
                        <div className="text-4xl font-black italic tracking-widest text-[#0f2942]">M<span className="text-gray-500">Z</span></div>
                        <p className="mt-1 text-[10px] font-bold tracking-tight text-gray-600">{companySubtitle}</p>
                        <p className="text-[8px] uppercase tracking-widest text-gray-400">GATE AUTOMATION</p>
                      </div>

                      <div className="text-left">
                        <span className="mb-2 inline-block rounded-sm bg-[#0f2942] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">INVOICE</span>
                        <h3 className="text-lg font-bold text-gray-900">فاتورة / أمر عمل</h3>
                        <p className="text-xs font-semibold text-blue-600">{order.order_number || "WO-202608-7666"}</p>
                        <p className="mt-1 text-[10px] text-gray-500">التاريخ: {dateValue} - الوقت: {timeValue}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="rounded-sm border-r-4 border-[#0f2942] bg-gray-50/80 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="inline-block h-3 w-1 bg-blue-500" />
                          <h4 className="text-xs font-bold text-gray-500">بيانات العميل</h4>
                        </div>
                        <p className="text-base font-bold text-gray-900">{order.client_name || "-"}</p>
                        <p className="mt-1 text-xs text-gray-600" dir="ltr">{order.client_phone || "-"}</p>
                      </div>
                      <div className="rounded-sm border-r-4 border-[#0f2942] bg-gray-50/80 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="inline-block h-3 w-1 bg-blue-500" />
                          <h4 className="text-xs font-bold text-gray-500">ملخص العملية</h4>
                        </div>
                        <div className="flex justify-between text-xs">
                          <div>
                            <p className="text-[10px] text-gray-400">فترة الضمان</p>
                            <p className="font-bold text-gray-800">{warrantyLabel}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400">طريقة الدفع</p>
                            <p className="font-bold text-gray-800">{order.payment_method === "bank" ? t.bankTransfer : t.cash}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-700">تفاصيل المنتجات والخدمات</h4>
                        <span className="text-[10px] text-gray-400">{invoiceItems.length || 0} {itemCountLabel}</span>
                      </div>
                      <table className="w-full border-collapse text-right">
                        <thead>
                          <tr className="bg-[#0f2942] text-xs text-white">
                            <th className="p-3 font-semibold">المنتج / الخدمة</th>
                            <th className="p-3 text-center font-semibold">الكمية</th>
                            <th className="p-3 text-left font-semibold">سعر الوحدة</th>
                            <th className="p-3 text-left font-semibold">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 border-b border-gray-100 text-xs">
                          {invoiceItems.length > 0 ? invoiceItems.map((item, index) => (
                            <tr key={`${item.code}-${index}`} className="hover:bg-gray-50/50">
                              <td className="p-3">
                                <p className="font-bold text-gray-900">{item.name}</p>
                                <p className="text-[10px] text-gray-400">{item.code}</p>
                              </td>
                              <td className="p-3 text-center font-medium">{item.qty}</td>
                              <td className="p-3 text-left font-medium">{item.unitPrice} {currency}</td>
                              <td className="p-3 text-left font-bold text-gray-900">{item.total} {currency}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan={4} className="p-3 text-center text-gray-400">-</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-12 items-start gap-6">
                      <div className="col-span-7 rounded border border-gray-100 bg-gray-50/50 p-4 text-[10px] leading-relaxed">
                        <h5 className="mb-2 border-b border-gray-200 pb-1 text-xs font-bold text-gray-900">الضمان والشروط</h5>
                        <ul className="list-inside list-disc space-y-1.5 text-gray-600">
                          <li><strong className="text-gray-800">نطاق التغطية:</strong> يغطي الضمان العيوب التصنيعية للأجهزة والأعطال الفنية الناتجة عن عملية التركيب فقط.</li>
                          <li><strong className="text-gray-800">العوامل الجوية:</strong> لا يشمل الضمان الأعطال أو الأضرار الناتجة عن سوء الأحوال والعوامل الجوية.</li>
                          <li><strong className="text-gray-800">التيار الكهربائي:</strong> لا يشمل الضمان الأعطال الناتجة عن تذبذب أو ارتفاع وانخفاض التيار الكهربائي في الموقع.</li>
                          <li><strong className="text-gray-800">الهدية المجانية:</strong> لا يشمل الضمان جهاز الاتصال كونه هدية مجانية.</li>
                        </ul>
                        <p className="mt-3 text-[9px] font-semibold text-gray-400">يرجى الاحتفاظ بهذه الفاتورة لإثبات الضمان والخدمة.</p>
                      </div>

                      <div className="col-span-5 space-y-2 text-xs">
                        <h5 className="mb-2 border-b border-gray-200 pb-1 font-bold text-gray-900">ملخص المبلغ</h5>
                        <div className="flex justify-between text-gray-600">
                          <span>الإجمالي الفرعي:</span>
                          <span>{subtotal} {currency}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>الضريبة / الخصم:</span>
                          <span>0.000 {currency}</span>
                        </div>
                        <div className="flex justify-between border-t border-gray-100 pt-1 text-sm font-bold text-gray-900">
                          <span>الإجمالي:</span>
                          <span>{subtotal} {currency}</span>
                        </div>
                        <div className="mt-4 rounded bg-[#0f2942] p-4 text-center text-white">
                          <p className="mb-1 text-[10px] text-gray-300">المبلغ المدفوع إجمالاً</p>
                          <p className="text-2xl font-black tracking-wide">{subtotal} {currency}</p>
                          <p className="mt-1 text-[9px] text-gray-400">المتبقي: 0.000 {currency}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-4 text-[10px] text-gray-500">
                    <p className="font-medium">شكراً لثقتكم بنا</p>
                    <p className="font-semibold">MZ SMART - سلطنة عمان، محافظة جنوب الباطنة، الرميس</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
