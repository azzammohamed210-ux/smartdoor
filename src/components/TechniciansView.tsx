import { useState } from "react";
import { UserPlus, Trash2, X, Mail, User as UserIcon } from "lucide-react";
import type { Lang, Strings } from "../locales";
import type { Technician } from "../types";
import { addTechnician, deleteTechnician } from "../lib/storage";

interface Props {
  lang: Lang;
  t: Strings;
  technicians: Technician[];
  onRefresh: () => void;
}

export default function TechniciansView({ lang, t, technicians, onRefresh }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Tech@2026");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError(lang === "ar" ? "جميع الحقول مطلوبة" : "All fields required");
      return;
    }
    setSaving(true);
    try {
      await addTechnician({ name: name.trim(), email: email.trim(), password, phone: phone.trim() });
      setName(""); setEmail(""); setPassword("Tech@2026"); setPhone("");
      setShowAdd(false);
      onRefresh();
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    await deleteTechnician(id);
    onRefresh();
  };

  const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{t.manageTechnicians}</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:shadow-lg"
        >
          <UserPlus className="h-4 w-4" />
          {t.addTechnician}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {technicians.map((tc) => (
          <div key={tc.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{tc.name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <Mail className="h-3 w-3" />
                    {tc.email}
                  </p>
                  {tc.phone && <p className="text-xs text-slate-400">{tc.phone}</p>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(tc.id)}
                className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50"
                title={t.deleteTechnician}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t.addTechnician}</h3>
              <button onClick={() => setShowAdd(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t.technicianName}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t.email}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="tech@smartdoor.test" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{t.password}</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">{lang === "ar" ? "الهاتف" : "Phone"}</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9+]*"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                  className={inputCls}
                  placeholder="+9689XXXXXXXX"
                  dir="ltr"
                />
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-medium text-slate-600 hover:bg-slate-50">
                  {t.cancel}
                </button>
                <button onClick={handleAdd} disabled={saving} className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50">
                  {saving ? "..." : t.create}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
