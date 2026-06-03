import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoNgolab from '../../../../shared/assets/images/logo_ngolab.png';

interface Props {
  onStart?: () => void;
  onToggleGesture?: () => void;
  handTrackingEnabled?: boolean;
}

const QRScanIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 14h1M18 14h3M14 18h3M21 18v3M18 21h-4M21 14v1" />
  </svg>
);

const GestureIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

const PromoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const WelcomeScreen: React.FC<Props> = ({
  onStart = () => {},
  onToggleGesture = () => {},
  handTrackingEnabled = false,
}) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStart = () => {
    onStart();
    navigate('/user/service');
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div className="w-full h-screen flex flex-col bg-[#0D0D0D] text-white relative overflow-hidden select-none">

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#0D0D0D]" />

        <img
          src="https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=2000&auto=format&fit=crop"
          className="absolute right-0 top-0 w-[55%] h-full object-cover animate-ken-burns opacity-80"
          alt="Mie Yamin Ngolab Express"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D] via-[#0D0D0D]/85 to-[#0D0D0D]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-[#0D0D0D]/60" />

        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[30%] right-[45%] w-[200px] h-[200px] bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
      </div>

      {/* HEADER */}
      <header className="relative z-20 flex items-center justify-between px-12 pt-8 pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center backdrop-blur-sm">
            <img
              src={logoNgolab}
              alt="Logo Ngolab Express"
              className="w-8 h-8 object-contain"
            />
          </div>

          <div>
            <p className="text-orange-500 font-bold text-[10px] uppercase tracking-[0.5em] leading-none">
              Ngolab Express
            </p>
            <h1>WELCOME SCREEN PERTAMA</h1>
            <p className="text-white/40 text-[9px] font-medium tracking-widest mt-1">
              Autentik Malang • Mie Yamin Spesial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-5 py-3 text-right">
            <p className="text-white font-bold text-lg leading-none tabular-nums">
              {formatTime(currentTime)}
            </p>
            <p className="text-white/40 text-[10px] mt-1 tracking-wide">
              {formatDate(currentTime)}
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
              Open
            </span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="relative z-20 flex-1 flex flex-col justify-center px-12 pb-4">

        <div className="flex items-center gap-3 mb-6">
          <div className="h-[2px] w-8 bg-orange-500 rounded-full" />
          <span className="text-orange-500 font-bold text-[11px] tracking-[0.6em] uppercase">
            Selamat Datang Di
          </span>
          <div className="h-[2px] w-8 bg-orange-500 rounded-full" />
        </div>

        <div className="mb-4">
          <h1 className="leading-none select-none">
            <span className="block text-[7rem] font-black text-white tracking-tighter uppercase leading-[0.85]">
              NGOLAB
            </span>
            <span className="block text-[7rem] font-black text-orange-500 tracking-tighter uppercase leading-[0.85] drop-shadow-[0_0_60px_rgba(249,115,22,0.4)]">
              EXPRESS
            </span>
          </h1>

          <p className="text-white/30 text-[11px] font-medium uppercase tracking-[0.4em] mt-4">
            AUTENTIK MALANG &nbsp;•&nbsp; MIE YAMIN SPESIAL &nbsp;•&nbsp; PILIHAN TERBAIK
          </p>
        </div>

        <div className="flex items-center gap-3 mb-10">
          {['⚡ Cepat', '✅ Praktis', '🎫 Tanpa Antri'].map((item) => (
            <div
              key={item}
              className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-full px-4 py-2"
            >
              <span className="text-white/60 text-[10px] font-medium">
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* BUTTON MULAI */}
        <button
          id="btn-mulai-pesan"
          onClick={handleStart}
          className="group relative w-full max-w-[500px] flex items-center justify-between gap-4 bg-orange-500 hover:bg-orange-400 active:scale-[0.98] rounded-[1.5rem] px-8 py-6 transition-all duration-300 shadow-[0_20px_60px_rgba(249,115,22,0.45)] hover:shadow-[0_25px_70px_rgba(249,115,22,0.6)] overflow-hidden"
          style={{ minHeight: '88px' }}
        >
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="flex flex-col items-start relative z-10">
            <span className="text-2xl font-black text-white uppercase tracking-widest leading-none">
              MULAI PESAN
            </span>
            <span className="text-orange-100/80 text-[11px] font-medium mt-1.5">
              Sentuh untuk memulai pemesanan
            </span>
          </div>

          <div className="relative z-10 w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
            <ArrowRightIcon />
          </div>
        </button>

        {/* FEATURE CARDS */}
        <div className="flex items-stretch gap-4 mt-6 max-w-[500px]">

          <div
            id="card-scan-member"
            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/40 backdrop-blur-md rounded-2xl p-5 flex flex-col items-start gap-3 cursor-pointer transition-all duration-300 active:scale-[0.97] group"
            role="button"
            onClick={handleStart}
          >
            <div className="w-12 h-12 bg-orange-500/15 border border-orange-500/30 rounded-xl flex items-center justify-center text-orange-400 group-hover:bg-orange-500/25 transition-colors">
              <QRScanIcon />
            </div>

            <div>
              <p className="text-white font-bold text-[13px] leading-tight">
                Scan Member
              </p>
              <p className="text-white/40 text-[10px] mt-1 leading-snug">
                Dapatkan poin & cashback
              </p>
            </div>
          </div>

          <div
            id="card-gesture"
            className={`flex-1 border backdrop-blur-md rounded-2xl p-5 flex flex-col items-start gap-3 cursor-pointer transition-all duration-300 active:scale-[0.97] group ${
              handTrackingEnabled
                ? 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-emerald-500/30'
            }`}
            role="button"
            onClick={onToggleGesture}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                handTrackingEnabled
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : 'bg-white/8 border border-white/15 text-white/50 group-hover:text-emerald-400 group-hover:bg-emerald-500/15 group-hover:border-emerald-500/30'
              }`}
            >
              <GestureIcon />
            </div>

            <div>
              <p
                className={`font-bold text-[13px] leading-tight ${
                  handTrackingEnabled ? 'text-emerald-400' : 'text-white'
                }`}
              >
                {handTrackingEnabled ? '✓ Gesture Aktif' : 'Aktifkan Gesture'}
              </p>
              <p className="text-white/40 text-[10px] mt-1 leading-snug">
                Gerakkan tangan untuk navigasi
              </p>
            </div>
          </div>

          <div
            id="card-promo"
            className="flex-1 bg-gradient-to-br from-orange-500/10 to-yellow-500/5 hover:from-orange-500/20 hover:to-yellow-500/10 border border-orange-500/20 hover:border-orange-500/50 backdrop-blur-md rounded-2xl p-5 flex flex-col items-start gap-3 cursor-pointer transition-all duration-300 active:scale-[0.97] group"
            role="button"
            onClick={() => setShowPromo(true)}
          >
            <div className="w-12 h-12 bg-orange-500/15 border border-orange-500/30 rounded-xl flex items-center justify-center text-orange-400 group-hover:bg-orange-500/25 transition-colors">
              <PromoIcon />
            </div>

            <div>
              <p className="text-orange-400 font-bold text-[13px] leading-tight">
                Promo Hari Ini
              </p>
              <p className="text-white/40 text-[10px] mt-1 leading-snug">
                Cashback hingga 10%
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-20 px-12 py-5 border-t border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-white/25">
          <span className="text-[10px] font-medium uppercase tracking-widest">
            Jam Buka: 08.00 – 21.00 WIB
          </span>
        </div>

        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
          <span className="text-white/30 text-[10px] font-medium">
            Tips: Gerakkan tangan untuk navigasi gesture
          </span>
        </div>

        <span className="text-white/15 text-[9px] font-medium uppercase tracking-widest">
          © 2025 Ngolab Express • Sistem Pembayaran Terenkripsi
        </span>
      </footer>

      {/* PROMO MODAL */}
      {showPromo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowPromo(false)}
        >
          <div
            className="bg-[#1A1A1A] border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-500/15 border border-orange-500/30 rounded-xl flex items-center justify-center text-orange-400">
                <PromoIcon />
              </div>

              <div>
                <p className="text-orange-400 font-bold text-[10px] uppercase tracking-widest">
                  Promo Spesial
                </p>
                <h3 className="text-white font-black text-xl tracking-tight">
                  Hari Ini
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                <p className="text-orange-400 font-black text-lg leading-none">
                  Cashback 10%
                </p>
                <p className="text-white/50 text-[11px] mt-1">
                  Untuk semua pembayaran QRIS hari ini
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white font-bold text-sm leading-none">
                  Poin Member Double
                </p>
                <p className="text-white/50 text-[11px] mt-1">
                  Setiap pesanan = 2x poin cashback
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPromo(false)}
              className="w-full mt-6 bg-orange-500 hover:bg-orange-400 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ken-burns {
          0% { transform: scale(1.08) translateX(0px); }
          50% { transform: scale(1.13) translateX(-15px); }
          100% { transform: scale(1.08) translateX(0px); }
        }

        .animate-ken-burns {
          animation: ken-burns 30s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;