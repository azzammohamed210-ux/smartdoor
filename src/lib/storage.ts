import { supabase } from "./supabaseClient";
import type { WorkOrder, Technician, Product, OrderStatus } from "../types";

export interface MockUser {
  email: string;
  password: string;
  name: string;
  role: "admin" | "technician";
  technicianEmail?: string;
}

const LS_USER = "sd_current_user";
const LS_ORDERS = "sd_orders";
const LS_TECHS = "sd_technicians";
const LS_PRODUCTS = "sd_products";

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

export function getCurrentUser(): MockUser | null {
  return lsGet<MockUser | null>(LS_USER, null);
}
export async function login(email: string, password: string): Promise<MockUser | null> {
  // Check admin credentials from the database
  try {
    const { data: admin, error: adminErr } = await supabase
      .from("admins")
      .select("email, password, name, active")
      .eq("email", email)
      .maybeSingle();
    if (!adminErr && admin && admin.active && admin.password === password) {
      const u: MockUser = { email: admin.email, password, name: admin.name, role: "admin" };
      lsSet(LS_USER, u);
      return u;
    }
  } catch { /* fall through */ }

  // Check technician credentials from the database
  try {
    const { data: tech, error: techErr } = await supabase
      .from("technicians")
      .select("id, email, password, name, active")
      .eq("email", email)
      .maybeSingle();
    if (!techErr && tech && tech.active && tech.password === password) {
      const u: MockUser = { email: tech.email, password, name: tech.name, role: "technician", technicianEmail: tech.email };
      lsSet(LS_USER, u);
      return u;
    }
  } catch { /* fall through */ }

  // Fallback: check local cache (for offline / first-load scenarios)
  const techs = lsGet<Technician[]>(LS_TECHS, []);
  const tech = techs.find(t => t.email === email && t.password === password && t.active);
  if (tech) {
    const active = await isTechnicianActive(email);
    if (!active) return null;
    const u: MockUser = { email: tech.email, password, name: tech.name, role: "technician", technicianEmail: tech.email };
    lsSet(LS_USER, u);
    return u;
  }
  return null;
}
export function logout() {
  localStorage.removeItem(LS_USER);
}

function seedLocal() {
  if (!localStorage.getItem(LS_TECHS)) {
    lsSet(LS_TECHS, [
      { id: "t1", name: "محمد إيهاب محمد", email: "tech1@smartdoor.test", phone: "+96891234561", password: "Tech@2026", active: true },
      { id: "t2", name: "احمد سامي عبد المنعم", email: "tech2@smartdoor.test", phone: "+96891234562", password: "Tech@2026", active: true },
      { id: "t3", name: "باسم مصطفي", email: "tech3@smartdoor.test", phone: "+96891234563", password: "Tech@2026", active: true },
    ]);
  }
  if (!localStorage.getItem(LS_PRODUCTS)) {
    lsSet(LS_PRODUCTS, [
      { id: "p101", code: "P-101", name_ar: "ماكينة لايف سلايد", category: "door", price: 450, total_stock: 12, reorder_level: 5 },
      { id: "p102", code: "P-102", name_ar: "ماكينة لايف سوينج", category: "door", price: 520, total_stock: 8, reorder_level: 5 },
      { id: "p103", code: "P-103", name_ar: "ماكينة دورمانا", category: "door", price: 680, total_stock: 6, reorder_level: 5 },
      { id: "p301", code: "P-301", name_ar: "قفل سمارت VIP", category: "lock", price: 320, total_stock: 15, reorder_level: 5 },
      { id: "p302", code: "P-302", name_ar: "قفل كهرومغناطيسي", category: "lock", price: 180, total_stock: 10, reorder_level: 5 },
    ]);
  }
}
seedLocal();

// ---- Technicians CRUD ----
export async function fetchTechnicians(): Promise<Technician[]> {
  try {
    const { data, error } = await supabase.from("technicians").select("*").eq("active", true).order("name");
    if (!error && data && data.length) return data as Technician[];
  } catch { /* fall through */ }
  return lsGet<Technician[]>(LS_TECHS, []).filter(t => t.active);
}

export async function addTechnician(input: { name: string; email: string; password: string; phone?: string }): Promise<Technician> {
  const tech: Technician = { id: crypto.randomUUID(), name: input.name, email: input.email, password: input.password, phone: input.phone, active: true };
  try {
    const { data, error } = await supabase.from("technicians").insert({
      name: input.name, email: input.email, password: input.password, phone: input.phone, active: true,
    }).select("*").single();
    if (!error && data) return data as Technician;
  } catch { /* fall through */ }
  const techs = lsGet<Technician[]>(LS_TECHS, []);
  techs.push(tech);
  lsSet(LS_TECHS, techs);
  return tech;
}

export async function deleteTechnician(id: string): Promise<void> {
  let dbOk = false;
  try {
    const { error } = await supabase.from("technicians").update({ active: false }).eq("id", id);
    if (!error) dbOk = true;
  } catch { /* fall through */ }
  const techs = lsGet<Technician[]>(LS_TECHS, []);
  const idx = techs.findIndex(t => t.id === id);
  if (idx >= 0) { techs[idx].active = false; lsSet(LS_TECHS, techs); }
  else if (dbOk) {
    // DB update succeeded but technician not in local cache — add a tombstone
    techs.push({ id, name: "", email: "", active: false });
    lsSet(LS_TECHS, techs);
  }
}

export async function isTechnicianActive(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("technicians")
      .select("active")
      .eq("email", email)
      .maybeSingle();
    if (!error && data) return data.active === true;
  } catch { /* fall through */ }
  const techs = lsGet<Technician[]>(LS_TECHS, []);
  const tech = techs.find(t => t.email === email);
  if (tech) return tech.active;
  return false;
}

// ---- Products CRUD ----
export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.from("products").select("*").order("code");
    if (!error && data && data.length) return data as Product[];
  } catch { /* fall through */ }
  return lsGet<Product[]>(LS_PRODUCTS, []);
}

export async function addProduct(input: { code: string; name_ar: string; category: string; price: number; total_stock: number; reorder_level: number }): Promise<Product> {
  const prod: Product = { id: crypto.randomUUID(), ...input };
  try {
    const { data, error } = await supabase.from("products").insert({
      code: input.code, name_ar: input.name_ar, category: input.category,
      price: input.price, total_stock: input.total_stock, reorder_level: input.reorder_level,
    }).select("*").single();
    if (!error && data) return data as Product;
  } catch { /* fall through */ }
  const prods = lsGet<Product[]>(LS_PRODUCTS, []);
  prods.push(prod);
  lsSet(LS_PRODUCTS, prods);
  return prod;
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<void> {
  try {
    const { error } = await supabase.from("products").update({
      code: patch.code, name_ar: patch.name_ar, category: patch.category,
      price: patch.price, total_stock: patch.total_stock, reorder_level: patch.reorder_level,
    }).eq("id", id);
    if (!error) return;
  } catch { /* fall through */ }
  const prods = lsGet<Product[]>(LS_PRODUCTS, []);
  const idx = prods.findIndex(p => p.id === id);
  if (idx >= 0) { prods[idx] = { ...prods[idx], ...patch }; lsSet(LS_PRODUCTS, prods); }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) return;
  } catch { /* fall through */ }
  const prods = lsGet<Product[]>(LS_PRODUCTS, []);
  lsSet(LS_PRODUCTS, prods.filter(p => p.id !== id));
}

// ---- Work Orders ----
function genOrderNumber(): string {
  const d = new Date();
  return `WO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export function toArabicNumber(n: number): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).split("").map(d => /[0-9]/.test(d) ? arabicDigits[parseInt(d)] : d).join("");
}

function parseGpsLink(link: string): { lat?: number; lng?: number; link?: string } {
  if (!link) return {};
  const coordMatch = link.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
  if (coordMatch) {
    return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]), link };
  }
  return { link };
}

export async function fetchWorkOrders(techId?: string): Promise<WorkOrder[]> {
  try {
    let q = supabase.from("work_orders").select("*").eq("archived", false).order("created_at", { ascending: false });
    if (techId) q = q.eq("technician_id", techId);
    const { data, error } = await q;
    if (!error && data) {
      const techs = await fetchTechnicians();
      const prods = await fetchProducts();
      return (data as any[]).map(r => {
        const gps = r.gps_link || (r.gps_lat && r.gps_lng ? `https://www.google.com/maps?q=${r.gps_lat},${r.gps_lng}` : undefined);
        return {
          ...r,
          technician_name: techs.find(t => t.id === r.technician_id)?.name,
          product_name: prods.find(p => p.id === r.product_id)?.name_ar,
          product_code: prods.find(p => p.id === r.product_id)?.code,
          gps_link: gps,
        };
      }) as WorkOrder[];
    }
  } catch { /* fall through */ }
  let orders = lsGet<WorkOrder[]>(LS_ORDERS, []).filter(o => !o.archived);
  if (techId) orders = orders.filter(o => o.technician_id === techId);
  const techs = lsGet<Technician[]>(LS_TECHS, []);
  const prods = lsGet<Product[]>(LS_PRODUCTS, []);
  return orders.map(o => ({
    ...o,
    technician_name: techs.find(t => t.id === o.technician_id)?.name,
    product_name: prods.find(p => p.id === o.product_id)?.name_ar,
    product_code: prods.find(p => p.id === o.product_id)?.code,
    gps_link: o.gps_lat && o.gps_lng ? `https://www.google.com/maps?q=${o.gps_lat},${o.gps_lng}` : undefined,
  }));
}

export async function fetchArchivedOrders(): Promise<WorkOrder[]> {
  try {
    const { data, error } = await supabase
      .from("work_orders")
      .select("*")
      .eq("archived", true)
      .order("archived_at", { ascending: false });
    if (!error && data) {
      const techs = await fetchTechnicians();
      const prods = await fetchProducts();
      return (data as any[]).map(r => {
        const gps = r.gps_lat && r.gps_lng ? `https://www.google.com/maps?q=${r.gps_lat},${r.gps_lng}` : undefined;
        return {
          ...r,
          technician_name: techs.find(t => t.id === r.technician_id)?.name,
          product_name: prods.find(p => p.id === r.product_id)?.name_ar,
          product_code: prods.find(p => p.id === r.product_id)?.code,
          gps_link: gps,
        } as WorkOrder;
      });
    }
  } catch { /* fall through */ }
  return [];
}

export async function triggerArchive(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("archive_completed_orders");
    if (!error && data !== null) return parseInt(data) || 0;
  } catch { /* fall through */ }
  // Fallback: call edge function
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/midnight-archive`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      const json = await res.json();
      return parseInt(json.archived) || 0;
    }
  } catch { /* ignore */ }
  return 0;
}

export async function checkAndArchive(): Promise<number> {
  const orders = await fetchWorkOrders();
  const hasCompleted = orders.some(o => o.status === "completed");
  if (!hasCompleted) return 0;
  return triggerArchive();
}

export async function createWorkOrder(input: {
  technician_id?: string;
  client_phone: string;
  client_location_name?: string;
  gps_link?: string;
  notes?: string;
}): Promise<WorkOrder> {
  const existing = await fetchWorkOrders(input.technician_id);
  const routeNum = existing.filter(o => o.status === "pending" || o.status === "in_progress").length + 1;
  const gps = parseGpsLink(input.gps_link || "");

  const order: WorkOrder = {
    id: crypto.randomUUID(),
    order_number: genOrderNumber(),
    technician_id: input.technician_id,
    client_phone: input.client_phone,
    client_location_name: input.client_location_name,
    gps_lat: gps.lat,
    gps_lng: gps.lng,
    gps_link: gps.link,
    route_number: routeNum,
    status: "pending",
    amount: 0,
    warranty_months: 12,
    payment_method: "cash",
    checklist: [],
    notes: input.notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  try {
    const { data, error } = await supabase.from("work_orders").insert({
      order_number: order.order_number,
      technician_id: input.technician_id,
      client_phone: input.client_phone,
      client_location_name: input.client_location_name,
      gps_lat: gps.lat,
      gps_lng: gps.lng,
      gps_link: gps.link,
      route_number: routeNum,
      status: "pending",
      notes: input.notes,
    }).select("*").single();
    if (!error && data) { order.id = data.id; order.order_number = data.order_number; return order; }
  } catch { /* fall through */ }
  const orders = lsGet<WorkOrder[]>(LS_ORDERS, []);
  orders.unshift(order);
  lsSet(LS_ORDERS, orders);
  return order;
}

export async function updateWorkOrder(id: string, patch: Partial<WorkOrder>): Promise<void> {
  const gps = patch.gps_link ? parseGpsLink(patch.gps_link) : {};
  const dbPatch: any = { ...patch, updated_at: new Date().toISOString() };
  if (patch.gps_link !== undefined) {
    dbPatch.gps_lat = gps.lat;
    dbPatch.gps_lng = gps.lng;
  }
  try {
    const { error } = await supabase.from("work_orders").update({
      ...dbPatch,
      checklist: patch.checklist as any,
    }).eq("id", id);
    if (!error) return;
  } catch { /* fall through */ }
  const orders = lsGet<WorkOrder[]>(LS_ORDERS, []);
  const idx = orders.findIndex(o => o.id === id);
  if (idx >= 0) {
    orders[idx] = { ...orders[idx], ...dbPatch };
    lsSet(LS_ORDERS, orders);
  }
}

export async function completeOrder(id: string, details: {
  client_name: string;
  product_id: string;
  product_ids?: string[];
  product_name?: string;
  product_code?: string;
  amount: number;
  warranty_months: number;
  payment_method: string;
  checklist: string[];
  notes?: string;
  receipt_image_url?: string;
  final_photo_url?: string;
  id_image_url?: string;
}): Promise<void> {
  await updateWorkOrder(id, { ...details, status: "completed" });
  await deductInventoryForOrder(details.product_ids || (details.product_id ? [details.product_id] : []));
}

export async function deductInventoryForOrder(productIds: string[]): Promise<void> {
  if (!productIds.length) return;
  const products = await fetchProducts();
  const counts = new Map<string, number>();
  for (const pid of productIds) counts.set(pid, (counts.get(pid) || 0) + 1);
  for (const [pid, qty] of counts) {
    const p = products.find(x => x.id === pid);
    if (p) await updateProduct(p.id, { ...p, total_stock: Math.max(0, p.total_stock - qty) });
  }
}

export async function archiveOrders(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const now = new Date().toISOString();
  try {
    const { error } = await supabase.from("work_orders").update({ archived: true, archived_at: now }).in("id", ids);
    if (!error) return;
  } catch { /* fall through */ }
  const orders = lsGet<WorkOrder[]>(LS_ORDERS, []);
  for (const o of orders) if (ids.includes(o.id)) { o.archived = true; o.archived_at = now; }
  lsSet(LS_ORDERS, orders);
}

export async function deleteOrder(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (!error) return;
  } catch { /* fall through */ }
  const orders = lsGet<WorkOrder[]>(LS_ORDERS, []);
  lsSet(LS_ORDERS, orders.filter(o => o.id !== id));
}

export async function deleteOrders(ids: string[]): Promise<void> {
  if (!ids.length) return;
  try {
    const { error } = await supabase.from("work_orders").delete().in("id", ids);
    if (!error) return;
  } catch { /* fall through */ }
  const orders = lsGet<WorkOrder[]>(LS_ORDERS, []);
  const remove = new Set(ids);
  lsSet(LS_ORDERS, orders.filter(o => !remove.has(o.id)));
}

export async function cancelOrder(id: string, reason: string): Promise<void> {
  await updateWorkOrder(id, { status: "cancelled", cancel_reason: reason });
}

export async function startWork(id: string): Promise<void> {
  await updateWorkOrder(id, { status: "in_progress" });
}

export async function bulkCreateOrders(
  routed: { client_name: string; client_phone: string; gps_link?: string; gps_lat?: number; gps_lng?: number; product_detail?: string; preferred_time?: string; technician_id: string; route_number: number }[],
): Promise<number> {
  let created = 0;
  for (const r of routed) {
    const gps = r.gps_lat && r.gps_lng
      ? { lat: r.gps_lat, lng: r.gps_lng, link: r.gps_link || `https://www.google.com/maps?q=${r.gps_lat},${r.gps_lng}` }
      : parseGpsLink(r.gps_link || "");
    const notesParts: string[] = [];
    if (r.product_detail) notesParts.push(`المنتج: ${r.product_detail}`);
    if (r.preferred_time) notesParts.push(`الوقت المفضل: ${r.preferred_time}`);
    const notes = notesParts.join(" | ") || undefined;

    const order: WorkOrder = {
      id: crypto.randomUUID(),
      order_number: genOrderNumber(),
      technician_id: r.technician_id,
      client_name: r.client_name || undefined,
      client_phone: r.client_phone || "",
      gps_lat: gps.lat,
      gps_lng: gps.lng,
      gps_link: gps.link,
      route_number: r.route_number,
      status: "pending",
      amount: 0,
      warranty_months: 12,
      payment_method: "cash",
      checklist: [],
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase.from("work_orders").insert({
        order_number: order.order_number,
        technician_id: r.technician_id,
        client_name: r.client_name || null,
        client_phone: r.client_phone || "",
        gps_lat: gps.lat,
        gps_lng: gps.lng,
        gps_link: gps.link,
        route_number: r.route_number,
        status: "pending",
        notes,
      }).select("*").single();
      if (!error && data) { created++; continue; }
    } catch { /* fall through */ }
    const orders = lsGet<WorkOrder[]>(LS_ORDERS, []);
    orders.unshift(order);
    lsSet(LS_ORDERS, orders);
    created++;
  }
  return created;
}
