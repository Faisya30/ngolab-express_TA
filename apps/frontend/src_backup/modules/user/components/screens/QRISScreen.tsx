
import React, { useEffect, useState } from 'react';

interface Props {
  total: number;
  onComplete: () => void;
  onBack: () => void;
}

const QRISScreen: React.FC<Props> = ({ total, onComplete, onBack }) => {
  const [status, setStatus] = useState('Menunggu pembayaran...');
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animasi titik-titik sederhana
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 500);

    // Simulasi pembayaran sukses setelah 5 detik
    const timer = setTimeout(() => {
      setStatus('Pembayaran Berhasil!');
      setTimeout(onComplete, 1500);
    }, 6000);

    return () => {
      clearTimeout(timer);
      clearInterval(dotsInterval);
    };
  }, [onComplete]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 font-sans p-3 sm:p-4 md:p-6 overflow-y-auto relative">
      
      {/* Dekorasi Latar Belakang */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400/5 blur-[100px] rounded-full" />

      <div
        className="w-full max-w-[440px] md:max-w-[500px] bg-white rounded-[2.5rem] p-5 md:p-7 flex flex-col items-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] relative animate-in fade-in zoom-in duration-500"
        style={{ transform: 'scale(var(--kiosk-scale))', transformOrigin: 'center center' }}
      >
        
        {/* Header Pembayaran */}
          <div className="flex flex-col items-center mb-5 md:mb-6">
            <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 mb-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Metode Pembayaran</p>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-11 md:h-11 bg-white shadow-md rounded-xl flex items-center justify-center p-2 border border-slate-100">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" alt="QRIS" className="w-full" />
              </div>
              <h2 className="text-2xl md:text-[2rem] font-black text-slate-900 tracking-tighter uppercase">SCAN <span className="text-orange-600">QRIS</span></h2>
           </div>
        </div>

        {/* BOX GAMBAR QRIS (Tempat Menempelkan Foto QRIS) */}
          <div className="w-full aspect-square bg-white rounded-[2rem] p-3 shadow-inner border-2 border-slate-50 relative group mb-5 md:mb-6">
            <div className="w-full h-full rounded-[1.4rem] overflow-hidden border-2 border-orange-500/20 p-3 flex items-center justify-center bg-white relative">
              {/* 
                  ANDA DAPAT MENGGANTI URL DI BAWAH INI DENGAN PATH FOTO QRIS ANDA 
                  Contoh: src="/assets/my-qris.jpg" atau URL Cloudinary/GDrive 
              */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=NGOLAB_PAYMENT_ID_${Math.random()}&color=000000&bgcolor=ffffff`} 
                alt="QRIS Merchant" 
                className="w-full h-full object-contain"
              />
              
              {/* Animasi Scan Line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-[scan_3s_infinite_ease-in-out]" />
           </div>

           {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-slate-900 rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-slate-900 rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-slate-900 rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-slate-900 rounded-br-xl" />
        </div>

        {/* Info Total Tagihan */}
          <div className="w-full bg-slate-50 rounded-[1.5rem] p-4 md:p-5 mb-5 md:mb-6 border border-slate-100 flex items-center justify-between">
           <div className="text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Tagihan</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">Rp {total.toLocaleString('id-ID')}</p>
           </div>
            <div className="w-11 h-11 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
           </div>
        </div>

        {/* Status Pembayaran */}
        <div className="flex flex-col items-center gap-3">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-sm font-black text-slate-600 uppercase tracking-widest">
                 {status}{status === 'Menunggu pembayaran...' ? dots : ''}
              </p>
           </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight text-center px-4 md:px-8">
              Halaman akan otomatis berpindah setelah pembayaran terdeteksi oleh sistem kami.
           </p>
        </div>

        {/* Tombol Batal */}
        <button 
          onClick={onBack}
          className="mt-6 px-6 py-2.5 rounded-full border border-slate-100 text-slate-300 font-black text-[10px] uppercase tracking-[0.25em] hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
        >
          Batal & Kembali
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 5%; }
          50% { top: 95%; }
          100% { top: 5%; }
        }
      `}</style>
    </div>
  );
};

export default QRISScreen;
