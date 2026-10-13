import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, CheckCircle2, AlertTriangle, Video, VideoOff, RefreshCw, Sparkles } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { Child, AttendanceRecord } from '../../types/nursery';
import confetti from 'canvas-confetti';
import jsQR from 'jsqr';

interface ParentQrScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child;
  onAttendanceRecorded: () => void;
}

function playSuccessBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch {}
}

export const ParentQrScanModal: React.FC<ParentQrScanModalProps> = ({
  isOpen,
  onClose,
  child,
  onAttendanceRecorded,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    record?: AttendanceRecord;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const storage = NurseryStorageService.getInstance();

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      isProcessingRef.current = false;
      setScanResult(null);
      startCamera();

      return () => {
        document.body.style.overflow = originalOverflow;
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('المتصفح لا يدعم الوصول المباشر لكاميرا الهاتف');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play().then(() => {
          setCameraActive(true);
          startQrDetectionLoop();
        }).catch(() => {
          setCameraActive(true);
          startQrDetectionLoop();
        });
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('يرجى السماح بصلاحية الكاميرا لمسح كود QR تلقائياً عند مدخل الحضانة');
      setCameraActive(false);
    }
  };

  const startQrDetectionLoop = () => {
    const scanFrame = () => {
      if (!videoRef.current || !canvasRef.current || isProcessingRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          try {
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (qrCode && qrCode.data) {
              // Successfully auto-detected QR code directly from camera!
              triggerAttendanceRecord();
              return;
            }
          } catch (e) {}
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const triggerAttendanceRecord = () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsScanning(true);

    playSuccessBeep();

    setTimeout(() => {
      setIsScanning(false);
      const res = storage.recordQrScan(child.id);
      setScanResult(res);

      if (res.success) {
        try {
          confetti({
            particleCount: 60,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#10b981', '#3b82f6', '#f59e0b'],
          });
        } catch (e) {}
        onAttendanceRecorded();
      }

      // Re-arm detector after 3.5 seconds
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 3500);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in font-sans overscroll-contain"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-display">كاميرا فحص كود الحضور</h3>
              <span className="text-[10px] text-blue-200">وجه الكاميرا نحو بوستر QR مدخل الحضانة</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Child badge */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
                style={{ backgroundColor: child.avatarColor }}
              >
                {child.avatarUrl ? (
                  <img src={child.avatarUrl} alt={child.fullName} className="w-full h-full object-cover" />
                ) : (
                  child.fullName[0]
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {child.fullName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  معرف الطالب ID: {child.studentId} ({child.levelNameAr})
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-600 font-bold px-2 py-1 rounded-lg">
              طالب معتمد
            </span>
          </div>

          {/* Hidden Canvas for Live jsQR Frame Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Real Live Camera Viewfinder with Auto QR Capture */}
          <div className="relative rounded-3xl bg-black aspect-4/3 flex flex-col items-center justify-center text-center border-2 border-dashed border-blue-500 overflow-hidden shadow-inner">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover absolute inset-0 ${cameraActive ? 'block' : 'hidden'}`}
            />

            {/* If camera is not active / permissions blocked */}
            {!cameraActive && (
              <div className="p-4 space-y-2 z-10 flex flex-col items-center">
                <VideoOff className="w-10 h-10 text-slate-500" />
                <span className="text-xs font-bold text-slate-300">
                  {cameraError || 'جاري تشغيل كاميرا الهاتف...'}
                </span>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>إعادة تشغيل الكاميرا</span>
                </button>
              </div>
            )}

            {/* Target Viewfinder Overlay with Animated Scanning Line */}
            <div className="absolute inset-4 border-2 border-blue-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse shadow-[0_0_8px_#10b981]"></div>
              
              {/* Corner markers */}
              <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-amber-400"></div>
              <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-amber-400"></div>
              <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-amber-400"></div>
              <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-amber-400"></div>
            </div>

            {/* Viewfinder Badge */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-xs py-1.5 px-2.5 rounded-xl text-[10px] text-white pointer-events-none flex items-center justify-center gap-1.5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-semibold">يلقط تلقائياً بمجرد توجيه الكاميرا نحو كود QR</span>
            </div>
          </div>

          {/* Schedule Banner */}
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[10px] text-amber-900 dark:text-amber-200 space-y-0.5">
            <div>• <span className="font-bold text-emerald-700 dark:text-emerald-300">الحضور بالموعد:</span> من 07:30 ص إلى 08:30 ص.</div>
            <div>• <span className="font-bold text-amber-700 dark:text-amber-300">متأخر:</span> بعد 08:30 ص يسجل في المتأخرين.</div>
            <div>• <span className="font-bold text-blue-700 dark:text-blue-300">موعد الانصراف:</span> دائماً الساعة 02:00 ظهراً.</div>
          </div>

          {/* Result Alert */}
          {scanResult && (
            <div className={`p-3.5 rounded-2xl text-xs font-bold text-center border animate-fade-in shadow-md ${
              scanResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
            }`}>
              <div className="flex items-center justify-center gap-2">
                {scanResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                <span className="leading-relaxed">{scanResult.message}</span>
              </div>
            </div>
          )}

          {/* Live Scanner Guide */}
          <div className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-center text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-medium">المسح التلقائي مفعل: وجّه الكاميرا نحو كود QR المعروض بمدخل الحضانة لتسجيل الحضور فوراً</span>
          </div>
        </div>
      </div>
    </div>
  );
};
