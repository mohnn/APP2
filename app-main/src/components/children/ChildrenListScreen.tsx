import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Baby, 
  Wallet, 
  ChevronLeft,
  Camera,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Child, ChildStatus } from '../../types/nursery';
import { NurseryStorageService } from '../../services/storage';
import { EditChildModal } from './EditChildModal';

interface ChildrenListScreenProps {
  onSelectChild: (childId: string) => void;
  onOpenAddChild: () => void;
  onOpenCollectForChild: (childId: string) => void;
}

export function calculateAgeAr(birthDateStr: string): string {
  try {
    const birth = new Date(birthDateStr);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years === 0) {
      return `${months} أشهر`;
    }
    if (months === 0) {
      return `${years} سنوات`;
    }
    return `${years} سنوات و ${months} أشهر`;
  } catch {
    return 'غير محدد';
  }
}

export const ChildrenListScreen: React.FC<ChildrenListScreenProps> = ({
  onSelectChild,
  onOpenAddChild,
  onOpenCollectForChild,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'lvl-kids-area' | 'lvl-kg1'>('all');
  const [photoUpdateVersion, setPhotoUpdateVersion] = useState(0);
  const [activeChildForPhoto, setActiveChildForPhoto] = useState<string | null>(null);
  const [childToEdit, setChildToEdit] = useState<Child | null>(null);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  const [deleteNotification, setDeleteNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const storage = NurseryStorageService.getInstance();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeChildForPhoto) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        storage.updateChildPhoto(activeChildForPhoto, dataUrl);
        setPhotoUpdateVersion(v => v + 1);
        setActiveChildForPhoto(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredChildren = useMemo(() => {
    let list = storage.children;

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(c => 
        c.fullName.toLowerCase().includes(q) || 
        c.studentId.includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    }

    if (selectedLevel !== 'all') {
      list = list.filter(c => c.levelId === selectedLevel);
    }

    return list;
  }, [storage.children, searchTerm, selectedLevel, photoUpdateVersion]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3 font-sans text-right select-none pb-24">
      {/* Hidden file input for photo change */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handlePhotoUpload}
      />

      {/* Delete Feedback Notification */}
      {deleteNotification && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-fade-in shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{deleteNotification}</span>
        </div>
      )}

      {/* Top Search + Add Button */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم أو معرف الطالب (ID)..."
            className="w-full pr-9 pl-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={onOpenAddChild}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة طالب</span>
        </button>
      </div>

      {/* 2 Levels Filter Tabs (النقطة 2: المستويين فقط) */}
      <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-2xl text-xs font-bold text-center">
        <button
          onClick={() => setSelectedLevel('all')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            selectedLevel === 'all'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          جميع الطلاب ({storage.children.length})
        </button>

        <button
          onClick={() => setSelectedLevel('lvl-kids-area')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            selectedLevel === 'lvl-kids-area'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          الكيدز إريا (3 أرقام)
        </button>

        <button
          onClick={() => setSelectedLevel('lvl-kg1')}
          className={`flex-1 py-1.5 rounded-xl transition-all ${
            selectedLevel === 'lvl-kg1'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          كيجي 1 (4 أرقام)
        </button>
      </div>

      {/* Children List */}
      <div className="space-y-2.5 pb-4">
        {filteredChildren.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <Baby className="w-12 h-12 mx-auto text-blue-500 opacity-60" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">لا يوجد طلاب مسجلون حالياً</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              قاعدة البيانات مفرغة ونظيفة بالكامل. اضغط أدناه لإضافة أول طالب في الحضانة.
            </p>
            <button
              type="button"
              onClick={onOpenAddChild}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md active:scale-98 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة طالب جديد الآن</span>
            </button>
          </div>
        ) : (
          filteredChildren.map((child) => {
            const age = calculateAgeAr(child.birthDate);

            return (
              <div
                key={child.id}
                onClick={() => onSelectChild(child.id)}
                className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-xs shrink-0 overflow-hidden"
                    style={{ backgroundColor: child.avatarColor }}
                  >
                    {child.avatarUrl ? (
                      <img src={child.avatarUrl} alt={child.fullName} className="w-full h-full object-cover" />
                    ) : (
                      child.fullName[0]
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {child.fullName}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/40 px-1 py-0.2 rounded">
                        ID: {child.studentId}
                      </span>
                      <span>·</span>
                      <span>{child.levelNameAr}</span>
                      <span>·</span>
                      <span>{age}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setChildToEdit(child)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                    title="تعديل بيانات الطفل"
                  >
                    <Edit3 className="w-4 h-4 text-blue-600" />
                  </button>

                  <button
                    onClick={() => {
                      setActiveChildForPhoto(child.id);
                      fileInputRef.current?.click();
                    }}
                    className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 transition-colors"
                    title="تغيير صورة الطفل"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenCollectForChild(child.id)}
                    className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 transition-colors"
                    title="تحصيل كاش"
                  >
                    <Wallet className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setChildToDelete(child)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 transition-colors cursor-pointer"
                    title="حذف الطالب نهائياً من الحضانة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectChild(child.id)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Child Modal */}
      {childToEdit && (
        <EditChildModal
          isOpen={Boolean(childToEdit)}
          onClose={() => setChildToEdit(null)}
          child={childToEdit}
          onChildUpdated={() => {
            setPhotoUpdateVersion(v => v + 1);
            setChildToEdit(null);
          }}
        />
      )}

      {/* Delete Confirmation In-App Modal */}
      {childToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-rose-200 dark:border-rose-900/50 space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/70 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تأكيد حذف الطالب نهائياً
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                هل أنت متأكد من حذف ملف الطالب <span className="font-bold text-rose-600 dark:text-rose-400">{childToDelete.fullName}</span> (معرف ID: <span className="font-mono font-bold">{childToDelete.studentId}</span>)؟
              </p>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 text-right leading-relaxed space-y-1">
                <div>• سيتم حذف ملف الطالب وكافة سجلات الحضور والتقييمات والرسوم.</div>
                <div>• سيتم إلغاء حساب ولي الأمر المرتبط به نهائياً ومنعه من الدخول.</div>
                <div>• لن يتمكن ولي الأمر من التسجيل مجدداً طالما الطالب غير موجود بالنظام.</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const res = storage.deleteChild(childToDelete.id);
                  setChildToDelete(null);
                  setPhotoUpdateVersion(v => v + 1);
                  setDeleteNotification(res.message);
                  setTimeout(() => setDeleteNotification(null), 4000);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف نهائي</span>
              </button>
              <button
                type="button"
                onClick={() => setChildToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
