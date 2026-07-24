import { useState, useEffect, useCallback } from "react";
import { X, Plus, Zap, CheckCircle2, AlertCircle, MapPin, Phone, Clock, Package, Trash2, Edit2, Check, UserCheck, Loader2, Sparkles } from "lucide-react";
import type { Lang, Strings } from "../locales";
import type { Technician } from "../types";
import { parseSingleOrder, dispatchOrders, type ParsedOrder, type RoutedOrder } from "../lib/chatParser";
import { bulkCreateOrders, toArabicNumber } from "../lib/storage";
import { supabase } from "../lib/supabaseClient";

interface OrderCard {
  id: string;
  rawText: string;
  parsed: ParsedOrder | null;
  analyzed: boolean;
  analyzing: boolean;
  parseSource: "ai" | "fallback" | null;
}

interface Props {
  lang: Lang;
  t: Strings;
  technicians: Technician[];
  onClose: () => void;
  onDispatched: () => void;
}

const LS_DRAFT_CARDS = "sd_import_draft_cards";

function loadDraftCards(): OrderCard[] {
  try {
    const raw = localStorage.getItem(LS_DRAFT_CARDS);
    if (!raw) return [];
    const cards = JSON.parse(raw) as OrderCard[];
    return cards.map(c => ({ ...c, analyzing: false }));
  } catch { return []; }
}

function saveDraftCards(cards: OrderCard[]) {
  try { localStorage.setItem(LS_DRAFT_CARDS, JSON.stringify(cards)); } catch { /* ignore */ }
}

export default function BulkImportModal({ lang, t, technicians, onClose, onDispatched }: Props) {
  const [cards, setCards] = useState<OrderCard[]>(loadDraftCards);
  const [dispatching, setDispatching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showTechSelect, setShowTechSelect] = useState(false);
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);

  useEffect(() => { saveDraftCards(cards); }, [cards]);

  const activeTechs = technicians.filter(tc => tc.active);

  const addCard = useCallback(() => {
    const id = crypto.randomUUID();
    setCards(prev => [...prev, { id, rawText: "", parsed: null, analyzed: false, analyzing: false, parseSource: null }]);
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateCardText = useCallback((id: string, text: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, rawText: text, analyzed: false, parsed: null, parseSource: null } : c));
  }, []);

  const analyzeCard = useCallback(async (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card || !card.rawText.trim()) return;

    setCards(prev => prev.map(c => c.id === id ? { ...c, analyzing: true } : c));

    try {
      const { data, error } = await supabase.functions.invoke("ai-parse-order", {
        body: { text: card.rawText },
      });

      if (error || !data) throw new Error("AI parse failed");

      const source: "ai" | "fallback" = data.source === "ai" ? "ai" : "fallback";
      const parsed: ParsedOrder = {
        client_name: parseSingleOrder(card.rawText).client_name,
        client_phone: data.phone || "",
        gps_link: data.location_url || undefined,
        gps_lat: undefined,
        gps_lng: undefined,
        product_detail: data.product || undefined,
        preferred_time: data.appointment_time || undefined,
        raw: card.rawText,
      };

      if (data.location_url) {
        const coords = parseSingleOrder(card.rawText);
        if (coords.gps_lat && coords.gps_lng) {
          parsed.gps_lat = coords.gps_lat;
          parsed.gps_lng = coords.gps_lng;
        }
      }

      setCards(prev => prev.map(c => c.id === id ? { ...c, parsed, analyzed: true, analyzing: false, parseSource: source } : c));
    } catch {
      const parsed = parseSingleOrder(card.rawText);
      setCards(prev => prev.map(c => c.id === id ? { ...c, parsed, analyzed: true, analyzing: false, parseSource: "fallback" } : c));
    }
  }, [cards]);

  const editCard = useCallback((id: string) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, analyzed: false } : c));
  }, []);

  const analyzedCards = cards.filter(c => c.analyzed && c.parsed);

  const handleDispatchClick = () => {
    if (analyzedCards.length === 0) {
      setError(lang === "ar" ? "حلل بطاقة واحدة على الأقل أولاً" : "Analyze at least one card first");
      return;
    }
    setError("");
    setSelectedTechIds([]);
    setShowTechSelect(true);
  };

  const toggleTech = (id: string) => {
    setSelectedTechIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id)
        : prev.length >= 3 ? prev : [...prev, id]
    );
  };

  const handleConfirmDispatch = async () => {
    if (selectedTechIds.length === 0) return;
    const selectedTechs = activeTechs.filter(tc => selectedTechIds.includes(tc.id));
    if (selectedTechs.length === 0) return;

    setShowTechSelect(false);
    setDispatching(true);
    setError("");
    try {
      const parsedOrders = analyzedCards.map(c => c.parsed!);
      const routed = dispatchOrders(
        parsedOrders,
        selectedTechs.map(tc => ({ id: tc.id, name: tc.name })),
      );
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
      saveDraftCards([]);
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
          ) : (
            <div className="space-y-4">
              {/* Draft saved indicator */}
              {cards.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                  {t.draftSaved}
                </div>
              )}

              {/* Cards list */}
              {cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
                  <Package className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-400">{t.noCards}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card, idx) => (
                    <div key={card.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 transition hover:ring-blue-200">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
                            {toArabicNumber(idx + 1)}
                          </span>
                          {card.analyzed ? (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              {t.cardAnalyzed}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
                              <Clock className="h-3 w-3" />
                              {t.cardPending}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeCard(card.id)}
                          className="rounded-lg p-1.5 text-rose-400 transition hover:bg-rose-50"
                          title={t.deleteCard}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {card.analyzing ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                      ) : card.analyzed && card.parsed ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                              <div>
                                <p className="text-xs text-slate-400">{t.cardPhone}</p>
                                <p className="text-sm font-medium text-slate-800" dir="ltr">{card.parsed.client_phone || "-"}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                              <Package className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                              <div>
                                <p className="text-xs text-slate-400">{t.cardProduct}</p>
                                <p className="text-sm font-medium text-slate-800">{card.parsed.product_detail || "-"}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                              <div>
                                <p className="text-xs text-slate-400">{t.cardTime}</p>
                                <p className="text-sm font-medium text-slate-800">{card.parsed.preferred_time || "-"}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                              <div>
                                <p className="text-xs text-slate-400">{t.cardLocation}</p>
                                {card.parsed.gps_link ? (
                                  <a href={card.parsed.gps_link} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                                    GPS
                                  </a>
                                ) : (
                                  <p className="text-sm font-medium text-slate-400">-</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => editCard(card.id)}
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 transition hover:text-blue-700"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            {t.editCard}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            value={card.rawText}
                            onChange={(e) => updateCardText(card.id, e.target.value)}
                            rows={3}
                            className={inputCls + " text-sm"}
                            placeholder={t.cardRawPlaceholder}
                          />
                          <button
                            onClick={() => analyzeCard(card.id)}
                            disabled={!card.rawText.trim()}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                          >
                            <Sparkles className="h-4 w-4" />
                            {t.analyzeCard}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Add card button */}
              <button
                onClick={addCard}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 py-3 font-medium text-blue-600 transition hover:border-blue-400 hover:bg-blue-50"
              >
                <Plus className="h-5 w-5" />
                {t.addNewOrderCard}
              </button>

              {/* Dispatch button */}
              {analyzedCards.length > 0 && (
                <button
                  onClick={handleDispatchClick}
                  disabled={dispatching}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
                >
                  {dispatching ? (
                    <>{t.bulkImportDispatching}</>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      {t.confirmDispatch} ({toArabicNumber(analyzedCards.length)} {t.cardsCount})
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Technician selection modal */}
      {showTechSelect && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">{t.selectTechniciansTitle}</h3>
            </div>
            <p className="mb-4 text-sm text-slate-500">{t.selectTechniciansHint}</p>

            {activeTechs.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-600">{t.noActiveTechs}</p>
            ) : (
              <div className="space-y-2">
                {activeTechs.map(tc => (
                  <label
                    key={tc.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                      selectedTechIds.includes(tc.id)
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTechIds.includes(tc.id)}
                      onChange={() => toggleTech(tc.id)}
                      className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-slate-800">{tc.name}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowTechSelect(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 font-medium text-slate-600 transition hover:bg-slate-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmDispatch}
                disabled={selectedTechIds.length === 0}
                className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
              >
                <Zap className="h-4 w-4" />
                {t.confirmDispatch}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
