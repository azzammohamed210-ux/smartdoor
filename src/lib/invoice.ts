import type { WorkOrder } from "../types";
import { translations, type Lang } from "../locales";

export function buildWhatsappUrl(phone: string, message: string): string {
  const clean = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function getWhatsappMessage(order: WorkOrder, lang: Lang): string {
  return translations[lang].whatsappMessage(order);
}
