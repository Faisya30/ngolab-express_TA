
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
      className="w-full h-screen flex flex-col items-center bg-[#0f1e18] text-white relative overflow-hidden cursor-pointer selection:bg-none"
      onClick={handleStart}
      role="button"
      aria-label="Mulai pemesanan kios"
    >
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full relative overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover animate-ken-burns scale-110 saturate-75"
            alt="Premium Bakso Express Poster"
          />
        </div>
      </div>

      <div className="absolute inset-0 z-10 bg-[linear-gradient(120deg,rgba(9,18,15,0.86),rgba(11,36,29,0.78)_45%,rgba(225,91,45,0.5))]" />

      <div className="relative z-20 w-full pt-10 flex flex-col items-center shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-6 bg-[#ff9a54]" />
          <span className="text-[#ffd5b7] font-black text-[10px] tracking-[0.55em] uppercase">
            NGOLAB EXPRESS
          </span>
          <div className="h-px w-6 bg-[#ff9a54]" />
        </div>
        <p className="text-white/65 text-[9px] font-bold uppercase tracking-[0.28em]">Autentik Malang • Mie Yamin Spesial</p>
      </div>

      <div className="relative z-20 flex-1 flex flex-col items-center justify-center w-full max-w-[85vw] mx-auto">
        <div className="text-center">
          <h1 className="flex flex-col items-center select-none">
            <span className="block text-[14vw] md:text-[8rem] font-black text-white tracking-tighter leading-[0.8] uppercase opacity-100 drop-shadow-[0_20px_30px_rgba(0,0,0,0.22)]">
              ORDER
            </span>
            <span className="block text-[14vw] md:text-[8rem] font-black text-[#ff9a54] tracking-tighter leading-[0.8] uppercase drop-shadow-[0_15px_40px_rgba(225,91,45,0.42)]">
              HERE
            </span>
          </h1>
          
          <div className="mt-8">
            <div className="inline-block px-8 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
              <p className="text-[10px] font-black text-white/90 uppercase tracking-[0.34em]">
                CEPAT, MUDAH, DAN TANPA ANTRE PANJANG
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-30 w-full max-w-4xl pb-10 px-8 flex flex-col items-center shrink-0">
        <div className="w-full bg-white/95 rounded-4xl p-2.5 flex items-center justify-between shadow-2xl border border-white/20 group active:scale-[0.99] transition-all duration-300 backdrop-blur-md">
          <div className="flex items-center gap-5 pl-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 shrink-0">
               <img
                 src={logoNgolab}
                 alt="Logo Ngolab"
                 className="w-7 h-7 object-contain"
               />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight uppercase leading-none">SENTUH UNTUK MEMESAN</h2>
              <p className="text-slate-500 text-[9px] font-bold tracking-[0.14em] uppercase mt-1.5">Dapatkan Poin Dan Cashback Di Setiap Pesanan</p>
            </div>
          </div>

          <div className="bg-[#e15b2d] px-10 py-5 rounded-xl flex items-center gap-4 group-hover:bg-[#12201b] transition-all duration-500 shrink-0 mr-1">
            <span className="text-sm md:text-base font-black text-white uppercase tracking-widest">MULAI</span>
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:translate-x-1 transition-transform">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        </div>

        <div className="mt-8 opacity-65">
          <span className="text-[9px] font-black uppercase tracking-[0.28em]">© SISTEM PEMBAYARAN TERENKRIPSI</span>
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
