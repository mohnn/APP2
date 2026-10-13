import React, { useState, useEffect } from 'react';
import { X, Check, Baby, Edit3, Trash2 } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { Child, Guardian } from '../../types/nursery';

interface EditChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child;
  onChildUpdated: (updated: Child) => void;
}

export const EditChildModal: React.FC<EditChildModalProps> = ({
  isOpen,
  onClose,
  child,
  onChildUpdated,
}) => {
  const storage = NurseryStorageService.getInstance();
  const currentGuardian = storage.guardians.find(g => g.id === child.guardianId);

  // Form State
  const [fullName, setFullName] = useState(child.fullName);
  const [studentId, setStudentId] = useState(child.studentId);
  const [levelId, setLevelId] = useState<'lvl-kids-area' | 'lvl-kg1'>(child.levelId);
  const [gender, setGender] = useState<'male' | 'female'>(child.gender);
  const [birthDate, setBirthDate] = useState(child.birthDate);
  const [monthlyFee, setMonthlyFee] = useState(child.monthlyFee);
  const [address, setAddress] = useState(child.address);
  const [notes, setNotes] = useState(child.notes || '');

  // Guardian State
  const [guardianName, setGuardianName] = useState(currentGuardian?.fullName || '');
  const [relation, setRelation] = useState(currentGuardian?.relation || 'الأب');
  const [phone, setPhone] = useState(currentGuardian?.phone || '');
  const [whatsapp, setWhatsapp] = useState(currentGuardian?.whatsapp || '');

  useEffect(() => {
    if (child) {
      setFullName(child.fullName);
      setStudentId(child.studentId);
      setLevelId(child.levelId);
      setGender(child.gender);
      setBirthDate(child.birthDate);
      setMonthlyFee(child.monthlyFee);
      setAddress(child.address);
      setNotes(child.notes || '');

      const g = storage.guardians.find(grd => grd.id === child.guardianId);
      if (g) {
        setGuardianName(g.fullName);
        setRelation(g.relation || 'الأب');
        setPhone(g.phone || '');
        setWhatsapp(g.whatsapp || '');
      }
    }
  }, [child, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanId = studentId.trim();

    // Validate ID length based on level (Point 2)
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

    // Check duplicate ID with other children
    const duplicate = storage.children.find(c => c.studentId === cleanId && c.id !== child.id);
    if (duplicate) {
      alert(`معرف الطالب (${cleanId}) مستخدم بالفعل مع طالب آخر (${duplicate.fullName})!`);
      return;
    }

    if (!fullName.trim() || !guardianName.trim() || !phone.trim()) {
      alert('يرجى كتابة اسم الطالب واسم ولي الأمر ورقم الهاتف!');
      return;
    }

    const updated = storage.updateChild(
      child.id,
      {
        fullName: fullName.trim(),
        studentId: cleanId,
        code: `ID-${cleanId}`,
        password: cleanId,
        levelId,
        levelNameAr: levelId === 'lvl-kids-area' ? 'الكيدز إريا' : 'كيجي 1',
        gender,
        birthDate,
        monthlyFee: Number(monthlyFee),
        address: address.trim(),
        notes: notes.trim(),
      },
      {
        fullName: guardianName.trim(),
        relation,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
      }
    );

    if (updated) {
      onChildUpdated(updated);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-display">تعديل بيانات الطفل</h3>
              <span className="text-[10px] text-amber-300">{child.fullName} (ID: {child.studentId})</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Child Full Name */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              اسم الطفل الرباعي <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            />
          </div>

          {/* Level & Student ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                المستوى الدراسي <span className="text-rose-500">*</span>
              </label>
              <select
                value={levelId}
                onChange={e => setLevelId(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="lvl-kids-area">الكيدز إريا (3 أرقام)</option>
                <option value="lvl-kg1">كيجي 1 (4 أرقام)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                معرف الطالب (ID) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={levelId === 'lvl-kids-area' ? 3 : 4}
                value={studentId}
                onChange={e => setStudentId(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-blue-600 dark:text-blue-400 text-left"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {levelId === 'lvl-kids-area' ? '3 أرقام كحد أقصى (مثال: 101)' : '4 أرقام كحد أقصى (مثال: 1001)'}
              </span>
            </div>
          </div>

          {/* Monthly Fee & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                المصروفات الشهرية الصافية (ج.م) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                value={monthlyFee}
                onChange={e => setMonthlyFee(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 text-left"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                المبلغ الحقيقي الفعلي بدون أي إضافات مخفية
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                النوع
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`py-1.5 rounded-lg font-bold transition-all ${
                    gender === 'male' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  ولد 👦
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`py-1.5 rounded-lg font-bold transition-all ${
                    gender === 'female' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  بنت 👧
                </button>
              </div>
            </div>
          </div>

          {/* Birth Date & Address */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                تاريخ الميلاد
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                العنوان السكني
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="التجمع الخامس"
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Guardian Information */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <span className="font-bold text-blue-700 dark:text-blue-400 block">
              بيانات ولي الأمر
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  اسم ولي الأمر <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={guardianName}
                  onChange={e => setGuardianName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  صلة القرابة
                </label>
                <select
                  value={relation}
                  onChange={e => setRelation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="الأب">الأب</option>
                  <option value="الأم">الأم</option>
                  <option value="الجد">الجد</option>
                  <option value="العم/الخال">العم / الخال</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  رقم هاتف الاتصال <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-left"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  رقم الواتساب
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-left"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              ملاحظات إضافية (اختياري)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="أي ملاحظات صحية أو خاصة..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-600 active:scale-98 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Check className="w-4 h-4" />
              <span>حفظ التعديلات فوراً</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
