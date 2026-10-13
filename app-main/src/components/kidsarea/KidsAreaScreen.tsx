import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Timer, 
  UserCheck, 
  History, 
  AlertCircle, 
  DollarSign, 
  Users, 
  Edit3,
  Calendar,
  X,
  Phone
} from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { KidsAreaSession, Child } from '../../types/nursery';
import { formatTime12h, getCurrentTime12h } from '../../utils/timeFormat';

interface KidsAreaScreenProps {
  onBack: () => void;
}

export const KidsAreaScreen: React.FC<KidsAreaScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();
  const [sessions, setSessions] = useState<KidsAreaSession[]>(storage.kidsAreaSessions);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'finance'>('active');
  const [now, setNow] = useState(Date.now());

  // Modal for new session
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [newAllocatedMinutes, setNewAllocatedMinutes] = useState(60);
  const [newFee, setNewFee] = useState(150);
  const [newNotes, setNewNotes] = useState('');

  // Modal for edit time
  const [editingSession, setEditingSession] = useState<KidsAreaSession | null>(null);
  const [newDurationMinutes, setNewDurationMinutes] = useState(60);

  // Toast notification
  const [alertToast, setAlertToast] = useState<string | null>(null);

  // Keep countdown updated every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      // Check if any active session has expired
      const currentSessions = storage.kidsAreaSessions;
      const expiredSession = currentSessions.find(
        s => s.status === 'active' && currentNow >= s.expiryTimestamp
      );

      if (expiredSession) {
        // Automatically complete the expired session (النقطة 7: نقله في خانة اللي جم قبل كده وتدينه رسالة)
        const result = storage.completeKidsAreaSession(expiredSession.id);
        setSessions([...storage.kidsAreaSessions]);
        setAlertToast(result.message);
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [storage]);

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddModalOpen) setIsAddModalOpen(false);
        if (editingSession) setEditingSession(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen, editingSession]);

  const activeSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'active');
  }, [sessions]);

  const completedSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'completed');
  }, [sessions]);

  // Financial Summary specific to Kids Area (النقطة 6)
  const kidsAreaFinance = useMemo(() => {
    const summary = storage.getFinancialSummary('month', 'lvl-kids-area');
    const totalVisits = sessions.length;
    const activeCount = activeSessions.length;
    const completedCount = completedSessions.length;
    const totalFeesCollected = sessions.reduce((sum, s) => sum + (s.fee || 0), 0);

    return {
      ...summary,
      totalVisits,
      activeCount,
      completedCount,
      totalFeesCollected,
    };
  }, [storage, sessions, activeSessions, completedSessions]);

  const handleAddNewSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) {
      alert('يرجى إدخال اسم الطفل');
      return;
    }

    const created = storage.addKidsAreaSession({
      childName: newChildName.trim(),
      studentId: newStudentId.trim() || undefined,
      guardianName: newGuardianName.trim() || 'ولي أمر زائر',
      guardianPhone: newGuardianPhone.trim() || '01000000000',
      allocatedMinutes: Number(newAllocatedMinutes),
      fee: Number(newFee),
      notes: newNotes.trim(),
    });

    setSessions([...storage.kidsAreaSessions]);
    setIsAddModalOpen(false);
    setNewChildName('');
    setNewStudentId('');
    setNewGuardianName('');
    setNewGuardianPhone('');
    setNewNotes('');

    setAlertToast(`تم بدء جلسة الكيدز إريا للطفل (${created.childName}) لمدة ${created.allocatedMinutes} دقيقة.`);
    setTimeout(() => setAlertToast(null), 4000);
  };

  const handleUpdateDuration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    storage.updateKidsAreaDuration(editingSession.id, Number(newDurationMinutes));
    setSessions([...storage.kidsAreaSessions]);
    setAlertToast(`تم تعديل وقت الطفل (${editingSession.childName}) إلى ${newDurationMinutes} دقيقة بنجاح.`);
    setEditingSession(null);
    setTimeout(() => setAlertToast(null), 4000);
  };

  const handleManualComplete = (sessionId: string) => {
    const res = storage.completeKidsAreaSession(sessionId);
    setSessions([...storage.kidsAreaSessions]);
    setAlertToast(res.message);
    setTimeout(() => setAlertToast(null), 5000);
  };

  // Helper function to format remaining time
  const getRemainingTimeDisplay = (expiryTimestamp: number) => {
    const diffMs = expiryTimestamp - now;
    if (diffMs <= 0) return { text: 'انتهى الوقت!', isExpired: true, minutes: 0 };
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return {
      text: `${mins} دقيقة و ${secs} ثانية`,
      isExpired: false,
      minutes: mins,
    };
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right font-sans select-none pb-24">
      {/* Toast Notification (النقطة 7) */}
      {alertToast && (
        <div className="p-3 bg-amber-600 text-white rounded-2xl text-xs font-bold shadow-lg flex items-center justify-between animate-fade-in border border-amber-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-200" />
            <span>{alertToast}</span>
          </div>
          <button onClick={() => setAlertToast(null)} className="p-1 hover:bg-amber-700 rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-1.5">
              <span>ركن الكيدز إريا (Kids Area)</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">مكان واحد</span>
            </h2>
            <span className="text-[10px] text-slate-400">
              إدارة أوقات تواجد الأطفال المؤقتة والملخص المالي المستقل
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>دخول طفل للكيدز إريا</span>
        </button>
      </div>

      {/* 3 Tabs: المتواجدون حالياً، اللي جم قبل كده، الملخص المالي للكيدز إريا */}
      <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-2xl text-xs font-bold text-center">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'active'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          المتواجدون الآن ({activeSessions.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'completed'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          اللي جم قبل كده ({completedSessions.length})
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'finance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          الملخص المالي للكيدز إريا 💰
        </button>
      </div>

      {/* TAB 1: المتواجدون الآن مع الوقت المتبقي وتعديل الوقت (النقطة 7) */}
      {activeTab === 'active' && (
        <div className="space-y-3">
          {activeSessions.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Timer className="w-10 h-10 mx-auto text-amber-500 opacity-60" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                لا يوجد أطفال متواجدون حالياً في الكيدز إريا
              </div>
              <p className="text-[11px] text-slate-400">
                يمكنك الضغط على "دخول طفل للكيدز إريا" لتسجيل وصول طفل وتحديد وقت تواجده.
              </p>
            </div>
          ) : (
            activeSessions.map((session) => {
              const rem = getRemainingTimeDisplay(session.expiryTimestamp);

              return (
                <div
                  key={session.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-amber-400/80 dark:border-amber-500/50 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-base shadow-sm">
                        {session.childName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {session.childName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>معرف: {session.studentId}</span>
                          <span>·</span>
                          <span>دخول: {formatTime12h(session.entryTime)}</span>
                          <span>·</span>
                          <span className="text-emerald-600 font-bold">{session.fee} ج.م</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">الوقت المتبقي:</span>
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-xl inline-block ${
                        rem.minutes <= 10 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        ⏳ {rem.text}
                      </span>
                    </div>
                  </div>

                  {/* Guardian and Session Details */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">ولي الأمر: {session.guardianName}</span>
                      <span className="font-mono text-slate-400">({session.guardianPhone})</span>
                    </div>
                    <div>
                      <span>المدة المحددة: </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{session.allocatedMinutes} دقيقة</span>
                    </div>
                  </div>

                  {/* Action Buttons: تعديل الوقت + إنهاء وخروج يدوي */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSession(session);
                        setNewDurationMinutes(session.allocatedMinutes);
                      }}
                      className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل وقت الطفل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleManualComplete(session.id)}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>تسجيل خروج الآن</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: سجل اللي جم قبل كده (انتهى وقتهم) (النقطة 7) */}
      {activeTab === 'completed' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              سجل الزيارات السابقة للكيدز إريا
            </span>
            <span className="text-[10px] text-slate-400">
              إجمالي المنتهي: {completedSessions.length} طفل
            </span>
          </div>

          {completedSessions.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              لا توجد زيارات سابقة مكتملة حتى الآن.
            </div>
          ) : (
            completedSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-sm">
                    {session.childName[0]}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {session.childName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      معرف: {session.studentId} · ولي الأمر: {session.guardianName}
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono text-[11px]">
                  <span className="text-slate-500 block">دخول: {formatTime12h(session.entryTime)}</span>
                  <span className="text-emerald-600 font-bold block">خروج: {formatTime12h(session.leftAt) || 'مكتمل'}</span>
                  <span className="text-[10px] text-amber-600 font-bold">{session.fee} ج.م ({session.allocatedMinutes} دقيقة)</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: الملخص المالي المستقل للكيدز إريا (النقطة 6) */}
      {activeTab === 'finance' && (
        <div className="space-y-3">
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 text-white shadow-lg space-y-2">
            <span className="text-xs font-bold opacity-90 block">
              الملخص المالي المستقل: ركن الكيدز إريا
            </span>
            <div className="text-3xl font-bold font-mono">
              {kidsAreaFinance.totalIncome.toLocaleString()} <span className="text-sm font-sans font-normal">ج.م</span>
            </div>
            <p className="text-[11px] text-amber-100 leading-relaxed">
              إجمالي إيرادات رسوم دخول الكيدز إريا المحصلة نقدياً خلال الشهر الجاري.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">إجمالي الزيارات</span>
              <span className="font-bold font-mono text-base text-slate-900 dark:text-white">
                {kidsAreaFinance.totalVisits}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">المتواجدون حالياً</span>
              <span className="font-bold font-mono text-base text-amber-600">
                {kidsAreaFinance.activeCount}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">متوسط رسم الدخول</span>
              <span className="font-bold font-mono text-base text-emerald-600">
                150 ج.م
              </span>
            </div>
          </div>

          {/* Detailed breakdown */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
            <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              تفاصيل الإيرادات والمصروفات الخاصة بالكيدز إريا
            </div>

            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>إجمالي المقبوضات النقدية (الكاش):</span>
              <span className="font-mono font-bold text-emerald-600">{kidsAreaFinance.totalIncome.toLocaleString()} ج.م</span>
            </div>

            <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
              <span>المصروفات التشغيلية للألعاب والتعقيم:</span>
              <span className="font-mono font-bold text-rose-500">{kidsAreaFinance.totalExpenses.toLocaleString()} ج.م</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 font-bold">
              <span>صافي ربح ركن الكيدز إريا:</span>
              <span className="font-mono text-base text-amber-600">{kidsAreaFinance.netProfit.toLocaleString()} ج.م</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Child to Kids Area */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in font-sans"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden text-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm font-display">دخول طفل جديد للكيدز إريا</h3>
                <span className="text-[10px] text-amber-200">تحديد وقت التواجد والرسم النقدي</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleAddNewSession} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم الطفل *</label>
                <input
                  type="text"
                  required
                  value={newChildName}
                  onChange={e => setNewChildName(e.target.value)}
                  placeholder="مثال: عمر طارق"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">معرف الطفل (اختياري)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={newStudentId}
                    onChange={e => setNewStudentId(e.target.value)}
                    placeholder="مثال: 108"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-center"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المدة (بالدقائق) *</label>
                  <select
                    value={newAllocatedMinutes}
                    onChange={e => setNewAllocatedMinutes(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-center"
                  >
                    <option value={30}>30 دقيقة</option>
                    <option value={60}>60 دقيقة (ساعة)</option>
                    <option value={90}>90 دقيقة</option>
                    <option value={120}>120 دقيقة (ساعتان)</option>
                    <option value={180}>180 دقيقة (3 ساعات)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">اسم ولي الأمر</label>
                  <input
                    type="text"
                    value={newGuardianName}
                    onChange={e => setNewGuardianName(e.target.value)}
                    placeholder="مثال: أحمد مصطفى"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={newGuardianPhone}
                    onChange={e => setNewGuardianPhone(e.target.value)}
                    placeholder="010..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رسم الدخول (كاش) *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={newFee}
                    onChange={e => setNewFee(Number(e.target.value))}
                    className="w-full p-2 pl-12 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono font-bold"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">ج.م</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">ملاحظات إضافية</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="أي توصيات خاصة بالطفل..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>بدء الجلسة وحفظ الدخول</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Child Time in Kids Area (النقطة 7) */}
      {editingSession && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in font-sans"
          onClick={() => setEditingSession(null)}
        >
          <div 
            className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                تعديل وقت تواجد الطفل ({editingSession.childName})
              </h3>
              <button onClick={() => setEditingSession(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateDuration} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  المدة الإجمالية الجديدة (بالدقائق):
                </label>
                <select
                  value={newDurationMinutes}
                  onChange={e => setNewDurationMinutes(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold font-mono"
                >
                  <option value={30}>30 دقيقة</option>
                  <option value={45}>45 دقيقة</option>
                  <option value={60}>60 دقيقة (ساعة)</option>
                  <option value={90}>90 دقيقة</option>
                  <option value={120}>120 دقيقة (ساعتان)</option>
                  <option value={150}>150 دقيقة</option>
                  <option value={180}>180 دقيقة (3 ساعات)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-all"
              >
                حفظ التعديل الآن
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
