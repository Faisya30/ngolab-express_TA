import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onScanSuccess: (code: string) => void;
  onBack: () => void;
  validateUrl?: string;
}

const ScannerScreen: React.FC<Props> = ({ onScanSuccess, onBack, validateUrl }) => {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = useRef(`qr-reader-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    let isMounted = true;

    async function startScanner() {
      try {
        const html5QrCode = new Html5Qrcode(containerId.current);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (!isMounted) return;
            setScanning(false);
            onScanSuccess(decodedText);
          },
          () => {
            // ignore scan failures (no QR in frame)
          }
        );

        if (isMounted) setScanning(true);
      } catch (err) {
        console.error('Gagal memulai scanner:', err);
        if (isMounted) setError('Kamera tidak tersedia atau izin ditolak. Pastikan kamera frontal/laptop aktif.');
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [onScanSuccess]);

  const handleClose = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
    onBack();
  };

  return (
    <div className="w-full h-full bg-transparent flex flex-col items-center justify-center relative overflow-hidden text-[#12201b]">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-orange-600/10 via-transparent to-transparent" />
      </div>

      <button
        onClick={handleClose}
        aria-label="Batal scan"
        className="absolute top-12 left-12 z-20 text-[#5f716a] hover:text-white transition flex items-center gap-4 font-black text-xl tracking-widest group uppercase"
      >
        <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex items-center justify-center group-hover:bg-white/10 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        Batal
      </button>

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full px-6">
        <header className="text-center mb-10">
          <h2 className="text-5xl font-black text-[#12201b] mb-4 tracking-tighter uppercase">SCAN <span className="text-[#e15b2d]">MEMBER</span></h2>
          <p className="text-[#5f716a] text-xl font-medium px-10">Posisikan QR Member tepat di dalam bingkai kamera.</p>
        </header>

        <div className="relative w-full max-w-md rounded-[3rem] overflow-hidden border-4 border-[#e7ece8] shadow-2xl bg-[#0f1e18]/20">
          <div id={containerId.current} className="w-full" />
          {!scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <p className="text-white font-black text-lg tracking-widest uppercase">Menyiapkan kamera...</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-8 w-full max-w-md rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-center">
            <p className="text-sm font-bold text-red-700">{error}</p>
          </div>
        )}

        {validateUrl && (
          <p className="mt-6 text-[11px] tracking-widest uppercase font-black text-slate-500">
            Validasi: {validateUrl}
          </p>
        )}
      </div>
    </div>
  );
};

export default ScannerScreen;
