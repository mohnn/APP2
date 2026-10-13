import React, { useState } from 'react';
import { ArrowRight, Printer, FileText, Download, CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';

interface ReportsScreenProps {
  onBack: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onBack }) => {
  const [reportType, setReportType] = useState<'attendance' | 'arrears' | 'financial'>('arrears');
  const storage = NurseryStorageService.getInstance();

  const handlePrint = () => {
    window.print();
  };

  // Arrears kids
  const arrearsList = storage.monthlyFees
    .filter(f => f.month === 10 && f.year === 2026 && f.remainingAmount > 0)
    .map(f => {
      const child = storage.children.find(c => c.id === f.childId);
      const guardian = storage.guardians.find(g => g.id === child?.guardianId);
      return {
        ...f,
        childName: child?.fullName || '',
        childCode: child?.code || '',
        guardianName: guardian?.fullName || '',
        guardianPhone: guardian?.phone || '',
      };
    });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              التقارير والكشوفات الرسمية
            </h2>
            <span className="text-[10px] text-slate-400">توليد وطباعة التقارير بصيغة PDF</span>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>طباعة التقرير</span>
        </button>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-bold text-center no-print">
        <button
          onClick={() => setReportType('arrears')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            reportType === 'arrears' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'text-slate-600'
          }`}
        >
          كشف المتأخرات ({arrearsList.length})
        </button>
        <button
          onClick={() => setReportType('attendance')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            reportType === 'attendance' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'text-slate-600'
          }`}
        >
          تقرير الحضور والغياب
        </button>
        <button
          onClick={() => setReportType('financial')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            reportType === 'financial' ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'text-slate-600'
          }`}
        >
          التقرير المالي العام
        </button>
      </div>

      {/* Printable Report Container */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
        <div className="border-b border-slate-200 pb-2 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {reportType === 'arrears' ? 'كشف متأخرات مصروفات الأطفال' : reportType === 'attendance' ? 'تقرير الحضور اليومي والغياب' : 'تقرير الإيرادات والمصروفات'}
            </h3>
            <span className="text-[10px] text-slate-400">حضانة Modern British Kids · التاريخ: {new Date().toLocaleDateString('ar-EG')}</span>
          </div>
          <span className="font-bold text-xs text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-lg">
            تقرير رسمي معتمد
          </span>
        </div>

        {reportType === 'arrears' && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-rose-600 mb-1">
              إجمالي مبالغ المتأخرات: {arrearsList.reduce((s, a) => s + a.remainingAmount, 0).toLocaleString()} ج.م
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {arrearsList.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {item.childName} <span className="font-mono text-slate-400 font-normal">({item.childCode})</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ولي الأمر: {item.guardianName} · {item.guardianPhone}
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <span className="font-bold text-rose-600 block">{item.remainingAmount} ج.م متبقي</span>
                    <span className="text-[10px] text-slate-400">من أصل {item.totalRequired}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportType === 'attendance' && (
          <div className="space-y-2">
            <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              تم تسجيل حضور 23 طفلاً، وتأخر 2 أطفال، وغياب 4 أطفال، وإجازة طفل واحد اليوم عبر بوابات الـ QR والـ RFID المعتمدة.
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-[11px]">
              <div className="flex justify-between"><span>نسبة الحضور الإجمالية:</span><span className="font-bold text-emerald-600">83%</span></div>
              <div className="flex justify-between"><span>الأطفال الحاضرون في الموعد:</span><span className="font-bold">23</span></div>
              <div className="flex justify-between"><span>المتأخرون عن 08:30 ص:</span><span className="font-bold text-amber-600">2</span></div>
            </div>
          </div>
        )}

        {reportType === 'financial' && (
          <div className="space-y-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span>إجمالي التحصيل المحقق:</span><span className="font-mono font-bold text-emerald-600">67,400 ج.م</span></div>
              <div className="flex justify-between"><span>المصروفات التشغيلية والرواتب:</span><span className="font-mono font-bold text-rose-600">42,800 ج.م</span></div>
              <div className="flex justify-between pt-1 border-t border-slate-200"><span>صافي الربح الفائض:</span><span className="font-mono font-bold text-blue-700">24,600 ج.م</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
