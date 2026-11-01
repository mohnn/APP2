import { NurseryStorageService } from './storage';
import { buildBackupFile, BackupSummary } from './backup';

/** اسم الورقة المخفية التي تحمل بيانات الاستعادة داخل ملف Excel */
export const RESTORE_SHEET = '_MBK_RESTORE';
export const RESTORE_MARK = 'MBK-Nursery-Excel-Backup-v1';
const CHUNK = 30000; // الحد الأقصى لخلية Excel 32767 حرفاً

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const monthName = (m: number) => MONTHS[(m - 1 + 12) % 12] || String(m);

const dict = (map: Record<string, string>) => (v: unknown) => (v == null || v === '' ? '' : map[String(v)] ?? String(v));
const CHILD_STATUS = dict({ active: 'نشط', leave: 'إجازة', suspended: 'موقوف', withdrawn: 'منسحب', graduated: 'متخرج' });
const GENDER = dict({ male: 'ذكر', female: 'أنثى' });
const LEVEL = dict({ 'lvl-pre-kg': 'بري كيجي', 'lvl-kg1': 'كيجي 1' });
const ATT_STATUS = dict({ present: 'حاضر', absent: 'غائب', late: 'متأخر', leave: 'إجازة' });
const ATT_METHOD = dict({ manual: 'يدوي', qr: 'QR' });
const FEE_STATUS = dict({ unpaid: 'غير مدفوع', partial: 'مدفوع جزئياً', paid: 'مدفوع' });
const PAY_METHOD = dict({ cash: 'نقدي' });
const PAYROLL_STATUS = dict({ paid: 'تم الصرف', pending: 'قيد الصرف' });
const SESSION_STATUS = dict({ active: 'جارية', completed: 'منتهية' });
const FOOD = dict({ excellent: 'ممتاز', good: 'جيد', little: 'قليل', none: 'لم يأكل' });
const SLEEP = dict({ none: 'لم ينم', '30min': 'نصف ساعة', '1hour': 'ساعة', '2hours': 'ساعتان' });
const MOOD = dict({ happy: 'سعيد', calm: 'هادئ', fussy: 'منزعج', crying: 'يبكي' });
const ACTIVITY = dict({ very_active: 'نشيط جداً', normal: 'عادي', low: 'قليل النشاط' });

type Cell = string | number | boolean | null | undefined;
interface Col {
  header: string;
  width?: number;
  money?: boolean;
}

/** ينشئ ملف Excel فيه كل بيانات الحضانة في جداول مرتبة + ورقة مخفية للاستعادة */
export const buildExcelBackup = async (): Promise<{ bytes: Uint8Array; fileName: string; summary: BackupSummary }> => {
  const mod: any = await import('exceljs');
  const ExcelJS = mod.default ?? mod;
  const storage = NurseryStorageService.getInstance();
  const backup = buildBackupFile();

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Modern British Kids';
  wb.created = new Date();

  const childName = (id: string) => storage.children.find(c => c.id === id)?.fullName || '';
  const childCode = (id: string) => storage.children.find(c => c.id === id)?.studentId || '';
  const guardianOf = (guardianId: string) => storage.guardians.find(g => g.id === guardianId);

  const addSheet = (name: string, cols: Col[], rows: Cell[][], tabColor = 'FF1E3A8A') => {
    const ws = wb.addWorksheet(name, {
      properties: { tabColor: { argb: tabColor } },
      views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
    });
    ws.columns = cols.map(c => ({ header: c.header, width: c.width ?? 16 }));
    const head = ws.getRow(1);
    head.height = 24;
    head.eachCell((cell: any) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });
    rows.forEach(r => ws.addRow(r.map(v => (v === undefined ? null : v))));
    for (let i = 2; i <= rows.length + 1; i++) {
      const row = ws.getRow(i);
      row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      if (i % 2 === 1) row.eachCell({ includeEmpty: true }, (c: any) => (c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }));
    }
    cols.forEach((c, idx) => {
      if (c.money) ws.getColumn(idx + 1).numFmt = '#,##0.00';
    });
    if (rows.length > 0) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
    return ws;
  };

  // ---------- ملخص ----------
  const sumReceipts = storage.receipts.reduce((n, r) => n + (r.amount || 0), 0);
  const sumExpenses = storage.expenses.reduce((n, e) => n + (e.amount || 0), 0);
  const sumIncome = storage.secondaryIncome.reduce((n, i) => n + (i.amount || 0), 0);
  const nowAr = new Date().toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' });
  const summaryRows: Cell[][] = [
    ['تاريخ التصدير', nowAr],
    ['عدد الأطفال', storage.children.length],
    ['عدد أولياء الأمور', storage.guardians.length],
    ['عدد الإيصالات', storage.receipts.length],
    ['إجمالي المحصّل من الإيصالات', sumReceipts],
    ['عدد مصروفات الحضانة', storage.expenses.length],
    ['إجمالي مصروفات الحضانة', sumExpenses],
    ['إجمالي الدخل الثانوي', sumIncome],
    ['عدد الموظفين', storage.employees.length],
    ['عدد جلسات ركن الكيدز إريا', storage.kidsAreaSessions.length],
    ['عدد الصور في المعرض', storage.galleryPhotos.length],
  ];
  const sum = addSheet('ملخص', [{ header: 'البند', width: 34 }, { header: 'القيمة', width: 34 }], summaryRows, 'FFF59E0B');
  sum.getColumn(1).font = { bold: true };
  [6, 8, 9].forEach(r => (sum.getRow(r).getCell(2).numFmt = '#,##0.00'));

  // ---------- الأطفال ----------
  addSheet(
    'الأطفال',
    [
      { header: 'م', width: 6 }, { header: 'كود الطالب', width: 12 }, { header: 'اسم الطالب', width: 28 },
      { header: 'المرحلة', width: 12 }, { header: 'الفصل', width: 14 }, { header: 'النوع', width: 9 },
      { header: 'تاريخ الميلاد', width: 14 }, { header: 'تاريخ الالتحاق', width: 14 },
      { header: 'الرسوم الشهرية', width: 14, money: true }, { header: 'الحالة', width: 10 },
      { header: 'ولي الأمر', width: 26 }, { header: 'صلة القرابة', width: 12 }, { header: 'هاتف ولي الأمر', width: 16 },
      { header: 'واتساب', width: 16 }, { header: 'العنوان', width: 30 }, { header: 'حساسية / ملاحظات', width: 28 },
    ],
    storage.children.map((c, i) => {
      const g = guardianOf(c.guardianId);
      return [i + 1, c.studentId, c.fullName, LEVEL(c.levelId), c.classNameAr || '', GENDER(c.gender), c.birthDate, c.enrollmentDate,
        c.monthlyFee, CHILD_STATUS(c.status), g?.fullName || '', g?.relation || '', g?.phone || '', g?.whatsapp || '', c.address || '',
        [c.allergies, c.notes].filter(Boolean).join(' - ')];
    })
  );

  // ---------- أولياء الأمور ----------
  addSheet(
    'أولياء الأمور',
    [
      { header: 'اسم ولي الأمر', width: 28 }, { header: 'صلة القرابة', width: 12 }, { header: 'الهاتف', width: 16 },
      { header: 'واتساب', width: 16 }, { header: 'هاتف آخر', width: 16 }, { header: 'الوظيفة', width: 18 },
      { header: 'البريد', width: 24 }, { header: 'العنوان', width: 30 }, { header: 'الأبناء', width: 34 },
    ],
    storage.guardians.map(g => [g.fullName, g.relation, g.phone, g.whatsapp, g.secondPhone || '', g.job || '', g.email || '', g.address || '',
      storage.children.filter(c => c.guardianId === g.id).map(c => c.fullName).join('، ')])
  );

  // ---------- المفوضون بالاستلام ----------
  addSheet(
    'المفوضون بالاستلام',
    [{ header: 'الاسم', width: 26 }, { header: 'الصلة', width: 14 }, { header: 'الهاتف', width: 16 }, { header: 'الطفل', width: 26 }, { header: 'ملاحظات', width: 28 }],
    storage.pickupPersons.map(p => [p.fullName, p.relation, p.phone, childName(p.childId), p.notes || ''])
  );

  // ---------- الحضور ----------
  addSheet(
    'الحضور',
    [
      { header: 'التاريخ', width: 14 }, { header: 'كود الطالب', width: 12 }, { header: 'اسم الطالب', width: 28 }, { header: 'الحالة', width: 10 },
      { header: 'وقت الحضور', width: 14 }, { header: 'وقت الانصراف', width: 14 }, { header: 'الطريقة', width: 10 }, { header: 'سبب الإجازة / ملاحظات', width: 30 },
    ],
    [...storage.attendance].sort((a, b) => b.date.localeCompare(a.date)).map(a => [a.date, childCode(a.childId), childName(a.childId), ATT_STATUS(a.status),
      a.checkInTime || '', a.checkOutTime || '', ATT_METHOD(a.method), [a.leaveReason, a.notes].filter(Boolean).join(' - ')]),
    'FF059669'
  );

  // ---------- المصروفات الدراسية الشهرية ----------
  addSheet(
    'الرسوم الشهرية',
    [
      { header: 'اسم الطالب', width: 28 }, { header: 'الشهر', width: 12 }, { header: 'السنة', width: 8 },
      { header: 'الرسوم الأساسية', width: 14, money: true }, { header: 'الخصم', width: 11, money: true }, { header: 'الأنشطة', width: 11, money: true },
      { header: 'المطلوب', width: 12, money: true }, { header: 'المدفوع', width: 12, money: true }, { header: 'المتبقي', width: 12, money: true }, { header: 'الحالة', width: 14 },
    ],
    [...storage.monthlyFees].sort((a, b) => b.year - a.year || b.month - a.month).map(f => [childName(f.childId), monthName(f.month), f.year, f.baseFee, f.discount,
      f.activitiesFee, f.totalRequired, f.paidAmount, f.remainingAmount, FEE_STATUS(f.status)]),
    'FF0EA5E9'
  );

  // ---------- الإيصالات ----------
  addSheet(
    'الإيصالات',
    [
      { header: 'رقم الإيصال', width: 16 }, { header: 'التاريخ', width: 14 }, { header: 'اسم الطالب', width: 28 }, { header: 'كود الطالب', width: 12 },
      { header: 'ولي الأمر', width: 24 }, { header: 'عن شهر', width: 12 }, { header: 'السنة', width: 8 }, { header: 'المبلغ', width: 12, money: true },
      { header: 'طريقة الدفع', width: 12 }, { header: 'المتبقي على الطالب', width: 16, money: true }, { header: 'أصدره', width: 18 }, { header: 'ملاحظات', width: 26 },
    ],
    [...storage.receipts].sort((a, b) => b.date.localeCompare(a.date)).map(r => [r.receiptNumber, r.date, r.childName, r.studentId, r.guardianName, r.monthName,
      r.year, r.amount, PAY_METHOD(r.paymentMethod), r.remainingChildBalance, r.issuedByUserName, r.notes || '']),
    'FF10B981'
  );

  // ---------- مصروفات الحضانة ----------
  addSheet(
    'مصروفات الحضانة',
    [{ header: 'التاريخ', width: 14 }, { header: 'التصنيف', width: 18 }, { header: 'الوصف', width: 34 }, { header: 'المورد', width: 20 }, { header: 'المبلغ', width: 12, money: true }, { header: 'طريقة الدفع', width: 12 }],
    [...storage.expenses].sort((a, b) => b.date.localeCompare(a.date)).map(e => [e.date, e.categoryLabelAr, e.description, e.supplier || '', e.amount, PAY_METHOD(e.paymentMethod)]),
    'FFEF4444'
  );

  // ---------- الدخل الثانوي ----------
  addSheet(
    'الدخل الثانوي',
    [{ header: 'التاريخ', width: 14 }, { header: 'التصنيف', width: 18 }, { header: 'البيان', width: 30 }, { header: 'المبلغ', width: 12, money: true }, { header: 'الطالب', width: 26 }, { header: 'ملاحظات', width: 26 }],
    [...storage.secondaryIncome].sort((a, b) => b.date.localeCompare(a.date)).map(i => [i.date, i.categoryLabelAr, i.title || i.description || '', i.amount, i.childName || '', i.notes || '']),
    'FF06B6D4'
  );

  // ---------- الموظفون والرواتب ----------
  addSheet(
    'الموظفون',
    [{ header: 'الاسم', width: 28 }, { header: 'الوظيفة', width: 22 }, { header: 'الهاتف', width: 16 }, { header: 'الراتب الأساسي', width: 14, money: true }, { header: 'تاريخ التعيين', width: 14 }, { header: 'الحالة', width: 10 }],
    storage.employees.map(e => [e.fullName || e.name, e.roleLabelAr, e.phone, e.basicSalary ?? e.baseSalary, e.hireDate, e.active ? 'على رأس العمل' : 'متوقف']),
    'FF8B5CF6'
  );
  addSheet(
    'الرواتب',
    [
      { header: 'الموظف', width: 26 }, { header: 'الشهر', width: 12 }, { header: 'السنة', width: 8 }, { header: 'الأساسي', width: 12, money: true },
      { header: 'مكافآت', width: 11, money: true }, { header: 'خصومات', width: 11, money: true }, { header: 'سلف', width: 11, money: true }, { header: 'الصافي', width: 12, money: true }, { header: 'الحالة', width: 12 },
    ],
    [...storage.payroll].sort((a, b) => b.year - a.year || b.month - a.month).map(p => [p.employeeName, monthName(p.month), p.year, p.basicSalary ?? p.baseSalary, p.bonuses,
      p.deductions, p.advancesDeduction ?? p.advances, p.netSalary, PAYROLL_STATUS(p.status)]),
    'FF8B5CF6'
  );

  // ---------- حسابات المعلمين (بدون كلمات المرور) ----------
  addSheet(
    'المعلمون',
    [
      { header: 'اسم المعلم', width: 26 }, { header: 'المادة', width: 20 }, { header: 'اسم المستخدم', width: 18 },
      { header: 'الفصول', width: 30 }, { header: 'الهاتف', width: 16 }, { header: 'الحالة', width: 10 },
    ],
    storage.teachers.map(t => [t.fullName, t.subject, t.username, t.classIds.map(id => storage.classes.find(c => c.id === id)?.name || id).join('، '), t.phone || '', t.active ? 'نشط' : 'موقوف']),
    'FF8B5CF6'
  );

  // ---------- ركن الكيدز إريا ----------
  addSheet(
    'ركن الكيدز إريا',
    [
      { header: 'اسم الطفل', width: 26 }, { header: 'ولي الأمر', width: 24 }, { header: 'هاتف', width: 16 },
      { header: 'وقت الدخول', width: 14 }, { header: 'المدة (دقيقة)', width: 12 }, { header: 'الرسوم', width: 11, money: true }, { header: 'الحالة', width: 10 }, { header: 'ملاحظات', width: 26 },
    ],
    storage.kidsAreaSessions.map(s => [s.childName, s.guardianName, s.guardianPhone, s.entryTime, s.allocatedMinutes, s.fee, SESSION_STATUS(s.status), s.notes || '']),
    'FFF59E0B'
  );

  // ---------- المتابعة اليومية والتقييمات ----------
  addSheet(
    'المتابعة اليومية',
    [
      { header: 'التاريخ', width: 14 }, { header: 'اسم الطالب', width: 28 }, { header: 'الطعام', width: 10 }, { header: 'النوم', width: 11 }, { header: 'المزاج', width: 10 },
      { header: 'النشاط', width: 13 }, { header: 'دورات المياه', width: 12 }, { header: 'الواجب', width: 10 }, { header: 'ملاحظات', width: 32 },
    ],
    [...storage.dailyReports].sort((a, b) => b.date.localeCompare(a.date)).map(d => [d.date, childName(d.childId), FOOD(d.foodIntake), SLEEP(d.sleepDuration),
      MOOD(d.mood), ACTIVITY(d.activityLevel), d.toiletVisits, d.homeworkDone ? 'تم' : 'لم يتم', d.notes || ''])
  );
  addSheet(
    'التقييمات',
    [
      { header: 'اسم الطالب', width: 28 }, { header: 'الشهر', width: 12 }, { header: 'السنة', width: 8 }, { header: 'اللغة العربية', width: 12 }, { header: 'اللغة الإنجليزية', width: 14 },
      { header: 'الأرقام والحساب', width: 14 }, { header: 'المهارات الحركية', width: 14 }, { header: 'المهارات الاجتماعية', width: 16 }, { header: 'الاستقلالية', width: 12 },
      { header: 'الفن والإبداع', width: 12 }, { header: 'القرآن والآداب', width: 14 }, { header: 'ملاحظات عامة', width: 36 },
    ],
    storage.evaluations.map(e => [childName(e.childId), monthName(e.month), e.year, e.arabicLanguage, e.englishLanguage, e.numbersMath, e.fineMotorSkills,
      e.socialSkills, e.independence, e.artAndCreativity, e.quranAndEtiquette, e.overallFeedback])
  );

  // ---------- الصور (بيانات فقط، بدون الصور نفسها) ----------
  addSheet(
    'الصور',
    [{ header: 'التاريخ', width: 14 }, { header: 'لمن', width: 28 }, { header: 'التعليق', width: 34 }],
    storage.galleryPhotos.map(p => [p.takenDate, p.childId === 'all' ? 'كل الأطفال (عامة)' : childName(p.childId) || 'طفل محذوف', p.caption]),
    'FFEC4899'
  );

  // ---------- ورقة الاستعادة المخفية ----------
  const restore = wb.addWorksheet(RESTORE_SHEET, { state: 'hidden' });
  const chunks: string[] = [];
  for (let i = 0; i < backup.text.length; i += CHUNK) chunks.push(backup.text.slice(i, i + CHUNK));
  restore.addRow([RESTORE_MARK]);
  restore.addRow([new Date().toISOString()]);
  restore.addRow([chunks.length]);
  chunks.forEach(c => restore.addRow([c]));

  const pad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const buffer: ArrayBuffer = await wb.xlsx.writeBuffer();
  return { bytes: new Uint8Array(buffer), fileName: `MBK-Backup-${stamp}.xlsx`, summary: backup.summary };
};

/** يقرأ ملف Excel أنشأه التطبيق ويرجع نص بيانات الاستعادة (JSON) */
export const readRestoreTextFromExcel = async (data: ArrayBuffer): Promise<{ ok: true; text: string } | { ok: false; message: string }> => {
  try {
    const mod: any = await import('exceljs');
    const ExcelJS = mod.default ?? mod;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(data);
    const ws = wb.getWorksheet(RESTORE_SHEET);
    if (!ws) {
      return { ok: false, message: 'هذا الملف لا يحتوي على بيانات استعادة (ربما تم تعديله أو لم يُنشأ من التطبيق). استخدم ملف النسخة الأصلي.' };
    }
    const mark = String(ws.getRow(1).getCell(1).value ?? '');
    if (mark !== RESTORE_MARK) return { ok: false, message: 'ملف الاستعادة غير مدعوم أو تالف.' };
    const count = Number(ws.getRow(3).getCell(1).value ?? 0);
    if (!count || count < 1) return { ok: false, message: 'ملف الاستعادة فارغ.' };
    let text = '';
    for (let i = 0; i < count; i++) {
      const v = ws.getRow(4 + i).getCell(1).value;
      if (typeof v !== 'string') return { ok: false, message: 'ملف الاستعادة ناقص أو تالف.' };
      text += v;
    }
    return { ok: true, text };
  } catch {
    return { ok: false, message: 'تعذر قراءة ملف Excel. تأكد أنه الملف الأصلي للنسخة الاحتياطية.' };
  }
};
