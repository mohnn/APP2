import React, { useMemo, useState } from 'react';
import { ArrowRight, FileText, Loader2 } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { MONTH_NAMES_AR, currentPeriod, localDateStr } from '../../utils/dateUtils';
import { ReportSpec, shareReportPdf } from '../../utils/reportPdf';
import { notify } from '../../utils/notify';

interface ReportsScreenProps {
  onBack: () => void;
}

const STATUS_AR: Record<string, string> = {
  present: 'حاضر',
  late: 'متأخر',
  absent: 'غائب',
  leave: 'إجازة',
  pending: 'لم يصل بعد',
  none: 'بدون حالة',
};

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ onBack }) => {
  const [reportType, setReportType] = useState<'attendance' | 'arrears' | 'financial'>('arrears');
  const [exporting, setExporting] = useState(false);
  const storage = NurseryStorageService.getInstance();

  const { month, year } = currentPeriod();
  const monthLabel = `${MONTH_NAMES_AR[month - 1]} ${year}`;
  const today = localDateStr();

  // ---------- كشف المتأخرات (الشهر الحالي) ----------
  const arrearsList = useMemo(
    () =>
      storage
        .getMonthFees()
        .filter(f => f.remainingAmount > 0)
        .map(f => {
          const child = storage.children.find(c => c.id === f.childId);
          const guardian = storage.guardians.find(g => g.id === child?.guardianId);
          return {
            ...f,
            childName: child?.fullName || '',
            childCode: child?.studentId || '',
            guardianName: guardian?.fullName || '',
            guardianPhone: guardian?.phone || '',
          };
        }),
    [storage.monthlyFees, storage.children]
  );
  const arrearsTotal = arrearsList.reduce((s, a) => s + a.remainingAmount, 0);

  // ---------- الحضور (اليوم) ----------
  const attendance = useMemo(() => {
    const kids = storage.children.filter(c => c.status === 'active');
    const rows = kids.map(c => {
      const v = storage.getAttendanceView(c.id, today);
      return { child: c, status: v.status, rec: v.record };
    });
    const summary = storage.getAttendanceSummary(kids, today);
    const rate = kids.length > 0 ? Math.round(((summary.present + summary.late) / kids.length) * 100) : 0;
    const order: Record<string, number> = { absent: 0, late: 1, leave: 2, pending: 3, none: 4, present: 5 };
    rows.sort((a, b) => order[a.status] - order[b.status] || a.child.fullName.localeCompare(b.child.fullName, 'ar'));
    return { rows, summary, rate, total: kids.length };
  }, [storage.attendance, storage.children, today]);

  // ---------- المالية (الشهر الحالي) ----------
  const fin = useMemo(() => storage.getFinancialSummary('month'), [storage.receipts, storage.expenses, storage.kidsAreaSessions]);

  const titleOf = reportType === 'arrears' ? 'كشف متأخرات مصروفات الأطفال' : reportType === 'attendance' ? 'تقرير الحضور اليومي والغياب' : 'تقرير الإيراد والمصروفات العام';

  const buildSpec = (): { spec: ReportSpec; file: string } => {
    if (reportType === 'arrears') {
      return {
        file: `Arrears-${today}.pdf`,
        spec: {
          title: 'كشف متأخرات مصروفات الأطفال',
          subtitle: `حضانة Modern British Kids · شهر ${monthLabel}`,
          summary: [
            ['عدد الأطفال المتأخرين', String(arrearsList.length), arrearsList.length ? 'bad' : 'good'],
            ['إجمالي المتأخرات', `${arrearsTotal.toLocaleString('en-US')} ج.م`, arrearsTotal ? 'bad' : 'good'],
          ],
          sections: [
            {
              title: 'قائمة المتأخرين',
              emptyText: 'لا توجد متأخرات هذا الشهر 🎉',
              columns: [
                { header: 'م', width: 0.5, align: 'center' },
                { header: 'اسم الطفل', width: 2.8, align: 'right' },
                { header: 'ولي الأمر', width: 2.2, align: 'right' },
                { header: 'الهاتف', width: 2.6, align: 'center', mono: true },
                { header: 'المطلوب', width: 1.7, align: 'center', mono: true },
                { header: 'المدفوع', width: 1.7, align: 'center', mono: true },
                { header: 'المتبقي', width: 1.7, align: 'center', mono: true },
              ],
              rows: arrearsList.map((a, i) => [String(i + 1), a.childName, a.guardianName, a.guardianPhone, String(a.totalRequired), String(a.paidAmount), String(a.remainingAmount)]),
            },
          ],
          footer: 'تقرير رسمي معتمد من إدارة الحضانة',
        },
      };
    }
    if (reportType === 'attendance') {
      const s = attendance.summary;
      return {
        file: `Attendance-${today}.pdf`,
        spec: {
          title: 'تقرير الحضور اليومي والغياب',
          subtitle: `حضانة Modern British Kids · ${today}`,
          summary: [
            ['حاضر', String(s.present), 'good'],
            ['متأخر', String(s.late), s.late ? 'bad' : 'neutral'],
            ['غائب', String(s.absent), s.absent ? 'bad' : 'neutral'],
            ['إجازة', String(s.leave)],
            ['لم يصل بعد / بدون حالة', String(s.pending + s.none)],
            ['نسبة الحضور', `${attendance.rate}%`, attendance.rate >= 80 ? 'good' : 'bad'],
          ],
          sections: [
            {
              title: 'حالة كل طفل اليوم',
              emptyText: 'لا يوجد أطفال مسجلون',
              columns: [
                { header: 'م', width: 0.6, align: 'center' },
                { header: 'اسم الطفل', width: 3.4, align: 'right' },
                { header: 'الحالة', width: 1.6, align: 'center' },
                { header: 'وقت الحضور', width: 1.6, align: 'center', mono: true },
                { header: 'وقت الانصراف', width: 1.6, align: 'center', mono: true },
              ],
              rows: attendance.rows.map((r, i) => [String(i + 1), r.child.fullName, STATUS_AR[r.status] || r.status, r.rec?.checkInTime || '—', r.rec?.checkOutTime || '—']),
            },
          ],
          footer: 'الحضور في الموعد حتى 08:30 ص، وبعدها يُسجَّل تأخيراً أو غياباً',
        },
      };
    }
    return {
      file: `Financial-${month}-${year}.pdf`,
      spec: {
        title: 'تقرير الإيراد والمصروفات العام',
        subtitle: `حضانة Modern British Kids · ${fin.periodLabel}`,
        summary: [
          ['إجمالي الإيرادات', `${fin.totalIncome.toLocaleString('en-US')} ج.م`, 'good'],
          ['إجمالي المصروفات', `${fin.totalExpenses.toLocaleString('en-US')} ج.م`, 'bad'],
          ['صافي الربح', `${fin.netProfit.toLocaleString('en-US')} ج.م`, fin.netProfit >= 0 ? 'good' : 'bad'],
        ],
        sections: [
          {
            title: `الإيصالات (${fin.receipts.length})`,
            emptyText: 'لا توجد إيصالات في هذا الشهر',
            columns: [
              { header: 'التاريخ', width: 1.8, align: 'center', mono: true },
              { header: 'اسم الطفل', width: 3, align: 'right' },
              { header: 'عن شهر', width: 1.8, align: 'center' },
              { header: 'المبلغ', width: 1.4, align: 'center', mono: true },
            ],
            rows: fin.receipts.map(r => [r.date.split(' ')[0], r.childName, r.monthName, String(r.amount)]),
          },
          {
            title: `المصروفات (${fin.expenses.length})`,
            emptyText: 'لا توجد مصروفات في هذا الشهر',
            columns: [
              { header: 'التاريخ', width: 1.8, align: 'center', mono: true },
              { header: 'التصنيف', width: 2, align: 'right' },
              { header: 'الوصف', width: 3, align: 'right' },
              { header: 'المبلغ', width: 1.4, align: 'center', mono: true },
            ],
            rows: fin.expenses.map(e => [e.date, e.categoryLabelAr, e.description, String(e.amount)]),
          },
        ],
        footer: 'تقرير رسمي معتمد من إدارة الحضانة',
      },
    };
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { spec, file } = buildSpec();
      const result = await shareReportPdf(spec, file);
      if (result === 'cancelled') notify('تم إلغاء الحفظ.', 'error');
      else if (result === 'shared') notify('اختر مكان الحفظ أو المشاركة من القائمة (الملفات / Drive / واتساب).', 'success');
      else if (result === 'saved-documents') notify('تم حفظ التقرير في مجلد المستندات: Documents/MBK', 'success');
      else notify('تم تنزيل ملف التقرير (PDF).', 'success');
    } catch (e) {
      console.error('Report PDF error:', e);
      notify(`تعذر إنشاء ملف التقرير${e instanceof Error && e.message ? ` (${e.message})` : ''}.`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const tabCls = (t: string) =>
    `flex-1 py-1.5 rounded-lg transition-all ${reportType === t ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">التقارير والكشوفات الرسمية</h2>
            <span className="text-[10px] text-slate-400">بيانات حقيقية · تصدير PDF ومشاركة</span>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
          <span>{exporting ? 'جاري التجهيز...' : 'تصدير PDF'}</span>
        </button>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-xl text-xs font-bold text-center">
        <button onClick={() => setReportType('arrears')} className={tabCls('arrears')}>
          كشف المتأخرات ({arrearsList.length})
        </button>
        <button onClick={() => setReportType('attendance')} className={tabCls('attendance')}>
          تقرير الحضور والغياب
        </button>
        <button onClick={() => setReportType('financial')} className={tabCls('financial')}>
          التقرير المالي العام
        </button>
      </div>

      {/* Report body */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">{titleOf}</h3>
            <span className="text-[10px] text-slate-400">حضانة Modern British Kids · التاريخ: {new Date().toLocaleDateString('ar-EG')}</span>
          </div>
          <span className="font-bold text-xs text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-lg">تقرير رسمي معتمد</span>
        </div>

        {reportType === 'arrears' && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-rose-600 mb-1">
              إجمالي المتأخرات عن شهر {monthLabel}: {arrearsTotal.toLocaleString()} ج.م
            </div>
            {arrearsList.length === 0 ? (
              <div className="py-6 text-center text-slate-400">لا توجد متأخرات هذا الشهر 🎉</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {arrearsList.map(item => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
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
            )}
          </div>
        )}

        {reportType === 'attendance' && (
          <div className="space-y-2">
            <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              اليوم ({attendance.total} طفل): حاضر {attendance.summary.present} · متأخر {attendance.summary.late} · غائب {attendance.summary.absent} · إجازة {attendance.summary.leave}
              {attendance.summary.pending + attendance.summary.none > 0 && ` · لم يصل بعد/بدون حالة ${attendance.summary.pending + attendance.summary.none}`}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-[11px]">
              <div className="flex justify-between"><span>نسبة الحضور الإجمالية:</span><span className="font-bold text-emerald-600">{attendance.rate}%</span></div>
              <div className="flex justify-between"><span>الحاضرون في الموعد:</span><span className="font-bold">{attendance.summary.present}</span></div>
              <div className="flex justify-between"><span>المتأخرون عن 08:30 ص:</span><span className="font-bold text-amber-600">{attendance.summary.late}</span></div>
              <div className="flex justify-between"><span>الغائبون:</span><span className="font-bold text-rose-600">{attendance.summary.absent}</span></div>
            </div>
            {attendance.rows.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendance.rows.map(r => (
                  <div key={r.child.id} className="py-1.5 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{r.child.fullName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        r.status === 'present' ? 'bg-emerald-50 text-emerald-700' : r.status === 'late' ? 'bg-amber-50 text-amber-700' : r.status === 'absent' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {STATUS_AR[r.status]}
                      {r.rec?.checkInTime ? ` · ${r.rec.checkInTime}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {reportType === 'financial' && (
          <div className="space-y-2">
            <div className="text-[10px] text-slate-400">{fin.periodLabel}</div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between"><span>إجمالي الإيرادات ({fin.receiptsCount} إيصال):</span><span className="font-mono font-bold text-emerald-600">{fin.totalIncome.toLocaleString()} ج.م</span></div>
              <div className="flex justify-between"><span>إجمالي المصروفات:</span><span className="font-mono font-bold text-rose-600">{fin.totalExpenses.toLocaleString()} ج.م</span></div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700"><span>صافي الربح:</span><span className={`font-mono font-bold ${fin.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{fin.netProfit.toLocaleString()} ج.م</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
