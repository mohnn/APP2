import React, { useState } from 'react';
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

  // Child Info
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('106');
  const [levelId, setLevelId] = useState<'lvl-kids-area' | 'lvl-kg1'>('lvl-kids-area');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('2023-05-15');
  const [monthlyFee, setMonthlyFee] = useState(2500);
  const [photoDataUrl, setPhotoDataUrl] = useState('');

  // Guardian Info
  const [guardianName, setGuardianName] = useState('');
  const [relation, setRelation] = useState('الأب');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('التجمع الخامس - القاهرة الجديدة');

  if (!isOpen) return null;

  const handleLevelChange = (newLevel: 'lvl-kids-area' | 'lvl-kg1') => {
    setLevelId(newLevel);
    if (newLevel === 'lvl-kids-area') {
      setMonthlyFee(2500);
      // default 3 digits ID
      setStudentId('106');
    } else {
      setMonthlyFee(2800);
      // default 4 digits ID
      setStudentId('1006');
    }
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
    const cleanId = studentId.trim();

    // Validate ID length based on level (النقطة 2)
    if (levelId === 'lvl-kids-area') {
      if (cleanId.length > 3 || !/^\d+$/.test(cleanId)) {
        alert('تنبيه: معرف الطالب في مرحلة (الكيدز إريا) يجب ألا يتعدى 3 أرقام (مثال: 101)!');
        return;
      }
    } else {
      if (cleanId.length > 4 || !/^\d+$/.test(cleanId)) {
        alert('تنبيه: معرف الطالب في مرحلة (كيجي 1) يجب ألا يتعدى 4 أرقام (مثال: 1001)!');
        return;
      }
    }

    // Check duplicate ID
    if (storage.children.some(c => c.studentId === cleanId)) {
      alert(`معرف الطالب (${cleanId}) مسجل مسبقاً لطالب آخر! يرجى اختيار معرف غير مكرر.`);
      return;
    }

    if (!fullName.trim() || !guardianName.trim() || !phone.trim()) {
      alert('يرجى تعبئة اسم الطالب الرباعي واسم ولي الأمر ورقم الهاتف!');
      return;
    }

    const created = storage.addChild({
      fullName: fullName.trim(),
      studentId: cleanId,
      gender,
      birthDate,
      levelId,
      classId: levelId === 'lvl-kids-area' ? 'cls-ka-1' : 'cls-kg1-1',
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
            onClick={() => setStep(2)}
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
              {/* Level Selection (المستويين فقط - النقطة 2) */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  المرحلة التعليمية <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLevelChange('lvl-kids-area')}
                    className={`p-3 rounded-2xl border text-right transition-all ${
                      levelId === 'lvl-kids-area'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <span className="font-bold block text-xs">الكيدز إريا (Kids Area)</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 block mt-0.5 font-medium">
                      المعرف: لا يتعدى 3 أرقام
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLevelChange('lvl-kg1')}
                    className={`p-3 rounded-2xl border text-right transition-all ${
                      levelId === 'lvl-kg1'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <span className="font-bold block text-xs">كيجي 1 (KG 1)</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5 font-medium">
                      المعرف: لا يتعدى 4 أرقام
                    </span>
                  </button>
                </div>
              </div>

              {/* Student ID Input (الـ ID لا يتعدى 3 أرقام للكيدز إريا و 4 لكيجي 1) */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  معرف الطالب (ID) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={levelId === 'lvl-kids-area' ? 3 : 4}
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder={levelId === 'lvl-kids-area' ? 'مثال: 106 (3 أرقام كحد أقصى)' : 'مثال: 1006 (4 أرقام كحد أقصى)'}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-left font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {levelId === 'lvl-kids-area' 
                    ? 'شرط: ألا يتعدى الـ ID 3 أرقام لمرحلة الكيدز إريا'
                    : 'شرط: ألا يتعدى الـ ID 4 أرقام لمرحلة كيجي 1'}
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

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
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
