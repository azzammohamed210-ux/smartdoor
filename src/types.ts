export type Role = "admin" | "technician";

export interface User {
  email: string;
  name: string;
  role: Role;
  technicianEmail?: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  active: boolean;
}

export type ProductCategory = "door" | "lock";

export interface Product {
  id: string;
  code: string;
  name_ar: string;
  category: string;
  price: number;
  total_stock: number;
  reorder_level: number;
}

export type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface WorkOrder {
  id: string;
  order_number: string;
  technician_id?: string;
  technician_name?: string;
  client_name?: string;
  client_phone: string;
  client_location_name?: string;
  gps_lat?: number;
  gps_lng?: number;
  gps_link?: string;
  route_number?: number;
  status: OrderStatus;
  product_id?: string;
  product_ids?: string[];
  product_name?: string;
  product_code?: string;
  amount: number;
  warranty_months: number;
  payment_method: string;
  receipt_image_url?: string;
  final_photo_url?: string;
  id_image_url?: string;
  cancel_reason?: string;
  checklist: string[];
  notes?: string;
  invoice_url?: string;
  archived?: boolean;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  key: string;
  label_ar: string;
  label_en: string;
}
