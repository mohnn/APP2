import React, { useState, useRef } from 'react';
import { ArrowRight, Save, Settings, ShieldCheck, History, RotateCcw, Upload, Image as ImageIcon, Trash2, CheckCircle2 } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { DEFAULT_NURSERY_LOGO_DATA_URL, DEFAULT_LOGIN_BACKGROUND_DATA_URL } from '../../services/mockData';
import { BrandLogo } from '../common/BrandLogo';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();
  const [activeTab, setActiveTab] = useState<'general' | 'audit_log'>('general');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState(storage.settings.nurseryName);
  const [phone, setPhone] = useState(storage.settings.phone);
  const [whatsapp, setWhatsapp] = useState(storage.settings.whatsapp);
  const [address, setAddress] = useState(storage.settings.address);
  const [startTime, setStartTime] = useState(storage.settings.startTime);
  const [lateTime, setLateTime] = useState(storage.settings.lateThresholdTime);
  const [currency, setCurrency] = useState(storage.settings.currency);
  const [logoUrl, setLogoUrl] = useState(storage.settings.logoUrl || DEFAULT_NURSERY_LOGO_DATA_URL);
  const [bgUrl, setBgUrl] = useState(storage.settings.loginBackgroundUrl || DEFAULT_LOGIN_BACKGROUND_DATA_URL);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateSettings({
      nurseryName: name,
      phone,
      whatsapp,
      address,
      startTime,
      lateThresholdTime: lateTime,
      currency,
      logoUrl,
      loginBackgroundUrl: bgUrl,
    });
    setToastMessage('تم حفظ إعدادات وشعار وخلفية الحضانة بنجاح ✅');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Upload custom logo from user's device
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setLogoUrl(dataUrl);
        storage.updateLogo(dataUrl);
        setToastMessage('تم رفع وتعيين شعار الحضانة الجديد بنجاح! 🎓');
        setTimeout(() => setToastMessage(null), 4000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefaultLogo = () => {
    setLogoUrl(DEFAULT_NURSERY_LOGO_DATA_URL);
    storage.updateLogo(DEFAULT_NURSERY_LOGO_DATA_URL);
    setToastMessage('تمت استعادة الشعار الملكي الرسمي بنجاح.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Upload full screen background image
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setBgUrl(dataUrl);
        storage.updateLoginBackground(dataUrl);
        setToastMessage('تم رفع وتطبيق صورة الخلفية بالكامل لتغطي الشاشة بنجاح! 🎨');
        setTimeout(() => setToastMessage(null), 4000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetBg = () => {
    setBgUrl(DEFAULT_LOGIN_BACKGROUND_DATA_URL);
    storage.updateLoginBackground(DEFAULT_LOGIN_BACKGROUND_DATA_URL);
    setToastMessage('تمت استعادة صورة الخلفية الافتراضية بنجاح.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePurgeData = () => {
    if (confirm('تحذير: هل أنت متأكد من رغبتك في تفريغ قاعدة بيانات الطلاب والسجلات المالية للبدء من الصفر؟')) {
      storage.clearAllData();
      setToastMessage('تم تفريغ كافة بيانات الطلاب بنجاح. النظام الآن فارغ وجاهز للتسجيل.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right font-sans select-none pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              إعدادات النظام والحضانة
            </h2>
            <span className="text-[10px] text-slate-400">بيانات الحضانة، الشعار الرسمي، ومواعيد الحضور</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-bold text-center">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'general'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          بيانات الحضانة والشعار
        </button>

        <button
          onClick={() => setActiveTab('audit_log')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'audit_log'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          سجل الرقابة (Audit Logs)
        </button>
      </div>

      {activeTab === 'general' ? (
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {/* Logo & Branding Card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs border-b pb-1">
              شعار الحضانة الرسمي (Nursery Logo)
            </span>

            <div className="flex items-center gap-3.5">
              <div className="shrink-0">
                <BrandLogo size="lg" customLogoUrl={logoUrl} showSubtitle={false} />
              </div>

              <div className="flex-1 space-y-2">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  يظهر هذا الشعار في كافة أركان التطبيق، شاشة الدخول، البوسترات، والإيصالات المالية.
                </p>

                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-98"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة الشعار</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToDefaultLogo}
                    className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                    title="استعادة الشعار الرسمي"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>الافتراضي</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full Screen Background Customization Card */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                صورة خلفية الشاشة بالكامل (Wallpaper)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-24 h-16 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden relative shadow-inner shrink-0 bg-slate-950">
                <img
                  src={bgUrl}
                  alt="Background Preview"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-right">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                  خلفية التطبيق وشاشة الدخول تغطي كامل الشاشة
                </span>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  يمكنك رفع أي صورة أو خلفية عالية الجودة من جهازك لتغطي الشاشة بأكملها خلف كل النصوص والبطاقات.
                </p>

                <div className="flex gap-2 justify-center sm:justify-start">
                  <input
                    type="file"
                    ref={bgInputRef}
                    accept="image/*"
                    onChange={handleBgUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bgInputRef.current?.click()}
                    className="py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all active:scale-98"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة الخلفية</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetBg}
                    className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                    title="استعادة الخلفية الافتراضية"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>الافتراضي</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* General Information Card */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم الحضانة الرسمي</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-left"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رقم واتساب الإدارة</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-left"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">العنوان والموقع</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
              />
            </div>
          </div>

          {/* Timings */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] border-b pb-1">
              مواعيد الحضور الذكي والغياب التلقائي
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">موعد بداية الحضانة</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-center font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">حد التأخير (متأخر)</label>
                <input
                  type="time"
                  value={lateTime}
                  onChange={e => setLateTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-center font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">العملة الافتراضية</label>
              <input
                type="text"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-center font-bold"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </button>

          {/* Data Clean Slate Purge Card */}
          <div className="p-3.5 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">تفريغ قاعدة بيانات الطلاب</span>
              <Trash2 className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              تفريغ كافة الطلاب والسجلات والبدء بقاعدة بيانات نظيفة وجاهزة تماماً.
            </p>
            <button
              type="button"
              onClick={handlePurgeData}
              className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              تفريغ كافة بيانات الطلاب الآن
            </button>
          </div>
        </form>
      ) : (
        /* Audit Logs Feed */
        <div className="space-y-2 pb-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>سجل العمليات والرقابة الأمنية ({storage.auditLogs.length})</span>
            <span className="text-[10px]">مسجل للمحاسبة والشفافية</span>
          </div>

          {storage.auditLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  {log.action}
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {log.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {log.details}
              </p>
              <div className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span>المستخدم: {log.userName} ({log.userRole})</span>
                <span className="text-slate-400 font-mono">ID: {log.id.slice(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
