import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { X, Navigation, ZoomIn, ZoomOut, LocateFixed, MapPin } from "lucide-react";
import type { Lang, Strings } from "../locales";
import type { WorkOrder, Technician } from "../types";
import { toArabicNumber } from "../lib/storage";

interface Props {
  lang: Lang;
  t: Strings;
  orders: WorkOrder[];
  technician?: Technician | null;
  technicians?: Technician[];
  isAdmin: boolean;
  onClose: () => void;
}

const GREEN = "#10b981";
const ORANGE = "#f59e0b";
const RED = "#ef4444";

const orderColor = (status: string): string =>
  status === "completed" ? GREEN : status === "cancelled" ? RED : ORANGE;

const statusLabel = (status: string, t: Strings): string =>
  status === "pending" ? t.legendPending :
  status === "in_progress" ? t.legendInProgress :
  status === "completed" ? t.legendCompleted : t.legendCancelled;

function makeNumberedIcon(color: string, num: number): L.DivIcon {
  return L.divIcon({
    className: "wo-marker",
    html: `<div style="position:relative;width:38px;height:38px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:15px;font-family:inherit;">${num}</div>
      <div style="position:absolute;left:50%;top:34px;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid ${color};"></div>
    </div>`,
    iconSize: [38, 46],
    iconAnchor: [19, 46],
    popupAnchor: [0, -46],
  });
}

export default function MapView({ lang, t, orders, technician, technicians, isAdmin, onClose }: Props) {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [locating, setLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const mappedOrders = (() => {
    let r = orders;
    if (isAdmin && selectedTech) r = r.filter((o) => o.technician_id === selectedTech);
    if (!isAdmin && technician) r = r.filter((o) => o.technician_id === technician.id);
    return r.filter((o) => o.gps_lat && o.gps_lng);
  })();

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [23.588, 58.3829],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    });
    const tiles = L.tileLayer(
      "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
      {
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        maxZoom: 20,
      }
    );
    tiles.addTo(map);
    mapRef.current = map;
    tileLayerRef.current = tiles;
    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markersRef.current = [];
      userMarkerRef.current = null;
    };
  }, []);

  // Update markers when orders change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (mappedOrders.length === 0) return;
    mappedOrders.forEach((order, idx) => {
      const color = orderColor(order.status);
      const marker = L.marker([order.gps_lat!, order.gps_lng!], {
        icon: makeNumberedIcon(color, idx + 1),
      });
      marker.on("click", () => setSelectedOrder(order));
      marker.addTo(map);
      markersRef.current.push(marker);
    });
    // Auto-fit to all markers
    const pts: L.LatLngExpression[] = mappedOrders.map((o) => [o.gps_lat!, o.gps_lng!]);
    if (pts.length === 1) {
      map.setView(pts[0] as L.LatLngExpression, 14);
    } else {
      map.fitBounds(L.latLngBounds(pts).pad(0.2));
    }
  }, [mappedOrders]);

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();

  const handleMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapRef.current!;
        map.setView([latitude, longitude], 15);
        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = L.marker([latitude, longitude], {
          icon: L.divIcon({
            className: "user-loc",
            html: `<div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).addTo(map);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const techCount = (id: string) =>
    orders.filter((o) => o.technician_id === id && o.gps_lat && o.gps_lng).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shadow-lg" style={{ background: "linear-gradient(135deg, #1e75e6 0%, #0066fe 100%)" }}>
        <button onClick={onClose} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25">
          <X className="h-4 w-4" />
          <span>{t.back}</span>
        </button>
        <h2 className="text-base font-bold text-white">{isAdmin ? t.techOrdersMap : t.workOrderMap}</h2>
        <div className="w-16" />
      </div>

      {/* Technician filter */}
      {isAdmin && technicians && technicians.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2">
          <button
            onClick={() => setSelectedTech(null)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${!selectedTech ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {t.filterAll}
          </button>
          {technicians.map((tc) => (
            <button
              key={tc.id}
              onClick={() => setSelectedTech(tc.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${selectedTech === tc.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {tc.name}
              <span className="rounded-full bg-white/20 px-1.5 text-xs">{toArabicNumber(techCount(tc.id))}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map container */}
      <div className="relative flex-1">
        <div ref={containerRef} className="absolute inset-0" style={{ background: "#aadaff" }} />

        {/* No orders overlay */}
        {mappedOrders.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl bg-white/90 px-6 py-4 text-center shadow-lg backdrop-blur">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">{t.noOrders}</p>
            </div>
          </div>
        )}

        {/* My Location button (top right) */}
        <button
          onClick={handleMyLocation}
          className={`absolute right-4 top-4 z-[1000] flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition active:scale-90 ${locating ? "bg-blue-600 text-white" : "bg-white text-blue-600 hover:bg-slate-50"}`}
          aria-label="My location"
        >
          <LocateFixed className={`h-5 w-5 ${locating ? "animate-pulse" : ""}`} />
        </button>

        {/* Zoom controls (bottom right) */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1">
          <button onClick={zoomIn} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-lg transition hover:bg-slate-50 active:scale-90">
            <ZoomIn className="h-5 w-5" />
          </button>
          <button onClick={zoomOut} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-lg transition hover:bg-slate-50 active:scale-90">
            <ZoomOut className="h-5 w-5" />
          </button>
        </div>

        {/* Legend (bottom left) */}
        <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur">
          <p className="mb-2 text-xs font-semibold text-slate-700">{lang === "ar" ? "المفتاح" : "Legend"}</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white" />
              <span className="text-xs text-slate-600">{t.legendCompleted}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white" />
              <span className="text-xs text-slate-600">{lang === "ar" ? "قيد الانتظار / التنفيذ" : "Pending / In Progress"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white" />
              <span className="text-xs text-slate-600">{t.legendCancelled}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order detail popup */}
      {selectedOrder && (
        <div className="absolute inset-0 z-[1100] flex items-end justify-center bg-black/30" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:mb-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">{t.clientName}</span>
                <span className="text-sm font-medium text-slate-900">{selectedOrder.client_name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">{t.clientPhone}</span>
                <span className="text-sm font-medium text-slate-900">{selectedOrder.client_phone}</span>
              </div>
              {selectedOrder.technician_name && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">{t.technician}</span>
                  <span className="text-sm font-medium text-slate-900">{selectedOrder.technician_name}</span>
                </div>
              )}
              {selectedOrder.client_location_name && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">{t.clientLocation}</span>
                  <span className="text-sm font-medium text-slate-900">{selectedOrder.client_location_name}</span>
                </div>
              )}
              {selectedOrder.product_name && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">{t.product}</span>
                  <span className="text-sm font-medium text-slate-900">{selectedOrder.product_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {statusLabel(selectedOrder.status, t)}
                </span>
                {selectedOrder.route_number && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {t.route} {toArabicNumber(selectedOrder.route_number)}
                  </span>
                )}
              </div>
            </div>
            <a
              href={selectedOrder.gps_link || `https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.gps_lat},${selectedOrder.gps_lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Navigation className="h-4 w-4" />
              {t.openGoogleMaps}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
