import React, { useState, useRef } from 'react';
import { 
  ArrowRight, 
  Phone, 
  MessageCircle, 
  Calendar, 
  Wallet, 
  Clock, 
  Award, 
  QrCode, 
  CheckCircle2,
  Camera,
  Upload,
  Image as ImageIcon,
  Edit3,
  Trash2
} from 'lucide-react';
import { Child, ChildMonthlyFee, DailyReport, EvaluationRecord, Guardian, PickupPerson } from '../../types/nursery';
import { NurseryStorageService } from '../../services/storage';
import { calculateAgeAr } from './ChildrenListScreen';
import { QrCodeSvg } from '../common/QrCodeSvg';
import { EditChildModal } from './EditChildModal';
import { formatTime12h } from '../../utils/timeFormat';

interface ChildProfileScreenProps {
  childId: string;
  onBack: () => void;
  onOpenCollect: (childId: string) => void;
}

type ProfileTab = 
  | 'info' 
  | 'guardian' 
  | 'attendance' 
  | 'fees' 
  | 'daily_reports' 
  | 'evaluations';

export const ChildProfileScreen: React.FC<ChildProfileScreenProps> = ({
  childId,
  onBack,
  onOpenCollect,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('info');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showChangePhotoModal, setShowChangePhotoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const storage = NurseryStorageService.getInstance();
  const child = storage.children.find(c => c.id === childId);

  if (!child) {
    return (
      <div className="flex-1 p-6 text-center text-slate-500">
        الطفل غير موجود
        <button onClick={onBack} className="block mx-auto mt-4 text-blue-600 font-bold">
          العودة للقائمة
        </button>
      </div>
    );
  }

  const guardian = storage.guardians.find(g => g.id === child.guardianId);
  const pickupPersons = storage.pickupPersons.filter(p => p.childId === child.id);
  
  // Attendance history
  const attendanceHistory = storage.attendance
    .filter(a => a.childId === child.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Child monthly fees
  const childFees = storage.monthlyFees
    .filter(f => f.childId === child.id)
    .sort((a, b) => b.month - a.month);

  // Child receipts
  const childReceipts = storage.receipts
    .filter(r => r.childId === child.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Daily reports
  const dailyReports = storage.dailyReports
    .filter(d => d.childId === child.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // Evaluations
  const evaluations = storage.evaluations
    .filter(e => e.childId === child.id)
    .sort((a, b) => b.month - a.month);

  // Handle Photo Change (النقطة 13: خيار لتغيير صورة الطفل)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        storage.updateChildPhoto(child.id, dataUrl);
        setPhotoVersion(v => v + 1);
        setShowChangePhotoModal(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPresetAvatar = (url: string) => {
    storage.updateChildPhoto(child.id, url);
    setPhotoVersion(v => v + 1);
    setShowChangePhotoModal(false);
  };

  const handleDeleteChild = () => {
    setShowDeleteModal(true);
  };

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'info', label: 'البيانات' },
    { id: 'guardian', label: 'ولي الأمر والمفوضين' },
    { id: 'fees', label: 'المصروفات النقدية' },
    { id: 'attendance', label: 'سجل الحضور' },
    { id: 'daily_reports', label: 'المتابعة اليومية' },
    { id: 'evaluations', label: 'التقييمات' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 flex flex-col font-sans select-none">
      {/* Top Profile Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDeleteChild}
              className="p-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 transition-colors border border-rose-200 dark:border-rose-900/40"
              title="حذف ملف الطالب نهائياً من الحضانة"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف</span>
            </button>

            <button
              onClick={() => setShowEditModal(true)}
              className="p-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
              title="تعديل بيانات الطفل"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>تعديل</span>
            </button>

            <button
              onClick={() => setShowQrModal(true)}
              className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-800/40"
              title="عرض كود QR المخصص للطالب"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>كارت QR</span>
            </button>

            <button
              onClick={() => onOpenCollect(child.id)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>تحصيل كاش</span>
            </button>
          </div>
        </div>

        {/* Profile Identity Bar */}
        <div className="flex items-center gap-3.5 text-right">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center text-white text-2xl font-bold shadow-md ring-4 ring-slate-100 dark:ring-slate-800 overflow-hidden"
              style={{ backgroundColor: child.avatarColor }}
            >
              {child.avatarUrl ? (
                <img src={child.avatarUrl} alt={child.fullName} className="w-full h-full object-cover" />
              ) : (
                child.fullName[0]
              )}
            </div>

            {/* Change photo button (النقطة 13) */}
            <button
              onClick={() => setShowChangePhotoModal(true)}
              className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md transition-colors"
              title="تغيير صورة الطالب"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {child.fullName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.2 rounded">
                معرف: {child.studentId}
              </span>
              <span>·</span>
              <span>{calculateAgeAr(child.birthDate)}</span>
              <span>·</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {child.levelNameAr}
              </span>
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                activeTab === tab.id
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 p-3.5 space-y-3">
        {/* TAB 1: General Info */}
        {activeTab === 'info' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5 text-right text-xs">
              <div className="text-[11px] font-bold text-slate-400 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1">
                البيانات الأساسية ومعرف الطالب (ID)
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">معرف الطالب (ID):</span>
                  <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-300">{child.studentId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">المرحلة التعليمية:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{child.levelNameAr}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">تاريخ الميلاد:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{child.birthDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">المصروف الشهري الأساسي:</span>
                  <span className="font-semibold text-emerald-600 font-mono">{child.monthlyFee} ج.م (كاش)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">العنوان:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{child.address || 'القاهرة الجديدة'}</span>
              </div>

              {child.allergies && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300">
                  <span className="font-bold block text-[11px]">ملاحظات الحساسية:</span>
                  <span>{child.allergies}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Guardian & Pickup */}
        {activeTab === 'guardian' && (
          <div className="space-y-3 text-right">
            {guardian && (
              <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="text-[11px] font-bold text-slate-400">ولي الأمر الأساسي</span>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                    {guardian.relation}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {guardian.fullName}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {guardian.job || 'المهنة غير مسجلة'} · {guardian.address}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={`tel:${guardian.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال ({guardian.phone})</span>
                  </a>

                  <a
                    href={`https://wa.me/2${guardian.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Fees & Cash Payments */}
        {activeTab === 'fees' && (
          <div className="space-y-3 text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                سجل المصروفات (سداد نقدي كاش 💵)
              </span>
              <button
                onClick={() => onOpenCollect(child.id)}
                className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
              >
                + تحصيل كاش
              </button>
            </div>

            <div className="space-y-2">
              {childFees.map((fee) => (
                <div
                  key={fee.id}
                  className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      شهر {fee.month} / {fee.year}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        fee.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {fee.status === 'paid' ? 'مدفوع نقداً' : 'متبقي'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center pt-1 border-t">
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">المطلوب</span>
                      <span className="font-bold font-mono">{fee.totalRequired} ج.م</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30">
                      <span className="text-[10px] text-emerald-600 block">المدفوع</span>
                      <span className="font-bold font-mono text-emerald-700">{fee.paidAmount} ج.م</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30">
                      <span className="text-[10px] text-rose-600 block">المتبقي</span>
                      <span className="font-bold font-mono text-rose-700">{fee.remainingAmount} ج.م</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Attendance History */}
        {activeTab === 'attendance' && (
          <div className="space-y-2 text-right">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 block">
              سجل الحضور والانصراف (موعد الانصراف 02:00 ظهراً)
            </span>
            {attendanceHistory.map((att) => (
              <div
                key={att.id}
                className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold block text-slate-900 dark:text-white">{att.date}</span>
                  <span className="text-[10px] text-slate-400">
                    الحالة: {att.status === 'present' ? 'حاضر' : att.status === 'late' ? 'متأخر (بعد 8:30)' : att.status === 'leave' ? `إجازة (${att.leaveReason || ''})` : 'غائب'}
                  </span>
                </div>
                <div className="text-left font-mono text-[11px]">
                  {att.checkInTime && <span className="text-emerald-600 block">دخول: {formatTime12h(att.checkInTime)}</span>}
                  {att.checkOutTime && <span className="text-slate-500 block">خروج: {formatTime12h(att.checkOutTime)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: Daily Reports */}
        {activeTab === 'daily_reports' && (
          <div className="space-y-2 text-right">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 block">
              المتابعة اليومية للطفل
            </span>
            {dailyReports.map((dr) => (
              <div
                key={dr.id}
                className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2"
              >
                <div className="flex justify-between border-b pb-1.5">
                  <span className="font-bold">{dr.date}</span>
                  <span className="text-emerald-600 font-bold">تقرير معتمد</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-400 block">الوجبة</span>
                    <span className="font-bold">{dr.foodIntake === 'excellent' ? 'كاملة' : 'جيد'}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-400 block">النوم</span>
                    <span className="font-bold">{dr.sleepDuration}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-400 block">المزاج</span>
                    <span className="font-bold">{dr.mood === 'happy' ? 'سعيد' : 'هادئ'}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-400 block">الحمام</span>
                    <span className="font-bold">{dr.toiletVisits} مرات</span>
                  </div>
                </div>
                {dr.notes && (
                  <p className="text-[11px] bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-slate-600 dark:text-slate-300">
                    {dr.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: Evaluations */}
        {activeTab === 'evaluations' && (
          <div className="space-y-2 text-right">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 block">
              تقييم المهارات الأكاديمية والتربوية
            </span>
            {evaluations.map((ev) => (
              <div
                key={ev.id}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-2"
              >
                <div className="flex justify-between border-b pb-1.5">
                  <span className="font-bold">شهر {ev.month} / {ev.year}</span>
                  <span className="text-blue-600 font-bold">تقييم متميز</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-950/30 p-2 rounded-xl">
                  {ev.overallFeedback}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Photo Modal (النقطة 8 و 13: خيار تغيير أو حذف صورة الطفل) */}
      {showChangePhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowChangePhotoModal(false)}
        >
          <div 
            className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-5 text-center shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              الصورة الشخصية للطفل
            </h3>
            <p className="text-xs text-slate-500">
              يمكنك رفع صورة جديدة من جهازك أو حذف الصورة الحالية
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>اختيار صورة جديدة من الجهاز</span>
            </button>

            {/* Delete photo option (النقطة 8: خيار حذف الصورة) */}
            {child.avatarUrl && (
              <button
                type="button"
                onClick={() => {
                  storage.deleteChildPhoto(child.id);
                  setPhotoVersion(v => v + 1);
                  setShowChangePhotoModal(false);
                }}
                className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-rose-200 dark:border-rose-900/40 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>حذف الصورة الحالية</span>
              </button>
            )}

            <button
              onClick={() => setShowChangePhotoModal(false)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Edit Child Data Modal (النقطة 9: تعديل بيانات الطفل بعد التسجيل) */}
      <EditChildModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        child={child}
        onChildUpdated={() => {
          setPhotoVersion(v => v + 1);
        }}
      />

      {/* Child QR Code Badge Modal */}
      {showQrModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-5 text-center shadow-2xl border"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {child.fullName}
            </h3>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold block mb-4">
              معرف الطالب: {child.studentId}
            </span>

            <div className="bg-slate-50 dark:bg-white p-3 rounded-2xl inline-block shadow-inner mb-3">
              <QrCodeSvg value={child.qrPayload} size={160} />
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-rose-200 dark:border-rose-900/50 space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/70 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تأكيد حذف ملف الطالب نهائياً
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                هل أنت متأكد من حذف ملف الطالب <span className="font-bold text-rose-600 dark:text-rose-400">{child.fullName}</span> (معرف ID: <span className="font-mono font-bold">{child.studentId}</span>) نهائياً من الحضانة؟
              </p>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 text-right leading-relaxed space-y-1">
                <div>• سيتم حذف كافة السجلات المالية، الحضور، والمتابعة والتقييمات نهائياً.</div>
                <div>• سيتم إلغاء حساب ولي الأمر المرتبط به ومنعه من الدخول للتطبيق أو التسجيل مجدداً.</div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  storage.deleteChild(child.id);
                  setShowDeleteModal(false);
                  onBack();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف نهائي</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
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
