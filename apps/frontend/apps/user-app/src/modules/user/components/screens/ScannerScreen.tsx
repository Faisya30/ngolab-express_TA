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

        const config = {
          fps: 10,
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1,
          disableFlip: false,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            console.log('QR TERDETEKSI:', decodedText);

            if (!isMounted) return;

            setScanning(false);

            if (scannerRef.current) {
              scannerRef.current.stop().catch(() => { });
              scannerRef.current = null;
            }

            onScanSuccess(decodedText);
          },
          () => {
            // ignore scan failures
          }
        );

        if (isMounted) {
          scannerRef.current = html5QrCode;
          setScanning(true);
        }
      } catch (err: any) {
        console.error('Gagal memulai scanner:', err);

        if (isMounted) {
          scannerRef.current = null;
          setScanning(false);

          if (err?.name === 'NotAllowedError') {
            setError('Izin kamera ditolak. Berikan izin kamera dan coba lagi.');
          } else if (err?.name === 'NotFoundError') {
            setError('Kamera tidak ditemukan di perangkat ini.');
          } else if (err?.name === 'NotReadableError') {
            setError('Kamera sedang digunakan aplikasi lain.');
          } else {
            setError('Kamera tidak tersedia atau izin ditolak. Pastikan kamera frontal/laptop aktif.');
          }
        }
      }
    }

    startScanner();

    return () => {
      isMounted = false;

      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
        } catch {
          // ignore
        }

        scannerRef.current = null;
      }
    };
  }, [onScanSuccess]);

  const handleClose = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => { });
      scannerRef.current = null;
    }

    setScanning(false);
    onBack();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fffaf5] px-8 py-8 text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.08),transparent_30%),radial-gradient(circle_at_80%_75%,rgba(99,102,241,0.08),transparent_35%)]" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.10),transparent_30%),radial-gradient(circle_at_80%_75%,rgba(251,146,60,0.08),transparent_35%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl flex-col rounded-[28px] border border-slate-200 bg-white/85 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={handleClose}
            aria-label="Kembali"
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 active:scale-95"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 18l-6-6 6-6" />
              </svg>
            </span>
            Kembali
          </button>

        </div>

        <div className="grid flex-1 grid-cols-1 items-center gap-8 lg:grid-cols-[280px_1fr_260px]">
          <aside>
            <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              Scan <span className="text-orange-600">Member</span>
            </h2>

            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
              Arahkan QR Code member ke dalam bingkai untuk melakukan scan.
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-5 text-xs font-black uppercase tracking-wider text-orange-600">
                Cara Scan
              </h3>

              <div className="space-y-5">
                {[
                  {
                    title: 'Arahkan QR Code',
                    desc: 'Arahkan QR Code member ke dalam bingkai kamera',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm12 2h4m-4 4h4m-8-6h2m-2 4h2" />
                    ),
                  },
                  {
                    title: 'Pastikan pencahayaan cukup',
                    desc: 'Hindari cahaya terlalu gelap atau terlalu terang',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z" />
                    ),
                  },
                  {
                    title: 'Jaga posisi tetap stabil',
                    desc: 'Pastikan kamera tidak bergerak saat melakukan scan',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M8 3h8a2 2 0 012 2v14a2 2 0 01-2 2H8a2 2 0 01-2-2V5a2 2 0 012-2zm4 15h.01" />
                    ),
                  },
                  {
                    title: 'Scan akan dilakukan otomatis',
                    desc: 'Sistem akan memproses QR Code secara otomatis',
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-orange-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>

                    <div>
                      <p className="text-xs font-black text-slate-900">{item.title}</p>
                      <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex justify-center">
            <div className="relative h-[430px] w-full max-w-[520px] overflow-hidden rounded-2xl bg-slate-900 shadow-2xl">
              <div
                id={containerId.current}
                className="h-full w-full overflow-hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
              />

              <div className="pointer-events-none absolute inset-0 bg-black/25" />

              <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 rounded-xl bg-black/65 px-5 py-3 text-xs font-bold text-white shadow-lg">
                Arahkan QR Code member ke dalam bingkai
              </div>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative h-[280px] w-[280px]">
                  <span className="absolute left-0 top-0 h-12 w-12 rounded-tl-2xl border-l-4 border-t-4 border-orange-400
shadow-[0_0_16px_rgba(251,146,60,0.9)]]" />
                  <span className="absolute right-0 top-0 h-12 w-12 rounded-tr-2xl border-r-4 border-t-4 border-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.9)]]" />
                  <span className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-2xl border-b-4 border-l-4 border-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.9)]]" />
                  <span className="absolute bottom-0 right-0 h-12 w-12 rounded-br-2xl border-b-4 border-r-4 border-orange-400 shadow-[0_0_16px_rgba(251,146,60,0.9)]]" />
                </div>
              </div>

              {!scanning && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                  <p className="rounded-2xl bg-black/60 px-6 py-4 text-sm font-black uppercase tracking-wider text-white">
                    Menyiapkan kamera...
                  </p>
                </div>
              )}

              <div className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-2xl bg-black/65 px-6 py-4 text-white shadow-lg">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                <div>
                  <p className="text-sm font-black">Menunggu QR Member...</p>
                  <p className="mt-0.5 text-xs font-medium text-white/70">
                    Scan otomatis ketika QR terdeteksi.
                  </p>
                </div>
              </div>

              {error && (
                <div className="absolute inset-x-8 bottom-8 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-center shadow-xl">
                  <p className="text-sm font-bold text-rose-700">{error}</p>
                </div>
              )}
            </div>
          </main>

          <aside className="rounded-2xl bg-orange-50/40 p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-orange-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
                </svg>
              </div>

              <h3 className="text-xs font-black uppercase tracking-wider text-orange-600">
                Informasi
              </h3>
            </div>

            <p className="text-sm font-medium leading-relaxed text-slate-600">
              QR Code ditampilkan dari aplikasi membership member.
            </p>

            <p className="mt-4 text-sm font-medium leading-relaxed text-slate-600">
              Sistem akan membaca kode secara otomatis.
            </p>

            <div className="mt-10 flex justify-center">
              <div className="relative flex h-36 w-24 items-center justify-center rounded-3xl border-4 border-orange-200
text-orange-300 bg-white 0 shadow-sm">
                <svg className="h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm12 2h4m-4 4h4m-8-6h2m-2 4h2" />
                </svg>
              </div>
            </div>

            {validateUrl && (
              <p className="mt-6 break-all text-[10px] font-black uppercase tracking-wider text-slate-400">
                Validasi: {validateUrl}
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ScannerScreen;