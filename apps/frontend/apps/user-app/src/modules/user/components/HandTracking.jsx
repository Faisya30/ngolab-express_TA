import React, { useEffect, useRef, useState } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const DEBUG_LANDMARK_LOG = false;

const parseWebcamError = (error) => {
  const name = error?.name || 'UnknownError';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Izin kamera ditolak';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Kamera tidak ditemukan';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Kamera sedang dipakai aplikasi lain';
  }
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return 'Pengaturan kamera tidak didukung';
  }
  return 'Webcam gagal diakses';
};

const getCameraAttempts = () => [
  {
    video: {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 360 },
      frameRate: { ideal: 24, max: 30 },
    },
    audio: false,
  },
  {
    video: {
      width: { ideal: 640 },
      height: { ideal: 360 },
    },
    audio: false,
  },
  {
    video: true,
    audio: false,
  },
];

const HandTracking = ({ onLandmarks }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const restartTimerRef = useRef(null);
  const [status, setStatus] = useState('Meminta izin webcam...');

  useEffect(() => {
    let stream;
    let frameId;
    let hands;
    let isMounted = true;
    let isProcessing = false;
    let lastLogTs = 0;

    const clearRestartTimer = () => {
      if (restartTimerRef.current) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
    };

    const stopStream = () => {
      const activeStream = streamRef.current;
      if (!activeStream) return;

      activeStream.getTracks().forEach((track) => {
        track.onended = null;
        track.oninactive = null;
        track.stop();
      });

      streamRef.current = null;
    };

    const getWebcamStream = async () => {
      const attempts = getCameraAttempts();
      let lastError = null;

      for (const constraints of attempts) {
        try {
          return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error('Unknown getUserMedia error');
    };

    const scheduleRestart = (message) => {
      if (!isMounted) return;

      stopStream();
      clearRestartTimer();

      if (hands) {
        hands.close();
        hands = null;
      }

      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }

      setStatus(message);
      restartTimerRef.current = window.setTimeout(() => {
        if (isMounted) {
          start();
        }
      }, 1000);
    };

    const onResults = (results) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      const handLandmarks = results.multiHandLandmarks?.[0];
      if (handLandmarks) {
        drawConnectors(ctx, handLandmarks, HAND_CONNECTIONS, {
          color: '#22c55e',
          lineWidth: 3,
        });

        drawLandmarks(ctx, handLandmarks, {
          color: '#f97316',
          lineWidth: 1,
          radius: 3,
        });
      }

      const now = Date.now();
      if (DEBUG_LANDMARK_LOG && handLandmarks && now - lastLogTs > 250) {
        console.log('Hand landmarks:', handLandmarks);
        lastLogTs = now;
      }

      if (onLandmarks) {
        if (!handLandmarks) {
          onLandmarks({ hands: [], pointer: null, pinch: false, pinchDistance: null });
        } else {
          const indexTip = handLandmarks[8];
          const thumbTip = handLandmarks[4];

          let pinch = false;
          let pinchDistance = null;
          if (indexTip && thumbTip) {
            const dx = indexTip.x - thumbTip.x;
            const dy = indexTip.y - thumbTip.y;
            const dz = indexTip.z - thumbTip.z;
            pinchDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            pinch = pinchDistance < 0.06;
          }

          onLandmarks({
            hands: [handLandmarks],
            pointer: indexTip
              ? {
                  xNorm: indexTip.x,
                  yNorm: indexTip.y,
                  mirroredXNorm: 1 - indexTip.x,
                  xPx: Math.round(indexTip.x * width),
                  yPx: Math.round(indexTip.y * height),
                }
              : null,
            pinch,
            pinchDistance,
          });
        }
      }

      ctx.restore();
    };

    async function start() {
      try {
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
          setStatus('Butuh HTTPS untuk webcam');
          return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          setStatus('Browser tidak mendukung webcam');
          return;
        }

        setStatus('Membuka webcam...');
        const nextStream = await getWebcamStream();

        if (!isMounted) {
          nextStream.getTracks().forEach((track) => track.stop());
          return;
        }

        stopStream();
        clearRestartTimer();

        stream = nextStream;
        streamRef.current = nextStream;

        const [videoTrack] = nextStream.getVideoTracks();
        if (videoTrack) {
          videoTrack.onended = () => scheduleRestart('Kamera terputus, mencoba menyambung ulang...');
          videoTrack.oninactive = () => scheduleRestart('Kamera tidak aktif, mencoba menyambung ulang...');
        }

        const video = videoRef.current;
        if (!video) return;

        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = nextStream;
        await video.play();

        hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);
        setStatus('Tracking tangan aktif');

        const detectFrame = async () => {
          if (!isMounted) return;

          if (video.srcObject !== streamRef.current) {
            frameId = requestAnimationFrame(detectFrame);
            return;
          }

          if (!isProcessing && video.readyState >= 2) {
            isProcessing = true;
            try {
              await hands.send({ image: video });
            } catch (err) {
              console.error('MediaPipe send error:', err);
            } finally {
              isProcessing = false;
            }
          }

          frameId = requestAnimationFrame(detectFrame);
        };

        detectFrame();
      } catch (err) {
        console.error('Webcam error:', err);
        setStatus(parseWebcamError(err));
      }
    }

    start();

    return () => {
      isMounted = false;
      clearRestartTimer();
      if (frameId) cancelAnimationFrame(frameId);
      if (hands) hands.close();
      stopStream();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [onLandmarks]);

  return (
    <div className="fixed top-4 left-4 z-10000 w-[300px] rounded-2xl border border-white/20 bg-slate-900/85 backdrop-blur-md p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-white/80">Hand Tracking</p>
        <span className="text-[9px] text-emerald-300">{status}</span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
        <video
          ref={videoRef}
          autoPlay
          className="w-full aspect-video object-cover scale-x-[-1]"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full scale-x-[-1] pointer-events-none"
        />
      </div>
    </div>
  );
};

export default HandTracking;
