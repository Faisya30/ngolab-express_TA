import React, { useState } from 'react';

interface AuthProps {
  onLogin: (user: any) => void;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (response.ok && payload?.success && payload?.user) {
        const role = String(payload.user.role || '').toLowerCase();

        if (role === 'super_admin') {
          setError(
            'Super Admin hanya bisa login di Super Admin App (http://localhost:3000). Admin App ini khusus untuk Kiosk/CV Admin.'
          );
          return;
        }

        if (role !== 'kiosk_admin' && role !== 'cv_admin') {
          setError(`Role ${payload.user.role} tidak diizinkan di Admin App. Gunakan akun kiosk_admin atau cv_admin.`);
          return;
        }

        const userData = {
          username: payload.user.username,
          role: payload.user.role,
        };

        localStorage.setItem('current_admin', JSON.stringify(userData));
        onLogin(userData);
      } else {
        setError(payload?.error || 'Invalid credentials.');
      }
    } catch (_error) {
      setError('Gagal terhubung ke backend. Pastikan server backend berjalan di VITE_BACKEND_URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#f7faff] flex items-center justify-center px-6 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_85%_75%,rgba(99,102,241,0.12),transparent_35%)]" />

      <div className="relative z-10 w-full max-w-7xl min-h-172.5 bg-white/75 backdrop-blur-xl rounded-[28px] shadow-[0_30px_90px_rgba(15,23,42,0.08)] border border-white/80 overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_1.05fr]">
        
        {/* LEFT SIDE */}
        <div className="relative hidden lg:flex flex-col px-14 py-12 overflow-hidden">
          <div className="relative z-20">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-700 shadow-xl shadow-blue-600/25 flex items-center justify-center">
                <span className="text-white text-3xl font-bold leading-none"></span>
              </div>

              <div>
                <h1 className="text-[26px] font-black tracking-tight text-slate-900">
                  NGOLAB <span className="text-blue-600">EXPRESS</span>
                </h1>
                <p className="text-slate-400 text-xs font-bold tracking-[0.55em] mt-1">TERMINAL</p>
              </div>
            </div>

            <h2 className="text-[26px] leading-tight font-black text-slate-900 max-w-107.5">
              Sistem manajemen terminal modern untuk operasional yang lebih efisien
            </h2>

            <div className="w-14 h-1.5 rounded-full bg-blue-500 mt-8 mb-10" />

            <div className="space-y-6 w-82.5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 12l2 2 4-4m5-4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3 8 3z" />
                  </svg>
                </div>
                <div className="pt-1">
                  <h3 className="font-black text-slate-900">Aman</h3>
                  <p className="text-sm text-slate-500 font-medium leading-snug max-w-60">
                    Data terlindungi dengan enkripsi tingkat tinggi
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="pt-1">
                  <h3 className="font-black text-slate-900">Cepat</h3>
                  <p className="text-sm text-slate-500 font-medium leading-snug max-w-60">
                    Akses sistem dengan performa optimal
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 19V9m6 10V5m6 14v-7m4 7H3" />
                  </svg>
                </div>
                <div className="pt-1">
                  <h3 className="font-black text-slate-900">Efisien</h3>
                  <p className="text-sm text-slate-500 font-medium leading-snug max-w-60">
                    Kelola terminal dengan lebih efektif
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Illustration dipindah ke kanan bawah agar tidak menabrak teks */}
          <div className="absolute bottom-20 right-6 w-75 h-61.25 pointer-events-none z-10">
            <div className="absolute bottom-0 left-10 right-0 h-12 bg-blue-200/25 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-20 w-52 h-10 bg-white rounded-[50%] shadow-xl border border-blue-50" />

            <div className="absolute bottom-9 left-32 w-24 h-32 bg-white rounded-3xl shadow-2xl border border-blue-100 -rotate-2">
              <div className="absolute top-5 left-4 right-4 h-20 bg-linear-to-br from-blue-500 to-indigo-700 rounded-2xl shadow-inner flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white text-xs font-black">NGOLAB</p>
                  <p className="text-blue-100 text-[9px] font-bold">EXPRESS</p>
                </div>
              </div>
              <div className="absolute bottom-4 left-7 right-7 h-2 bg-slate-200 rounded-full" />
            </div>

            <div className="absolute bottom-5 left-36 w-16 h-12 bg-white rounded-b-2xl shadow-lg" />
            <div className="absolute bottom-3 left-32 w-24 h-7 bg-white rounded-xl shadow-lg" />
            <div className="absolute bottom-24 right-0 w-24 h-16 bg-blue-100/45 rounded-xl" />
            <div className="absolute bottom-16 left-0 w-24 h-12 bg-blue-100/45 rounded-xl" />
            <div className="absolute top-8 right-20 w-10 h-10 bg-amber-100 rounded-full opacity-80" />
            <div className="absolute top-16 right-2 w-14 h-5 bg-blue-100/60 rounded-full" />
          </div>

          <div className="relative z-30 mt-auto">
            <p className="inline-flex px-4 py-2 rounded-full bg-white/80 border border-slate-200 text-[10px] text-slate-400 font-semibold">
              © 2024 Ngolab Express Terminal. All rights reserved.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center px-8 py-10">
          <div className="w-full ax-w-117.5 bg-white rounded-[28px] shadow-[0_25px_70px_rgba(15,23,42,0.10)] border border-slate-100 px-10 py-11">
            <div className="text-center mb-9">
              <div className="w-14 h-14 bg-linear-to-br from-blue-500 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-600/25">
                <span className="text-white font-black text-3xl">N</span>
              </div>

              <h1 className="text-[28px] font-black text-slate-900 tracking-tight">Portal Admin</h1>
              <p className="text-slate-400 text-[11px] font-black mt-2 uppercase tracking-[0.25em]">
                Ngolab Express Terminal
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[13px] rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Masukkan username"
                    className="w-full h-14 pl-14 pr-5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full h-14 pl-14 pr-5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 font-bold text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black hover:shadow-xl hover:shadow-blue-600/25 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.22em]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In</>
                )}
              </button>
            </form>

            
          </div>
        </div>

        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-slate-400 text-[11px] uppercase tracking-[0.4em] font-black">
          Ngolab Express v1.0.2
        </p>
      </div>
    </div>
  );
};

export default Auth;