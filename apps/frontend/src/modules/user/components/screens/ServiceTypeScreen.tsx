
import React from 'react';
import { ServiceType } from '../../types.ts';

interface Props {
  onSelect: (type: ServiceType) => void;
  onBack: () => void;
}

const DineInIcon = () => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="60" cy="60" r="50" fill="#FFFBEB" stroke="#FBBF24" strokeWidth="2"/>
    <path d="M40 45V85M80 45V85" stroke="#374151" strokeWidth="6" strokeLinecap="round"/>
    <rect x="44" y="65" width="32" height="12" rx="3" fill="#374151"/>
    <path d="M50 35C50 35 55 45 60 45C65 45 70 35 70 35" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

const TakeAwayIcon = () => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path d="M30 45L35 90H85L90 45H30Z" fill="#FDE68A"/>
    <path d="M30 45H90V35C90 32.2386 87.7614 30 85 30H35C32.2386 30 30 32.2386 30 35V45Z" fill="#F59E0B"/>
    <path d="M45 30V20C45 17.2386 47.2386 15 50 15H70C72.7614 15 75 17.2386 75 20V30" stroke="#92400E" strokeWidth="6" strokeLinecap="round"/>
  </svg>
);

const ServiceTypeScreen: React.FC<Props> = ({ onSelect, onBack }) => {
  return (
    <div className="w-full h-full flex flex-col p-8 md:p-12 bg-transparent relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 right-20 w-80 h-80 rounded-full bg-[#e15b2d]/10 blur-3xl" />
        <div className="absolute -bottom-32 left-16 w-96 h-96 rounded-full bg-[#1d7a63]/10 blur-3xl" />
      </div>

      <button 
        onClick={onBack} 
        className="relative z-10 mb-8 text-[#5f716a] hover:text-[#12201b] transition flex items-center gap-3 font-black text-[9px] tracking-[0.18em] uppercase group"
      >
        <div className="w-9 h-9 rounded-full border border-[#d9e2dc] bg-white/70 flex items-center justify-center group-hover:bg-white group-hover:border-[#e15b2d] group-hover:text-[#e15b2d] transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        Kembali
      </button>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block px-5 py-1.5 bg-white/85 rounded-full border border-[#d9e2dc] mb-5 shadow-sm">
             <p className="text-[#1d7a63] font-black text-[9px] uppercase tracking-[0.32em]">LOKASI MAKAN</p>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#12201b] mb-3 tracking-tighter uppercase leading-none">
            NIKMATI DI <span className="text-[#e15b2d]">MANA?</span>
          </h2>
          <p className="text-[#5f716a] font-bold uppercase tracking-[0.16em] text-[11px]">Pilih kenyamanan cara makan Anda hari ini</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-3xl">
          <button 
            onClick={() => onSelect(ServiceType.DINE_IN)}
            className="flex-1 group bg-white/95 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-[#d9e2dc] hover:border-[#e15b2d] active:scale-[0.98] backdrop-blur-md"
          >
            <div className="w-28 h-28 group-hover:scale-105 transition-transform duration-500">
              <DineInIcon />
            </div>
            <div className="text-center">
              <span className="block text-xl font-black text-[#12201b] mb-1 uppercase tracking-tight">Makan Di Sini</span>
              <p className="text-[9px] text-[#e15b2d] font-black uppercase tracking-[0.24em] opacity-80">Dine In Experience</p>
            </div>
          </button>

          <button 
            onClick={() => onSelect(ServiceType.TAKE_AWAY)}
            className="flex-1 group bg-white/95 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-[#d9e2dc] hover:border-[#e15b2d] active:scale-[0.98] backdrop-blur-md"
          >
            <div className="w-28 h-28 group-hover:scale-105 transition-transform duration-500">
              <TakeAwayIcon />
            </div>
            <div className="text-center">
              <span className="block text-xl font-black text-[#12201b] mb-1 uppercase tracking-tight">Bawa Pulang</span>
              <p className="text-[9px] text-[#e15b2d] font-black uppercase tracking-[0.24em] opacity-80">Take Away Parcel</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceTypeScreen;
