
import React, { useEffect, useState } from 'react';

import qrisImage from '../../../../shared/assets/images/qris.jpg';

import logoNgolab from '../../../../shared/assets/images/logo_ngolab.png';

import HandIcon from '@iconify-react/pixelarticons/hand';

  

interface Props {

  total: number;

  onComplete: () => void;

  onBack: () => void;

}

  

const QRISScreen: React.FC<Props> = ({ total, onComplete, onBack }) => {

  const [status, setStatus] = useState('Menunggu Pembayaran');

  const [dots, setDots] = useState('');

  

  useEffect(() => {

    const dotsInterval = setInterval(() => {

      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));

    }, 500);

  

    return () => clearInterval(dotsInterval);

  }, []);

  

  const handlePaid = () => {

    setStatus('Pembayaran Berhasil');

    setTimeout(() => {

      onComplete();

    }, 800);

  };

  

  return (

    <div className="relative w-full h-screen overflow-hidden bg-white text-[#07111f]">

      <div className="absolute inset-0 pointer-events-none bg-white">

        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#fffaf5] to-white" />

        <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full border border-orange-100/70" />

        <div className="absolute right-[-130px] bottom-[-130px] h-[360px] w-[360px] rounded-full border border-orange-100/80" />

        <div className="absolute left-[18%] top-[22%] h-[220px] w-[220px] rounded-full bg-orange-50/50 blur-[90px]" />

        <div className="absolute right-[22%] bottom-[18%] h-[260px] w-[260px] rounded-full bg-orange-50/60 blur-[100px]" />

      </div>

  

      <button

        onClick={onBack}

        className="absolute left-8 top-8 z-30 h-11 px-5 rounded-full bg-white shadow-sm text-[#07111f] font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2"

      >

        <span className="text-lg leading-none">←</span>

        Kembali

      </button>

  

      <main className="relative z-20 h-screen flex flex-col items-center justify-center px-8">

        <div className="mb-4 flex items-center gap-3">

          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm p-2">

            <img src={logoNgolab} alt="Ngolab" className="w-full h-full object-contain" />

          </div>

          <div className="leading-none">

            <p className="text-[#07111f] font-black text-base">NGOLAB</p>

            <p className="text-orange-500 font-black text-base">EXPRESS</p>

          </div>

        </div>

  

        <div className="text-center mb-5">

  

          <h1 className="text-[4rem] leading-none font-black uppercase tracking-tight">

            Scan <span className="text-orange-500">QRIS</span>

          </h1>

  

          <p className="mt-2 text-[12px] font-semibold text-slate-400">

            Arahkan kamera HP ke QRIS untuk melakukan pembayaran

          </p>

        </div>

  

        <div className="w-[420px] rounded-[30px] bg-white p-5 border border-orange-100 shadow-[0_24px_70px_rgba(249,115,22,0.16)]">

          <div className="flex justify-center mb-3">

            <div className="text-center">

              <p className="text-[18px] leading-none font-black text-slate-800">

                QRIS

              </p>

              <p className="text-[8px] font-black text-slate-500">

                QR Code Standard

              </p>

              <p className="text-[8px] font-bold text-slate-400">

                Pembayaran Nasional

              </p>

            </div>

          </div>

  

          <div className="relative rounded-[24px] bg-white p-4">

            <img

              src={qrisImage}

              alt="QRIS Merchant"

              className="mx-auto w-[270px] h-[270px] object-contain"

            />

  

            <div className="absolute top-4 left-12 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />

            <div className="absolute top-4 right-12 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />

            <div className="absolute bottom-4 left-12 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-lg" />

            <div className="absolute bottom-4 right-12 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />

          </div>

  

          <div className="mt-3 rounded-2xl bg-orange-50 px-4 py-3 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white">

                ⏱

              </div>

  

              <div>

                <p className="text-[10px] font-black text-orange-500 uppercase">

                  {status === 'Menunggu Pembayaran' ? `${status}${dots}` : status}

                </p>

                <p className="text-[9px] text-slate-400">

                  Pembayaran akan terverifikasi otomatis

                </p>

              </div>

            </div>

  

            <p className="text-orange-500 font-black tracking-widest">•••</p>

          </div>

  

          <button

            onClick={handlePaid}

            className="mt-3 w-full h-14 rounded-2xl bg-orange-500 text-white font-black uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"

          >

            <span className="w-5 h-5 rounded-full bg-white text-orange-500 flex items-center justify-center text-xs">

              ✓

            </span>

            Saya Sudah Bayar

          </button>

        </div>

  

        <div className="mt-4 w-[420px] bg-white rounded-2xl shadow-sm border border-orange-100 px-5 py-3 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">

              🎧

            </div>

  

            <div>

              <p className="text-[10px] font-black text-slate-900">

                Butuh bantuan?

              </p>

              <p className="text-[8px] text-slate-400">

                Hubungi staf kami jika mengalami kendala pembayaran

              </p>

            </div>

          </div>

  

          <span className="text-slate-900 text-xl">›</span>

        </div>

      </main>

    </div>

  );

};

  

export default QRISScreen;