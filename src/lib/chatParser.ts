export interface ParsedOrder {
  client_name: string;
  client_phone: string;
  gps_link: string;
  gps_lat?: number;
  gps_lng?: number;
  product_detail: string;
  preferred_time: string;
  raw: string;
}

function extractPhone(text: string): string {
  const patterns = [
    /\+968\s?\d{3}\s?\d{3,4}/,
    /968\s?\d{3}\s?\d{3,4}/,
    /\+9\d{8,12}/,
    /\b7\d{7}\b/,
    /\b9\d{7}\b/,
    /\b\d{8}\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0].replace(/[\s\-]/g, "");
  }
  return "";
}

function extractGpsLink(text: string): { link: string; lat?: number; lng?: number } {
  const urlMatch = text.match(/https?:\/\/[^\s]+google[^\s]*/i) || text.match(/https?:\/\/maps\.app\.goo\.gl\/\S+/i) || text.match(/https?:\/\/[^\s]+maps[^\s]*/i);
  if (urlMatch) {
    const link = urlMatch[0];
    const coordMatch = link.match(/q=(-?\d+\.?\d*),(-?\d+\.?\d*)/) || link.match(/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) {
      return { link, lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
    }
    const atMatch = link.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) return { link, lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    return { link };
  }
  const coordMatch = text.match(/(-?\d{1,2}\.\d{4,})\s*,\s*(-?\d{1,3}\.\d{4,})/);
  if (coordMatch) {
    return { link: `https://www.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}`, lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
  }
  const addrMatch = text.match(/(?:الموقع|العنوان|location|address|مكان|منطقة)\s*[:：]\s*(.+?)(?:\n|$)/i);
  if (addrMatch && addrMatch[1].trim()) {
    const addr = addrMatch[1].trim();
    return { link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` };
  }
  return { link: "" };
}

function extractName(text: string): string {
  const namePatterns = [
    /(?:الاسم|اسم|name|client|customer)\s*[:：]\s*(.+?)(?:\n|$)/i,
    /(?:العميل)\s*[:：]\s*(.+?)(?:\n|$)/i,
  ];
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m && m[1].trim()) return m[1].trim().split(/\s{2,}|\t/)[0].trim();
  }
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.length >= 3 && line.length <= 40 && !/\d/.test(line) && !/https?/.test(line) && !/^(من|to|at|on|في|على|صباح|مساء|الوقت|الموقع|المنتج|phone|tel)/i.test(line)) {
      return line;
    }
  }
  return "";
}

function extractProduct(text: string): string {
  const patterns = [
    /(?:المنتج|product|جهاز|ماكينة|قفل|نوع|type|موديل|model|خدمة|service)\s*[:：]\s*(.+?)(?:\n|$)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1].trim()) return m[1].trim();
  }
  const keywords = [
    "لايف سلايد", "لايف سوينج", "دورمانا", "سمارت VIP", "كهرومغناطيسي",
    "ماكينة", "قفل", "باب", "تركيب", "صيانة", "فتح", "إصلاح",
  ];
  for (const kw of keywords) {
    if (text.includes(kw)) return kw;
  }
  return "";
}

function extractPreferredTime(text: string): string {
  const patterns = [
    /(?:الوقت|time|موعد|توقيت|متى|وقت|التاريخ|date)\s*[:：]\s*(.+?)(?:\n|$)/i,
    /(?:صباح|مساء|بعد|قبل|اليوم|غدا|السبت|الأحد|الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة)\b[^\n]*/i,
    /(?:AM|PM|am|pm)\s*\d{1,2}[:：]?\d{0,2}/,
    /\d{1,2}[:：]\d{2}\s*(?:AM|PM|am|pm|صباحا|مساء)?/,
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[0].trim()) return m[0].trim();
  }
  return "";
}

const SEPARATOR_LINE = /^(?:_{3,}|-{3,}|={3,}|\.{3,}|\*{3,}|~{3,}|#{3,}|—{3,})\s*$/;

function splitChatBlocks(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  const sepIndices: number[] = [];
  lines.forEach((line, idx) => {
    if (SEPARATOR_LINE.test(line.trim())) sepIndices.push(idx);
  });

  if (sepIndices.length > 0) {
    const blocks: string[] = [];
    let start = 0;
    for (const sepIdx of sepIndices) {
      const block = lines.slice(start, sepIdx).join("\n").trim();
      if (block.length > 0) blocks.push(block);
      start = sepIdx + 1;
    }
    const tail = lines.slice(start).join("\n").trim();
    if (tail.length > 0) blocks.push(tail);
    return blocks.filter(b => b.length > 0);
  }

  const tripleBlocks = normalized.split(/\n\s*\n\s*\n/);
  if (tripleBlocks.length > 1) return tripleBlocks.map(b => b.trim()).filter(b => b.length > 10);

  const chunks: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.match(/^\[?\d{1,2}[/:.]\d{2}/) || line.match(/^~?\s*\+?\d{5,}/)) {
      if (current.length > 0) chunks.push(current.join("\n"));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) chunks.push(current.join("\n"));
  return chunks.filter(c => c.trim().length > 10);
}

const DEFAULT_NAME_AR = "عميل واتساب";

export function parseChatText(rawText: string): ParsedOrder[] {
  if (!rawText.trim()) return [];
  const blocks = splitChatBlocks(rawText);
  const results: ParsedOrder[] = [];
  for (const block of blocks) {
    const phone = extractPhone(block);
    const gps = extractGpsLink(block);
    const extractedName = extractName(block);
    const name = extractedName || DEFAULT_NAME_AR;
    const product = extractProduct(block);
    const time = extractPreferredTime(block);
    if (phone || gps.link || extractedName || block.length > 0) {
      results.push({
        client_name: name,
        client_phone: phone,
        gps_link: gps.link,
        gps_lat: gps.lat,
        gps_lng: gps.lng,
        product_detail: product,
        preferred_time: time,
        raw: block,
      });
    }
  }
  return results;
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface RoutedOrder extends ParsedOrder {
  technician_id: string;
  technician_name: string;
  route_number: number;
}

export function parseSingleOrder(rawText: string): ParsedOrder {
  const phone = extractPhone(rawText);
  const gps = extractGpsLink(rawText);
  const extractedName = extractName(rawText);
  const name = extractedName || DEFAULT_NAME_AR;
  const product = extractProduct(rawText);
  const time = extractPreferredTime(rawText);
  return {
    client_name: name,
    client_phone: phone,
    gps_link: gps.link,
    gps_lat: gps.lat,
    gps_lng: gps.lng,
    product_detail: product,
    preferred_time: time,
    raw: rawText,
  };
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 24 * 60;
  let h = 0, m = 0;
  const lower = timeStr.toLowerCase();
  const isPM = /مساء|pm|مغرب|عصر/.test(lower);
  const isAM = /صباح|am|فجر|صبح/.test(lower);
  const hm = timeStr.match(/(\d{1,2})[:：](\d{2})/);
  const hOnly = timeStr.match(/(\d{1,2})\s*(?:صباحا?|مساء?|am|pm)?/);
  if (hm) { h = parseInt(hm[1], 10); m = parseInt(hm[2], 10); }
  else if (hOnly) { h = parseInt(hOnly[1], 10); m = 0; }
  else return 24 * 60;
  if (isPM && h < 12) h += 12;
  if (isAM && h === 12) h = 0;
  if (!isPM && !isAM && h >= 0 && h < 6) h += 12;
  return h * 60 + m;
}

export function dispatchOrders(
  parsed: ParsedOrder[],
  technicians: { id: string; name: string }[],
): RoutedOrder[] {
  const BARKA_LAT = 23.6846;
  const BARKA_LNG = 58.1902;

  const sorted = [...parsed].sort((a, b) => {
    const ta = timeToMinutes(a.preferred_time);
    const tb = timeToMinutes(b.preferred_time);
    if (ta !== tb) return ta - tb;
    const da = a.gps_lat && a.gps_lng ? haversine(BARKA_LAT, BARKA_LNG, a.gps_lat, a.gps_lng) : Infinity;
    const db = b.gps_lat && b.gps_lng ? haversine(BARKA_LAT, BARKA_LNG, b.gps_lat, b.gps_lng) : Infinity;
    return db - da;
  });

  const techCount = technicians.length || 1;
  const techBuckets: ParsedOrder[][] = Array.from({ length: techCount }, () => []);
  const routeCounters: number[] = Array.from({ length: techCount }, () => 0);

  sorted.forEach((order, idx) => {
    const techIdx = idx % techCount;
    techBuckets[techIdx].push(order);
  });

  const routed: RoutedOrder[] = [];
  technicians.forEach((tech, techIdx) => {
    techBuckets[techIdx].forEach((order) => {
      routeCounters[techIdx]++;
      routed.push({
        ...order,
        technician_id: tech.id,
        technician_name: tech.name,
        route_number: routeCounters[techIdx],
      });
    });
  });

  return routed;
}
