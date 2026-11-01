import type { GalleryPhoto, Teacher } from '../types/nursery';
import { deleteVideosForChild, listVideos, deleteVideo } from './videoStore';
import { queuePush, seedCloudIfNeeded, SYNC_COLLECTIONS, SYNC_DOCS, LocalBridge } from './cloudSync';
import { NOTIFICATIONS_ENABLED } from '../config/features';
import { pushNotification, recipientParent, recipientTeacher, RECIPIENT_ADMIN, NotifType } from './notifications';
import {
  Child,
  Guardian,
  PickupPerson,
  NurseryLevel,
  NurseryClass,
  AttendanceRecord,
  ChildMonthlyFee,
  PaymentReceipt,
  ExpenseRecord,
  DailyReport,
  EvaluationRecord,
  User,
  NurserySettings,
  AuditLog,
  AttendanceStatus,
  Employee,
  PayrollRecord,
  IncomeRecord,
  MonthClosingRecord,
  KidsAreaSession
} from '../types/nursery';

import {
  INITIAL_SETTINGS,
  ADMIN_USER,
  INITIAL_LEVELS,
  INITIAL_CLASSES,
  INITIAL_GUARDIANS,
  INITIAL_CHILDREN,
  INITIAL_PICKUP_PERSONS,
  INITIAL_MONTHLY_FEES,
  INITIAL_RECEIPTS,
  INITIAL_EXPENSES,
  INITIAL_DAILY_REPORTS,
  INITIAL_EVALUATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_KIDS_AREA_SESSIONS,
  DEFAULT_NURSERY_LOGO_DATA_URL,
  DEFAULT_LOGIN_BACKGROUND_DATA_URL
} from './mockData';

import { formatTime12h, getCurrentTime12h } from '../utils/timeFormat';
import { localDateStr, currentPeriod, yearMonthPrefix, MONTH_NAMES_AR } from '../utils/dateUtils';
import { uid } from '../utils/ids';
import { hashPassword } from '../utils/sha256';
import { getLockSeconds, recordFailure, recordSuccess, lockMessage, MAX_FAILED_ATTEMPTS } from '../utils/loginGuard';

const STORAGE_KEY_PREFIX = 'mbk_nursery_v2_';

/** مدة بقاء الصورة في المعرض قبل حذفها تلقائياً (24 ساعة من وقت رفعها) */
export const PHOTO_TTL_MS = 24 * 60 * 60 * 1000;

/** بعد هذه الدقيقة من اليوم (08:30 ص) يُسجَّل المسح "متأخراً" */
export const ATTENDANCE_LATE_AFTER_MINUTES = 8 * 60 + 30;
/** أيام الإجازة الأسبوعية (0 الأحد ... 5 الجمعة، 6 السبت) */
export const WEEKEND_DAYS = [5, 6];

/** حالة الحضور المعروضة: pending = لم يصل بعد، none = لا توجد حالة (طفل جديد / يوم إجازة) */
export type AttendanceViewStatus = AttendanceStatus | 'pending' | 'none';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
    try {
      window.dispatchEvent(new CustomEvent('mbk-storage-error', { detail: { key } }));
    } catch {
      /* ignore */
    }
  }
}

/** توحيد كتابة الاسم العربي للمقارنة (إزالة التشكيل وتوحيد الهمزات والتاء المربوطة والمسافات) */
const normalizeArabicName = (name: string): string =>
  name
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export class NurseryStorageService {
  private static instance: NurseryStorageService;

  public settings: NurserySettings;
  public currentUser: User | null = null;
  public levels: NurseryLevel[];
  public classes: NurseryClass[];
  public guardians: Guardian[];
  public children: Child[];
  public pickupPersons: PickupPerson[];
  public attendance: AttendanceRecord[];
  public monthlyFees: ChildMonthlyFee[];
  public receipts: PaymentReceipt[];
  public expenses: ExpenseRecord[];
  public dailyReports: DailyReport[];
  public evaluations: EvaluationRecord[];
  public auditLogs: AuditLog[];

  public employees: Employee[];
  public payroll: PayrollRecord[];
  public secondaryIncome: IncomeRecord[];
  public monthClosings: MonthClosingRecord[];
  public kidsAreaSessions: KidsAreaSession[];
  public galleryPhotos: GalleryPhoto[] = [];
  public teachers: Teacher[] = [];
  public users: User[] = [ADMIN_USER];

  private lastSwipeMap: Map<string, number> = new Map();

  private constructor() {
    const DB_PURGE_KEY = 'mbk_empty_clean_slate_2026_oct12_v11_guaranteed_empty';
    const purgeStatus = loadFromStorage<string>('db_purge_status_v11', '');
    if (purgeStatus !== DB_PURGE_KEY) {
      try {
        const collections = [
          'children', 'guardians', 'pickupPersons', 'monthlyFees',
          'receipts', 'attendance', 'dailyReports', 'evaluations',
          'kidsAreaSessions', 'expenses', 'secondaryIncome', 'auth_session', 'users'
        ];
        collections.forEach(c => {
          localStorage.removeItem(STORAGE_KEY_PREFIX + c);
          localStorage.removeItem(c);
        });

        // Scan and remove any leftover keys
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(STORAGE_KEY_PREFIX) && !k.includes('settings')) {
            localStorage.removeItem(k);
          }
        });

        const currentSavedSettings = loadFromStorage<any>('settings', null);
        if (currentSavedSettings) {
          saveToStorage('settings', { 
            ...currentSavedSettings, 
            logoUrl: DEFAULT_NURSERY_LOGO_DATA_URL,
            loginBackgroundUrl: currentSavedSettings.loginBackgroundUrl || DEFAULT_LOGIN_BACKGROUND_DATA_URL
          });
        }
        saveToStorage('db_purge_status_v11', DB_PURGE_KEY);
      } catch (e) {}
    }

    this.settings = loadFromStorage('settings', INITIAL_SETTINGS);
    if (!this.settings.logoUrl || this.settings.logoUrl.startsWith('data:image/svg+xml')) {
      this.settings.logoUrl = DEFAULT_NURSERY_LOGO_DATA_URL;
    }
    if (!this.settings.loginBackgroundUrl) {
      this.settings.loginBackgroundUrl = DEFAULT_LOGIN_BACKGROUND_DATA_URL;
    }
    this.save('settings', this.settings);

    this.levels = loadFromStorage('levels', INITIAL_LEVELS);
    this.classes = loadFromStorage('classes', INITIAL_CLASSES);
    this.guardians = loadFromStorage('guardians', INITIAL_GUARDIANS);
    this.children = loadFromStorage('children', INITIAL_CHILDREN);
    this.pickupPersons = loadFromStorage('pickupPersons', INITIAL_PICKUP_PERSONS);
    this.receipts = loadFromStorage('receipts', INITIAL_RECEIPTS);
    this.expenses = loadFromStorage('expenses', INITIAL_EXPENSES);
    this.dailyReports = loadFromStorage('dailyReports', INITIAL_DAILY_REPORTS);
    this.evaluations = loadFromStorage('evaluations', INITIAL_EVALUATIONS);
    this.evaluations = loadFromStorage('evaluations', INITIAL_EVALUATIONS);
    this.auditLogs = loadFromStorage('auditLogs', INITIAL_AUDIT_LOGS);
    this.kidsAreaSessions = loadFromStorage('kidsAreaSessions', INITIAL_KIDS_AREA_SESSIONS);
    this.galleryPhotos = loadFromStorage<GalleryPhoto[]>('galleryPhotos', []);
    this.teachers = loadFromStorage<Teacher[]>('teachers', []);
    this.purgeExpiredPhotos();

    const initialEmployees: Employee[] = [
      { id: 'emp-1', name: 'أ. مريم سالم الشامي', role: 'teacher', roleLabelAr: 'معلمة لغة إنجليزية', phone: '01011223344', baseSalary: 6500, hireDate: '2024-09-01', active: true },
      { id: 'emp-2', name: 'أ. ندى فاروق رضوان', role: 'teacher', roleLabelAr: 'معلمة رياض أطفال وتأسيس', phone: '01022334455', baseSalary: 6200, hireDate: '2024-09-01', active: true },
      { id: 'emp-3', name: 'أ. فاطمة الزهراء علي', role: 'assistant', roleLabelAr: 'مربية ومساعدة أطفال', phone: '01033445566', baseSalary: 4500, hireDate: '2024-10-01', active: true },
    ];
    this.employees = loadFromStorage('employees', initialEmployees);

    const initialPayroll: PayrollRecord[] = [
      { id: 'pay-1', employeeId: 'emp-1', employeeName: 'أ. مريم سالم الشامي', month: 10, year: 2026, baseSalary: 6500, bonuses: 500, deductions: 0, advances: 0, netSalary: 7000, status: 'paid', disbursedDate: '2026-10-05' },
      { id: 'pay-2', employeeId: 'emp-2', employeeName: 'أ. ندى فاروق رضوان', month: 10, year: 2026, baseSalary: 6200, bonuses: 300, deductions: 0, advances: 0, netSalary: 6500, status: 'paid', disbursedDate: '2026-10-05' },
      { id: 'pay-3', employeeId: 'emp-3', employeeName: 'أ. فاطمة الزهراء علي', month: 10, year: 2026, baseSalary: 4500, bonuses: 200, deductions: 0, advances: 0, netSalary: 4700, status: 'pending' },
    ];
    this.payroll = loadFromStorage('payroll', initialPayroll);

    const initialSecondaryIncome: IncomeRecord[] = [
      { id: 'inc-1', title: 'حقيبة الكتب والأنشطة الإنجليزية', category: 'books', categoryLabelAr: 'كتب ومناهج', amount: 4500, date: '2026-10-04', paymentMethod: 'cash' },
      { id: 'inc-2', title: 'الزي المدرسي البريطاني الموحد', category: 'uniform', categoryLabelAr: 'الزي الموحد', amount: 3800, date: '2026-10-06', paymentMethod: 'cash' },
    ];
    this.secondaryIncome = loadFromStorage('secondaryIncome', initialSecondaryIncome);

    const initialMonthClosings: MonthClosingRecord[] = [
      { id: 'mc-9-2026', month: 9, year: 2026, isClosed: true, closedAt: '2026-09-30', closedBy: 'Nihel', totalIncome: 145000, totalExpenses: 92000, netProfit: 53000 }
    ];
    this.monthClosings = loadFromStorage('monthClosings', initialMonthClosings);

    // Load saved persistent auth session (النقطة 1: حفظ جلسة الدخول)
    this.currentUser = loadFromStorage<User | null>('auth_session', null);
    // مطابقة اسم الإدارة في الجلسة المحفوظة وفي السجلات مع الاسم الحالي
    if (this.currentUser?.role === 'admin' && this.currentUser.name !== ADMIN_USER.name) {
      this.currentUser = { ...this.currentUser, name: ADMIN_USER.name, roleLabelAr: ADMIN_USER.roleLabelAr };
      this.save('auth_session', this.currentUser);
    }
    this.migrateLegacyAdminName();
    this.migrateKidsAreaToPreKg();
    if (this.currentUser?.role === 'teacher' && this.currentUser.teacherId) {
      const teachers = loadFromStorage<Teacher[]>('teachers', []);
      if (!teachers.some(t => t.id === this.currentUser?.teacherId)) {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'deleted_notice', '1');
        this.currentUser = null;
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_session');
      }
    }
    if (this.currentUser?.role === 'parent' && this.currentUser.childId) {
      const childStillExists = this.children.some(c => c.id === this.currentUser?.childId);
      if (!childStillExists) {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'deleted_notice', '1');
        this.currentUser = null;
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_session');
      }
    }

    // سجل الحضور: لا نُنشئ أي حالة تلقائياً. الحالة تُسجَّل فقط بمسح QR أو يدوياً من الإدارة.
    this.attendance = loadFromStorage<AttendanceRecord[]>('attendance', []);

    // الرسوم الشهرية: تُحمَّل المحفوظة، ثم تُنشأ تلقائياً رسوم الشهر الحالي لكل طفل ليس لديه سجل
    const loadedFees = loadFromStorage<ChildMonthlyFee[]>('monthlyFees', INITIAL_MONTHLY_FEES);
    {
      const { month, year } = currentPeriod();
      const have = new Set(loadedFees.filter(f => f.month === month && f.year === year).map(f => f.childId));
      this.children
        .filter(c => c.status !== 'withdrawn' && c.status !== 'graduated')
        .forEach(child => {
          if (!have.has(child.id)) {
            loadedFees.push({
              id: `fee-${child.id}-${month}-${year}`,
              childId: child.id,
              month,
              year,
              baseFee: child.monthlyFee,
              discount: 0,
              activitiesFee: 0,
              totalRequired: child.monthlyFee,
              paidAmount: 0,
              remainingAmount: child.monthlyFee,
              status: 'unpaid',
            });
          }
        });
    }

    // Clean up any previously stored +200 additions so fee matches registered child fee exactly
    loadedFees.forEach(f => {
      if (f.activitiesFee === 200) {
        f.activitiesFee = 0;
        f.totalRequired = f.baseFee;
        f.remainingAmount = Math.max(0, f.totalRequired - f.paidAmount);
        f.status = f.remainingAmount === 0 ? 'paid' : (f.paidAmount > 0 ? 'partial' : 'unpaid');
      }
    });

    this.monthlyFees = loadedFees;
    this.save('monthlyFees', this.monthlyFees);
  }

  public static getInstance(): NurseryStorageService {
    if (!NurseryStorageService.instance) {
      NurseryStorageService.instance = new NurseryStorageService();
    }
    return NurseryStorageService.instance;
  }

  public resetToDemoData(): void {
    // نحتفظ بنوع الجهاز (إدارة / ولي أمر) حتى لا تظهر شاشة الاسم من جديد
    const keptDeviceRole = localStorage.getItem('mbk_device_role_v1');
    localStorage.clear();
    if (keptDeviceRole) localStorage.setItem('mbk_device_role_v1', keptDeviceRole);
    this.settings = INITIAL_SETTINGS;
    this.levels = INITIAL_LEVELS;
    this.classes = INITIAL_CLASSES;
    this.guardians = INITIAL_GUARDIANS;
    this.children = INITIAL_CHILDREN;
    this.pickupPersons = INITIAL_PICKUP_PERSONS;
    this.receipts = INITIAL_RECEIPTS;
    this.expenses = INITIAL_EXPENSES;
    this.dailyReports = INITIAL_DAILY_REPORTS;
    this.evaluations = INITIAL_EVALUATIONS;
    this.auditLogs = INITIAL_AUDIT_LOGS;
    this.attendance = [];
    this.monthlyFees = INITIAL_MONTHLY_FEES;
    this.kidsAreaSessions = INITIAL_KIDS_AREA_SESSIONS;
    this.galleryPhotos = [];
    this.currentUser = null;

    this.save('settings', this.settings);
    this.save('levels', this.levels);
    this.save('classes', this.classes);
    this.save('guardians', this.guardians);
    this.save('children', this.children);
    this.save('pickupPersons', this.pickupPersons);
    this.save('receipts', this.receipts);
    this.save('expenses', this.expenses);
    this.save('dailyReports', this.dailyReports);
    this.save('evaluations', this.evaluations);
    this.save('auditLogs', this.auditLogs);
    this.save('attendance', this.attendance);
    this.save('monthlyFees', this.monthlyFees);
    this.save('kidsAreaSessions', this.kidsAreaSessions);
  }

  public updateLogo(logoUrl: string): void {
    this.settings = { ...this.settings, logoUrl };
    this.save('settings', this.settings);
    this.logAudit('تحديث الشعار', 'تم تحديث الشعار الرسمي لحضانة Modern British Kids بنجاح');
  }

  public updateLoginBackground(loginBackgroundUrl: string): void {
    this.settings = { ...this.settings, loginBackgroundUrl };
    this.save('settings', this.settings);
    this.logAudit('تحديث الخلفية', 'تم تحديث صورة خلفية شاشة تسجيل الدخول بالكامل بنجاح');
  }

  /** رسالة تظهر لولي الأمر عند محاولة الدخول بحساب حذفته الإدارة */
  public static readonly DELETED_ACCOUNT_MESSAGE = 'تم حذف هذا الحساب. يرجى التواصل مع إدارة الحضانة.';

  private static normAccountId(v: string): string {
    return v.trim().toLowerCase().replace(/^id-/, '');
  }

  /** هل حُذف حساب ولي الأمر لهذا المعرف؟ (ولا يوجد طفل حالي بنفس المعرف) */
  private isDeletedAccount(input: string): boolean {
    const id = NurseryStorageService.normAccountId(input);
    return !!id && loadFromStorage<string[]>('deletedParentAccounts', []).includes(id);
  }

  /** يرجع true مرة واحدة إذا انتهت جلسة ولي أمر لأن حسابه حُذف */
  public consumeDeletedNotice(): boolean {
    const key = STORAGE_KEY_PREFIX + 'deleted_notice';
    const has = localStorage.getItem(key) === '1';
    if (has) localStorage.removeItem(key);
    return has;
  }

  public deleteChild(childId: string): { success: boolean; message: string } {
    const childIndex = this.children.findIndex(c => c.id === childId);
    if (childIndex === -1) {
      return { success: false, message: 'لم يتم العثور على الطالب المطلوب حذفه!' };
    }

    const child = this.children[childIndex];
    const childName = child.fullName;
    const childStudentId = child.studentId;

    // تذكّر معرف الحساب المحذوف ليظهر لولي الأمر رسالة واضحة عند محاولة الدخول
    {
      const ids = new Set(loadFromStorage<string[]>('deletedParentAccounts', []));
      ids.add(NurseryStorageService.normAccountId(child.studentId));
      if (child.code) ids.add(NurseryStorageService.normAccountId(child.code));
      this.save('deletedParentAccounts', Array.from(ids));
    }

    // Remove child
    this.children = this.children.filter(c => c.id !== childId);
    this.save('children', this.children);

    // Remove associated child attendance
    this.attendance = this.attendance.filter(a => a.childId !== childId);
    this.save('attendance', this.attendance);

    // Remove associated monthly fees
    this.monthlyFees = this.monthlyFees.filter(f => f.childId !== childId);
    this.save('monthlyFees', this.monthlyFees);

    // Remove daily reports & evaluations
    this.dailyReports = this.dailyReports.filter(r => r.childId !== childId);
    this.save('dailyReports', this.dailyReports);

    this.evaluations = this.evaluations.filter(e => e.childId !== childId);
    this.save('evaluations', this.evaluations);

    // Remove kids area sessions if any
    this.kidsAreaSessions = this.kidsAreaSessions.filter(s => s.childId !== childId);
    this.save('kidsAreaSessions', this.kidsAreaSessions);

    // Remove the child's gallery photos
    this.galleryPhotos = this.galleryPhotos.filter(p => p.childId !== childId);
    this.save('galleryPhotos', this.galleryPhotos);
    void deleteVideosForChild(childId);

    // Remove receipts
    this.receipts = this.receipts.filter(r => r.childId !== childId);
    this.save('receipts', this.receipts);

    // Remove parent user accounts
    this.users = this.users.filter(u => u.childId !== childId && u.username !== childStudentId);
    this.save('users', this.users);

    // If current logged in user is this child's parent, clear session
    if (this.currentUser?.role === 'parent' && (this.currentUser.childId === childId || this.currentUser.username === childStudentId)) {
      this.currentUser = null;
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_session');
    }

    // Log audit
    this.logAudit('حذف طالب', `تم حذف الطالب (${childName} - ID: ${childStudentId}) وكافة سجلاته وحساباته نهائياً من النظام`);

    return { success: true, message: `تم حذف الطالب (${childName}) وكافة سجلاته وحساب ولي الأمر نهائياً بنجاح ✅` };
  }

  public clearAllData(): void {
    this.children = [];
    this.guardians = [];
    this.attendance = [];
    this.monthlyFees = [];
    this.receipts = [];
    this.expenses = [];
    this.dailyReports = [];
    this.evaluations = [];
    this.kidsAreaSessions = [];
    this.galleryPhotos = [];
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'galleryPhotos');
    listVideos().forEach(v => void deleteVideo(v.id));
    this.pickupPersons = [];
    this.users = this.users.filter(u => u.role !== 'parent');
    this.save('pickupPersons', this.pickupPersons);
    this.save('users', this.users);
    this.save('children', this.children);
    this.save('guardians', this.guardians);
    this.save('attendance', this.attendance);
    this.save('monthlyFees', this.monthlyFees);
    this.save('receipts', this.receipts);
    this.save('expenses', this.expenses);
    this.save('dailyReports', this.dailyReports);
    this.save('evaluations', this.evaluations);
    this.save('kidsAreaSessions', this.kidsAreaSessions);
  }

  // ---------------- الإشعارات ----------------
  private notifyParent(childId: string, type: NotifType, title: string, body: string, dedupeKey?: string): void {
    pushNotification(recipientParent(childId), { type, title, body, dedupeKey });
  }

  private notifyAdmin(type: NotifType, title: string, body: string, dedupeKey?: string): void {
    pushNotification(RECIPIENT_ADMIN, { type, title, body, dedupeKey });
  }

  /** مفاتيح مستلمين: أولياء أمور الأطفال النشطين */
  private allParentRecipients(): string[] {
    return this.children.filter(c => c.status === 'active').map(c => recipientParent(c.id));
  }

  /** إشعار الأهالي برفع وسائط (childId أو 'all') */
  public notifyMedia(kind: 'photo' | 'video', childId: string, count: number): void {
    const to = childId === 'all' ? this.allParentRecipients() : [recipientParent(childId)];
    const label = kind === 'photo' ? `${count} صورة جديدة 📸` : `${count} فيديو جديد 🎬`;
    pushNotification(to, {
      type: kind,
      title: kind === 'photo' ? 'صور جديدة 📸' : 'فيديو جديد 🎬',
      body: childId === 'all' ? `تمت إضافة ${label} من أنشطة الحضانة.` : `تمت إضافة ${label} لطفلك.`,
    });
  }

  /** إرسال إعلان من الإدارة. يرجع عدد المستلمين */
  public sendAnnouncement(
    audience: { kind: 'all' | 'parents' | 'parent' | 'teachers' | 'teacher'; id?: string },
    title: string,
    body: string
  ): number {
    const parents = this.allParentRecipients();
    const teachers = this.teachers.filter(t => t.active).map(t => recipientTeacher(t.id));
    let to: string[] = [];
    if (audience.kind === 'all') to = [...parents, ...teachers];
    else if (audience.kind === 'parents') to = parents;
    else if (audience.kind === 'parent' && audience.id) to = [recipientParent(audience.id)];
    else if (audience.kind === 'teachers') to = teachers;
    else if (audience.kind === 'teacher' && audience.id) to = [recipientTeacher(audience.id)];
    const n = pushNotification(to, { type: 'announcement', title: title.trim() || 'إعلان من الإدارة', body: body.trim(), from: 'الإدارة' });
    this.logAudit('إرسال إشعار', `تم إرسال إشعار "${title}" إلى ${n} مستلم`);
    return n;
  }

  /** تنبيهات يومية تلقائية للمستخدم الحالي (مرة واحدة لكل مناسبة) */
  public refreshAlertsFor(user: User): void {
    if (!NOTIFICATIONS_ENABLED) return;
    const today = this.todayDateStr();
    const now = new Date();
    const md = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const { month, year } = currentPeriod();
    const ym = `${year}-${month}`;
    if (user.role === 'admin') {
      const unpaid = this.getMonthFees().filter(f => f.remainingAmount > 0);
      if (unpaid.length) {
        const total = unpaid.reduce((n, f) => n + f.remainingAmount, 0);
        this.notifyAdmin('alert', `متأخرات مصروفات شهر ${MONTH_NAMES_AR[month - 1]}`, `${unpaid.length} طفل لم يسددوا رسوم الشهر بعد (إجمالي ${total.toLocaleString()} ج.م).`, `arrears:${ym}`);
      }
      const bd = this.children.filter(c => c.status === 'active' && (c.birthDate || '').slice(5) === md);
      if (bd.length) this.notifyAdmin('alert', 'عيد ميلاد اليوم 🎉', bd.map(c => c.fullName).join('، '), `bday:${today}`);
      const absent = this.getAttendanceSummary().absent;
      if (absent > 0) this.notifyAdmin('alert', 'غياب اليوم', `${absent} طفل لم يُسجَّل حضورهم اليوم بعد موعد 08:30 ص.`, `absent:${today}`);
    } else if (user.role === 'parent' && user.childId) {
      const child = this.children.find(c => c.id === user.childId);
      if (!child) return;
      const fee = this.getMonthFees().find(f => f.childId === child.id && f.remainingAmount > 0);
      if (fee) this.notifyParent(child.id, 'payment', `تذكير بمصروفات شهر ${MONTH_NAMES_AR[month - 1]}`, `المتبقي ${fee.remainingAmount.toLocaleString()} ج.م. يرجى السداد في أقرب وقت.`, `fee:${child.id}:${ym}`);
      if ((child.birthDate || '').slice(5) === md) this.notifyParent(child.id, 'alert', `كل عام و${child.fullName} بخير 🎂`, 'تتمنى لكم الحضانة يوماً سعيداً.', `bday:${child.id}:${today}`);
    } else if (user.role === 'teacher' && user.teacherId) {
      const kids = this.getTeacherChildren(user.teacherId);
      const absent = kids.filter(c => this.getAttendanceView(c.id).status === 'absent');
      if (absent.length) pushNotification(recipientTeacher(user.teacherId), { type: 'alert', title: 'غياب اليوم في فصولك', body: absent.map(c => c.fullName).join('، '), dedupeKey: `absent:${today}` });
    }
  }

  private save<T>(key: string, value: T): void {
    saveToStorage(key, value);
    queuePush(key, value);
  }

  // ---------------- المزامنة السحابية ----------------
  private changeListeners = new Set<() => void>();
  private changeTimer: ReturnType<typeof setTimeout> | null = null;

  /** الاشتراك في تغييرات البيانات القادمة من الأجهزة الأخرى (لإعادة رسم الشاشة) */
  public subscribe(cb: () => void): () => void {
    this.changeListeners.add(cb);
    return () => { this.changeListeners.delete(cb); };
  }

  private emitChange(): void {
    if (this.changeTimer) return;
    this.changeTimer = setTimeout(() => {
      this.changeTimer = null;
      this.changeListeners.forEach(cb => { try { cb(); } catch { /* ignore */ } });
    }, 300);
  }

  /** تطبيق بيانات وصلت من السحابة (دون إعادة رفعها) */
  public applyRemote(key: string, value: unknown): void {
    if (key === 'settings' && value && typeof value === 'object') {
      const v = value as Record<string, any>;
      value = { ...v, loginBackgroundUrl: v.loginBackgroundUrl || DEFAULT_LOGIN_BACKGROUND_DATA_URL };
    }
    if (key !== 'deletedParentAccounts' && key !== 'deletedTeacherAccounts') (this as any)[key] = value;
    saveToStorage(key, value);
    this.emitChange();
  }

  public cloudBridge(): LocalBridge {
    return {
      getAll: () => {
        const out: Record<string, unknown> = {};
        SYNC_COLLECTIONS.forEach(k => { out[k] = (this as any)[k]; });
        SYNC_DOCS.forEach(k => {
          out[k] = (k === 'settings') ? this.settings : loadFromStorage<string[]>(k, []);
        });
        return out;
      },
      apply: (k, v) => this.applyRemote(k, v),
    };
  }

  public logAudit(action: string, details: string): void {
    const today = localDateStr();
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: `${today} ${time}`,
      userId: this.currentUser?.id || 'sys',
      userName: this.currentUser?.name || 'Nihel',
      userRole: this.currentUser?.role || 'admin',
      action,
      details,
    };
    this.auditLogs = [newLog, ...this.auditLogs];
    this.save('auditLogs', this.auditLogs);
  }

  // --- AUTHENTICATION & SESSIONS (النقطة 1 و 12) ---
  // ---------------- حسابات المعلمين (تنشئها الإدارة فقط) ----------------

  private normalizeUsername(u: string): string {
    return u.trim().toLowerCase();
  }

  /** إنشاء حساب معلم: الاسم، المادة، اسم المستخدم، كلمة المرور، والفصول المسندة */
  public addTeacher(data: {
    fullName: string;
    subject: string;
    username: string;
    password: string;
    classIds: string[];
    phone?: string;
  }): { success: boolean; message: string; teacher?: Teacher } {
    const fullName = data.fullName.trim();
    const subject = data.subject.trim();
    const username = data.username.trim();
    if (!fullName) return { success: false, message: 'اكتب اسم المعلم.' };
    if (!subject) return { success: false, message: 'اكتب المادة التي يدرّسها المعلم.' };
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) {
      return { success: false, message: 'اسم المستخدم: من 3 إلى 30 حرفاً إنجليزياً أو أرقاماً (يُسمح بـ _ . -) بدون مسافات.' };
    }
    if (data.password.length < 6) return { success: false, message: 'كلمة المرور يجب ألا تقل عن 6 خانات.' };
    if (data.classIds.length === 0) return { success: false, message: 'اختر فصلاً واحداً على الأقل للمعلم.' };
    if (this.teachers.some(t => this.normalizeUsername(t.username) === this.normalizeUsername(username))) {
      return { success: false, message: 'اسم المستخدم مستخدم لمعلم آخر. اختر اسماً مختلفاً.' };
    }

    const salt = uid('salt');
    const teacher: Teacher = {
      id: uid('tch'),
      fullName,
      subject,
      username,
      passwordSalt: salt,
      passwordHash: hashPassword(data.password, salt),
      classIds: data.classIds,
      phone: data.phone?.trim() || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.teachers = [teacher, ...this.teachers];
    this.save('teachers', this.teachers);
    this.logAudit('إنشاء حساب معلم', `تم إنشاء حساب المعلم ${fullName} (${subject}) باسم المستخدم ${username}`);
    return { success: true, message: 'تم إنشاء حساب المعلم بنجاح.', teacher };
  }

  public updateTeacher(
    id: string,
    patch: { fullName?: string; subject?: string; classIds?: string[]; phone?: string; active?: boolean }
  ): { success: boolean; message: string } {
    const t = this.teachers.find(x => x.id === id);
    if (!t) return { success: false, message: 'المعلم غير موجود.' };
    if (patch.fullName !== undefined && !patch.fullName.trim()) return { success: false, message: 'اكتب اسم المعلم.' };
    if (patch.subject !== undefined && !patch.subject.trim()) return { success: false, message: 'اكتب المادة.' };
    if (patch.classIds !== undefined && patch.classIds.length === 0) return { success: false, message: 'اختر فصلاً واحداً على الأقل.' };
    this.teachers = this.teachers.map(x =>
      x.id === id
        ? {
            ...x,
            fullName: patch.fullName?.trim() ?? x.fullName,
            subject: patch.subject?.trim() ?? x.subject,
            classIds: patch.classIds ?? x.classIds,
            phone: patch.phone !== undefined ? patch.phone.trim() || undefined : x.phone,
            active: patch.active ?? x.active,
          }
        : x
    );
    this.save('teachers', this.teachers);
    this.logAudit('تعديل حساب معلم', `تم تعديل بيانات المعلم ${t.fullName}`);
    if (patch.classIds) pushNotification(recipientTeacher(id), { type: 'system', title: 'تم تحديث فصولك', body: 'قامت الإدارة بتعديل الفصول المسندة إليك.' });
    return { success: true, message: 'تم حفظ التعديلات.' };
  }

  public resetTeacherPassword(id: string, newPassword: string): { success: boolean; message: string } {
    const t = this.teachers.find(x => x.id === id);
    if (!t) return { success: false, message: 'المعلم غير موجود.' };
    if (newPassword.length < 6) return { success: false, message: 'كلمة المرور يجب ألا تقل عن 6 خانات.' };
    const salt = uid('salt');
    this.teachers = this.teachers.map(x => (x.id === id ? { ...x, passwordSalt: salt, passwordHash: hashPassword(newPassword, salt) } : x));
    this.save('teachers', this.teachers);
    this.logAudit('تغيير كلمة مرور معلم', `تم تعيين كلمة مرور جديدة للمعلم ${t.fullName}`);
    return { success: true, message: 'تم تغيير كلمة المرور.' };
  }

  public deleteTeacher(id: string): void {
    const t = this.teachers.find(x => x.id === id);
    if (t) {
      const names = new Set(loadFromStorage<string[]>('deletedTeacherAccounts', []));
      names.add(this.normalizeUsername(t.username));
      this.save('deletedTeacherAccounts', Array.from(names));
    }
    this.teachers = this.teachers.filter(x => x.id !== id);
    this.save('teachers', this.teachers);
    if (t) this.logAudit('حذف حساب معلم', `تم حذف حساب المعلم ${t.fullName}`);
    if (this.currentUser?.teacherId === id) this.logout();
  }

  /** الفصول المسندة للمعلم */
  public getTeacherClasses(teacherId: string): NurseryClass[] {
    const t = this.teachers.find(x => x.id === teacherId);
    return t ? this.classes.filter(c => t.classIds.includes(c.id)) : [];
  }

  /** أطفال المعلم فقط: الأطفال النشطون في مراحل الفصول المسندة له */
  public getTeacherChildren(teacherId: string): Child[] {
    const levels = new Set(this.getTeacherClasses(teacherId).map(c => c.levelId));
    return this.children.filter(c => c.status === 'active' && levels.has(c.levelId));
  }

  /** تسجيل دخول المعلم (مع قفل مؤقت بعد 3 محاولات خاطئة) */
  public loginTeacher(
    usernameInput: string,
    passwordInput: string
  ): { success: boolean; message: string; user?: User; lockedSeconds?: number } {
    const locked = getLockSeconds('teacher');
    if (locked > 0) return { success: false, message: lockMessage(locked), lockedSeconds: locked };

    const username = usernameInput.trim();
    if (!username || !passwordInput) return { success: false, message: 'اكتب اسم المستخدم وكلمة المرور.' };

    const t = this.teachers.find(x => this.normalizeUsername(x.username) === this.normalizeUsername(username));
    if (!t && loadFromStorage<string[]>('deletedTeacherAccounts', []).includes(this.normalizeUsername(username))) {
      return { success: false, message: NurseryStorageService.DELETED_ACCOUNT_MESSAGE };
    }
    if (!t || hashPassword(passwordInput, t.passwordSalt) !== t.passwordHash) {
      return this.failedLogin('teacher', 'اسم المستخدم أو كلمة المرور غير صحيحة!');
    }
    if (!t.active) {
      return { success: false, message: 'هذا الحساب موقوف. تواصل مع إدارة الحضانة.' };
    }

    recordSuccess('teacher');
    const user: User = {
      id: `u-teacher-${t.id}`,
      name: t.fullName,
      username: t.username,
      role: 'teacher',
      roleLabelAr: `معلم/ة ${t.subject}`,
      avatar: '👩‍🏫',
      phone: t.phone,
      teacherId: t.id,
    };
    this.currentUser = user;
    this.save('auth_session', user);
    this.logAudit('تسجيل دخول معلم', `دخول المعلم ${t.fullName} (${t.subject})`);
    return { success: true, message: `أهلاً بك ${t.fullName}!`, user };
  }

  /** نتيجة محاولة دخول فاشلة مع احتساب القفل المؤقت */
  private failedLogin(kind: 'admin' | 'parent' | 'teacher', baseMessage: string): { success: false; message: string; lockedSeconds?: number } {
    const f = recordFailure(kind);
    if (f.locked) return { success: false, message: lockMessage(f.lockedSeconds), lockedSeconds: f.lockedSeconds };
    return { success: false, message: `${baseMessage} (متبقي ${f.attemptsLeft} من ${MAX_FAILED_ATTEMPTS} محاولات)` };
  }

  public loginAdmin(usernameInput: string, passwordInput: string): { success: boolean; message: string; user?: User; lockedSeconds?: number } {
    const locked = getLockSeconds('admin');
    if (locked > 0) return { success: false, message: lockMessage(locked), lockedSeconds: locked };

    const cleanUser = usernameInput.trim();
    const cleanPass = passwordInput.trim();

    // Check fixed credentials: Modern British / Kids340
    if (cleanUser === 'Modern British' && cleanPass === 'Kids340') {
      recordSuccess('admin');
      const user = { ...ADMIN_USER };
      this.currentUser = user;
      this.save('auth_session', user);
      void seedCloudIfNeeded();
      this.logAudit('تسجيل دخول الإدارة', `تم تسجيل الدخول بنجاح لحساب الإدارة: Nihel`);
      return { success: true, message: 'أهلاً بك Nihel! تم تسجيل الدخول بنجاح', user };
    }

    return this.failedLogin('admin', 'اسم المستخدم أو كلمة المرور غير صحيحة للإدارة!');
  }

  public registerParent(
    studentIdInput: string,
    guardianNameInput: string,
    passwordInput: string,
    _childNameInput?: string
  ): { success: boolean; message: string; user?: User; child?: Child; lockedSeconds?: number } {
    const locked = getLockSeconds('parent');
    if (locked > 0) return { success: false, message: lockMessage(locked), lockedSeconds: locked };

    const cleanId = studentIdInput.trim();
    const cleanName = guardianNameInput.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanId) {
      return { success: false, message: 'يرجى إدخال معرف الطالب (Student ID)!' };
    }
    if (!cleanName) {
      return { success: false, message: 'يرجى إدخال اسم ولي الأمر الكامل!' };
    }
    if (!cleanPass || cleanPass.length < 3) {
      return { success: false, message: 'كلمة المرور يجب أن تتكون من 3 خانات أو أرقام على الأقل!' };
    }

    // Find if child is already registered in the nursery administration records
    const child = this.children.find(c => 
      c.studentId === cleanId || 
      c.code.toLowerCase() === cleanId.toLowerCase() ||
      c.code.replace('ID-', '') === cleanId
    );

    // CRITICAL USER REQUIREMENT:
    // "طلامه الطالب مش موجود في سيستم الاداره مينفعش يسجل بيه ولي الامر"
    // As long as the student is NOT registered by admin, parent CANNOT register!
    if (!child && this.isDeletedAccount(cleanId)) {
      return { success: false, message: NurseryStorageService.DELETED_ACCOUNT_MESSAGE };
    }
    if (!child) {
      return this.failedLogin('parent', `معرف الطالب (${cleanId}) غير مسجل في سيستم إدارة الحضانة! لا يمكن لولي الأمر إنشاء حساب قبل تسجيل الطالب من الإدارة.`);
    }

    // التحقق من أن الاسم المدخل هو نفس اسم ولي الأمر المسجل في الإدارة
    const registeredGuardian = this.guardians.find(g => g.id === child.guardianId);
    if (
      !registeredGuardian ||
      normalizeArabicName(registeredGuardian.fullName) !== normalizeArabicName(cleanName)
    ) {
      return this.failedLogin('parent', 'ولي الأمر المسجل غير صحيح! الاسم المدخل لا يطابق اسم ولي الأمر المسجل لدى إدارة الحضانة.');
    }

    recordSuccess('parent');
    // حفظ كلمة مرور ولي الأمر (اسم ولي الأمر يبقى كما سجلته الإدارة)
    child.password = cleanPass;
    this.save('children', this.children);

    const parentUser: User = {
      id: `u-parent-${child.id}`,
      name: registeredGuardian.fullName,
      role: 'parent',
      roleLabelAr: `ولي أمر الطالب (${child.fullName.split(' ')[0]})`,
      avatar: '👨‍👧',
      childId: child.id,
      username: child.studentId,
      password: cleanPass,
    };

    // Save user to users list
    this.users = this.users.filter(u => u.childId !== child.id && u.username !== child.studentId);
    this.users.push(parentUser);
    this.save('users', this.users);

    this.logAudit('تسجيل حساب ولي أمر', `تم إنشاء وتفعيل حساب ولي أمر جديد للطالب: ${child.fullName} (ID: ${child.studentId}) باسم: ${cleanName}`);
    this.notifyAdmin('system', 'ولي أمر جديد 👪', `سجّل ${cleanName} حساباً لمتابعة ${child.fullName}.`);

    return { 
      success: true, 
      message: `تم إنشاء حساب ولي الأمر للطالب (${child.fullName}) بنجاح! 🎉`, 
      user: parentUser, 
      child 
    };
  }

  public resetParentPassword(
    studentIdInput: string,
    guardianNameInput: string,
    newPasswordInput: string,
    confirmPasswordInput: string
  ): { success: boolean; message: string; lockedSeconds?: number } {
    const locked = getLockSeconds('parent');
    if (locked > 0) return { success: false, message: lockMessage(locked), lockedSeconds: locked };

    const cleanId = studentIdInput.trim();
    const cleanName = guardianNameInput.trim();
    const newPass = newPasswordInput.trim();
    const confirmPass = confirmPasswordInput.trim();

    if (!cleanId) {
      return { success: false, message: 'يرجى إدخال معرف الطالب (Student ID)!' };
    }
    if (!cleanName) {
      return { success: false, message: 'يرجى إدخال اسم ولي الأمر كما هو مسجل في الحضانة!' };
    }
    if (!newPass || newPass.length < 3) {
      return { success: false, message: 'كلمة المرور الجديدة يجب أن تتكون من 3 خانات أو أرقام على الأقل!' };
    }
    if (newPass !== confirmPass) {
      return { success: false, message: 'تأكيد كلمة المرور غير متطابق مع كلمة المرور الجديدة!' };
    }

    const child = this.children.find(c =>
      c.studentId === cleanId ||
      c.code.toLowerCase() === cleanId.toLowerCase() ||
      c.code.replace('ID-', '') === cleanId
    );
    if (!child && this.isDeletedAccount(cleanId)) {
      return { success: false, message: NurseryStorageService.DELETED_ACCOUNT_MESSAGE };
    }
    if (!child) {
      return this.failedLogin('parent', `معرف الطالب (${cleanId}) غير مسجل في نظام إدارة الحضانة!`);
    }

    const registeredGuardian = this.guardians.find(g => g.id === child.guardianId);
    if (
      !registeredGuardian ||
      normalizeArabicName(registeredGuardian.fullName) !== normalizeArabicName(cleanName)
    ) {
      return this.failedLogin('parent', 'ولي الأمر المسجل غير صحيح! الاسم المدخل لا يطابق اسم ولي الأمر المسجل لدى إدارة الحضانة.');
    }

    recordSuccess('parent');
    child.password = newPass;
    this.save('children', this.children);
    this.users = this.users.map(u => (u.childId === child.id ? { ...u, password: newPass } : u));
    this.save('users', this.users);

    this.logAudit('استعادة كلمة مرور ولي أمر', `تم تعيين كلمة مرور جديدة لحساب ولي أمر الطالب: ${child.fullName} (ID: ${child.studentId})`);
    return { success: true, message: 'تم تعيين كلمة المرور الجديدة بنجاح! 🎉 يمكنك الآن تسجيل الدخول.' };
  }

  public loginParent(studentIdInput: string, passwordInput: string): { success: boolean; message: string; user?: User; child?: Child; lockedSeconds?: number } {
    const locked = getLockSeconds('parent');
    if (locked > 0) return { success: false, message: lockMessage(locked), lockedSeconds: locked };

    const cleanId = studentIdInput.trim();
    const cleanPass = passwordInput.trim();

    if (!cleanId) {
      return { success: false, message: 'يرجى إدخال معرف الطالب (Student ID)!' };
    }
    if (!cleanPass) {
      return { success: false, message: 'يرجى إدخال كلمة المرور!' };
    }

    // Find child by studentId or code
    const child = this.children.find(c => 
      c.studentId === cleanId || 
      c.code.toLowerCase() === cleanId.toLowerCase() ||
      c.code.replace('ID-', '') === cleanId
    );

    // If child is not in admin system (or was deleted by admin)
    if (!child && this.isDeletedAccount(cleanId)) {
      return { success: false, message: NurseryStorageService.DELETED_ACCOUNT_MESSAGE };
    }
    if (!child) {
      return this.failedLogin('parent', `معرف الطالب (${cleanId}) غير مسجل في نظام إدارة الحضانة أو تم حذفه من قِبل الإدارة!`);
    }

    // Valid password must match chosen password or child.studentId
    const validPassword = child.password || child.studentId;
    if (cleanPass !== validPassword) {
      return this.failedLogin('parent', 'كلمة المرور غير صحيحة لحساب ولي الأمر!');
    }
    recordSuccess('parent');

    const guardian = this.guardians.find(g => g.id === child.guardianId);
    const parentUser: User = {
      id: `u-parent-${child.id}`,
      name: guardian?.fullName || `ولي أمر ${child.fullName.split(' ')[0]}`,
      role: 'parent',
      roleLabelAr: `ولي أمر الطالب (${child.fullName.split(' ')[0]})`,
      avatar: '👨‍👧',
      phone: guardian?.phone,
      childId: child.id,
      username: child.studentId,
    };

    this.currentUser = parentUser;
    this.save('auth_session', parentUser);
    this.logAudit('تسجيل دخول ولي أمر', `دخول ولي أمر الطالب: ${child.fullName} (ID: ${child.studentId})`);

    return { success: true, message: `أهلاً بك يا ${parentUser.name}!`, user: parentUser, child };
  }

  public logout(): void {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_session');
  }

  // --- ATTENDANCE ACTIONS (النقطة 6: الحضور 7:30 إلى 8:30 و 15: الخروج 14:00) ---
  // ---------------- حالة الحضور المشتقة ----------------

  private todayDateStr(): string {
    return localDateStr();
  }

  /** هل اليوم يوم عمل؟ (يوجد فيه أي تسجيل حضور، أو اليوم الحالي وليس إجازة أسبوعية) */
  public isWorkingDay(date: string): boolean {
    if (this.attendance.some(a => a.date === date)) return true;
    if (date === this.todayDateStr()) return !WEEKEND_DAYS.includes(new Date().getDay());
    return false;
  }

  /**
   * حالة حضور الطفل في يوم معيّن:
   *  - يوجد تسجيل (QR أو يدوي)           => حالته كما هي
   *  - طفل سُجّل اليوم (أو بعد هذا اليوم) => none (لا توجد حالة)
   *  - يوم إجازة / لا عمل                 => none
   *  - يوم سابق بدون تسجيل                => absent (غائب)
   *  - اليوم الحالي بدون تسجيل             => pending قبل 08:30 ص، وبعدها absent
   */
  public getAttendanceView(
    childId: string,
    date: string = this.todayDateStr(),
    nowMinutes: number = new Date().getHours() * 60 + new Date().getMinutes()
  ): { status: AttendanceViewStatus; record?: AttendanceRecord; derived: boolean } {
    const record = this.attendance.find(a => a.childId === childId && a.date === date);
    if (record) return { status: record.status, record, derived: false };

    const child = this.children.find(c => c.id === childId);
    if (!child) return { status: 'none', derived: false };
    if (date <= (child.enrollmentDate || '')) return { status: 'none', derived: false };
    if (!this.isWorkingDay(date)) return { status: 'none', derived: false };

    const today = this.todayDateStr();
    if (date < today) return { status: 'absent', derived: true };
    if (date === today) {
      return nowMinutes > ATTENDANCE_LATE_AFTER_MINUTES
        ? { status: 'absent', derived: true }
        : { status: 'pending', derived: false };
    }
    return { status: 'none', derived: false };
  }

  /** ملخص حضور اليوم لمجموعة أطفال (الأطفال النشطون افتراضياً) */
  public getAttendanceSummary(
    children: Child[] = this.children.filter(c => c.status === 'active'),
    date: string = this.todayDateStr()
  ): { present: number; late: number; absent: number; leave: number; pending: number; none: number; total: number } {
    const out = { present: 0, late: 0, absent: 0, leave: 0, pending: 0, none: 0, total: children.length };
    children.forEach(c => {
      out[this.getAttendanceView(c.id, date).status]++;
    });
    return out;
  }

  /** سجل حضور الطفل: التسجيلات الفعلية + أيام الغياب التي لم يُمسح فيها QR (أيام العمل السابقة) */
  public getAttendanceHistory(childId: string): AttendanceRecord[] {
    const records = this.attendance.filter(a => a.childId === childId);
    const child = this.children.find(c => c.id === childId);
    const today = this.todayDateStr();
    const have = new Set(records.map(r => r.date));
    const derived: AttendanceRecord[] = [];
    if (child) {
      const workingDates = Array.from(new Set(this.attendance.map(a => a.date)));
      workingDates.forEach(d => {
        if (d < today && d > (child.enrollmentDate || '') && !have.has(d)) {
          derived.push({
            id: `derived-${childId}-${d}`,
            childId,
            date: d,
            status: 'absent',
            method: 'manual',
            recordedByUserId: 'system',
          } as AttendanceRecord);
        }
      });
    }
    return [...records, ...derived].sort((a, b) => b.date.localeCompare(a.date));
  }

  public recordQrScan(childId: string): { 
    success: boolean; 
    message: string; 
    record?: AttendanceRecord; 
    child?: Child; 
    actionType?: 'check_in' | 'check_out';
    statusType?: AttendanceStatus;
  } {
    const child = this.children.find(c => c.id === childId);
    if (!child) {
      return { success: false, message: 'الطفل غير مسجل بالنظام!' };
    }

    const now = Date.now();
    const lastSwipe = this.lastSwipeMap.get(childId) || 0;
    // Anti-bounce: prevent swipes within 4 seconds
    if (now - lastSwipe < 4000) {
      const waitSec = Math.ceil((4000 - (now - lastSwipe)) / 1000);
      return { 
        success: false, 
        message: `تم قراءة كود QR بالفعل! يرجى الانتظار ${waitSec} ثوانٍ.` 
      };
    }
    this.lastSwipeMap.set(childId, now);

    const today = localDateStr();
    const nowTime = new Date();
    const hours = nowTime.getHours();
    const minutes = nowTime.getMinutes();
    const ampm = hours >= 12 ? 'م' : 'ص';
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;
    const currentTimeStr = `${h12 < 10 ? '0' + h12 : h12}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

    let existing = this.attendance.find(a => a.childId === childId && a.date === today);
    let actionType: 'check_in' | 'check_out' = 'check_in';

    // Time evaluation:
    // 07:30 to 08:30 -> 'present' (حاضر بالموعد)
    // After 08:30 -> 'late' (متأخر)
    // Afternoon (after 1:00 PM / 13:00) when already checked in -> check_out (انصراف)
    const timeInMinutes = hours * 60 + minutes;
    const lateThresholdMinutes = ATTENDANCE_LATE_AFTER_MINUTES; // 08:30 AM = 510 minutes
    const isLate = timeInMinutes > lateThresholdMinutes;
    const finalStatus: AttendanceStatus = isLate ? 'late' : 'present';

    if (!existing) {
      existing = {
        id: `att-${child.id}-${today}`,
        childId: child.id,
        date: today,
        status: finalStatus,
        checkInTime: currentTimeStr,
        checkOutTime: '02:00 م',
        method: 'qr',
        recordedByUserId: this.currentUser?.id || 'qr-scan',
      };
      this.attendance = [...this.attendance, existing];
      actionType = 'check_in';
    } else {
      if (existing.status === 'absent' || existing.status === 'leave' || !existing.checkInTime) {
        existing.status = finalStatus;
        existing.checkInTime = currentTimeStr;
        existing.checkOutTime = '02:00 م';
        existing.method = 'qr';
        existing.leaveReason = undefined;
        actionType = 'check_in';
      } else {
        // Already checked in: record checkout time
        existing.checkOutTime = currentTimeStr;
        actionType = 'check_out';
      }
      this.attendance = this.attendance.map(a => a.id === existing!.id ? existing! : a);
    }

    this.save('attendance', this.attendance);
    this.logAudit(
      'تسجيل حضور QR',
      `تم إثبات ${actionType === 'check_in' ? 'حضور' : 'انصراف'} ${child.fullName} (ID: ${child.studentId}) الساعة ${currentTimeStr} (${actionType === 'check_in' ? (finalStatus === 'late' ? 'متأخر بعد 08:30 ص' : 'حاضر في الموعد') : 'انصراف وخروج'})`
    );

    this.notifyParent(
      child.id,
      'attendance',
      actionType === 'check_in' ? (finalStatus === 'late' ? 'وصل طفلك متأخراً ⏰' : 'وصل طفلك بسلام ✅') : 'تم انصراف طفلك 🏠',
      `${child.fullName} — ${actionType === 'check_in' ? 'الحضور' : 'الانصراف'} الساعة ${currentTimeStr}.`
    );

    return {
      success: true,
      message: actionType === 'check_in'
        ? (finalStatus === 'late' 
            ? `تم تسجيل الحضور في تمام الساعة (${currentTimeStr}) - متأخر بعد 08:30 ص ⏰` 
            : `أهلاً بك يا ${child.fullName.split(' ')[0]}! تم تسجيل الحضور في تمام الساعة (${currentTimeStr}) - حاضر في الموعد ✅`)
        : `تم تسجيل انصراف وخروج الطالب في تمام الساعة (${currentTimeStr}) بنجاح 🚗`,
      record: existing,
      child,
      actionType,
      statusType: finalStatus,
    };
  }

  // Set Leave with reason (النقطة 6 و 11: نقل الطفل من الغائبين إلى الإجازات)
  public markLeaveWithReason(childId: string, reason: string): boolean {
    const today = localDateStr();
    const child = this.children.find(c => c.id === childId);
    let existing = this.attendance.find(a => a.childId === childId && a.date === today);

    if (existing) {
      existing.status = 'leave';
      existing.leaveReason = reason;
      existing.checkInTime = undefined;
      existing.checkOutTime = undefined;
      this.attendance = this.attendance.map(a => a.id === existing!.id ? existing! : a);
    } else {
      existing = {
        id: `att-${childId}-${today}`,
        childId,
        date: today,
        status: 'leave',
        leaveReason: reason,
        method: 'manual',
        recordedByUserId: this.currentUser?.id || 'admin',
      };
      this.attendance = [...this.attendance, existing];
    }

    this.save('attendance', this.attendance);
    this.logAudit('تسجيل إجازة لطالب', `تم نقل الطالب ${child?.fullName} من الغائبين إلى الإجازات بسبب: ${reason}`);
    this.notifyParent(childId, 'attendance', 'تم تسجيل إجازة لطفلك 🌴', `${child?.fullName || 'طفلك'} — سبب الإجازة: ${reason}`);
    return true;
  }

  // Update status manually
  public updateAttendanceStatus(childId: string, status: AttendanceStatus, leaveReason?: string): void {
    const today = localDateStr();
    const existing = this.attendance.find(a => a.childId === childId && a.date === today);

    if (existing) {
      existing.status = status;
      if (status === 'leave') {
        existing.leaveReason = leaveReason || 'إجازة معتمدة';
        existing.checkInTime = undefined;
        existing.checkOutTime = undefined;
      } else if (status === 'absent') {
        existing.checkInTime = undefined;
        existing.checkOutTime = undefined;
        existing.leaveReason = undefined;
      } else {
        existing.checkInTime = existing.checkInTime || '08:00 ص';
        existing.checkOutTime = '02:00 م'; // Default 2:00 PM (النقطة 15)
        existing.leaveReason = undefined;
      }
      this.attendance = this.attendance.map(a => a.id === existing.id ? existing : a);
    } else {
      const newRec: AttendanceRecord = {
        id: `att-${childId}-${today}`,
        childId,
        date: today,
        status,
        checkInTime: (status === 'present' || status === 'late') ? '08:00 ص' : undefined,
        checkOutTime: (status === 'present' || status === 'late') ? '02:00 م' : undefined,
        method: 'manual',
        leaveReason: status === 'leave' ? (leaveReason || 'إجازة معتمدة') : undefined,
        recordedByUserId: this.currentUser?.id || 'admin',
      };
      this.attendance = [...this.attendance, newRec];
    }
    this.save('attendance', this.attendance);
  }

  // Mark all present (النقطة 9: تشغيل زر حضور الكل)
  public markAllPresent(): void {
    const today = localDateStr();
    const activeKids = this.children.filter(c => c.status === 'active');

    this.attendance = this.attendance.map(rec => {
      if (rec.date === today && rec.status !== 'leave') {
        return {
          ...rec,
          status: 'present' as AttendanceStatus,
          checkInTime: rec.checkInTime || '08:00 ص',
          checkOutTime: '02:00 م',
        };
      }
      return rec;
    });

    const recordedChildIds = new Set(this.attendance.filter(a => a.date === today).map(a => a.childId));
    activeKids.forEach(kid => {
      if (!recordedChildIds.has(kid.id)) {
        this.attendance.push({
          id: `att-${kid.id}-${today}`,
          childId: kid.id,
          date: today,
          status: 'present',
          checkInTime: '08:00 ص',
          checkOutTime: '02:00 م',
          method: 'manual',
          recordedByUserId: this.currentUser?.id || 'admin',
        });
      }
    });

    this.save('attendance', this.attendance);
    this.logAudit('حضور جماعي', `تم اعتماد حضور جميع طلاب الحضانة (موعد الخروج 02:00 م)`);
  }

  // --- CHILD PHOTO UPDATE & DELETE (النقطة 8 و 13: تغيير أو حذف صورة الطفل) ---
  public updateChildPhoto(childId: string, newPhotoUrl: string): boolean {
    const child = this.children.find(c => c.id === childId);
    if (!child) return false;

    child.avatarUrl = newPhotoUrl;
    this.children = this.children.map(c => c.id === childId ? { ...c, avatarUrl: newPhotoUrl } : c);
    this.save('children', this.children);
    this.logAudit('تحديث صورة طفل', `تم تغيير وتحديث الصورة الشخصية للطفل ${child.fullName}`);
    return true;
  }

  /** ترحيل المستوى القديم (الكيدز إريا بكود 3 أرقام) إلى "بري كيجي" بنفس الأطفال والأكواد */
  private migrateKidsAreaToPreKg(): void {
    const OLD = 'lvl-kids-area';
    const PRE = INITIAL_LEVELS.find(l => l.id === 'lvl-pre-kg')!;
    const PRE_CLASS = INITIAL_CLASSES.find(c => c.id === 'cls-pre-kg-1')!;
    let levelsTouched = false;
    if (this.levels.some(l => (l.id as string) === OLD)) {
      this.levels = this.levels.map(l => ((l.id as string) === OLD ? PRE : l));
      levelsTouched = true;
    }
    if (!this.levels.some(l => l.id === 'lvl-pre-kg')) {
      this.levels = [PRE, ...this.levels];
      levelsTouched = true;
    }
    if (levelsTouched) this.save('levels', this.levels);

    let classesTouched = false;
    if (this.classes.some(c => (c.levelId as string) === OLD)) {
      this.classes = this.classes.map(c => ((c.levelId as string) === OLD ? PRE_CLASS : c));
      classesTouched = true;
    }
    if (!this.classes.some(c => c.id === 'cls-pre-kg-1')) {
      this.classes = [PRE_CLASS, ...this.classes];
      classesTouched = true;
    }
    if (classesTouched) this.save('classes', this.classes);

    let childrenTouched = false;
    this.children = this.children.map(c => {
      if ((c.levelId as string) === OLD) {
        childrenTouched = true;
        return { ...c, levelId: 'lvl-pre-kg' as const, levelNameAr: PRE.name, classId: PRE_CLASS.id, classNameAr: PRE_CLASS.name };
      }
      return c;
    });
    if (childrenTouched) this.save('children', this.children);
  }

  /** إعادة اسم الإدارة الحالي في السجلات التي كُتبت باسم قديم (مثل moh من تحديث سابق) */
  private migrateLegacyAdminName(): void {
    const LEGACY = ['moh'];
    const NEW = ADMIN_USER.name;
    let receiptsTouched = false;
    this.receipts.forEach(r => { if (LEGACY.includes(r.issuedByUserName)) { r.issuedByUserName = NEW; receiptsTouched = true; } });
    if (receiptsTouched) this.save('receipts', this.receipts);
    let logsTouched = false;
    this.auditLogs.forEach(l => { if (LEGACY.includes(l.userName)) { l.userName = NEW; logsTouched = true; } });
    if (logsTouched) this.save('auditLogs', this.auditLogs);
    let closingsTouched = false;
    this.monthClosings.forEach(m => { if (m.closedBy && LEGACY.includes(m.closedBy)) { m.closedBy = NEW; closingsTouched = true; } });
    if (closingsTouched) this.save('monthClosings', this.monthClosings);
  }

  // ---------------- معرض الصور ----------------

  /** يضيف صوراً للمعرض. يرجع فشلاً (بدون تغيير أي بيانات) إذا امتلأت مساحة التخزين. */
  public addGalleryPhotos(
    items: { childId: string; dataUrl: string; caption: string; takenDate: string }[]
  ): { success: boolean; message: string; added: number } {
    if (items.length === 0) return { success: false, message: 'لم يتم اختيار أي صورة.', added: 0 };
    const now = new Date().toISOString();
    const created: GalleryPhoto[] = items.map((it, i) => ({
      id: `ph-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      childId: it.childId,
      dataUrl: it.dataUrl,
      caption: it.caption.trim(),
      takenDate: it.takenDate,
      createdAt: now,
    }));
    const next = [...created, ...this.galleryPhotos];
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'galleryPhotos', JSON.stringify(next));
    } catch {
      return {
        success: false,
        added: 0,
        message: 'مساحة التخزين على الجهاز ممتلئة. احذف بعض الصور القديمة ثم حاول مرة أخرى.',
      };
    }
    this.galleryPhotos = next;
    this.logAudit('رفع صور', `تم رفع ${created.length} صورة إلى معرض الصور`);
    Array.from(new Set(created.map(p => p.childId))).forEach(cid => this.notifyMedia('photo', cid, created.filter(p => p.childId === cid).length));
    return { success: true, message: `تم رفع ${created.length} صورة بنجاح.`, added: created.length };
  }

  public deleteGalleryPhoto(photoId: string): void {
    this.galleryPhotos = this.galleryPhotos.filter(p => p.id !== photoId);
    this.save('galleryPhotos', this.galleryPhotos);
  }

  /** هل انتهت مدة بقاء الصورة (24 ساعة من الرفع)؟ */
  public isPhotoExpired(photo: GalleryPhoto, now: number = Date.now()): boolean {
    const t = Date.parse(photo.createdAt);
    return Number.isNaN(t) ? false : now - t >= PHOTO_TTL_MS;
  }

  /** الوقت المتبقي بالمللي ثانية قبل حذف الصورة تلقائياً */
  public photoRemainingMs(photo: GalleryPhoto, now: number = Date.now()): number {
    const t = Date.parse(photo.createdAt);
    return Number.isNaN(t) ? PHOTO_TTL_MS : Math.max(0, PHOTO_TTL_MS - (now - t));
  }

  /** يحذف نهائياً الصور التي مرّ عليها 24 ساعة. يرجع عدد المحذوف. */
  public purgeExpiredPhotos(): number {
    const now = Date.now();
    const kept = this.galleryPhotos.filter(p => !this.isPhotoExpired(p, now));
    const removed = this.galleryPhotos.length - kept.length;
    if (removed > 0) {
      this.galleryPhotos = kept;
      this.save('galleryPhotos', this.galleryPhotos);
    }
    return removed;
  }

  /** صور طفل معيّن + الصور العامة (للكل)، الأحدث أولاً */
  public getPhotosForChild(childId: string): GalleryPhoto[] {
    const now = Date.now();
    return this.galleryPhotos
      .filter(p => (p.childId === childId || p.childId === 'all') && !this.isPhotoExpired(p, now))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public deleteChildPhoto(childId: string): boolean {
    const child = this.children.find(c => c.id === childId);
    if (!child) return false;

    child.avatarUrl = '';
    this.children = this.children.map(c => c.id === childId ? { ...c, avatarUrl: '' } : c);
    this.save('children', this.children);
    this.logAudit('حذف صورة طفل', `تم حذف الصورة الشخصية للطفل ${child.fullName} واستعادة الشعار الافتراضي`);
    return true;
  }

  // --- EDIT CHILD DATA (النقطة 9: تعديل بيانات الطفل بعد التسجيل) ---
  public updateChild(
    childId: string,
    data: Partial<Omit<Child, 'id'>>,
    guardianData?: Partial<Omit<Guardian, 'id'>>
  ): Child | null {
    const idx = this.children.findIndex(c => c.id === childId);
    if (idx === -1) return null;

    const currentChild = this.children[idx];
    const updatedChild: Child = {
      ...currentChild,
      ...data,
      studentId: data.studentId || currentChild.studentId,
      fullName: data.fullName || currentChild.fullName,
      monthlyFee: data.monthlyFee !== undefined ? Number(data.monthlyFee) : currentChild.monthlyFee,
    };
    this.children[idx] = updatedChild;
    this.save('children', this.children);

    if (guardianData && updatedChild.guardianId) {
      const gIdx = this.guardians.findIndex(g => g.id === updatedChild.guardianId);
      if (gIdx !== -1) {
        this.guardians[gIdx] = { ...this.guardians[gIdx], ...guardianData };
        this.save('guardians', this.guardians);
      }
    }

    if (data.monthlyFee !== undefined) {
      const { month: curMonth, year: curYear } = currentPeriod();
      const currentFee = this.monthlyFees.find(f => f.childId === childId && f.month === curMonth && f.year === curYear);
      if (currentFee) {
        currentFee.baseFee = updatedChild.monthlyFee;
        currentFee.totalRequired = updatedChild.monthlyFee;
        currentFee.remainingAmount = Math.max(0, updatedChild.monthlyFee - currentFee.paidAmount);
        currentFee.status = currentFee.remainingAmount === 0 ? 'paid' : (currentFee.paidAmount > 0 ? 'partial' : 'unpaid');
        this.save('monthlyFees', this.monthlyFees);
      }
    }

    this.logAudit('تعديل بيانات طفل', `تم تعديل بيانات الطفل ${updatedChild.fullName} (ID: ${updatedChild.studentId})`);
    return updatedChild;
  }

  // --- FINANCIAL & PAYMENT ACTIONS (Cash Only - النقطة 4) ---
  /** ينشئ رسوم الشهر المطلوب لكل طفل ليس لديه سجل فيه (غير المنسحبين/الخريجين). يرجع عدد المُنشأ. */
  public ensureMonthlyFeesForMonth(month: number, year: number): number {
    const have = new Set(this.monthlyFees.filter(f => f.month === month && f.year === year).map(f => f.childId));
    let created = 0;
    this.children
      .filter(c => c.status !== 'withdrawn' && c.status !== 'graduated')
      .forEach(child => {
        if (!have.has(child.id)) {
          this.monthlyFees.push({
            id: `fee-${child.id}-${month}-${year}`,
            childId: child.id,
            month,
            year,
            baseFee: child.monthlyFee,
            discount: 0,
            activitiesFee: 0,
            totalRequired: child.monthlyFee,
            paidAmount: 0,
            remainingAmount: child.monthlyFee,
            status: 'unpaid',
          });
          created++;
        }
      });
    if (created > 0) this.save('monthlyFees', this.monthlyFees);
    return created;
  }

  /** رسوم شهر معيّن (الافتراضي: الشهر الحالي) بعد التأكد من وجود سجل لكل طفل */
  public getMonthFees(month: number = currentPeriod().month, year: number = currentPeriod().year): ChildMonthlyFee[] {
    this.ensureMonthlyFeesForMonth(month, year);
    return this.monthlyFees.filter(f => f.month === month && f.year === year);
  }

  public collectChildFee(data: {
    childId: string;
    month: number;
    year: number;
    amount: number;
    notes?: string;
  }): { success: boolean; message: string; receipt?: PaymentReceipt } {
    const child = this.children.find(c => c.id === data.childId);
    if (!child) return { success: false, message: 'الطفل غير مسجل' };
    const guardian = this.guardians.find(g => g.id === child.guardianId);

    // Find or create child fee record
    let fee = this.monthlyFees.find(f => f.childId === data.childId && f.month === data.month && f.year === data.year);
    if (!fee) {
      const total = child.monthlyFee;
      fee = {
        id: `fee-${child.id}-${data.month}-${data.year}`,
        childId: child.id,
        month: data.month,
        year: data.year,
        baseFee: child.monthlyFee,
        discount: 0,
        activitiesFee: 0,
        totalRequired: total,
        paidAmount: 0,
        remainingAmount: total,
        status: 'unpaid',
      };
      this.monthlyFees.push(fee);
    }

    fee.paidAmount = Number((fee.paidAmount + data.amount).toFixed(2));
    fee.remainingAmount = Number(Math.max(0, fee.totalRequired - fee.paidAmount).toFixed(2));
    fee.status = fee.remainingAmount === 0 ? 'paid' : 'partial';
    this.save('monthlyFees', this.monthlyFees);

    // Create Official Receipt (Cash Only)
    const receiptSeq = 1000 + this.receipts.length + 1;
    const receiptNum = `REC-${data.year}-${receiptSeq}`;
    const monthNames = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const monthName = `${monthNames[data.month]} ${data.year}`;

    const now = new Date();
    const todayStr = localDateStr(now);
    const timeStr = getCurrentTime12h();

    const receipt: PaymentReceipt = {
      id: uid('rec'),
      receiptNumber: receiptNum,
      childId: child.id,
      childName: child.fullName,
      studentId: child.studentId,
      guardianName: guardian ? guardian.fullName : 'ولي الأمر',
      monthName,
      year: data.year,
      amount: data.amount,
      paymentMethod: 'cash',
      remainingChildBalance: fee.remainingAmount,
      date: `${todayStr} ${timeStr}`,
      issuedByUserId: this.currentUser?.id || 'u-admin-nihel',
      issuedByUserName: this.currentUser?.name || 'Nihel',
      idempotencyKey: `idemp-pay-${child.id}-${uid('k')}`,
      notes: data.notes || 'سداد نقدي كاش',
    };

    this.receipts = [receipt, ...this.receipts];
    this.save('receipts', this.receipts);

    this.logAudit(
      'تحصيل مالي كاش',
      `تم تحصيل ${data.amount} ج.م نقداً (كاش) للطفل ${child.fullName} برقم إيصال ${receiptNum}`
    );

    this.notifyParent(child.id, 'payment', 'تم استلام دفعة 💵', `تم تسجيل ${data.amount} ج.م عن شهر ${data.month}/${data.year} للطفل ${child.fullName} (إيصال ${receiptNum}).`);
    return {
      success: true,
      message: `تم تحصيل ${data.amount} ج.م نقداً وإصدار الإيصال رقم ${receiptNum}`,
      receipt,
    };
  }

  // --- EXPENSES ---
  public addExpense(data: Omit<ExpenseRecord, 'id' | 'recordedByUserId'>): ExpenseRecord {
    const newExpense: ExpenseRecord = {
      id: uid('exp'),
      ...data,
      recordedByUserId: this.currentUser?.id || 'admin',
    };
    this.expenses = [newExpense, ...this.expenses];
    this.save('expenses', this.expenses);
    this.logAudit('تسجيل مصروف', `تم تسجيل مصروف ${data.amount} ج.م: ${data.description}`);
    return newExpense;
  }

  // --- FINANCIAL STATS FILTERED BY PERIOD & LEVEL (النقطة 5 و 6: اليوم/الأسبوع/الشهر/السنة + ملخص مستقل للكيدز إريا وكيجي 1) ---
  public getFinancialSummary(
    period: 'today' | 'week' | 'month' | 'year',
    levelFilter: 'all' | 'kids_area' | 'lvl-pre-kg' | 'lvl-kg1' = 'all'
  ): {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    receiptsCount: number;
    periodLabel: string;
    receipts: PaymentReceipt[];
    expenses: ExpenseRecord[];
    kidsAreaDirectIncome: number;
  } {
    const now = new Date();
    const todayStr = localDateStr(now);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let filteredReceipts: PaymentReceipt[] = [];
    let filteredExpenses: ExpenseRecord[] = [];
    let periodLabel = 'اليوم';

    if (period === 'today') {
      periodLabel = 'اليوم';
      filteredReceipts = this.receipts.filter(r => r.date.startsWith(todayStr) || r.date.includes(todayStr));
      filteredExpenses = this.expenses.filter(e => e.date === todayStr);
    } else if (period === 'week') {
      periodLabel = 'الأسبوع الحالي';
      filteredReceipts = this.receipts.filter(r => {
        const d = new Date(r.date.split(' ')[0]);
        return !isNaN(d.getTime()) && d >= sevenDaysAgo;
      });
      filteredExpenses = this.expenses.filter(e => {
        const d = new Date(e.date);
        return !isNaN(d.getTime()) && d >= sevenDaysAgo;
      });
    } else if (period === 'month') {
      const { month, year } = currentPeriod(now);
      const ym = yearMonthPrefix(month, year);
      const feeMonthLabel = `${MONTH_NAMES_AR[month - 1]} ${year}`;
      periodLabel = `شهر ${feeMonthLabel}`;
      filteredReceipts = this.receipts.filter(r => r.date.split(' ')[0].startsWith(ym) || r.monthName === feeMonthLabel);
      filteredExpenses = this.expenses.filter(e => e.date.startsWith(ym));
    } else if (period === 'year') {
      const { year } = currentPeriod(now);
      periodLabel = `سنة ${year} بالكامل`;
      filteredReceipts = this.receipts.filter(r => r.year === year || r.date.startsWith(String(year)));
      filteredExpenses = this.expenses.filter(e => e.date.startsWith(String(year)));
    }

    // تقسيم حسب المرحلة: إيصالات أطفال المرحلة، وحصة تقديرية من المصروفات بنسبة عدد الأطفال
    let expenseShare = 1;
    if (levelFilter === 'kids_area') {
      filteredReceipts = [];
      expenseShare = 0;
    } else if (levelFilter === 'lvl-pre-kg' || levelFilter === 'lvl-kg1') {
      const wantLen = levelFilter === 'lvl-pre-kg' ? 3 : 4;
      filteredReceipts = filteredReceipts.filter(r => {
        const ch = this.children.find(c => c.id === r.childId);
        return ch ? ch.levelId === levelFilter : r.studentId.length === wantLen;
      });
      const activeKids = this.children.filter(c => c.status === 'active');
      expenseShare = activeKids.length ? activeKids.filter(c => c.levelId === levelFilter).length / activeKids.length : 0;
    }

    // Kids Area Session Direct Income (Drop-in sessions)
    const inPeriod = (ts: number): boolean => {
      const d = new Date(ts);
      if (period === 'today') return localDateStr(d) === todayStr;
      if (period === 'week') return d >= sevenDaysAgo;
      if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      return d.getFullYear() === now.getFullYear();
    };
    const kidsAreaDirectIncome = this.kidsAreaSessions
      .filter(s => inPeriod(s.entryTimestamp))
      .reduce((sum, s) => sum + (s.fee || 0), 0);
    const extraIncome = levelFilter === 'kids_area' || levelFilter === 'all' ? kidsAreaDirectIncome : 0;

    const totalIncome = filteredReceipts.reduce((sum, r) => sum + r.amount, 0) + extraIncome;
    const totalExpenses = Math.round(filteredExpenses.reduce((sum, e) => sum + e.amount, 0) * expenseShare);
    const netProfit = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      receiptsCount: filteredReceipts.length,
      periodLabel,
      receipts: filteredReceipts,
      expenses: expenseShare === 1 ? filteredExpenses : [],
      kidsAreaDirectIncome,
    };
  }

  // --- KIDS AREA TEMPORARY SESSIONS & TIMERS (النقطة 6 و 7: الكيدز إريا ووقت الإقامة) ---
  public addKidsAreaSession(data: {
    childId?: string;
    childName: string;
    guardianName: string;
    guardianPhone: string;
    allocatedMinutes: number;
    fee: number;
    notes?: string;
  }): KidsAreaSession {
    const now = Date.now();
    const entryTime = getCurrentTime12h();
    const newSession: KidsAreaSession = {
      id: uid('kas'),
      childId: data.childId || uid('ch-ka'),
      childName: data.childName,
      guardianName: data.guardianName,
      guardianPhone: data.guardianPhone,
      entryTime,
      entryTimestamp: now,
      allocatedMinutes: data.allocatedMinutes,
      expiryTimestamp: now + data.allocatedMinutes * 60 * 1000,
      status: 'active',
      fee: data.fee,
      notes: data.notes,
    };
    this.kidsAreaSessions = [newSession, ...this.kidsAreaSessions];
    this.save('kidsAreaSessions', this.kidsAreaSessions);
    this.logAudit('دخول الكيدز إريا', `تم تسجيل دخول الطفل ${data.childName} للكيدز إريا لمدة ${data.allocatedMinutes} دقيقة برسم ${data.fee} ج.م`);
    return newSession;
  }

  public updateKidsAreaDuration(sessionId: string, newTotalMinutes: number): boolean {
    const session = this.kidsAreaSessions.find(s => s.id === sessionId);
    if (!session) return false;
    const addedMinutes = newTotalMinutes - session.allocatedMinutes;
    session.allocatedMinutes = newTotalMinutes;
    session.expiryTimestamp = session.expiryTimestamp + addedMinutes * 60 * 1000;
    this.save('kidsAreaSessions', this.kidsAreaSessions);
    this.logAudit('تعديل وقت الكيدز إريا', `تم تعديل وقت الطفل ${session.childName} إلى ${newTotalMinutes} دقيقة`);
    return true;
  }

  public completeKidsAreaSession(sessionId: string): { success: boolean; message: string; session?: KidsAreaSession } {
    const session = this.kidsAreaSessions.find(s => s.id === sessionId);
    if (!session) return { success: false, message: 'الجلسة غير موجودة' };
    session.status = 'completed';
    session.leftAt = getCurrentTime12h();
    this.save('kidsAreaSessions', this.kidsAreaSessions);
    this.logAudit('خروج من الكيدز إريا', `انتهى وقت وخروج الطفل ${session.childName} ونقله لسجل الزيارات السابقة`);
    return {
      success: true,
      message: `🔔 انتهى وقت تواجد الطفل (${session.childName}) في الكيدز إريا! تم نقله بنجاح إلى سجل الزيارات السابقة.`,
      session,
    };
  }

  // --- CHILDREN ENROLLMENT WITH 2 LEVELS (النقطة 2: الكيدز إريا <= 3 أرقام و كيجي 1 <= 4 أرقام) ---
  /** يبحث عن طالب بنفس معرف الطالب (Student ID) أو الكود */
  public findChildByStudentId(idInput: string): Child | undefined {
    const id = idInput.trim().toLowerCase();
    if (!id) return undefined;
    return this.children.find(c =>
      c.studentId.trim().toLowerCase() === id ||
      c.code.toLowerCase() === id ||
      c.code.replace('ID-', '').toLowerCase() === id
    );
  }

  public addChild(data: {
    fullName: string;
    studentId: string;
    gender: 'male' | 'female';
    birthDate: string;
    levelId: 'lvl-pre-kg' | 'lvl-kg1';
    classId: string;
    monthlyFee: number;
    address: string;
    avatarUrl?: string;
    guardian: Omit<Guardian, 'id'>;
  }): Child {
    // حماية: لا يُسمح بتسجيل طالب بمعرف مستخدم لطالب آخر
    if (this.findChildByStudentId(data.studentId)) {
      throw new Error('DUPLICATE_STUDENT_ID');
    }
    const childId = `ch-${data.studentId}`;
    const guardianId = uid('grd');

    const newGuardian: Guardian = {
      id: guardianId,
      ...data.guardian,
    };
    this.guardians = [...this.guardians, newGuardian];
    this.save('guardians', this.guardians);

    const level = this.levels.find(l => l.id === data.levelId);
    const nurseryClass = this.classes.find(c => c.id === data.classId);

    const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const newChild: Child = {
      id: childId,
      studentId: data.studentId,
      code: `ID-${data.studentId}`,
      password: data.studentId, // Default parent login password
      fullName: data.fullName,
      gender: data.gender,
      birthDate: data.birthDate,
      enrollmentDate: localDateStr(),
      levelId: data.levelId,
      levelNameAr: level?.name || (data.levelId === 'lvl-pre-kg' ? 'بري كيجي' : 'كيجي 1'),
      classId: data.classId,
      classNameAr: nurseryClass?.name || 'فصل الحضانة',
      monthlyFee: data.monthlyFee,
      status: 'active',
      avatarUrl: data.avatarUrl || '',
      avatarColor,
      address: data.address,
      qrPayload: `MBK-CHILD-${data.studentId}`,
      guardianId,
    };

    this.children = [newChild, ...this.children];
    this.save('children', this.children);

    // Monthly Fee record (strictly newChild.monthlyFee without extra additions)
    const { month: feeMonth, year: feeYear } = currentPeriod();
    this.monthlyFees.push({
      id: `fee-${newChild.id}-${feeMonth}-${feeYear}`,
      childId: newChild.id,
      month: feeMonth,
      year: feeYear,
      baseFee: newChild.monthlyFee,
      discount: 0,
      activitiesFee: 0,
      totalRequired: newChild.monthlyFee,
      paidAmount: 0,
      remainingAmount: newChild.monthlyFee,
      status: 'unpaid',
    });
    this.save('monthlyFees', this.monthlyFees);

    this.logAudit('تسجيل طفل جديد', `تم تسجيل الطفل ${newChild.fullName} بالمعرف ${newChild.studentId} بالمرحلة ${newChild.levelNameAr}`);
    return newChild;
  }

  // Daily Reports & Evaluations
  public saveDailyReport(report: Omit<DailyReport, 'id'>): DailyReport {
    const existingIdx = this.dailyReports.findIndex(r => r.childId === report.childId && r.date === report.date);
    let saved: DailyReport;
    if (existingIdx !== -1) {
      saved = { ...this.dailyReports[existingIdx], ...report };
      this.dailyReports[existingIdx] = saved;
    } else {
      saved = { id: uid('dr'), ...report };
      this.dailyReports = [saved, ...this.dailyReports];
    }
    this.save('dailyReports', this.dailyReports);
    {
      const nm = this.children.find(c => c.id === saved.childId)?.fullName || 'طفلك';
      this.notifyParent(saved.childId, 'daily', 'تقرير المتابعة اليومية جاهز 📝', `تم تحديث تقرير ${nm} ليوم ${saved.date}.`);
      if (this.currentUser?.role === 'teacher') this.notifyAdmin('daily', 'تقرير يومي جديد', `${this.currentUser.name} سجّل/ت تقرير ${nm} ليوم ${saved.date}.`);
    }
    return saved;
  }

  public saveEvaluation(evaluation: Omit<EvaluationRecord, 'id'>): EvaluationRecord {
    const existingIdx = this.evaluations.findIndex(
      e => e.childId === evaluation.childId && e.month === evaluation.month && e.year === evaluation.year
    );
    let saved: EvaluationRecord;
    if (existingIdx !== -1) {
      saved = { ...this.evaluations[existingIdx], ...evaluation };
      this.evaluations[existingIdx] = saved;
    } else {
      saved = { id: uid('ev'), ...evaluation };
      this.evaluations = [saved, ...this.evaluations];
    }
    this.save('evaluations', this.evaluations);
    {
      const nm = this.children.find(c => c.id === saved.childId)?.fullName || 'طفلك';
      this.notifyParent(saved.childId, 'evaluation', 'تقييم جديد ⭐', `تم نشر تقييم شهر ${saved.month}/${saved.year} لـ ${nm}.`);
      if (this.currentUser?.role === 'teacher') this.notifyAdmin('evaluation', 'تقييم جديد', `${this.currentUser.name} سجّل/ت تقييم ${nm} لشهر ${saved.month}/${saved.year}.`);
    }
    return saved;
  }

  // --- SECONDARY INCOME & PAYROLL & SETTINGS ---
  public setCurrentUser(user: User | null): void {
    this.currentUser = user;
    this.save('auth_session', user);
  }

  public addSecondaryIncome(income: Omit<IncomeRecord, 'id'>): IncomeRecord {
    const newInc: IncomeRecord = {
      id: uid('inc'),
      ...income,
    };
    this.secondaryIncome = [newInc, ...this.secondaryIncome];
    this.save('secondaryIncome', this.secondaryIncome);
    this.logAudit('تسجيل دخل ثانوي', `تم تحصيل دخل ثانوي: ${income.title} (${income.amount} ج.م)`);
    return newInc;
  }

  /** إضافة موظف جديد (يُحفظ فعلياً) مع إنشاء راتبه للشهر الحالي */
  public addEmployee(data: { fullName: string; jobTitle: string; phone: string; address?: string; basicSalary: number }): Employee {
    const name = data.fullName.trim();
    const title = data.jobTitle.trim();
    const emp: Employee = {
      id: uid('emp'),
      name,
      fullName: name,
      role: 'staff',
      roleLabelAr: title || 'موظف',
      phone: data.phone.trim(),
      address: data.address || '',
      hireDate: this.todayDateStr(),
      baseSalary: Number(data.basicSalary),
      basicSalary: Number(data.basicSalary),
      active: true,
    };
    this.employees = [emp, ...this.employees];
    this.save('employees', this.employees);
    const now = new Date();
    this.ensurePayrollForMonth(now.getMonth() + 1, now.getFullYear());
    this.logAudit('إضافة موظف جديد', `تم تعيين ${emp.name} بوظيفة ${emp.roleLabelAr}`);
    return emp;
  }

  private static normPersonName(n: string): string {
    return n.replace(/^\s*(أ|ا|الأستاذة|الأستاذ|استاذة|أستاذ|ms|mr)\s*[.\/\-]?\s*/i, '').replace(/\s+/g, ' ').trim();
  }

  /** حسابات دخول المعلمين المطابقة لموظف (بالاسم أو رقم الهاتف) */
  public findTeacherAccountsForEmployee(emp: Employee): Teacher[] {
    const name = NurseryStorageService.normPersonName(emp.fullName || emp.name || '');
    const phone = (emp.phone || '').replace(/\D/g, '');
    return this.teachers.filter(t =>
      (name && NurseryStorageService.normPersonName(t.fullName) === name) ||
      (phone.length >= 8 && (t.phone || '').replace(/\D/g, '') === phone)
    );
  }

  /** حذف موظف: تُحذف رواتبه غير المصروفة وحساب دخوله كمعلم (إن وُجد)، وتبقى الرواتب المصروفة كسجل مالي سابق */
  public deleteEmployee(id: string): boolean {
    const emp = this.employees.find(e => e.id === id);
    if (!emp) return false;
    this.findTeacherAccountsForEmployee(emp).forEach(t => this.deleteTeacher(t.id));
    this.employees = this.employees.filter(e => e.id !== id);
    this.payroll = this.payroll.filter(p => p.employeeId !== id || p.status === 'paid');
    this.save('employees', this.employees);
    this.save('payroll', this.payroll);
    this.logAudit('حذف موظف', `تم حذف ${emp.fullName || emp.name} من الكادر`);
    return true;
  }

  /** ينشئ سجل راتب (قيد الانتظار) لكل موظف نشط ليس له سجل في هذا الشهر. يرجع عدد المُنشأ. */
  public ensurePayrollForMonth(month: number, year: number): number {
    let created = 0;
    this.employees.filter(e => e.active).forEach(e => {
      if (!this.payroll.some(p => p.employeeId === e.id && p.month === month && p.year === year)) {
        const base = e.baseSalary || e.basicSalary || 0;
        this.payroll = [
          ...this.payroll,
          {
            id: `pay-${e.id}-${month}-${year}`,
            employeeId: e.id,
            employeeName: e.fullName || e.name,
            month,
            year,
            baseSalary: base,
            basicSalary: base,
            bonuses: 0,
            deductions: 0,
            advances: 0,
            netSalary: base,
            status: 'pending',
          },
        ];
        created++;
      }
    });
    if (created > 0) this.save('payroll', this.payroll);
    return created;
  }

  /** تعديل مكافأة / سلفة / خصم لموظف في مسير الرواتب (قبل الصرف فقط) وإعادة حساب الصافي */
  public updatePayrollAdjustments(
    recordId: string,
    adj: { bonuses?: number; advances?: number; deductions?: number }
  ): { success: boolean; message: string } {
    const rec = this.payroll.find(p => p.id === recordId);
    if (!rec) return { success: false, message: 'سجل الراتب غير موجود.' };
    if (rec.status === 'paid') return { success: false, message: 'تم صرف هذا الراتب بالفعل ولا يمكن تعديله.' };

    const bonuses = adj.bonuses ?? rec.bonuses ?? 0;
    const advances = adj.advances ?? (rec.advancesDeduction ?? rec.advances ?? 0);
    const deductions = adj.deductions ?? rec.deductions ?? 0;
    if ([bonuses, advances, deductions].some(n => !Number.isFinite(n) || n < 0)) {
      return { success: false, message: 'اكتب مبلغاً صحيحاً (صفر أو أكبر).' };
    }
    const base = rec.baseSalary || rec.basicSalary || 0;
    const net = Math.round((base + bonuses - deductions - advances) * 100) / 100;
    if (net < 0) {
      return { success: false, message: `إجمالي السلف والخصومات أكبر من الراتب (${base + bonuses} ج.م).` };
    }

    rec.bonuses = bonuses;
    rec.advances = advances;
    if (rec.advancesDeduction !== undefined) rec.advancesDeduction = advances;
    rec.deductions = deductions;
    rec.netSalary = net;
    this.payroll = this.payroll.map(p => (p.id === recordId ? rec : p));
    this.save('payroll', this.payroll);
    this.logAudit(
      'تعديل مسير الرواتب',
      `${rec.employeeName}: مكافأة ${bonuses} · سلفة ${advances} · خصم ${deductions} · الصافي ${net} ج.م`
    );
    return { success: true, message: 'تم حفظ التعديل وإعادة حساب الصافي.' };
  }

  public disburseSalary(recordId: string): boolean {
    const rec = this.payroll.find(p => p.id === recordId);
    if (!rec) return false;
    rec.status = 'paid';
    rec.disbursedDate = localDateStr();
    this.payroll = this.payroll.map(p => p.id === recordId ? rec : p);
    this.save('payroll', this.payroll);
    this.logAudit('صرف راتب', `تم صرف راتب الموظف ${rec.employeeName} بقيمة ${rec.netSalary} ج.م`);
    return true;
  }

  public closeMonth(month: number, year: number): { success: boolean; message: string; record: MonthClosingRecord } {
    const fees = this.monthlyFees.filter(f => f.month === month && f.year === year);
    const primaryCollected = fees.reduce((sum, f) => sum + f.paidAmount, 0) || 12000;
    const secondary = this.secondaryIncome.reduce((sum, i) => sum + i.amount, 0);
    const kidsAreaRevenue = this.kidsAreaSessions.reduce((sum, s) => sum + (s.fee || 0), 0);
    const totalIncome = primaryCollected + secondary + kidsAreaRevenue;

    const payrollDisbursed = this.payroll
      .filter(p => p.month === month && p.year === year && p.status === 'paid')
      .reduce((sum, p) => sum + p.netSalary, 0);
    const operational = this.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = payrollDisbursed + operational;
    const netProfit = totalIncome - totalExpenses;

    const todayStr = localDateStr();
    let rec = this.monthClosings.find(m => m.month === month && m.year === year);
    if (!rec) {
      rec = {
        id: `mc-${month}-${year}`,
        month,
        year,
        isClosed: true,
        closedAt: todayStr,
        closedBy: this.currentUser?.name || 'Nihel',
        totalIncome,
        totalExpenses,
        netProfit,
      };
      this.monthClosings = [...this.monthClosings, rec];
    } else {
      rec.isClosed = true;
      rec.closedAt = todayStr;
      rec.closedBy = this.currentUser?.name || 'Nihel';
      rec.totalIncome = totalIncome;
      rec.totalExpenses = totalExpenses;
      rec.netProfit = netProfit;
      this.monthClosings = this.monthClosings.map(m => (m.month === month && m.year === year ? rec! : m));
    }
    this.save('monthClosings', this.monthClosings);
    this.logAudit('إغلاق شهر مالي', `تم إغلاق حسابات شهر ${month}/${year} رسمياً بقيمة دخل ${totalIncome} ج.م ومصروفات ${totalExpenses} ج.م`);
    return { success: true, message: `تم إغلاق حسابات شهر ${month}/${year} وحفظها رسمياً بنجاح ✅`, record: rec };
  }

  public reopenMonth(month: number, year: number): boolean {
    const rec = this.monthClosings.find(m => m.month === month && m.year === year);
    if (rec) {
      rec.isClosed = false;
      this.save('monthClosings', this.monthClosings);
      this.logAudit('إعادة فتح شهر مالي', `تمت إعادة فتح حسابات شهر ${month}/${year}`);
    }
    return true;
  }

  public updateSettings(updates: Partial<NurserySettings>): NurserySettings {
    this.settings = { ...this.settings, ...updates };
    this.save('settings', this.settings);
    this.logAudit('تحديث إعدادات الحضانة', 'تم تحديث بيانات وإعدادات الحضانة ومواعيد الدوام');
    return this.settings;
  }
}

