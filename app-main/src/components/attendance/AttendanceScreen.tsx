import React, { useState, useMemo } from 'react';
import { 
  QrCode, 
  CheckCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  Printer,
  ChevronDown,
  X,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { AttendanceStatus } from '../../types/nursery';
import { formatTime12h } from '../../utils/formatters';
import confetti from 'canvas-confetti';

interface AttendanceScreenProps {
  onOpenQrPrintModal: () => void;
  onSelectChild: (childId: string) => void;
}

export const AttendanceScreen: React.FC<AttendanceScreenProps> = ({
  onOpenQrPrintModal,
  onSelectChild,
}) => {
  const [levelFilter, setLevelFilter] = useState<'all' | 'kids_area' | 'kg1'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inlineLeaveChildId, setInlineLeaveChildId] = useState<string | null>(null);
  const [inlineLeaveReason, setInlineLeaveReason] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const storage = NurseryStorageService.getInstance();
  const today = new Date().toISOString().split('T')[0];

  const todayRecords = useMemo(() => {
    return storage.attendance.filter(a => a.date === today);
  }, [storage.attendance, today, refreshVersion]);

  const recordsMap = useMemo(() => {
    const map = new Map<string, typeof todayRecords[0]>();
    todayRecords.forEach(r => map.set(r.childId, r));
    return map;
  }, [todayRecords]);

  // Filtered children by level & search & status (النقطة 7: قسمين للكيدز إريا والكيجي 1)
  const scopedChildren = useMemo(() => {
    let list = storage.children.filter(c => c.status === 'active');
    if (levelFilter === 'kids_area') {
      list = list.filter(c => c.levelId === 'lvl-kids-area' || c.studentId.length === 3);
    } else if (levelFilter === 'kg1') {
      list = list.filter(c => c.levelId === 'lvl-kg1' || c.studentId.length === 4);
    }
    return list;
  }, [storage.children, levelFilter, refreshVersion]);

  // Counts scoped to selected section
  const counts = useMemo(() => {
    const scopedIds = new Set(scopedChildren.map(c => c.id));
    const scopedRecords = todayRecords.filter(r => scopedIds.has(r.childId));
    const present = scopedRecords.filter(r => r.status === 'present').length;
    const late = scopedRecords.filter(r => r.status === 'late').length;
    const absent = scopedRecords.filter(r => r.status === 'absent').length;
    const leave = scopedRecords.filter(r => r.status === 'leave').length;
    return { present, late, absent, leave, total: scopedChildren.length };
  }, [todayRecords, scopedChildren, refreshVersion]);

  // Displayed children with search & status filters
  const displayedChildren = useMemo(() => {
    let list = scopedChildren;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(c => 
        c.fullName.toLowerCase().includes(q) || 
        c.studentId.includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter(c => {
        const rec = recordsMap.get(c.id);
        const st = rec ? rec.status : 'absent';
        return st === statusFilter;
      });
    }

    return list;
  }, [scopedChildren, searchQuery, statusFilter, recordsMap, refreshVersion]);

  // Handle Mark All Present (النقطة 9: تشغيل زر حضور الكل مع تحديث الحالة فورياً)
  const handleMarkAllPresent = () => {
    storage.markAllPresent();
    setRefreshVersion(v => v + 1);

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
      });
    } catch (e) {}

    setFeedbackToast('تم تسجيل حضور جميع الطلاب المسجلين بالحضانة بنجاح! ✅ (موعد الانصراف 02:00 ظهراً)');
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Handle Status Update (حاضر / متأخر / غائب / إجازة)
  const handleUpdateStatus = (childId: string, status: AttendanceStatus) => {
    if (status === 'leave') {
      // فتح خانة سبب الإجازة مباشرة تحت الطفل (النقطة 6 و 11)
      if (inlineLeaveChildId === childId) {
        setInlineLeaveChildId(null);
      } else {
        setInlineLeaveChildId(childId);
        setInlineLeaveReason('');
      }
    } else {
      setInlineLeaveChildId(null);
      storage.updateAttendanceStatus(childId, status);
      setRefreshVersion(v => v + 1);
    }
  };

  // تأكيد سبب الإجازة ونقل الطفل من الغائبين إلى الإجازات (النقطة 11)
  const handleConfirmLeaveReason = (childId: string) => {
    if (!inlineLeaveReason.trim()) {
      alert('يرجى كتابة سبب الإجازة (مثال: عذر مرضي، سفر عائلي)');
      return;
    }

    const child = storage.children.find(c => c.id === childId);
    storage.markLeaveWithReason(childId, inlineLeaveReason.trim());
    setInlineLeaveChildId(null);
    setInlineLeaveReason('');
    setRefreshVersion(v => v + 1);

    setFeedbackToast(`تم تسجيل إجازة الطالب (${child?.fullName.split(' ')[0]}) بنجاح ونقله من الغائبين إلى الإجازات المعتمدة.`);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right font-sans select-none pb-24">
      {/* Feedback Toast Banner */}
      {feedbackToast && (
        <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner with Today's Date & QR Code Poster Launcher */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-display">
                سجل الحضور اليومي: {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>
              <span className="text-[10px] text-slate-400">
                تسجيل الحضور: 07:30 ص إلى 08:30 ص · الانصراف: 02:00 ظهراً
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: QR Code Poster (PDF) + Mark All Present (النقطة 3 و 9) */}
        <div className="grid grid-cols-2 gap-2">
          {/* تنزيل وطباعة بوستر QR للحضور (بدل تشغيل الكاميرا) */}
          <button
            onClick={onOpenQrPrintModal}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-900/10 active:scale-98 transition-all"
          >
            <QrCode className="w-4 h-4 text-amber-300" />
            <span>تنزيل بوستر QR (PDF)</span>
          </button>

          {/* زر حضور الكل */}
          <button
            onClick={handleMarkAllPresent}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs shadow-md shadow-emerald-900/10 transition-all"
          >
            <CheckCheck className="w-4 h-4 text-white" />
            <span>حضور الكل الآن</span>
          </button>
        </div>
      </div>

      {/* 2 Primary Level Sections (النقطة 7: قسم للكيدز إريا وقسم للكيجي 1) */}
      <div className="bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center text-xs font-bold">
        <button
          onClick={() => setLevelFilter('all')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            levelFilter === 'all'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          الكل ({storage.children.length})
        </button>

        <button
          onClick={() => setLevelFilter('kids_area')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            levelFilter === 'kids_area'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-500'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>قسم الكيدز إريا</span>
        </button>

        <button
          onClick={() => setLevelFilter('kg1')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            levelFilter === 'kg1'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-blue-500'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>قسم كيجي 1</span>
        </button>
      </div>

      {/* 4 Interactive Filter Cards (حاضرون، متأخرون، غائبون، إجازات) */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <button
          onClick={() => setStatusFilter(statusFilter === 'present' ? 'all' : 'present')}
          className={`p-2.5 rounded-2xl border transition-all ${
            statusFilter === 'present'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className="text-lg font-bold font-mono">{counts.present}</div>
          <div className="text-[10px] font-medium opacity-90">حاضرون</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'late' ? 'all' : 'late')}
          className={`p-2.5 rounded-2xl border transition-all ${
            statusFilter === 'late'
              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-amber-400'
          }`}
        >
          <div className="text-lg font-bold font-mono">{counts.late}</div>
          <div className="text-[10px] font-medium opacity-90">متأخرون</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
          className={`p-2.5 rounded-2xl border transition-all ${
            statusFilter === 'absent'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-rose-400'
          }`}
        >
          <div className="text-lg font-bold font-mono">{counts.absent}</div>
          <div className="text-[10px] font-medium opacity-90">غائبون</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'leave' ? 'all' : 'leave')}
          className={`p-2.5 rounded-2xl border transition-all ${
            statusFilter === 'leave'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-blue-400'
          }`}
        >
          <div className="text-lg font-bold font-mono">{counts.leave}</div>
          <div className="text-[10px] font-medium opacity-90">إجازات</div>
        </button>
      </div>

      {/* Point 8: Show Total Registered Students instead of Class Dropdown */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">
              عدد الطلاب المسجلين في الحضانة: <span className="font-mono text-blue-600 font-bold">{storage.children.length} طالباً</span>
            </span>
            <span className="text-[10px] text-slate-400">
              الكيدز إريا (3 أرقام) · كيجي 1 (4 أرقام)
            </span>
          </div>
        </div>

        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">
          سجل نشط
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="ابحث بالاسم أو معرف الطالب (ID)..."
          className="w-full pr-9 pl-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Children Attendance Rows */}
      <div className="space-y-2 pb-6">
        {displayedChildren.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-2">
            <Users className="w-10 h-10 mx-auto text-blue-500 opacity-50" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">لا يوجد طلاب مسجلون في هذا القسم حالياً</h4>
            <p className="text-[11px] text-slate-400">سجل الطلاب من شاشة "الأطفال" لتظهر أسماؤهم تلقائياً في سجل الحضور اليومي.</p>
          </div>
        ) : (
          displayedChildren.map((child) => {
          const rec = recordsMap.get(child.id);
          const currentStatus: AttendanceStatus = rec ? rec.status : 'absent';
          const checkInTime = rec?.checkInTime;
          const checkOutTime = rec?.checkOutTime || '14:00';
          const leaveReason = rec?.leaveReason;
          const isInlineLeaveOpen = inlineLeaveChildId === child.id;

          return (
            <div
              key={child.id}
              className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col gap-2.5 transition-all"
            >
              <div className="flex items-center justify-between">
                {/* Child Info */}
                <div 
                  onClick={() => onSelectChild(child.id)}
                  className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden shadow-xs"
                    style={{ backgroundColor: child.avatarColor }}
                  >
                    {child.avatarUrl ? (
                      <img src={child.avatarUrl} alt={child.fullName} className="w-full h-full object-cover" />
                    ) : (
                      child.fullName[0]
                    )}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">
                      {child.fullName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      معرف ID: <span className="font-bold text-blue-600 dark:text-blue-400">{child.studentId}</span> ({child.levelNameAr})
                      {checkInTime ? ` · دخول: ${formatTime12h(checkInTime)}` : ' · لم يسجل دخول'}
                      {currentStatus === 'present' || currentStatus === 'late' ? ` · انصراف: ${formatTime12h(checkOutTime || '02:00 م')}` : ''}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                {leaveReason && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                    سبب: {leaveReason}
                  </span>
                )}
              </div>

              {/* Status Segmented Buttons (حاضر / متأخر / غائب / إجازة) */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/70 dark:bg-slate-800/80 rounded-xl text-center text-xs">
                {(['present', 'late', 'absent', 'leave'] as const).map((st) => {
                  const isCur = currentStatus === st;
                  const labels = {
                    present: 'حاضر',
                    late: 'متأخر',
                    absent: 'غائب',
                    leave: 'إجازة'
                  };

                  const activeStyles = {
                    present: 'bg-emerald-600 text-white shadow-xs font-bold',
                    late: 'bg-amber-500 text-slate-950 font-bold shadow-xs',
                    absent: 'bg-rose-600 text-white shadow-xs font-bold',
                    leave: 'bg-blue-600 text-white shadow-xs font-bold',
                  };

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(child.id, st)}
                      className={`py-1.5 rounded-lg text-[11px] transition-all ${
                        isCur
                          ? activeStyles[st]
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {labels[st]}
                    </button>
                  );
                })}
              </div>

              {/* Inline Leave Reason Input (النقطة 6 و 11: عند الضغط على إجازة تظهر خانة سبب الإجازة تحته مباشرة ونقله من الغائبين) */}
              {isInlineLeaveOpen && (
                <div className="mt-1 p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2 animate-fade-in text-right">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-blue-950 dark:text-blue-200">
                      اكتب سبب إجازة الطفل (ونقله فورياً من الغائبين):
                    </label>
                    <button 
                      onClick={() => setInlineLeaveChildId(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={inlineLeaveReason}
                      onChange={e => setInlineLeaveReason(e.target.value)}
                      placeholder="مثال: عذر مرضي / سفر عائلي / راحة في المنزل"
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConfirmLeaveReason(child.id);
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => handleConfirmLeaveReason(child.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 shrink-0"
                    >
                      تأكيد ونقل للإجازات
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
        )}
      </div>
    </div>
  );
};
