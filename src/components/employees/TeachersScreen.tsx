import React, { useState } from 'react';
import { ArrowRight, UserPlus, Pencil, KeyRound, Trash2, Copy, CheckCircle2, School, ShieldCheck } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { Teacher } from '../../types/nursery';
import { PasswordInput } from '../common/PasswordInput';
import { askConfirm } from '../../utils/confirmDialog';
import { notify } from '../../utils/notify';

interface TeachersScreenProps {
  onBack: () => void;
}

interface FormState {
  fullName: string;
  subject: string;
  username: string;
  password: string;
  phone: string;
  classIds: string[];
}
const EMPTY: FormState = { fullName: '', subject: '', username: '', password: '', phone: '', classIds: [] };

/** حسابات المعلمين: الإدارة وحدها تنشئها وتديرها (لا يوجد تسجيل ذاتي) */
export const TeachersScreen: React.FC<TeachersScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();
  const [, setVersion] = useState(0);
  const refresh = () => setVersion(v => v + 1);

  const [modal, setModal] = useState<'add' | 'edit' | 'password' | null>(null);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ name: string; username: string; password: string } | null>(null);

  const classes = storage.classes;
  const className = (id: string) => classes.find(c => c.id === id)?.name || '—';

  const openAdd = () => {
    setForm(EMPTY);
    setError('');
    setEditing(null);
    setModal('add');
  };
  const openEdit = (t: Teacher) => {
    setEditing(t);
    setForm({ fullName: t.fullName, subject: t.subject, username: t.username, password: '', phone: t.phone || '', classIds: t.classIds });
    setError('');
    setModal('edit');
  };
  const openPassword = (t: Teacher) => {
    setEditing(t);
    setForm({ ...EMPTY, password: '' });
    setError('');
    setModal('password');
  };
  const close = () => {
    setModal(null);
    setEditing(null);
    setError('');
  };
  const toggleClass = (id: string) =>
    setForm(f => ({ ...f, classIds: f.classIds.includes(id) ? f.classIds.filter(x => x !== id) : [...f.classIds, id] }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modal === 'add') {
      const res = storage.addTeacher(form);
      if (!res.success) return setError(res.message);
      setCreated({ name: form.fullName.trim(), username: form.username.trim(), password: form.password });
      close();
    } else if (modal === 'edit' && editing) {
      const res = storage.updateTeacher(editing.id, { fullName: form.fullName, subject: form.subject, classIds: form.classIds, phone: form.phone });
      if (!res.success) return setError(res.message);
      close();
    } else if (modal === 'password' && editing) {
      const res = storage.resetTeacherPassword(editing.id, form.password);
      if (!res.success) return setError(res.message);
      setCreated({ name: editing.fullName, username: editing.username, password: form.password });
      close();
    }
    refresh();
  };

  const handleDelete = async (t: Teacher) => {
    const ok = await askConfirm({
      title: 'حذف حساب المعلم',
      message: `هل تريد حذف حساب المعلم (${t.fullName}) نهائياً؟ لن يستطيع الدخول بعد ذلك.`,
      confirmText: 'حذف الحساب',
      danger: true,
    });
    if (ok) {
      storage.deleteTeacher(t.id);
      refresh();
    }
  };

  const copyCreds = async () => {
    if (!created) return;
    const text = `حساب المعلم في Modern British Kids\nالاسم: ${created.name}\nاسم المستخدم: ${created.username}\nكلمة المرور: ${created.password}\nيدخل من زر "تسجيل دخول المعلمين" في شاشة الدخول.`;
    try {
      await navigator.clipboard.writeText(text);
      notify('تم نسخ بيانات الدخول ✅', 'success');
    } catch {
      notify('تعذر النسخ. اكتب البيانات يدوياً للمعلم.', 'error');
    }
  };

  const inputCls = 'w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl';

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">حسابات المعلمين</h2>
            <span className="text-[10px] text-slate-400">تنشئها الإدارة فقط، والمعلم يدخل من زر "تسجيل دخول المعلمين"</span>
          </div>
        </div>
        <button onClick={openAdd} className="px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0">
          <UserPlus className="w-4 h-4" />
          <span>إنشاء حساب معلم</span>
        </button>
      </div>

      {/* List */}
      {storage.teachers.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          لا توجد حسابات معلمين بعد. اضغط "إنشاء حساب معلم" لإضافة أول معلم.
        </div>
      ) : (
        <div className="space-y-2.5">
          {storage.teachers.map(t => (
            <div key={t.id} className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{t.fullName}</div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">مدرس/ة {t.subject}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${t.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                  {t.active ? 'نشط' : 'موقوف'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-200">@{t.username}</span>
                {t.classIds.map(id => (
                  <span key={id} className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1">
                    <School className="w-3 h-3" /> {className(id)}
                  </span>
                ))}
                {t.phone && <span className="text-slate-400 font-mono">{t.phone}</span>}
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-[11px] font-bold">
                <button onClick={() => openEdit(t)} className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> تعديل
                </button>
                <button onClick={() => openPassword(t)} className="py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1 transition-colors">
                  <KeyRound className="w-3.5 h-3.5" /> كلمة السر
                </button>
                <button
                  onClick={() => {
                    storage.updateTeacher(t.id, { active: !t.active });
                    refresh();
                  }}
                  className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> {t.active ? 'إيقاف' : 'تفعيل'}
                </button>
                <button onClick={() => handleDelete(t)} className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 flex items-center justify-center gap-1 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit / Password modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-3" onClick={close}>
          <form
            onSubmit={submit}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              {modal === 'add' ? 'إنشاء حساب معلم جديد' : modal === 'edit' ? `تعديل بيانات: ${editing?.fullName}` : `كلمة مرور جديدة للمعلم: ${editing?.fullName}`}
            </h3>

            {modal !== 'password' && (
              <>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم المعلم</label>
                  <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="الاسم الكامل" className={inputCls} />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المادة التي يدرّسها</label>
                  <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="مثال: لغة عربية" className={inputCls} />
                </div>
              </>
            )}

            {modal === 'add' && (
              <>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم المستخدم (إنجليزي بدون مسافات)</label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="مثال: ms.sara"
                    autoCapitalize="none"
                    spellCheck={false}
                    className={`${inputCls} font-mono text-left`}
                  />
                </div>
              </>
            )}

            {(modal === 'add' || modal === 'password') && (
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">كلمة المرور (6 خانات على الأقل)</label>
                <PasswordInput value={form.password} onChange={v => setForm({ ...form, password: v })} placeholder="كلمة المرور" />
              </div>
            )}

            {modal !== 'password' && (
              <>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الفصول المسندة للمعلم</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {classes.map(c => (
                      <label key={c.id} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${form.classIds.includes(c.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-700'}`}>
                        <input type="checkbox" checked={form.classIds.includes(c.id)} onChange={() => toggleClass(c.id)} />
                        <span className="font-bold">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رقم الهاتف (اختياري)</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" className={`${inputCls} font-mono text-left`} />
                </div>
              </>
            )}

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-[11px] font-bold text-rose-700 dark:text-rose-300">⚠️ {error}</div>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={close} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">
                إلغاء
              </button>
              <button type="submit" className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-bold">
                {modal === 'add' ? 'إنشاء الحساب' : 'حفظ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Credentials card after create / password change */}
      {created && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3" onClick={() => setCreated(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" /> تم حفظ بيانات الدخول
            </div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              سلّم هذه البيانات للمعلم/ة <b>{created.name}</b>. لن تُعرض كلمة المرور مرة أخرى (تُحفظ مشفّرة).
            </p>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1.5 font-mono text-left" dir="ltr">
              <div><span className="text-slate-400">username:</span> <b>{created.username}</b></div>
              <div><span className="text-slate-400">password:</span> <b>{created.password}</b></div>
            </div>
            <p className="text-[10px] text-slate-400">يدخل المعلم من زر "تسجيل دخول المعلمين" في شاشة الدخول على موبايله.</p>
            <div className="flex gap-2">
              <button onClick={copyCreds} className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-1.5">
                <Copy className="w-4 h-4" /> نسخ البيانات
              </button>
              <button onClick={() => setCreated(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">
                تم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
