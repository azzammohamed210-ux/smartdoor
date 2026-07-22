import { useState } from "react";
import { X, ClipboardPaste, Zap, CheckCircle2, AlertCircle, MapPin } from "lucide-react";
import type { Lang, Strings } from "../locales";
import type { Technician } from "../types";
import { parseChatText, dispatchOrders, type ParsedOrder, type RoutedOrder } from "../lib/chatParser";
import { bulkCreateOrders, toArabicNumber } from "../lib/storage";

interface Props {
  lang: Lang;
  t: Strings;
  technicians: Technician[];
  onClose: () => void;
  onDispatched: () => void;
}

export default function BulkImportModal({ lang, t, technicians, onClose, onDispatched }: Props) {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedOrder[] | null>(null);
  const [routed, setRouted] = useState<RoutedOrder[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleParse = () => {
    if (!rawText.trim()) return;
    setParsing(true);
    setError("");
    setTimeout(() => {
      try {
        const result = parseChatText(rawText);
        if (result.length === 0) {
          setError(t.noParsedOrders);
          setParsed([]);
        } else {
          const dispatched = dispatchOrders(
            result,
            technicians.map(tc => ({ id: tc.id, name: tc.name })),
          );
          setParsed(result);
          setRouted(dispatched);
        }
      } catch (e: any) {
        setError(e.message || "Error");
      } finally {
        setParsing(false);
      }
    }, 300);
  };

  const handlePastePhone = async (idx: number) => {
    try {
      const clip = await navigator.clipboard.readText();
      const phone = clip.replace(/[^\d+]/g, "").trim();
      if (phone && routed) {
        const updated = [...routed];
        updated[idx].client_phone = phone;
        setRouted(updated);
      }
    } catch {
      setError(lang === "ar" ? "تعذر الوصول إلى الحافظة" : "Clipboard access denied");
    }
  };

  const handleDispatch = async () => {
    if (!routed) return;
    const missingPhone = routed.filter(r => !r.client_phone.trim());
    if (missingPhone.length > 0) {
      setError(lang === "ar" ? `يوجد ${missingPhone.length} طلب بدون رقم هاتف` : `${missingPhone.length} orders missing phone`);
      return;
    }
    setDispatching(true);
    setError("");
    try {
      await bulkCreateOrders(routed.map(r => ({
        client_name: r.client_name,
        client_phone: r.client_phone,
        gps_link: r.gps_link,
        gps_lat: r.gps_lat,
        gps_lng: r.gps_lng,
        product_detail: r.product_detail,
        preferred_time: r.preferred_time,
        technician_id: r.technician_id,
        route_number: r.route_number,
      })));
      setSuccess(true);
      setTimeout(() => { onDispatched(); onClose(); }, 1500);
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setDispatching(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between px-6 py-4" style={{ background: "linear-gradient(135deg, #1e75e6 0%, #0066fe 100%)" }}>
          <h3 className="text-lg font-bold text-white">{t.bulkImportTitle}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              <p className="mt-4 text-lg font-semibold text-slate-800">{t.bulkImportSuccess}</p>
            </div>
          ) : !routed ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t.bulkImportPlaceholder}</label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={10}
                  className={inputCls + " font-mono text-sm"}
                  placeholder={t.bulkImportPlaceholder}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <button
                onClick={handleParse}
                disabled={parsing || !rawText.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
              >
                {parsing ? (
                  <>{t.bulkImportParsing}</>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    {t.bulkImportParse}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MapPin className="h-4 w-4 text-blue-600" />
                {t.bulkImportPreview} ({routed.length})
              </div>

              <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500">
                      <th className="px-2 py-2 text-right font-medium">{t.colName}</th>
                      <th className="px-2 py-2 text-right font-medium">{t.colPhone}</th>
                      <th className="px-2 py-2 text-right font-medium">{t.colLocation}</th>
                      <th className="px-2 py-2 text-right font-medium">{t.colProduct}</th>
                      <th className="px-2 py-2 text-right font-medium">{t.colTime}</th>
                      <th className="px-2 py-2 text-right font-medium">{t.colTech}</th>
                      <th className="px-2 py-2 text-center font-medium">{t.colRoute}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routed.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-2 py-2 text-slate-800">{r.client_name || "-"}</td>
                        <td className="px-2 py-2">
                          {r.client_phone ? (
                            <span className="text-slate-700" dir="ltr">{r.client_phone}</span>
                          ) : (
                            <button
                              onClick={() => handlePastePhone(idx)}
                              className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                            >
                              <ClipboardPaste className="h-3 w-3" />
                              {t.pastePhone}
                            </button>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {r.gps_link ? (
                            <a href={r.gps_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                              <MapPin className="h-3 w-3" />
                              GPS
                            </a>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-slate-600">{r.product_detail || "-"}</td>
                        <td className="px-2 py-2 text-slate-600">{r.preferred_time || "-"}</td>
                        <td className="px-2 py-2 text-slate-700">{r.technician_name}</td>
                        <td className="px-2 py-2 text-center">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            {toArabicNumber(r.route_number)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setRouted(null); setParsed(null); setError(""); }}
                  className="flex-1 rounded-xl border border-slate-200 py-3 font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  {t.back}
                </button>
                <button
                  onClick={handleDispatch}
                  disabled={dispatching}
                  className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
                >
                  {dispatching ? (
                    <>{t.bulkImportDispatching}</>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      {t.bulkImportDispatch}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
