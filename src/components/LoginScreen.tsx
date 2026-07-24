import { Lock, User as UserIcon, DoorOpen } from "lucide-react";
import { useState } from "react";
import type { Lang, Strings } from "../locales";
import { login, type MockUser } from "../lib/storage";

interface Props {
  lang: Lang;
  t: Strings;
  deactivated?: boolean;
  onLogin: (u: MockUser) => void;
}

export default function LoginScreen({ lang, t, deactivated, onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      if (u) onLogin(u);
      else setError(t.loginError);
    } catch {
      setError(t.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="flex min-h-screen items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #1e75e6 0%, #0066fe 100%)" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <DoorOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t.appTitle}</h1>
          <p className="mt-2 text-sm text-blue-100">{t.appSubtitle}</p>
        </div>
        <form onSubmit={submit} className="rounded-3xl bg-white p-8 shadow-2xl">
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t.email}</label>
            <div className="relative">
              <UserIcon className="absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 ltr:left-3 rtl:right-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="admin@smartdoor.test"
                required
              />
            </div>
          </div>
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t.password}</label>
            <div className="relative">
              <Lock className="absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 ltr:left-3 rtl:right-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          {deactivated && !error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{t.accountDeactivated}</p>}
          {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50"
          >
            {loading ? "..." : t.signIn}
          </button>
          <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <p className="mb-1 font-semibold text-slate-600">Demo accounts:</p>
            <p>admin@smartdoor.test / SmartDoor@2026</p>
            <p>tech1@smartdoor.test / Tech@2026</p>
          </div>
        </form>
      </div>
    </div>
  );
}
