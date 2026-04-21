
import React, { useState } from 'react';

interface AuthProps {
  onLogin: (user: any) => void;
}

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!BACKEND_URL) {
      setError('Backend URL belum dikonfigurasi. Isi VITE_BACKEND_URL di file .env frontend.');
      setLoading(false);
      return;
    }

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
        const userData = { username: payload.user.username, role: payload.user.role };
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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60 animate-blob"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-10 relative z-10">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/20">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Portal Admin</h1>
          <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Ngolab Express Terminal</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-[13px] rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </span>
              <input name="username" type="text" required value={formData.username} onChange={handleChange} placeholder="Enter username" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 font-semibold text-sm" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 ml-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <button type="button" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase">Forgot?</button>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </span>
              <input name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 font-semibold text-sm" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 text-sm uppercase tracking-wider">{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign In'}</button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-400 text-[10px] font-bold bg-slate-50 py-1.5 px-3 rounded-full inline-block uppercase tracking-wider border border-slate-100">Login menggunakan akun admin di database</p>
        </div>
      </div>
      <p className="absolute bottom-6 left-0 right-0 text-center text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">Ngolab Express v1.0.2</p>
    </div>
  );
};

export default Auth;
