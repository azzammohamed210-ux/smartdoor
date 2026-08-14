import { useState } from "react";
import { X, Trash2, Upload, Video, Loader2 } from "lucide-react";
import type { Lang, Strings } from "../locales";
import { categoryLabels } from "../locales";
import type { Product } from "../types";
import { addProduct, updateProduct, deleteProduct, uploadProductVideo } from "../lib/storage";

interface Props {
  lang: Lang;
  t: Strings;
  product: Product | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ProductEditModal({ lang, t, product, onClose, onRefresh }: Props) {
  const isEdit = !!product;
  const [code, setCode] = useState(product?.code || "");
  const [name, setName] = useState(product?.name_ar || "");
  const [category, setCategory] = useState(product?.category || "lock");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [stock, setStock] = useState(product?.total_stock?.toString() || "0");
  const [reorder, setReorder] = useState(product?.reorder_level?.toString() || "5");
  const [videoUrl, setVideoUrl] = useState<string | null>(product?.video_url || null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError(lang === "ar" ? "حجم الفيديو يجب أن يكون أقل من 50 ميجابايت" : "Video must be under 50MB");
      return;
    }
    setVideoUploading(true);
    setError("");
    try {
      const url = await uploadProductVideo(file);
      if (url) {
        setVideoUrl(url);
      } else {
        setError(lang === "ar" ? "فشل رفع الفيديو" : "Video upload failed");
      }
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setVideoUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setError("");
    if (!code.trim() || !name.trim()) {
      setError(lang === "ar" ? "الكود والاسم مطلوبان" : "Code and name required");
      return;
    }
    setSaving(true);
    try {
      const data = {
        code: code.trim(), name_ar: name.trim(), category,
        price: parseFloat(price) || 0, total_stock: parseInt(stock) || 0, reorder_level: parseInt(reorder) || 5,
        video_url: videoUrl,
      };
      if (isEdit && product) {
        await updateProduct(product.id, data);
      } else {
        await addProduct(data);
      }
      onRefresh();
      onClose();
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(t.confirmDelete)) return;
    await deleteProduct(product.id);
    onRefresh();
    onClose();
  };

  const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{isEdit ? t.editProduct : t.addProduct}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t.productCode}</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="P-101" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t.productCategory}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                <option value="lock">{categoryLabels.lock[lang]}</option>
                <option value="door">{categoryLabels.door[lang]}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.productName}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.productPrice}</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputCls}
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t.totalStock}</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputCls}
                dir="ltr"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t.reorderLevel}</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={reorder}
                onChange={(e) => setReorder(e.target.value)}
                className={inputCls}
                dir="ltr"
              />
            </div>
          </div>

          {/* Video upload */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Video className="h-4 w-4" />
              {t.uploadProductVideo}
            </label>
            <input
              type="file"
              accept="video/mp4,video/*"
              onChange={handleVideoUpload}
              disabled={videoUploading}
              className="w-full text-xs text-slate-500"
            />
            {videoUploading && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                {lang === "ar" ? "جاري رفع الفيديو..." : "Uploading video..."}
              </div>
            )}
            {videoUrl && !videoUploading && (
              <div className="mt-3 space-y-2">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {t.videoAttached}
                </div>
                <video src={videoUrl} controls className="w-full rounded-lg border border-slate-200" style={{ maxHeight: 200 }} />
              </div>
            )}
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            {isEdit && (
              <button onClick={handleDelete} className="rounded-xl border border-rose-200 px-3 py-2.5 text-rose-600 transition hover:bg-rose-50">
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-medium text-slate-600 hover:bg-slate-50">
              {t.cancel}
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50">
              {saving ? "..." : t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
