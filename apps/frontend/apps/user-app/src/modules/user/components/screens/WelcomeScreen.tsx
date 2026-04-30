
import React from 'react';
import { useNavigate } from 'react-router-dom';
import logoNgolab from '../../../../shared/assets/images/logo_ngolab.png';

interface Props {
  onStart?: () => void;
}

const WelcomeScreen: React.FC<Props> = ({ onStart = () => {} }) => {
  const navigate = useNavigate();

  const handleStart = () => {
    onStart();
    navigate('/user/service');
  };

  return (
    <div 
      className="w-full h-screen flex flex-col items-center bg-slate-950 text-white relative overflow-hidden cursor-pointer selection:bg-none"
      onClick={handleStart}
    >
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full relative overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover animate-ken-burns scale-110"
            alt="Premium Bakso Express Poster"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/75" />
        </div>
      </div>

      <div className="relative z-20 w-full pt-10 flex flex-col items-center shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-6 bg-orange-500" />
          <span className="text-orange-500 font-black text-[10px] tracking-[0.6em] uppercase">
            NGOLAB EXPRESS
          </span>
          <div className="h-px w-6 bg-orange-500" />
        </div>
        <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em]">Autentik Malang • Mie Yamin Spesial</p>
      </div>

      <div className="relative z-20 flex-1 flex flex-col items-center justify-center w-full max-w-[85vw] mx-auto">
        <div className="text-center">
          <h1 className="flex flex-col items-center select-none">
            <span className="block text-[14vw] md:text-[8rem] font-black text-white tracking-tighter leading-[0.8] uppercase opacity-100">
              ORDER
            </span>
            <span className="block text-[14vw] md:text-[8rem] font-black text-orange-500 tracking-tighter leading-[0.8] uppercase drop-shadow-[0_15px_40px_rgba(249,115,22,0.3)]">
              HERE
            </span>
          </h1>
          
          <div className="mt-8">
            <div className="inline-block px-8 py-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
              <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.4em]">
                PILIHAN TERBAIK SEJAK 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-30 w-full max-w-5xl pb-10 px-8 flex flex-col items-center shrink-0">
        <div className="w-full bg-zinc-100 rounded-[2.2rem] p-3 md:p-4 flex items-center justify-between shadow-[0_14px_40px_rgba(2,6,23,0.26)] border border-white/30 group active:scale-[0.99] transition-all duration-300">
          <div className="flex items-center gap-4 md:gap-5 pl-1 md:pl-2 min-w-0">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 border border-slate-200">
              <img
                src={logoNgolab}
                alt="Logo Ngolab"
                className="w-7 h-7 md:w-8 md:h-8 object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-[clamp(1.1rem,2vw,2.5rem)] font-black text-[#060e2a] tracking-tight uppercase leading-none truncate">SENTUH UNTUK MEMESAN</h2>
              <p className="text-slate-500 text-[10px] md:text-sm font-bold tracking-[0.16em] uppercase mt-1 truncate">Dapatkan Poin & Cashback Di Setiap Pesanan</p>
            </div>
          </div>

          <div className="bg-orange-500 min-w-[170px] md:min-w-[230px] px-7 md:px-10 py-4 md:py-5 rounded-2xl flex items-center justify-center gap-4 group-hover:bg-slate-900 transition-all duration-500 shrink-0 mr-0.5">
            <span className="text-lg md:text-[2rem] font-black text-white uppercase tracking-[0.08em] leading-none">MULAI</span>
            <div className="w-7 h-7 md:w-8 md:h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        </div>

        <div className="mt-8 opacity-30">
          <span className="text-[9px] font-black uppercase tracking-[0.4em]">© SISTEM PEMBAYARAN TERENKRIPSI</span>
        </div>
      </div>

      <style>{`
        @keyframes ken-burns {
          0% { transform: scale(1.1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1.1); }
        }
        .animate-ken-burns { animation: ken-burns 40s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
