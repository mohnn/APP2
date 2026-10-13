import React, { useState, useRef } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  Shield, 
  Sparkles, 
  KeyRound, 
  ArrowLeft, 
  Baby, 
  HelpCircle, 
  Camera, 
  Image as ImageIcon,
  Upload,
  UserCheck,
  CheckCircle2,
  UserPlus,
  Trash2
} from 'lucide-react';
import { BrandLogo, RoyalEmblemSvgIcon } from '../common/BrandLogo';
import { NurseryStorageService } from '../../services/storage';
import { User, Child } from '../../types/nursery';
import { DEFAULT_LOGIN_BACKGROUND_DATA_URL } from '../../services/mockData';

interface LoginScreenProps {
  onLoginSuccess: (user: User, child?: Child) => void;
}

const SAVED_ADMIN_KEY = 'mbk_admin_remembered_device_v1';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [loginType, setLoginType] = useState<'admin' | 'parent'>('admin');
  const [parentMode, setParentMode] = useState<'login' | 'register'>('login');
  const storage = NurseryStorageService.getInstance();

  // Admin form (تكون فارغة تماماً افتراضياً إلا إذا كان هذا الجهاز قد سجل مسبقاً)
  const [adminUsername, setAdminUsername] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVED_ADMIN_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.username || '';
      }
    } catch {}
    return '';
  });

  const [adminPassword, setAdminPassword] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVED_ADMIN_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.password || '';
      }
    } catch {}
    return '';
  });

  const [hasSavedAdminCreds, setHasSavedAdminCreds] = useState(() => {
    try {
      return Boolean(localStorage.getItem(SAVED_ADMIN_KEY));
    } catch {
      return false;
    }
  });

  // Parent form
  const [studentId, setStudentId] = useState('');
  const [childName, setChildName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [logoVersion, setLogoVersion] = useState(0);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Upload logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        storage.updateLogo(dataUrl);
        setLogoVersion(v => v + 1);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload full-bleed background image covering the entire screen
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        storage.updateLoginBackground(dataUrl);
        setLogoVersion(v => v + 1);
        setSuccessMessage('تم تحديث وتطبيق صورة الخلفية بالكامل بنجاح! 🎨');
        setTimeout(() => setSuccessMessage(''), 4000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = storage.loginAdmin(adminUsername, adminPassword);
      setIsLoading(false);
      if (res.success && res.user) {
        // Save on this device for future instant access
        try {
          localStorage.setItem(SAVED_ADMIN_KEY, JSON.stringify({
            username: adminUsername.trim(),
            password: adminPassword.trim(),
          }));
          setHasSavedAdminCreds(true);
        } catch {}
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message);
      }
    }, 200);
  };

  const handleForgetAdminCreds = () => {
    try {
      localStorage.removeItem(SAVED_ADMIN_KEY);
      setAdminUsername('');
      setAdminPassword('');
      setHasSavedAdminCreds(false);
      setSuccessMessage('تم مسح بيانات الإدارة المحفوظة من هذا الجهاز.');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {}
  };

  const handleParentRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (parentPassword !== confirmPassword) {
      setErrorMessage('تأكيد كلمة المرور غير متطابق مع كلمة المرور!');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = storage.registerParent(studentId, guardianName, parentPassword, childName);
      setIsLoading(false);
      if (res.success && res.user) {
        // كما طلب المستخدم: بعد التسجيل، يتم توجيهه لشاشة تسجيل الدخول ليسجل الدخول بالـ ID والباسورد
        setParentMode('login');
        setParentPassword('');
        setConfirmPassword('');
        setSuccessMessage('تم إنشاء حساب ولي الأمر بنجاح! 🎉 يرجى إدخال كلمة المرور لتسجيل الدخول.');
      } else {
        setErrorMessage(res.message);
      }
    }, 250);
  };

  const handleParentLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = storage.loginParent(studentId, parentPassword);
      setIsLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user, res.child);
      } else {
        setErrorMessage(res.message);
      }
    }, 200);
  };

  const currentBgUrl = storage.settings.loginBackgroundUrl || DEFAULT_LOGIN_BACKGROUND_DATA_URL;

  return (
    <div className="relative flex-1 w-full h-full min-h-screen text-white flex flex-col justify-center px-4 py-6 overflow-y-auto font-sans text-right select-none">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={logoInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleLogoUpload}
      />
      <input
        type="file"
        ref={bgInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleBgUpload}
      />

      {/* FULL-BLEED BACKGROUND COVERING 100% OF THE ENTIRE SCREEN (يغطي الشاشة بالكامل من الحافة للحافة) */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <img
          src={currentBgUrl}
          alt="Modern British Kids Full Screen Background"
          className="w-full h-full object-cover object-center select-none transform scale-100 transition-all duration-700"
        />
        {/* Transparent Darkening Overlay for Text Legibility (خلفية شفافة أنيقة لتوضيح النصوص مع إبقاء الصورة كاملة في الخلف) */}
        <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[0.5px] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-blue-950/40 to-slate-950/60 pointer-events-none" />

        {/* Ambient Corner Lighting Accents */}
        <div className="absolute top-8 left-8 w-16 h-16 bg-amber-400/20 clip-triangle pointer-events-none blur-xs" />
        <div className="absolute bottom-16 right-12 w-24 h-24 bg-amber-400/20 clip-triangle pointer-events-none blur-sm" />
      </div>

      {/* Top Floating Action: Change Background Image */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => bgInputRef.current?.click()}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-900/90 text-amber-300 hover:text-amber-200 border border-amber-400/30 text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all active:scale-95"
          title="رفع وتغيير صورة الخلفية بالكامل من جهازك لتغطي الشاشة بأكملها"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">تغيير صورة الخلفية كاملة</span>
          <span className="sm:hidden">صورة الخلفية</span>
        </button>
      </div>

      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-sm mx-auto space-y-4 relative z-10 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-block p-2 rounded-3xl bg-blue-950/80 border border-amber-400/50 shadow-2xl backdrop-blur-xl relative group">
            <BrandLogo key={logoVersion} size="lg" showSubtitle={false} className="justify-center text-white" />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="absolute -bottom-1 -left-1 p-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md text-[10px] font-bold flex items-center gap-1 border border-white"
              title="تغيير الشعار الرسمي من جهازك"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-wide drop-shadow-md">
              Modern British Kids
            </h1>
            <p className="text-xs text-amber-300 font-semibold drop-shadow-sm">
              حضانة بريطانية دولية للغات والتعليم المبكر
            </p>
          </div>
        </div>

        {/* Login Type Switcher (إدارة الحضانة أو ولي الأمر) */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-700/80 text-xs font-bold text-center shadow-lg">
          <button
            type="button"
            onClick={() => {
              setLoginType('admin');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              loginType === 'admin'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>إدارة الحضانة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType('parent');
              setParentMode('login'); // يبدأ بشاشة تسجيل الدخول مع زر تسجيل جديد بارز كما طلب المستخدم
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              loginType === 'parent'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>ولي الأمر</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/25 border border-rose-500/50 rounded-2xl text-rose-200 text-xs font-bold text-center animate-shake backdrop-blur-md shadow-md">
            {errorMessage}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/25 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs font-bold text-center backdrop-blur-md shadow-md flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Glassmorphic Form Container */}
        <div className="bg-slate-900/85 backdrop-blur-xl p-5 rounded-3xl border border-slate-700/70 shadow-2xl">
          {loginType === 'admin' ? (
            /* Admin Login Form */
            <form onSubmit={handleAdminSubmit} className="space-y-3.5 text-xs">
              <div className="text-center pb-1">
                <span className="text-[11px] text-slate-400 font-medium">
                  تسجيل دخول الإدارة الرسمية للحضانة <span className="text-amber-300 font-bold">(Nihel)</span>
                </span>
              </div>

              {hasSavedAdminCreds ? (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[10px] text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تم حفظ بيانات الإدارة لهذا الجهاز تلقائياً ✅</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleForgetAdminCreds}
                    className="text-rose-400 hover:text-rose-300 underline font-bold"
                    title="مسح البيانات المحفوظة من هذا الجهاز"
                  >
                    مسح
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[10px] text-slate-300 leading-relaxed">
                  أدخل اسم المستخدم وكلمة المرور الخاصة بإدارة الحضانة للدخول.
                </div>
              )}

              <div>
                <label className="font-bold text-slate-300 block mb-1">اسم المستخدم (Username)</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={e => setAdminUsername(e.target.value)}
                    placeholder="اسم مستخدم الإدارة"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-left focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">كلمة المرور (Password)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="كلمة مرور الإدارة"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-left focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-1"
              >
                <span>دخول الإدارة (Nihel)</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </form>
          ) : parentMode === 'register' ? (
            /* Parent Registration Form (تسجيل حساب جديد لأول مرة) */
            <form onSubmit={handleParentRegisterSubmit} className="space-y-3 text-xs">
              <div className="text-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-300 block mb-0.5">
                  تسجيل حساب ولي أمر جديد لأول مرة 🎓
                </span>
                <span className="text-[10px] text-slate-400">
                  أدخل معرف الطالب المسجل في الحضانة وبياناتك
                </span>
              </div>

              {/* Student ID */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  معرف الطالب في الحضانة (Student ID) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    placeholder="أدخل معرف الطالب المسجل في إدارة الحضانة"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-left focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-amber-300/80 mt-1">
                  ⚠️ يجب أن يكون الطالب مسجلاً مسبقاً في سيستم إدارة الحضانة
                </p>
              </div>

              {/* Guardian Name */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  اسم ولي الأمر الكامل <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={guardianName}
                    onChange={e => setGuardianName(e.target.value)}
                    placeholder="مثال: م. أحمد عبد الرحمن"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  كلمة المرور الخاصة بك <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={parentPassword}
                    onChange={e => setParentPassword(e.target.value)}
                    placeholder="اكتب كلمة مرور قوية"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-left focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  تأكيد كلمة المرور <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور للتأكيد"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-left focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>إنشاء الحساب والانتقال لتسجيل الدخول</span>
              </button>

              {/* Back to login */}
              <div className="text-center pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setParentMode('login');
                    setErrorMessage('');
                  }}
                  className="text-xs text-amber-300 hover:text-amber-200 underline font-semibold transition-colors"
                >
                  لديك حساب مسجل بالفعل؟ اضغط هنا للعودة لتسجيل الدخول
                </button>
              </div>
            </form>
          ) : (
            /* Parent Login Form (تسجيل الدخول عند العودة) */
            <form onSubmit={handleParentLoginSubmit} className="space-y-3.5 text-xs">
              <div className="text-center border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-300 block mb-0.5">
                  تسجيل دخول ولي الأمر 👨‍👧
                </span>
                <span className="text-[10px] text-slate-400">
                  أدخل معرف الطالب وكلمة المرور الخاصة بك للدخول
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  معرف الطالب (Student ID) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    placeholder="3 أرقام (الكيدز إريا) أو 4 أرقام (كيجي 1)"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-left focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  كلمة المرور (Password) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={parentPassword}
                    onChange={e => setParentPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="w-full pr-9 pl-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-left focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>دخول ولي الأمر</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Dedicated "تسجيل جديد" Button as requested */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-center text-[11px] text-slate-400">
                  ليس لديك حساب مسجل بعد؟
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParentMode('register');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600/25 to-amber-500/15 hover:from-amber-600/35 hover:to-amber-500/25 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>تسجيل جديد (حساب ولي أمر لأول مرة)</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 drop-shadow-sm">
          تطبيق Modern British Kids الرسمي · أمان الجلسات وتشفير البيانات
        </div>
      </div>
    </div>
  );
};
