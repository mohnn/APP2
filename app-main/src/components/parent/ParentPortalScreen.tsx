import React, { useState } from 'react';
import { 
  LogOut, 
  QrCode, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Wallet, 
  Award, 
  Coffee, 
  FileText,
  User,
  Sparkles,
  Camera
} from 'lucide-react';
import { User as UserType, Child, AttendanceRecord } from '../../types/nursery';
import { NurseryStorageService } from '../../services/storage';
import { ParentQrScanModal } from './ParentQrScanModal';
import { QrCodeSvg } from '../common/QrCodeSvg';
import { formatTime12h } from '../../utils/timeFormat';

interface ParentPortalScreenProps {
  user: UserType;
  child: Child;
  onLogout: () => void;
}

export const ParentPortalScreen: React.FC<ParentPortalScreenProps> = ({
  user,
  child,
  onLogout,
}) => {
  const storage = NurseryStorageService.getInstance();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'fees' | 'daily' | 'evaluations'>('overview');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  if (!child) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans select-none">
        <div className="p-6 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20 max-w-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">لم يتم العثور على ملف الطالب</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            ربما تم حذف الطالب أو تفريغ قاعدة البيانات. يرجى تسجيل الخروج والتسجيل من جديد.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
        >
          العودة لشاشة الدخول
        </button>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = storage.attendance.find(a => a.childId === child.id && a.date === todayStr);

  const fees = storage.monthlyFees.filter(f => f.childId === child.id);
  const dailyReport = storage.dailyReports.find(d => d.childId === child.id);
  const evaluation = storage.evaluations.find(e => e.childId === child.id);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col text-right font-sans select-none">
      {/* Top Parent App Bar */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0"
            style={{ backgroundColor: child.avatarColor }}
          >
            {child.fullName[0]}
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
              {child.fullName}
            </h2>
            <div className="text-[10px] text-slate-500 font-mono">
              معرف الطالب: <span className="font-bold text-blue-600 dark:text-blue-400">{child.studentId}</span> ({child.levelNameAr})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors"
            title="تسجيل الخروج"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* Hero Attendance Action Banner for Parents (النقطة 3: اسكان إثبات الحضور) */}
      <div className="p-4 bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-950 text-white space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            بوابة ولي الأمر · Modern British Kids
          </span>
          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono">
            ID: {child.studentId}
          </span>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-blue-200 block">حالة الحضور اليوم:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {todayAttendance?.status === 'present' ? (
                <span className="text-sm font-bold text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> حاضر ({formatTime12h(todayAttendance.checkInTime) || '08:00 ص'})
                </span>
              ) : todayAttendance?.status === 'late' ? (
                <span className="text-sm font-bold text-amber-300 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> متأخر ({formatTime12h(todayAttendance.checkInTime)})
                </span>
              ) : todayAttendance?.status === 'leave' ? (
                <span className="text-sm font-bold text-blue-300 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> إجازة ({todayAttendance.leaveReason || 'معتمدة'})
                </span>
              ) : (
                <span className="text-sm font-bold text-rose-300 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> غائب (لم يسجل حضور بعد)
                </span>
              )}
            </div>
            <span className="text-[10px] text-blue-200 block mt-1">
              مواعيد الحضور: 07:30 ص إلى 08:30 ص · الانصراف: 02:00 ظهراً
            </span>
          </div>

          {/* QR Scan Button for Parents */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex flex-col items-center justify-center p-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
          >
            <Camera className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">مسح كود الحضور</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-1 text-xs font-bold text-center shrink-0">
        {[
          { id: 'overview', label: 'ملف الطالب' },
          { id: 'attendance', label: 'سجل الحضور' },
          { id: 'evaluations', label: 'التقييم الشامل' },
          { id: 'daily', label: 'المتابعة اليومية' },
          { id: 'fees', label: 'المصروفات' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === t.id
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div className="flex-1 p-4 space-y-3.5 text-xs">
        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Student ID Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-center">
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full inline-block">
                بطاقة الطالب الرسمية
              </span>

              <div className="mx-auto p-2 bg-slate-50 dark:bg-white rounded-2xl inline-block shadow-inner">
                <QrCodeSvg value={child.qrPayload} size={130} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{child.fullName}</h3>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  معرف الطالب: <span className="font-bold text-slate-800 dark:text-slate-200">{child.studentId}</span>
                </div>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                  {child.levelNameAr} ({child.classNameAr})
                </div>
              </div>
            </div>

            {/* Quick Skills Evaluation Preview */}
            {evaluation && (
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs border-b pb-1">
                  تقييم المعلمة للشهر الحالي
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-blue-50/50 dark:bg-blue-950/30 p-2 rounded-xl">
                  {evaluation.overallFeedback}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              سجل الحضور والغياب الأخير
            </span>
            {storage.attendance.filter(a => a.childId === child.id).map(att => (
              <div
                key={att.id}
                className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{att.date}</span>
                  <span className="text-[10px] text-slate-400">
                    {att.status === 'present' ? 'حاضر بالموعد' : att.status === 'late' ? 'حضور متأخر (بعد 8:30)' : att.status === 'leave' ? `إجازة: ${att.leaveReason || ''}` : 'غائب'}
                  </span>
                </div>

                <div className="text-left font-mono text-[11px]">
                  {att.checkInTime && <span className="text-emerald-600 block">دخول: {formatTime12h(att.checkInTime)}</span>}
                  {att.checkOutTime && <span className="text-slate-400 block">خروج: {formatTime12h(att.checkOutTime)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'fees' && (
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
              المصروفات الشهرية (نقداً كاش)
            </span>
            {fees.map(f => (
              <div
                key={f.id}
                className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">شهر {f.month} / {f.year}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    f.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {f.status === 'paid' ? 'مدفوع بالكامل' : 'متبقي مستحق'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div><span>المطلوب:</span> <span className="font-bold">{f.totalRequired} ج.م</span></div>
                  <div><span>المدفوع:</span> <span className="font-bold text-emerald-600">{f.paidAmount} ج.م</span></div>
                  <div><span>المتبقي:</span> <span className="font-bold text-rose-600">{f.remainingAmount} ج.م</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block text-xs border-b pb-1">
              تقرير اليومية الصفي
            </span>
            {dailyReport ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">وجبة الطعام:</span>
                    <span className="font-bold">{dailyReport.foodIntake === 'excellent' ? 'تناول الوجبة كاملة 🥗' : 'جيد'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">فترة النوم:</span>
                    <span className="font-bold">{dailyReport.sleepDuration}</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">المزاج:</span>
                    <span className="font-bold">{dailyReport.mood === 'happy' ? 'سعيد ومرح 😊' : 'هادئ'}</span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">دخول الحمام:</span>
                    <span className="font-bold">{dailyReport.toiletVisits} مرات</span>
                  </div>
                </div>
                {dailyReport.notes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-amber-50/50 dark:bg-amber-950/30 p-2 rounded-xl">
                    {dailyReport.notes}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400">
                لم يتم إدخال تقرير اليوم بعد من قِبل المعلمة
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Comprehensive Evaluation (النقطة 13: وصول تقرير التقييم الكامل لولي الأمر) */}
        {activeTab === 'evaluations' && (
          <div className="space-y-3">
            {evaluation ? (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        تقرير التقييم الشهري المعتمد
                      </h4>
                      <span className="text-[10px] text-slate-400">شهر {evaluation.month} / {evaluation.year}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold px-2 py-0.5 rounded-md">
                    معتمد رسمياً ✅
                  </span>
                </div>

                {/* Evaluation Ratings Grid (جميع مهارات التقييم الثمانية كاملة) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30">
                    <span className="text-[10px] text-slate-500 block">اللغة العربية</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300 font-mono text-sm">{evaluation.arabicLanguage} / 5 ⭐</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-[10px] text-slate-500 block">اللغة الإنجليزية</span>
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 font-mono text-sm">{evaluation.englishLanguage} / 5 ⭐</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/30">
                    <span className="text-[10px] text-slate-500 block">الحساب والرياضيات</span>
                    <span className="font-bold text-purple-700 dark:text-purple-300 font-mono text-sm">{evaluation.numbersMath} / 5 ⭐</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
                    <span className="text-[10px] text-slate-500 block">السلوك الاجتماعي</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-sm">{evaluation.socialSkills} / 5 ⭐</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30">
                    <span className="text-[10px] text-slate-500 block">المهارات الحركية</span>
                    <span className="font-bold text-amber-700 dark:text-amber-300 font-mono text-sm">{evaluation.fineMotorSkills} / 5 ⭐</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/30">
                    <span className="text-[10px] text-slate-500 block">الاعتماد على النفس</span>
                    <span className="font-bold text-teal-700 dark:text-teal-300 font-mono text-sm">{evaluation.independence} / 5 ⭐</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30">
                    <span className="text-[10px] text-slate-500 block">الفنون والأشغال</span>
                    <span className="font-bold text-rose-700 dark:text-rose-300 font-mono text-sm">{evaluation.artAndCreativity} / 5 ⭐</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/30">
                    <span className="text-[10px] text-slate-500 block">القرآن والآداب</span>
                    <span className="font-bold text-cyan-700 dark:text-cyan-300 font-mono text-sm">{evaluation.quranAndEtiquette} / 5 ⭐</span>
                  </div>
                </div>

                {/* Teacher & Management Feedback */}
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1">
                  <span className="font-bold text-[11px] text-blue-950 dark:text-blue-200 block">
                    ملاحظات وتوصيات إدارة الحضانة والمعلمة:
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {evaluation.overallFeedback}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 bg-white dark:bg-slate-900 p-6 rounded-2xl border">
                <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <span className="text-xs font-bold block">لم يتم نشر التقييم الشهري لهذا الشهر بعد</span>
                <span className="text-[10px] text-slate-400">تقوم إدارة الحضانة بنشر التقييم بنهاية كل شهر</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Scanner Modal for Parent (النقطة 3) */}
      <ParentQrScanModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        child={child}
        onAttendanceRecorded={() => setRefreshVersion(v => v + 1)}
      />
    </div>
  );
};
