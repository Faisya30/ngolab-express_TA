
import React, { useState, useEffect, useRef } from 'react';
import { Member } from '../../types.ts';
import { DUMMY_MEMBER } from '../../constants.ts';

interface Props {
  onScanSuccess: (member: Member) => void;
  onBack: () => void;
}

const ScannerScreen: React.FC<Props> = ({ onScanSuccess, onBack }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Akses kamera ditolak atau tidak tersedia", err);
      }
    }
    setupCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Menggunakan data dummy yang lengkap dari constants
      onScanSuccess(DUMMY_MEMBER);
    }, 1500);
  };

  return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent" />
      </div>

      <button 
        onClick={onBack} 
        className="absolute top-12 left-12 z-20 text-slate-500 hover:text-white transition flex items-center gap-4 font-black text-xl tracking-widest group uppercase"
      >
        <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex items-center justify-center group-hover:bg-white/10 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        Batal
      </button>

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
        <header className="text-center mb-12">
          <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase">SCAN <span className="text-amber-400">MEMBER</span></h2>
          <p className="text-slate-500 text-xl font-medium px-10">Posisikan kode QR Anda tepat di dalam bingkai.</p>
        </header>

        {/* Scanner Frame */}
        <div className="relative w-full aspect-square max-w-md bg-slate-900 rounded-[4rem] overflow-hidden border-4 border-slate-800 shadow-2xl">
          {/* Camera View */}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover grayscale opacity-40"
          />

          {/* Scanner Overlay UI */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-orange-500/30 rounded-4xl relative">
              <div className="absolute -top-1 -left-1 w-12 h-12 border-t-8 border-l-8 border-orange-500 rounded-tl-2xl" />
              <div className="absolute -top-1 -right-1 w-12 h-12 border-t-8 border-r-8 border-orange-500 rounded-tr-2xl" />
              <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-8 border-l-8 border-orange-500 rounded-bl-2xl" />
              <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-8 border-r-8 border-orange-500 rounded-br-2xl" />
              
              {/* Animated Scan Line */}
              <div className="absolute left-0 w-full h-1 bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-[scan_3s_infinite_ease-in-out]" />
            </div>
          </div>

          {isSimulating && (
            <div className="absolute inset-0 bg-amber-400/20 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
               <div className="bg-amber-400 p-6 rounded-full animate-bounce shadow-2xl">
                 <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
               </div>
               <p className="text-white font-black text-2xl mt-6 tracking-widest uppercase">Terverifikasi</p>
            </div>
          )}
        </div>

        <button 
          onClick={handleSimulate}
          disabled={isSimulating}
          className="mt-16 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-amber-400 px-12 py-6 rounded-full border border-slate-800 font-black text-lg tracking-[0.2em] transition-all active:scale-95 shadow-xl uppercase"
        >
          Simulasi Scan
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default ScannerScreen;
