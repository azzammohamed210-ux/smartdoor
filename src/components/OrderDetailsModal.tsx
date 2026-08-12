import { useState, useEffect, useMemo, useRef } from "react";
import { X, Check, MapPin, Upload, ImageIcon, Crosshair, XCircle, Package, ScanLine, Loader2 } from "lucide-react";
import type { Lang, Strings } from "../locales";
import { checklistItems, warrantyOptions } from "../locales";
import type { WorkOrder, Technician, Product } from "../types";
import { createWorkOrder, completeOrder, cancelOrder } from "../lib/storage";
import InvoicePreviewModal from "./InvoicePreviewModal";

interface Props {
  mode: "create" | "edit";
  lang: Lang;
  t: Strings;
  order: WorkOrder | null;
  technicians: Technician[];
  products: Product[];
  currentTechId?: string;
  onClose: () => void;
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info", icon?: "check" | "cancel" | "rocket" | "cash") => void;
}

export default function OrderDetailsModal({ mode, lang, t, order, technicians, products, currentTechId, onClose, onRefresh, showToast }: Props) {
  const isCreate = mode === "create";
  const [technicianId, setTechnicianId] = useState(order?.technician_id || "");
  const [clientName, setClientName] = useState(order?.client_name || "");
  const [clientPhone, setClientPhone] = useState(order?.client_phone || "");
  const [clientLocationName, setClientLocationName] = useState(order?.client_location_name || "");
  const [gpsLink, setGpsLink] = useState(order?.gps_link || "");
  const [productId, setProductId] = useState(order?.product_id || "");
  const [productIds, setProductIds] = useState<string[]>(order?.product_ids || (order?.product_id ? [order.product_id] : []));
  const [amount, setAmount] = useState(order?.amount?.toString() || "");
  const [warranty, setWarranty] = useState(order?.warranty_months?.toString() || "12");
  const [paymentMethod, setPaymentMethod] = useState(order?.payment_method || "cash");
  const [checklist, setChecklist] = useState<string[]>(order?.checklist || []);
  const [notes, setNotes] = useState(order?.notes || "");
  const [idImage, setIdImage] = useState<string | undefined>(order?.id_image_url);
  const [receiptImage, setReceiptImage] = useState<string | undefined>(order?.receipt_image_url);
  const [finalPhoto, setFinalPhoto] = useState<string | undefined>(order?.final_photo_url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<WorkOrder | null>(null);
  const [successToast, setSuccessToast] = useState(false);
  const [cancelMode, setCancelMode] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [ocrEdited, setOcrEdited] = useState("");
  const ocrFileRef = useRef<HTMLInputElement>(null);

  const autoTotal = useMemo(() => {
    return products
      .filter(p => productIds.includes(p.id))
      .reduce((sum, p) => sum + p.price, 0);
  }, [products, productIds]);

  useEffect(() => {
    if (!amountTouched && autoTotal > 0) {
      setAmount(autoTotal.toFixed(3));
    }
  }, [autoTotal, amountTouched]);

  useEffect(() => {
    if (isCreate && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsLink(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
        () => {},
        { timeout: 5000 }
      );
    }
  }, [isCreate]);

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleOcrScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrScanning(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setIdImage(dataUrl);
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng+ara", 1, {
        logger: () => {},
      });
      const { data: { text } } = await worker.recognize(dataUrl);
      await worker.terminate();
      // Extract name: look for lines with Arabic or English name patterns
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2);
      // Try to find a name-like line (Arabic name or English name)
      let extractedName = "";
      // Look for "Name" label in English or Arabic
      const nameIdx = lines.findIndex(l => /name|اسم|الاسم/i.test(l));
      if (nameIdx >= 0 && nameIdx + 1 < lines.length) {
        extractedName = lines[nameIdx + 1];
      } else {
        // Try to find the longest Arabic text line as a fallback
        const arabicLines = lines.filter(l => /[\u0600-\u06FF]{3,}/.test(l));
        if (arabicLines.length > 0) {
          extractedName = arabicLines.sort((a, b) => b.length - a.length)[0];
        } else {
          // Fallback: first non-numeric line
          const nonNumeric = lines.find(l => !/^\d+$/.test(l.replace(/[\s\-:]/g, "")));
          extractedName = nonNumeric || "";
        }
      }
      // Clean up extracted name
      extractedName = extractedName.replace(/[^\u0600-\u06FFa-zA-Z\s]/g, "").trim();
      setOcrResult(extractedName || "");
      setOcrEdited(extractedName || "");
    } catch (err) {
      setOcrResult("");
      setOcrEdited("");
    } finally {
      setOcrScanning(false);
      if (ocrFileRef.current) ocrFileRef.current.value = "";
    }
  };

  const confirmOcrName = () => {
    setClientName(ocrEdited.trim());
    setOcrResult(null);
    setOcrEdited("");
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setIdImage(await readFileAsDataUrl(file));
  };
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReceiptImage(await readFileAsDataUrl(file));
  };
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFinalPhoto(await readFileAsDataUrl(file));
  };

  const autoDetectGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsLink(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
        () => {},
        { timeout: 5000 }
      );
    }
  };

  const toggleProduct = (id: string) => {
    setProductIds((prev) => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    setError("");
    if (!clientPhone.trim()) { setError(t.clientPhone); return; }
    setSaving(true);
    try {
      if (isCreate) {
        await createWorkOrder({
          technician_id: technicianId || undefined,
          client_phone: clientPhone.trim(),
          client_location_name: clientLocationName,
          gps_link: gpsLink,
          notes: notes,
        });
        showToast(t.toastOrderCreated, "success", "check");
        onRefresh();
        onClose();
      } else if (order) {
        const selectedProducts = products.filter(p => productIds.includes(p.id));
        const combinedName = selectedProducts.map(p => p.name_ar).join(" + ");
        const combinedCode = selectedProducts.map(p => p.code).join(" + ");
        const primaryProductId = productIds[0] || "";
        const updated: Partial<WorkOrder> = {
          client_name: clientName,
          product_id: primaryProductId,
          product_ids: productIds,
          product_name: combinedName || undefined,
          product_code: combinedCode || undefined,
          amount: parseFloat(amount) || 0,
          warranty_months: parseInt(warranty) || 0,
          payment_method: paymentMethod,
          checklist,
          notes,
          receipt_image_url: receiptImage,
          final_photo_url: finalPhoto,
          id_image_url: idImage,
        };
        await completeOrder(order.id, {
          client_name: clientName,
          product_id: primaryProductId,
          product_ids: productIds,
          product_name: combinedName || undefined,
          product_code: combinedCode || undefined,
          amount: parseFloat(amount) || 0,
          warranty_months: parseInt(warranty) || 0,
          payment_method: paymentMethod,
          checklist,
          notes,
          receipt_image_url: receiptImage,
          final_photo_url: finalPhoto,
          id_image_url: idImage,
        });

        const fullOrder: WorkOrder = {
          ...order,
          ...updated,
          status: "completed",
          product_name: combinedName || undefined,
          product_code: combinedCode || undefined,
          technician_name: technicians.find(tc => tc.id === (technicianId || order.technician_id))?.name,
        } as WorkOrder;
        setPendingOrder(fullOrder);
        setSuccessToast(true);
        showToast(t.toastOrderCompleted, "success", "rocket");
        setTimeout(() => {
          setSuccessToast(false);
          onRefresh();
          onClose();
        }, 1800);
      }
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return;
    setSaving(true);
    try {
      await cancelOrder(order!.id, cancelReason.trim());
      showToast(t.toastOrderCancelled, "error", "cancel");
      onRefresh();
      onClose();
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              {isCreate ? t.newOrder : t.completeOrder}
            </h3>
            <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
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

            {/* Client phone - numeric keyboard */}
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

            {/* Location + GPS unified row */}
            {!isCreate && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t.clientLocation}</label>
                <input value={clientLocationName} onChange={(e) => setClientLocationName(e.target.value)} className={inputCls} placeholder="مسقط، عمان" />
              </div>
            )}
            {/* Unified GPS input + auto-detect button */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t.gpsLink}</label>
              <div className="flex gap-2">
                <input value={gpsLink} onChange={(e) => setGpsLink(e.target.value)} className={inputCls} placeholder="23.5880, 58.3829 أو رابط جوجل" />
                <button
                  type="button"
                  onClick={autoDetectGps}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-blue-50 px-3 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  <Crosshair className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.gpsAutoDetect}</span>
                </button>
              </div>
              {gpsLink && (
                <a
                  href={gpsLink.startsWith("http") ? gpsLink : `https://www.google.com/maps?q=${gpsLink}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-50 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  <MapPin className="h-4 w-4" />
                  {gpsLink} - {t.openGoogleMaps}
                </a>
              )}
            </div>

            {/* Edit-mode fields */}
            {!isCreate && (
              <>
                {/* Client name + ID image upload */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t.clientName}</label>
                  <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <ImageIcon className="h-4 w-4" />
                    {t.uploadIdImage}
                  </label>
                  <input type="file" accept="image/*" onChange={handleIdUpload} className="w-full text-xs text-slate-500" />
                  {idImage && (
                    <div className="mt-3 flex items-center gap-3">
                      <img src={idImage} alt="ID" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {t.idImageAttached}
                      </div>
                    </div>
                  )}
                </div>

                {/* Product - multi-select checkboxes */}
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
                  {productIds.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      <Package className="h-3.5 w-3.5" />
                      {products.filter(p => productIds.includes(p.id)).map(p => p.name_ar).join(" + ")}
                    </div>
                  )}
                </div>

                {/* Amount - decimal keyboard + Warranty dropdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">{t.amountOmr}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setAmountTouched(true); }}
                      className={inputCls}
                      dir="ltr"
                    />
                    {autoTotal > 0 && !amountTouched && (
                      <p className="mt-1 text-xs text-emerald-600">{t.consumptionAutoPriced}: {autoTotal.toFixed(3)} {lang === "ar" ? "ر.ع" : "OMR"}</p>
                    )}
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

                {/* Bank receipt upload + preview */}
                {paymentMethod === "bank" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Upload className="h-4 w-4" />
                      {t.uploadReceipt}
                    </label>
                    <input type="file" accept="image/*" onChange={handleReceiptUpload} className="w-full text-xs text-slate-500" />
                    {receiptImage && (
                      <div className="mt-3">
                        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {t.receiptAttached}
                        </div>
                        <img src={receiptImage} alt="receipt" className="w-full rounded-lg border border-slate-200 object-contain" style={{ maxHeight: 180 }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Maintenance checklist - 3 items only */}
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

                {/* Maintenance notes only (no completion log) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{t.maintenanceNotes}</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} />
                </div>

                {/* Final photo upload */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <ImageIcon className="h-4 w-4" />
                    {t.uploadFinalPhoto}
                  </label>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-xs text-slate-500" />
                  {finalPhoto && (
                    <div className="mt-3">
                      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {t.finalPhotoAttached}
                      </div>
                      <img src={finalPhoto} alt="final" className="w-full rounded-lg border border-slate-200 object-contain" style={{ maxHeight: 180 }} />
                    </div>
                  )}
                </div>
              </>
            )}

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            {/* Cancel order mode */}
            {cancelMode && !isCreate && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <label className="mb-1 block text-sm font-semibold text-red-700">{t.cancelReason}</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-400"
                  placeholder={t.cancelReasonPlaceholder}
                />
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setCancelMode(false)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-white">
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    disabled={saving || !cancelReason.trim()}
                    className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                  >
                    {t.cancelOrder}
                  </button>
                </div>
              </div>
            )}

            {/* Action row */}
            {!cancelMode && (
              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-medium text-slate-600 transition hover:bg-slate-50">
                  {t.cancel}
                </button>
                {!isCreate && (
                  <button
                    onClick={() => setCancelMode(true)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 font-semibold text-white shadow-md transition hover:bg-red-600"
                  >
                    <XCircle className="h-4 w-4" />
                    {t.cancelOrder}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                >
                  {saving ? "..." : isCreate ? t.create : t.completeOrder}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvoice && pendingOrder && (
        <InvoicePreviewModal
          lang={lang}
          t={t}
          order={pendingOrder}
          products={products}
          onConfirm={() => { setShowInvoice(false); onRefresh(); onClose(); }}
          onClose={() => setShowInvoice(false)}
        />
      )}

      {successToast && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-2xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-base font-semibold text-slate-800">{t.orderCompletedSuccess}</span>
          </div>
        </div>
      )}
    </>
  );
}
