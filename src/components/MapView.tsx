import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { X, MapPin, Navigation, Layers, ZoomIn, ZoomOut, LocateFixed } from "lucide-react";
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

const OMAN_CENTER = { lat: 23.588, lng: 58.3829 };
const GREEN = "#10b981";
const RED = "#ef4444";

interface ClusterInfo {
  id: number;
  orders: WorkOrder[];
  center: { lat: number; lng: number };
  color: string;
  routeNumber: number;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clusterOrders(orders: WorkOrder[], thresholdKm = 3): ClusterInfo[] {
  const visited = new Array(orders.length).fill(false);
  const clusters: WorkOrder[][] = [];
  for (let i = 0; i < orders.length; i++) {
    if (visited[i]) continue;
    const cluster: WorkOrder[] = [orders[i]];
    visited[i] = true;
    for (let j = i + 1; j < orders.length; j++) {
      if (visited[j]) continue;
      const dist = haversine(orders[i].gps_lat!, orders[i].gps_lng!, orders[j].gps_lat!, orders[j].gps_lng!);
      if (dist <= thresholdKm) {
        cluster.push(orders[j]);
        visited[j] = true;
      }
    }
    clusters.push(cluster);
  }
  return clusters.map((co, idx) => {
    const lat = co.reduce((s, o) => s + o.gps_lat!, 0) / co.length;
    const lng = co.reduce((s, o) => s + o.gps_lng!, 0) / co.length;
    const hasUrgent = co.some((o) => o.status === "pending" || o.status === "cancelled");
    return {
      id: idx,
      orders: co.sort((a, b) => (a.route_number || 0) - (b.route_number || 0)),
      center: { lat, lng },
      color: hasUrgent ? RED : GREEN,
      routeNumber: idx + 1,
    };
  });
}

function sortOptimalVisit(orders: WorkOrder[]): WorkOrder[] {
  if (orders.length <= 1) return orders;
  const sorted = [...orders];
  const result: WorkOrder[] = [];
  const used = new Array(sorted.length).fill(false);
  result.push(sorted[0]);
  used[0] = true;
  for (let i = 1; i < sorted.length; i++) {
    let bestIdx = -1;
    let bestDist = Infinity;
    const last = result[result.length - 1];
    for (let j = 0; j < sorted.length; j++) {
      if (used[j]) continue;
      const dist = haversine(last.gps_lat!, last.gps_lng!, sorted[j].gps_lat!, sorted[j].gps_lng!);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = j;
      }
    }
    if (bestIdx >= 0) {
      result.push(sorted[bestIdx]);
      used[bestIdx] = true;
    }
  }
  return result;
}

const orderColor = (status: string): string =>
  status === "completed" || status === "in_progress" ? GREEN : RED;

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

function zoomBounds(bounds: Bounds, focal: { lat: number; lng: number }, factor: number): Bounds {
  return {
    minLat: focal.lat - (focal.lat - bounds.minLat) * factor,
    maxLat: focal.lat + (bounds.maxLat - focal.lat) * factor,
    minLng: focal.lng - (focal.lng - bounds.minLng) * factor,
    maxLng: focal.lng + (bounds.maxLng - focal.lng) * factor,
  };
}

export default function MapView({ lang, t, orders, technician, technicians, isAdmin, onClose }: Props) {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [mapStyle, setMapStyle] = useState<"satellite" | "default">("satellite");
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(11);
  const [center, setCenter] = useState(OMAN_CENTER);
  const [mapBounds, setMapBounds] = useState<Bounds>({
    minLat: OMAN_CENTER.lat - 0.5,
    maxLat: OMAN_CENTER.lat + 0.5,
    minLng: OMAN_CENTER.lng - 0.5,
    maxLng: OMAN_CENTER.lng + 0.5,
  });
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragStart = useRef({ x: 0, y: 0, lat: 0, lng: 0 });
  const [dragging, setDragging] = useState(false);
  const pinchRef = useRef<{ d0: number; focal: { lat: number; lng: number }; bounds: Bounds; zoom0: number } | null>(null);

  const mappedOrders = useMemo(() => {
    let r = orders;
    if (isAdmin && selectedTech) r = r.filter((o) => o.technician_id === selectedTech);
    if (!isAdmin && technician) r = r.filter((o) => o.technician_id === technician.id);
    return r.filter((o) => o.gps_lat && o.gps_lng);
  }, [orders, isAdmin, selectedTech, technician]);

  const clusters = useMemo(() => clusterOrders(mappedOrders), [mappedOrders]);

  useEffect(() => {
    if (mappedOrders.length === 0) {
      setCenter(OMAN_CENTER);
      setZoom(11);
      setMapBounds({ minLat: OMAN_CENTER.lat - 0.5, maxLat: OMAN_CENTER.lat + 0.5, minLng: OMAN_CENTER.lng - 0.5, maxLng: OMAN_CENTER.lng + 0.5 });
      setMapReady(true);
      return;
    }
    const lats = mappedOrders.map((o) => o.gps_lat!);
    const lngs = mappedOrders.map((o) => o.gps_lng!);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const cLat = (minLat + maxLat) / 2;
    const cLng = (minLng + maxLng) / 2;
    const range = Math.max(maxLat - minLat, maxLng - minLng);
    const newZoom = range > 0.5 ? 9 : range > 0.2 ? 10 : range > 0.05 ? 12 : 14;
    setCenter({ lat: cLat, lng: cLng });
    setZoom(newZoom);
    setMapBounds({ minLat: minLat - 0.1, maxLat: maxLat + 0.1, minLng: minLng - 0.1, maxLng: maxLng + 0.1 });
    setMapReady(true);
  }, [mappedOrders]);

  const project = useCallback(
    (lat: number, lng: number) => {
      const latRange = mapBounds.maxLat - mapBounds.minLat || 1;
      const lngRange = mapBounds.maxLng - mapBounds.minLng || 1;
      const x = ((lng - mapBounds.minLng) / lngRange) * 100;
      const y = ((mapBounds.maxLat - lat) / latRange) * 100;
      return { x, y };
    },
    [mapBounds]
  );

  const screenToLatLng = useCallback(
    (clientX: number, clientY: number) => {
      const rect = mapRef.current?.getBoundingClientRect();
      if (!rect) return center;
      const fx = (clientX - rect.left) / rect.width;
      const fy = (clientY - rect.top) / rect.height;
      const lng = mapBounds.minLng + fx * (mapBounds.maxLng - mapBounds.minLng);
      const lat = mapBounds.maxLat - fy * (mapBounds.maxLat - mapBounds.minLat);
      return { lat, lng };
    },
    [mapBounds, center]
  );

  const applyZoom = useCallback((focal: { lat: number; lng: number }, factor: number) => {
    setMapBounds((prev) => zoomBounds(prev, focal, factor));
    setZoom((z) => Math.max(5, Math.min(18, Math.round(z - Math.log2(factor) * 1))));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const d0 = Math.hypot(dx, dy) || 1;
      const midX = (pts[0].x + pts[1].x) / 2;
      const midY = (pts[0].y + pts[1].y) / 2;
      const focal = screenToLatLng(midX, midY);
      pinchRef.current = { d0, focal, bounds: mapBounds, zoom0: zoom };
      setDragging(false);
      return;
    }
    if (e.button !== 0 && e.pointerType !== "touch") return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, lat: center.lat, lng: center.lng };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pinchRef.current && pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      const d = Math.hypot(dx, dy) || 1;
      const factor = pinchRef.current.d0 / d;
      const clamped = Math.max(0.4, Math.min(2.5, factor));
      const nb = zoomBounds(pinchRef.current.bounds, pinchRef.current.focal, clamped);
      setMapBounds(nb);
      setZoom(Math.max(5, Math.min(18, Math.round(pinchRef.current.zoom0 - Math.log2(clamped)))));
      setCenter({ lat: (nb.minLat + nb.maxLat) / 2, lng: (nb.minLng + nb.maxLng) / 2 });
      return;
    }
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const latRange = mapBounds.maxLat - mapBounds.minLat;
    const lngRange = mapBounds.maxLng - mapBounds.minLng;
    const dLat = -(dy / rect.height) * latRange;
    const dLng = -(dx / rect.width) * lngRange;
    const newCenter = { lat: dragStart.current.lat + dLat, lng: dragStart.current.lng + dLng };
    setCenter(newCenter);
    setMapBounds({
      minLat: newCenter.lat - latRange / 2,
      maxLat: newCenter.lat + latRange / 2,
      minLng: newCenter.lng - lngRange / 2,
      maxLng: newCenter.lng + lngRange / 2,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchRef.current = null;
    if (pointers.current.size === 0) {
      setDragging(false);
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const focal = screenToLatLng(e.clientX, e.clientY);
    const factor = e.deltaY < 0 ? 0.8 : 1.25;
    applyZoom(focal, factor);
  };

  const zoomIn = () => applyZoom(center, 0.5);
  const zoomOut = () => applyZoom(center, 2);

  const handleMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCenter({ lat, lng });
        setZoom(15);
        setMapBounds({ minLat: lat - 0.02, maxLat: lat + 0.02, minLng: lng - 0.02, maxLng: lng + 0.02 });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleClusterClick = (cluster: ClusterInfo) => {
    if (cluster.orders.length === 1) {
      setSelectedOrder(cluster.orders[0]);
      return;
    }
    setExpandedCluster(expandedCluster === cluster.id ? null : cluster.id);
    const lats = cluster.orders.map((o) => o.gps_lat!);
    const lngs = cluster.orders.map((o) => o.gps_lng!);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const cLat = (minLat + maxLat) / 2;
    const cLng = (minLng + maxLng) / 2;
    const range = Math.max(maxLat - minLat, maxLng - minLng, 0.01);
    setCenter({ lat: cLat, lng: cLng });
    setZoom(15);
    setMapBounds({ minLat: cLat - range * 0.8, maxLat: cLat + range * 0.8, minLng: cLng - range * 0.8, maxLng: cLng + range * 0.8 });
  };

  const getTileUrl = (x: number, y: number, z: number): string => {
    if (mapStyle === "satellite") {
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    }
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  };

  const getLabelTileUrl = (x: number, y: number, z: number): string =>
    `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${x}`;

  const tiles = useMemo(() => {
    if (!mapReady) return [];
    const tileResults: { url: string; label: string; left: number; top: number; size: number }[] = [];
    const z = Math.round(zoom);
    const n = Math.pow(2, z);
    const lngToX = (lng: number) => ((lng + 180) / 360) * n;
    const latToY = (lat: number) => {
      const rad = (lat * Math.PI) / 180;
      return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
    };
    const xMin = Math.floor(lngToX(mapBounds.minLng));
    const xMax = Math.ceil(lngToX(mapBounds.maxLng));
    const yMin = Math.floor(latToY(mapBounds.maxLat));
    const yMax = Math.ceil(latToY(mapBounds.minLat));
    const tileSize = 256;
    const mapWidth = mapRef.current?.clientWidth || 800;
    const mapHeight = mapRef.current?.clientHeight || 600;
    const xScale = mapWidth / (lngToX(mapBounds.maxLng) - lngToX(mapBounds.minLng) || 1);
    const yScale = mapHeight / (latToY(mapBounds.minLat) - latToY(mapBounds.maxLat) || 1);
    const scale = Math.max(xScale, yScale);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const wrappedX = ((x % n) + n) % n;
        const tileLeft = (lngToX((x / n) * 360 - 180) - lngToX(mapBounds.minLng)) * xScale;
        const tileTop = (latToY((Math.atan(Math.exp(Math.PI * (1 - 2 * (y / n)))) * 180 / Math.PI - 90)) - latToY(mapBounds.maxLat)) * yScale;
        tileResults.push({
          url: getTileUrl(wrappedX, y, z),
          label: getLabelTileUrl(wrappedX, y, z),
          left: tileLeft,
          top: tileTop,
          size: tileSize * scale / n * n,
        });
      }
    }
    return tileResults;
  }, [mapBounds, zoom, mapStyle, mapReady]);

  const expandedOrders = useMemo(() => {
    if (expandedCluster === null) return [];
    const cluster = clusters.find((c) => c.id === expandedCluster);
    if (!cluster) return [];
    return sortOptimalVisit(cluster.orders).map((o, idx) => ({ order: o, seq: idx + 1 }));
  }, [expandedCluster, clusters]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shadow-lg" style={{ background: "linear-gradient(135deg, #1e75e6 0%, #0066fe 100%)" }}>
        <button onClick={onClose} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25">
          <X className="h-4 w-4" />
          <span>{t.back}</span>
        </button>
        <h2 className="text-base font-bold text-white">{isAdmin ? t.techOrdersMap : t.workOrderMap}</h2>
        <button
          onClick={() => setMapStyle(mapStyle === "satellite" ? "default" : "satellite")}
          className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25"
        >
          <Layers className="h-4 w-4" />
          <span>{mapStyle === "satellite" ? t.satelliteView : t.defaultView}</span>
        </button>
      </div>

      {/* Technician filter */}
      {isAdmin && technicians && technicians.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-slate-700 bg-slate-800 px-4 py-2">
          <button
            onClick={() => { setSelectedTech(null); setExpandedCluster(null); }}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${!selectedTech ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
          >
            {t.filterAll}
          </button>
          {technicians.map((tc) => {
            const count = orders.filter((o) => o.technician_id === tc.id && o.gps_lat && o.gps_lng).length;
            return (
              <button
                key={tc.id}
                onClick={() => { setSelectedTech(tc.id); setExpandedCluster(null); }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${selectedTech === tc.id ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
              >
                {tc.name}
                <span className="rounded-full bg-white/20 px-1.5 text-xs">{toArabicNumber(count)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Map container */}
      <div
        ref={mapRef}
        className="relative flex-1 touch-none overflow-hidden bg-slate-800"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        {/* Map tiles */}
        <div className="absolute inset-0" style={{ touchAction: "none" }}>
          {tiles.map((tile, i) => (
            <img
              key={`base-${tile.url}-${i}`}
              src={tile.url}
              alt=""
              className="absolute select-none"
              style={{ left: `${tile.left}px`, top: `${tile.top}px`, width: `${tile.size}px`, height: `${tile.size}px` }}
              draggable={false}
              loading="lazy"
            />
          ))}
          {/* Labels overlay for hybrid satellite view */}
          {mapStyle === "satellite" && tiles.map((tile, i) => (
            <img
              key={`label-${tile.label}-${i}`}
              src={tile.label}
              alt=""
              className="absolute pointer-events-none select-none"
              style={{ left: `${tile.left}px`, top: `${tile.top}px`, width: `${tile.size}px`, height: `${tile.size}px` }}
              draggable={false}
              loading="lazy"
            />
          ))}
        </div>

        {/* Orders / Clusters */}
        {mappedOrders.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl bg-white/90 px-6 py-4 text-center shadow-lg backdrop-blur">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">{t.noOrders}</p>
            </div>
          </div>
        ) : expandedCluster === null ? (
          clusters.map((cluster) => {
            const { x, y } = project(cluster.center.lat, cluster.center.lng);
            return (
              <button
                key={cluster.id}
                onClick={(e) => { e.stopPropagation(); handleClusterClick(cluster); }}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 active:scale-95"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full opacity-30" style={{ backgroundColor: cluster.color }} />
                  <div
                    className="relative flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white shadow-xl ring-2 ring-white/80"
                    style={{ backgroundColor: cluster.color }}
                  >
                    {toArabicNumber(cluster.orders.length)}
                  </div>
                  <div className="absolute left-1/2 top-full h-3 w-2 -translate-x-1/2 -translate-y-1" style={{ backgroundColor: cluster.color }} />
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs text-white backdrop-blur">
                    <p className="font-semibold">{t.clusterGroup} {toArabicNumber(cluster.routeNumber)}</p>
                    <p className="text-slate-300">{toArabicNumber(cluster.orders.length)} {t.ordersInCluster}</p>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          expandedOrders.map(({ order, seq }) => {
            const { x, y } = project(order.gps_lat!, order.gps_lng!);
            const color = orderColor(order.status);
            return (
              <button
                key={order.id}
                onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                className="absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 active:scale-95"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white shadow-xl ring-2 ring-white" style={{ backgroundColor: color }}>
                    {toArabicNumber(seq)}
                  </div>
                  <div className="absolute left-1/2 top-full h-2.5 w-1.5 -translate-x-1/2 -translate-y-1" style={{ backgroundColor: color }} />
                </div>
              </button>
            );
          })
        )}

        {/* Back to clusters button */}
        {expandedCluster !== null && (
          <button
            onClick={() => setExpandedCluster(null)}
            className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-sm font-medium text-slate-700 shadow-lg backdrop-blur transition hover:bg-white"
          >
            <Navigation className="h-4 w-4" />
            {t.clusters}
          </button>
        )}

        {/* My Location button (top right) */}
        <button
          onClick={handleMyLocation}
          className={`absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full shadow-lg backdrop-blur transition active:scale-90 ${locating ? "bg-blue-600 text-white" : "bg-white/95 text-blue-600 hover:bg-white"}`}
          aria-label="My location"
        >
          <LocateFixed className={`h-5 w-5 ${locating ? "animate-pulse" : ""}`} />
        </button>

        {/* Zoom controls (bottom right) */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1">
          <button onClick={zoomIn} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white active:scale-90">
            <ZoomIn className="h-5 w-5" />
          </button>
          <button onClick={zoomOut} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white active:scale-90">
            <ZoomOut className="h-5 w-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur">
          <p className="mb-2 text-xs font-semibold text-slate-700">{lang === "ar" ? "المفتاح" : "Legend"}</p>
          {expandedCluster === null ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white" />
                <span className="text-xs text-slate-600">{lang === "ar" ? "نشط / مكتمل" : "Active / Completed"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white" />
                <span className="text-xs text-slate-600">{lang === "ar" ? "عاجل / معلق" : "Urgent / Pending"}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">1</span>
                <span className="text-xs text-slate-600">{t.visitOrder}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-600">{lang === "ar" ? "مكتمل / نشط" : "Completed / Active"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-xs text-slate-600">{lang === "ar" ? "عاجل / معلق" : "Urgent / Pending"}</span>
              </div>
            </div>
          )}
        </div>

        {/* Hint banner */}
        {expandedCluster === null && clusters.length > 1 && (
          <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-slate-900/80 px-4 py-1.5 text-xs font-medium text-white backdrop-blur">
            {t.tapClusterHint}
          </div>
        )}
      </div>

      {/* Order detail popup */}
      {selectedOrder && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/30" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
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
                  {selectedOrder.status === "pending" ? t.legendPending :
                   selectedOrder.status === "in_progress" ? t.legendInProgress :
                   selectedOrder.status === "completed" ? t.legendCompleted : t.legendCancelled}
                </span>
                {selectedOrder.route_number && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {t.route} {toArabicNumber(selectedOrder.route_number)}
                  </span>
                )}
              </div>
            </div>
            {selectedOrder.gps_link && (
              <a
                href={selectedOrder.gps_link}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Navigation className="h-4 w-4" />
                {t.openGoogleMaps}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
