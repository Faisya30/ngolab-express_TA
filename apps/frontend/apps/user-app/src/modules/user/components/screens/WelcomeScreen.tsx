import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoNgolab from '../../../../shared/assets/images/logo_ngolab.png';

interface Props {
  onStart?: () => void;
  onToggleGesture?: () => void;
  handTrackingEnabled?: boolean;
}

const WelcomeScreen: React.FC<Props> = ({
  onStart = () => {},
  handTrackingEnabled = false,
}) => {
  const navigate = useNavigate();

  const handleStart = () => {
    onStart();
    navigate('/user/service');
  };

  return (
    <div
      className="w-full h-screen bg-[#05070b] text-white relative overflow-hidden cursor-pointer selection:bg-none"
      onClick={handleStart}
    >
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=2000&auto=format&fit=crop"
          alt="Ngolab Express"
          className="absolute right-0 top-0 w-[64%] h-full object-cover animate-ken-burns"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#05070b] via-[#05070b]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070b] via-transparent to-[#05070b]/40" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute bottom-[-120px] left-[180px] w-[420px] h-[420px] bg-orange-500/25 rounded-full blur-[130px]" />
        <div className="absolute top-[120px] right-[300px] w-[260px] h-[260px] bg-orange-400/15 rounded-full blur-[100px]" />
      </div>

      <header className="relative z-20 px-8 pt-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg">
            <img
              src={logoNgolab}
              alt="Logo Ngolab"
              className="w-10 h-10 object-contain"
            />
          </div>

          <div>
            <h1 className="text-white font-black text-lg leading-[0.9] tracking-tight">
              NGOLAB
            </h1>
            <h1 className="text-orange-500 font-black text-lg leading-[0.9] tracking-tight">
              EXPRESS
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/10 border border-white/15 backdrop-blur-xl rounded-2xl px-5 py-3 flex items-center gap-3 hover:bg-white/15 transition-all">
            <div className="text-white">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h2v2h-2zM18 14h3M14 19h7M19 17v4" />
              </svg>
            </div>

            <div className="text-left">
              <p className="text-[11px] font-black uppercase tracking-wide">
                Scan Member
              </p>
              <p className="text-[9px] text-white/55">
                Dapatkan poin & cashback
              </p>
            </div>
          </div>

          <div
            className={`border backdrop-blur-xl rounded-2xl px-5 py-3 flex items-center gap-3 transition-all ${
              handTrackingEnabled
                ? 'bg-orange-500/20 border-orange-400/50'
                : 'bg-white/10 border-white/15 hover:bg-white/15'
            }`}
          >
            <div className="text-white">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 11V6a2 2 0 0 0-4 0v4" />
                <path d="M14 10V4a2 2 0 0 0-4 0v6" />
                <path d="M10 10V6a2 2 0 0 0-4 0v8" />
                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15" />
              </svg>
            </div>

            <div className="text-left">
              <p className="text-[11px] font-black uppercase tracking-wide">
                {handTrackingEnabled ? 'Gesture Aktif' : 'Aktifkan Gesture'}
              </p>
              <p className="text-[9px] text-white/55">
                Gerakkan tangan untuk navigasi
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-20 h-[calc(100vh-100px)] px-20 flex flex-col justify-center">
        <div className="max-w-[760px]">
          <p className="text-orange-400 italic text-2xl mb-2 font-medium">
            Selamat Datang di
          </p>

          <h1 className="text-[5.8rem] leading-[0.82] font-black tracking-tight">
            <span className="block text-white">NGOLAB</span>
            <span className="block text-orange-500 drop-shadow-[0_0_45px_rgba(249,115,22,0.45)]">
              EXPRESS
            </span>
          </h1>

          <p className="mt-5 text-white/45 text-[12px] font-bold uppercase tracking-[0.35em]">
            Autentik Malang • Mie Yamin Spesial
          </p>

          <div className="flex gap-7 mt-8">
            {[
              ['⏱', 'Cepat', 'Tanpa menunggu lama'],
              ['✓', 'Praktis', 'Pesan sendiri dengan mudah'],
              ['👥', 'Tanpa Antri', 'Langsung dapat nomor antrian'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-3">
                <div className="text-orange-400 text-xl">{icon}</div>
                <div>
                  <p className="text-white text-sm font-black">{title}</p>
                  <p className="text-white/45 text-[10px] leading-tight">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-8 group bg-gradient-to-r from-orange-400 to-orange-600 rounded-[1.7rem] px-7 py-5 flex items-center gap-5 shadow-[0_0_45px_rgba(249,115,22,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-orange-500 group-hover:translate-x-1 transition-transform">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>

            <div className="text-left">
              <p className="text-white text-3xl font-black uppercase leading-none">
                Mulai Pesan
              </p>
              <p className="text-orange-100 text-sm mt-1">
                Sentuh untuk memulai
              </p>
            </div>
          </button>
        </div>
      </main>

      <section className="absolute bottom-14 left-8 right-8 z-30 bg-white/7 border border-white/10 backdrop-blur-2xl rounded-3xl p-5 grid grid-cols-3 gap-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        {[
          ['▦', 'Scan Member', 'Scan QR untuk mendapatkan poin & cashback'],
          ['☝', handTrackingEnabled ? 'Gesture Aktif' : 'Aktifkan Gesture', 'Navigasi tanpa sentuh dengan gerakan tangan'],
          ['🎁', 'Pakai Voucher', 'Gunakan voucher untuk harga lebih hemat'],
        ].map(([icon, title, desc]) => (
          <div
            key={title}
            className="group bg-white/7 hover:bg-white/12 border border-white/10 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl text-orange-400 border border-white/10">
              {icon}
            </div>

            <div className="flex-1">
              <p className="text-white font-black text-sm uppercase">
                {title}
              </p>
              <p className="text-white/45 text-[11px] leading-snug mt-1">
                {desc}
              </p>
            </div>

            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        ))}
      </section>

      <footer className="absolute bottom-3 left-0 right-0 z-30 flex justify-center">
        <div className="bg-white/7 border border-white/10 rounded-full px-6 py-2 backdrop-blur-xl">
          <p className="text-white/45 text-[11px]">
            👋 Tips: Sentuh layar di mana saja untuk mulai memesan
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes ken-burns {
          0% { transform: scale(1.08); }
          50% { transform: scale(1.14); }
          100% { transform: scale(1.08); }
        }

        .animate-ken-burns {
          animation: ken-burns 35s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen; 