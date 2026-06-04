import React from 'react';
import { ServiceType } from '../../types.ts';
import FireIcon from '@iconify-react/mdi/fire';

interface Props {
  onSelect: (type: ServiceType) => void;
  onBack: () => void;
}

const ServiceTypeScreen: React.FC<Props> = ({ onSelect, onBack }) => {
  return (
    <div className="w-full h-full min-h-screen relative overflow-hidden bg-[#f7f2ea] text-slate-950">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000&auto=format&fit=crop"
          alt="Restaurant Background"
          className="w-full h-full object-cover opacity-25 blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fff8ef]/95 via-[#fff8ef]/85 to-[#f8efe3]/92" />
      </div>

      <header className="relative z-20 flex items-center justify-start px-8 pt-6">
        <button
          onClick={onBack}
          className="bg-white/85 hover:bg-white border border-orange-100 rounded-full px-5 py-3 flex items-center gap-3 shadow-sm transition-all active:scale-95"
        >
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-slate-900">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider">
            Kembali
          </span>
        </button>
      </header>

      <main className="relative z-10 h-[calc(100vh-88px)] flex flex-col items-center justify-center px-10 pb-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-orange-300 bg-white/75 shadow-sm mb-4">
            <span className="text-orange-600 font-black text-[9px] uppercase tracking-widest">
              Lokasi Makan
            </span>
          </div>

          <h1 className="text-[3.7rem] leading-none font-black tracking-tight uppercase">
            <span className="text-slate-950">Nikmati di </span>
            <span className="text-orange-600">mana?</span>
          </h1>

          <p className="mt-3 text-slate-500 text-[11px] font-black uppercase tracking-[0.22em]">
            Pilih kenyamanan cara makan Anda hari ini
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full max-w-[940px]">
          <button
            onClick={() => onSelect(ServiceType.DINE_IN)}
            className="group relative bg-white rounded-[2rem] overflow-hidden shadow-[0_22px_60px_rgba(15,23,42,0.16)] border border-white hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(249,115,22,0.22)] active:scale-[0.98] transition-all duration-300"
          >
            <div className="relative h-[210px] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=1200&auto=format&fit=crop"
                alt="Makan di sini"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />

              <div className="absolute top-4 left-4 bg-orange-600 text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
                <FireIcon height="16" />
                <span className="text-[9px] font-black uppercase tracking-wide">
                  Paling Populer
                </span>
              </div>
            </div>

            <div className="relative px-7 pt-9 pb-6 text-left">
              <div className="absolute -top-10 left-8 w-20 h-20 bg-white rounded-full shadow-xl border border-orange-100 flex items-center justify-center">
                <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
                  <path d="M13 27H51" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
                  <path d="M18 27V49M46 27V49" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
                  <path d="M23 36H41" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
                  <path d="M25 49H20M44 49H39" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>

              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                Makan Di Sini
              </h2>
              <p className="mt-2 text-slate-500 text-[12px] font-medium leading-snug max-w-[250px]">
                Nikmati hidangan favorit Anda langsung di area Ngolab Express
              </p>

              <div className="relative mt-6 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full py-4 pl-6 pr-14 flex items-center justify-center shadow-[0_14px_32px_rgba(249,115,22,0.35)] overflow-hidden">
                <span className="text-white text-sm font-black uppercase tracking-[0.3em]">
                  Pilih
                </span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center text-orange-600 group-hover:translate-x-0.5 transition-transform">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </div>
          </button>

          <button
            onClick={() => onSelect(ServiceType.TAKE_AWAY)}
            className="group relative bg-white rounded-[2rem] overflow-hidden shadow-[0_22px_60px_rgba(15,23,42,0.16)] border border-white hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(249,115,22,0.22)] active:scale-[0.98] transition-all duration-300"
          >
            <div className="relative h-[210px] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=1200&auto=format&fit=crop"
                alt="Bawa pulang"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" />
            </div>

            <div className="relative px-7 pt-9 pb-6 text-left">
              <div className="absolute -top-10 left-8 w-20 h-20 bg-white rounded-full shadow-xl border border-orange-100 flex items-center justify-center">
                <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
                  <path d="M20 26H44L41 52H23L20 26Z" stroke="#F97316" strokeWidth="4" strokeLinejoin="round" />
                  <path d="M26 26V20C26 16.7 28.7 14 32 14C35.3 14 38 16.7 38 20V26" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>

              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950">
                Bawa Pulang
              </h2>
              <p className="mt-2 text-slate-500 text-[12px] font-medium leading-snug max-w-[250px]">
                Pesanan dikemas praktis untuk dibawa pulang
              </p>

              <div className="relative mt-6 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full py-4 pl-6 pr-14 flex items-center justify-center shadow-[0_14px_32px_rgba(249,115,22,0.35)] overflow-hidden">
                <span className="text-white text-sm font-black uppercase tracking-[0.3em]">
                  Pilih
                </span>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full flex items-center justify-center text-orange-600 group-hover:translate-x-0.5 transition-transform">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default ServiceTypeScreen;