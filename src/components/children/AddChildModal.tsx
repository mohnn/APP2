import { notify } from '../../utils/notify';
import React, { useState, useEffect } from 'react';
import { X, Check, Baby, Upload } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChildAdded: (childId: string) => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  onChildAdded,
}) => {
  const storage = NurseryStorageService.getInstance();

  const [step, setStep] = useState<1 | 2>(1);
  const [triedNext, setTriedNext] = useState(false);

  // Child Info (فارغة لكل طالب جديد)
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  // المرحلة: بري كيجي (معرف 3 أرقام) أو كيجي 1 (معرف 4 أرقام)
  const [levelId, setLevelId] = useState<'lvl-pre-kg' | 'lvl-kg1'>('lvl-kg1');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [monthlyFee, setMonthlyFee] = useState(2800);
  const [photoDataUrl, setPhotoDataUrl] = useState('');

  // Guardian Info
  const [guardianName, setGuardianName] = useState('');
  const [relation, setRelation] = useState('الأب');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');

  const resetForm = () => {
    setStep(1);
    setTriedNext(false);
    setFullName('');
    setStudentId('');
    setGender('male');
    setBirthDate('');
    setMonthlyFee(2800);
    setLevelId('lvl-kg1');
    setPhotoDataUrl('');
    setGuardianName('');
    setRelation('الأب');
    setPhone('');
    setWhatsapp('');
    setAddress('');
  };

  // كل مرة يُفتح فيها النموذج يبدأ فارغاً (بدون بيانات الطالب السابق)
  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  if (!isOpen) return null;

  // --- التحقق من معرف الطالب (التنسيق + عدم التكرار) ---
  const cleanId = studentId.trim();
  const maxIdLength = levelId === 'lvl-pre-kg' ? 3 : 4;
  const existingChild = cleanId ? storage.findChildByStudentId(cleanId) : undefined;
  let idError = '';
  if (existingChild) {
    idError = `كود الطالب (${cleanId}) مسجل بالفعل لطالب آخر (${existingChild.fullName}). اكتب كوداً غير مكرر.`;
  } else if (cleanId && (!/^\d+$/.test(cleanId) || cleanId.length > maxIdLength)) {
    idError = `المعرف يجب أن يكون أرقاماً فقط ولا يتعدى ${maxIdLength} أرقام.`;
  }

  /** أول مشكلة في بيانات الخطوة الأولى (فارغ = كل شيء صحيح) */
  const getStep1Error = (): string => {
    if (!cleanId) return 'اكتب معرف الطالب (ID).';
    if (idError) return idError;
    if (!fullName.trim()) return 'اكتب اسم الطالب رباعياً.';
    if (!birthDate) return 'اختر تاريخ ميلاد الطالب.';
    return '';
  };
  const step1Error = getStep1Error();

  /** الانتقال لبيانات ولي الأمر لا يتم إلا إذا كانت بيانات الطالب صحيحة */
  const goToStep2 = () => {
    setTriedNext(true);
    if (getStep1Error()) return;
    setStep(2);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // إعادة التحقق من بيانات الطالب (وإرجاع المستخدم للخطوة الأولى إن وُجدت مشكلة)
    if (getStep1Error()) {
      setTriedNext(true);
      setStep(1);
      return;
    }

    if (!fullName.trim() || !guardianName.trim() || !phone.trim()) {
      notify('يرجى تعبئة اسم الطالب الرباعي واسم ولي الأمر ورقم الهاتف!');
      return;
    }

    const created = storage.addChild({
      fullName: fullName.trim(),
      studentId: cleanId,
      gender,
      birthDate,
      levelId,
      classId: levelId === 'lvl-pre-kg' ? 'cls-pre-kg-1' : 'cls-kg-1',
      monthlyFee: Number(monthlyFee),
      address,
      avatarUrl: photoDataUrl || undefined,
      guardian: {
        fullName: guardianName.trim(),
        relation,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        address,
      },
    });

    onChildAdded(created.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in font-sans">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-base font-display">تسجيل طالب جديد</h3>
            <span className="text-[11px] text-amber-300">Modern British Kids Nursery</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-2.5 transition-colors ${
              step === 1 ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'text-slate-400'
            }`}
          >
            1. بيانات الطالب والمعرف (ID)
          </button>
          <button
            type="button"
            onClick={goToStep2}
            className={`flex-1 py-2.5 transition-colors ${
              step === 2 ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900' : 'text-slate-400'
            }`}
          >
            2. ولي الأمر والمصروفات
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {step === 1 ? (
            <>
              {/* اختيار المرحلة: بري كيجي (3 أرقام) أو كيجي 1 (4 أرقام) */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'lvl-pre-kg', title: 'بري كيجي (Pre-KG)', hint: 'معرف حتى 3 أرقام' },
                  { id: 'lvl-kg1', title: 'كيجي 1 (KG 1)', hint: 'معرف حتى 4 أرقام' },
                ] as const).map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setLevelId(l.id);
                      setMonthlyFee(l.id === 'lvl-pre-kg' ? 2500 : 2800);
                      setStudentId('');
                    }}
                    className={`p-3 rounded-2xl border text-right transition-all ${
                      levelId === l.id
                        ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs block">{l.title}</span>
                    <span className="text-[10px] opacity-80">{l.hint}</span>
                  </button>
                ))}
              </div>

              {/* Student ID Input (الـ ID لا يتعدى 3 أرقام لبري كيجي و 4 لكيجي 1) */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  معرف الطالب (ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={maxIdLength}
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder={levelId === 'lvl-pre-kg' ? 'مثال: 106 (3 أرقام كحد أقصى)' : 'مثال: 1006 (4 أرقام كحد أقصى)'}
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-left font-bold ${
                    idError ? 'border-rose-500 ring-1 ring-rose-400' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {idError && (
                  <div className="mt-1.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                    ⚠️ {idError}
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-1 block">
                  شرط: ألا يتعدى الـ ID {maxIdLength} أرقام لمرحلة {levelId === 'lvl-pre-kg' ? 'بري كيجي' : 'كيجي 1'}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  اسم الطالب رباعياً <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="مثال: يوسف أحمد محمد المهدي"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">النوع</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="male">ولد 👦</option>
                    <option value="female">بنت 👧</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">تاريخ الميلاد</label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-left"
                  />
                </div>
              </div>

              {/* Photo Upload (النقطة 13) */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  صورة الطالب (اختياري)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-500"
                  />
                  {photoDataUrl && (
                    <img src={photoDataUrl} alt="Preview" className="w-10 h-10 rounded-full object-cover border" />
                  )}
                </div>
              </div>

              {triedNext && step1Error && !idError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  ⚠️ {step1Error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={goToStep2}
                  className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl"
                >
                  التالي: بيانات ولي الأمر والمصروفات
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  اسم ولي الأمر <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={guardianName}
                  onChange={e => setGuardianName(e.target.value)}
                  placeholder="مثال: م. أحمد محمد المهدي"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">صلة القرابة</label>
                  <select
                    value={relation}
                    onChange={e => setRelation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    <option value="الأب">الأب</option>
                    <option value="الأم">الأم</option>
                    <option value="ولي أمر">ولي أمر</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    رقم الهاتف <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-left"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رقم واتساب</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-left"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">العنوان السكني</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المصروف الشهري (كاش 💵)</label>
                <input
                  type="number"
                  value={monthlyFee}
                  onChange={e => setMonthlyFee(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-left font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
                >
                  السابق
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl shadow-md"
                >
                  حفظ وتسجيل الطالب رسمياً
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
