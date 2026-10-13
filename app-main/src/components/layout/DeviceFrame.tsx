import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Maximize2, 
  RotateCcw, 
  Code2, 
  Wifi, 
  BatteryMedium, 
  Signal,
  LogOut,
  UserCheck
} from 'lucide-react';
import { User } from '../../types/nursery';
import { NurseryStorageService } from '../../services/storage';
import { BrandLogo } from '../common/BrandLogo';
import { DEFAULT_LOGIN_BACKGROUND_DATA_URL } from '../../services/mockData';

interface DeviceFrameProps {
  children: React.ReactNode;
  currentUser: User | null;
  onLogout: () => void;
  onOpenCodeExporter: () => void;
}

export type ViewportMode = 'phone' | 'tablet' | 'fullscreen';

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  currentUser,
  onLogout,
  onOpenCodeExporter,
}) => {
  const [mode, setMode] = useState<ViewportMode>('fullscreen');
  const [currentTime, setCurrentTime] = useState('08:30');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Device Simulator Control Bar */}
      <header className="h-13 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-2.5">
          <BrandLogo size="xs" iconOnly={true} />
          <div>
            <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>Modern British Kids</span>
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">حضانة دولية</span>
            </div>
            <div className="text-[10px] text-slate-400">
              نظام الإدارة الذكي والشامل لمتابعة الحضور والمصروفات
            </div>
          </div>
        </div>

        {/* Viewport switchers & User status */}
        <div className="flex items-center gap-2">
          {/* Viewport Modes */}
          <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 flex items-center gap-0.5">
            <button
              onClick={() => setMode('phone')}
              title="عرض شاشة الموبايل (Smartphone 390px)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                mode === 'phone'
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">هاتف</span>
            </button>
            <button
              onClick={() => setMode('tablet')}
              title="عرض شاشة التابلت (Tablet / iPad)"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                mode === 'tablet'
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تابلت</span>
            </button>
            <button
              onClick={() => setMode('fullscreen')}
              title="ملء الشاشة المباشر"
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                mode === 'fullscreen'
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">كامل</span>
            </button>
          </div>

          {/* User Badge & Logout (النقطة 12: تم إزالة الأدوار المتعددة والإبقاء على Nihel أو ولي الأمر) */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <div className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400">({currentUser.roleLabelAr.split(' ')[0]})</span>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                title="تسجيل الخروج والعودة لشاشة الدخول"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              شاشة تسجيل الدخول
            </div>
          )}

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (confirm('هل تريد إعادة تعيين البيانات التجريبية إلى الوضع الافتراضي؟')) {
                NurseryStorageService.getInstance().resetToDemoData();
                window.location.reload();
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="إعادة تعيين البيانات التجريبية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="relative flex-1 overflow-auto flex items-center justify-center p-0 md:p-6 bg-slate-950">
        {/* Full Viewport Wallpaper Background */}
        <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <img
            src={NurseryStorageService.getInstance().settings.loginBackgroundUrl || DEFAULT_LOGIN_BACKGROUND_DATA_URL}
            alt="Modern British Kids Full Screen Background"
            className="w-full h-full object-cover object-center select-none opacity-40 blur-xs"
          />
          <div className="absolute inset-0 bg-slate-950/70 pointer-events-none" />
        </div>

        {mode === 'phone' ? (
          /* Smartphone Frame (390 x 844 style) */
          <div className="relative z-10 w-full max-w-[400px] h-[852px] max-h-[calc(100vh-4rem)] bg-black rounded-[46px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_8px_#1e293b,0_0_0_10px_#334155] flex flex-col shrink-0 border border-slate-700/50">
            {/* Phone Screen Bezel */}
            <div className="relative flex-1 bg-white dark:bg-slate-900 rounded-[36px] overflow-hidden flex flex-col text-slate-800 dark:text-slate-100">
              {/* Dynamic Island / Top Notch */}
              <div className="h-10 bg-slate-900 text-white px-6 flex items-center justify-between text-xs z-40 shrink-0 select-none">
                <span className="font-semibold text-[13px] tracking-tight text-white font-mono">{currentTime}</span>
                {/* Dynamic island pill */}
                <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center gap-1.5 shadow-inner">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500/80"></div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Signal className="w-3.5 h-3.5" />
                  <Wifi className="w-3.5 h-3.5" />
                  <BatteryMedium className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              {/* Mobile Screen App Body */}
              <div className="flex-1 overflow-hidden flex flex-col relative">
                {children}
              </div>

              {/* iOS / Android Bottom Gesture Bar */}
              <div className="h-3.5 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 z-40">
                <div className="w-32 h-1 bg-slate-400/60 rounded-full"></div>
              </div>
            </div>
          </div>
        ) : mode === 'tablet' ? (
          /* Tablet / iPad Frame (820 x 860) */
          <div className="relative z-10 w-full max-w-[860px] h-[860px] max-h-[calc(100vh-4rem)] bg-black rounded-[38px] p-4 shadow-[0_25px_65px_-15px_rgba(0,0,0,0.95),0_0_0_10px_#1e293b] flex flex-col shrink-0 border border-slate-700/60">
            <div className="relative flex-1 bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden flex flex-col text-slate-800 dark:text-slate-100">
              {/* Tablet Top Bar */}
              <div className="h-8 bg-slate-900 text-white px-6 flex items-center justify-between text-xs z-40 shrink-0 select-none">
                <span className="font-semibold text-xs font-mono">{currentTime}</span>
                <span className="text-[11px] text-amber-300 font-medium">Modern British Kids Tablet Edition</span>
                <div className="flex items-center gap-2 text-slate-300">
                  <Wifi className="w-3.5 h-3.5" />
                  <BatteryMedium className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              {/* Tablet App Body */}
              <div className="flex-1 overflow-hidden flex flex-col relative">
                {children}
              </div>

              {/* Tablet Gesture Bar */}
              <div className="h-3 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 z-40">
                <div className="w-44 h-1 bg-slate-400/50 rounded-full"></div>
              </div>
            </div>
          </div>
        ) : (
          /* Fullscreen Mode */
          <div className="relative z-10 w-full h-full flex flex-col bg-transparent text-slate-800 dark:text-slate-100 flex-1">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
