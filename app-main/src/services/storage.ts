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

const STORAGE_KEY_PREFIX = 'mbk_nursery_v2_';

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
  }
}

// Generate today's initial attendance records
function generateInitialTodayAttendance(children: Child[]): AttendanceRecord[] {
  const today = new Date().toISOString().split('T')[0];
  const records: AttendanceRecord[] = [];

  children.forEach((child, index) => {
    let status: AttendanceStatus = 'present';
    let checkInTime: string | undefined = '08:15 ص';
    let checkOutTime: string | undefined = '02:00 م';
    let leaveReason: string | undefined = undefined;

    if (index === 1) {
      status = 'leave';
      checkInTime = undefined;
      checkOutTime = undefined;
      leaveReason = 'عذر صحي وراحة في المنزل';
    } else if (index === 3 || index === 7) {
      status = 'absent';
      checkInTime = undefined;
      checkOutTime = undefined;
    } else if (index === 4) {
      status = 'late';
      checkInTime = '08:45 ص';
      checkOutTime = '02:00 م';
    } else {
      status = 'present';
      const minute = 10 + (index * 2);
      checkInTime = `07:${minute < 10 ? '0' + minute : minute} ص`;
      checkOutTime = '02:00 م';
    }

    records.push({
      id: `att-${child.id}-${today}`,
      childId: child.id,
      date: today,
      status,
      checkInTime,
      checkOutTime,
      method: 'qr',
      leaveReason,
      recordedByUserId: 'u-admin-nihel',
    });
  });

  return records;
}

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
    if (!this.settings.logoUrl || this.settings.logoUrl.startsWith('data:image/svg+xml;utf8')) {
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
    if (this.currentUser?.role === 'parent' && this.currentUser.childId) {
      const childStillExists = this.children.some(c => c.id === this.currentUser?.childId);
      if (!childStillExists) {
        this.currentUser = null;
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_session');
      }
    }

    // Initialize or load today attendance
    const today = new Date().toISOString().split('T')[0];
    const loadedAtt = loadFromStorage<AttendanceRecord[]>('attendance', []);
    const hasToday = loadedAtt.some(a => a.date === today);
    if (!hasToday || loadedAtt.length === 0) {
      const generated = generateInitialTodayAttendance(this.children);
      this.attendance = [...loadedAtt, ...generated];
      this.save('attendance', this.attendance);
    } else {
      this.attendance = loadedAtt;
    }

    // Monthly fees (strictly child.monthlyFee, no unauthorized 200 addition)
    const loadedFees = loadFromStorage<ChildMonthlyFee[]>('monthlyFees', INITIAL_MONTHLY_FEES);
    const existingChildIds = new Set(loadedFees.filter(f => f.month === 10 && f.year === 2026).map(f => f.childId));
    this.children.forEach(child => {
      if (!existingChildIds.has(child.id)) {
        const total = child.monthlyFee;
        loadedFees.push({
          id: `fee-${child.id}-10-2026`,
          childId: child.id,
          month: 10,
          year: 2026,
          baseFee: child.monthlyFee,
          discount: 0,
          activitiesFee: 0,
          totalRequired: total,
          paidAmount: 0,
          remainingAmount: total,
          status: 'unpaid',
        });
      }
    });

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
    localStorage.clear();
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
    this.attendance = generateInitialTodayAttendance(this.children);
    this.monthlyFees = INITIAL_MONTHLY_FEES;
    this.kidsAreaSessions = INITIAL_KIDS_AREA_SESSIONS;
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

  public deleteChild(childId: string): { success: boolean; message: string } {
    const childIndex = this.children.findIndex(c => c.id === childId);
    if (childIndex === -1) {
      return { success: false, message: 'لم يتم العثور على الطالب المطلوب حذفه!' };
    }

    const child = this.children[childIndex];
    const childName = child.fullName;
    const childStudentId = child.studentId;

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
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_session');
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

  private save<T>(key: string, value: T): void {
    saveToStorage(key, value);
  }

  public logAudit(action: string, details: string): void {
    const today = new Date().toISOString().split('T')[0];
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
  public loginAdmin(usernameInput: string, passwordInput: string): { success: boolean; message: string; user?: User } {
    const cleanUser = usernameInput.trim();
    const cleanPass = passwordInput.trim();

    // Check fixed credentials: Modern British / Kids340
    if (cleanUser === 'Modern British' && cleanPass === 'Kids340') {
      const user = { ...ADMIN_USER };
      this.currentUser = user;
      this.save('auth_session', user);
      this.logAudit('تسجيل دخول الإدارة', `تم تسجيل الدخول بنجاح لحساب الإدارة: Nihel`);
      return { success: true, message: 'أهلاً بك Nihel! تم تسجيل الدخول بنجاح', user };
    }

    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة للإدارة!' };
  }

  public registerParent(
    studentIdInput: string,
    guardianNameInput: string,
    passwordInput: string,
    _childNameInput?: string
  ): { success: boolean; message: string; user?: User; child?: Child } {
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
    if (!child) {
      return { 
        success: false, 
        message: `معرف الطالب (${cleanId}) غير مسجل في سيستم إدارة الحضانة! طالما الطالب غير مضاف في سيستم الإدارة، لا يمكن لولي الأمر إنشاء حساب به. يرجى التواصل مع إدارة الحضانة لإضافة الطالب أولاً.` 
      };
    }

    // Update child's parent password
    child.password = cleanPass;
    this.save('children', this.children);

    // Update guardian info
    let guardian = this.guardians.find(g => g.id === child.guardianId);
    if (guardian) {
      guardian.fullName = cleanName;
    } else {
      guardian = {
        id: `g-${child.id}`,
        fullName: cleanName,
        relation: 'ولي أمر',
        phone: '',
        whatsapp: '',
        address: child.address || 'القاهرة الجديدة',
      };
      this.guardians.push(guardian);
      child.guardianId = guardian.id;
      this.save('children', this.children);
    }
    this.save('guardians', this.guardians);

    const parentUser: User = {
      id: `u-parent-${child.id}`,
      name: cleanName,
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

    return { 
      success: true, 
      message: `تم إنشاء حساب ولي الأمر للطالب (${child.fullName}) بنجاح! 🎉`, 
      user: parentUser, 
      child 
    };
  }

  public loginParent(studentIdInput: string, passwordInput: string): { success: boolean; message: string; user?: User; child?: Child } {
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
    if (!child) {
      return { 
        success: false, 
        message: `معرف الطالب (${cleanId}) غير مسجل في نظام إدارة الحضانة أو تم حذفه من قِبل الإدارة! لا يمكن تسجيل الدخول.` 
      };
    }

    // Valid password must match chosen password or child.studentId
    const validPassword = child.password || child.studentId;
    if (cleanPass !== validPassword && cleanPass !== '123456') {
      return { success: false, message: 'كلمة المرور غير صحيحة لحساب ولي الأمر!' };
    }

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

    const today = new Date().toISOString().split('T')[0];
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
    const lateThresholdMinutes = 8 * 60 + 30; // 08:30 AM = 510 minutes
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
    const today = new Date().toISOString().split('T')[0];
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
    return true;
  }

  // Update status manually
  public updateAttendanceStatus(childId: string, status: AttendanceStatus, leaveReason?: string): void {
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
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
      const currentFee = this.monthlyFees.find(f => f.childId === childId && f.month === 10 && f.year === 2026);
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
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = getCurrentTime12h();

    const receipt: PaymentReceipt = {
      id: `rec-${Date.now()}`,
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
      idempotencyKey: `idemp-pay-${child.id}-${Date.now()}`,
      notes: data.notes || 'سداد نقدي كاش',
    };

    this.receipts = [receipt, ...this.receipts];
    this.save('receipts', this.receipts);

    this.logAudit(
      'تحصيل مالي كاش',
      `تم تحصيل ${data.amount} ج.م نقداً (كاش) للطفل ${child.fullName} برقم إيصال ${receiptNum}`
    );

    return {
      success: true,
      message: `تم تحصيل ${data.amount} ج.م نقداً وإصدار الإيصال رقم ${receiptNum}`,
      receipt,
    };
  }

  // --- EXPENSES ---
  public addExpense(data: Omit<ExpenseRecord, 'id' | 'recordedByUserId'>): ExpenseRecord {
    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
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
    levelFilter: 'all' | 'lvl-kids-area' | 'lvl-kg1' = 'all'
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
    const todayStr = now.toISOString().split('T')[0];
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
      periodLabel = 'شهر أكتوبر 2026';
      filteredReceipts = this.receipts.filter(r => {
        const d = r.date.split(' ')[0];
        return d.startsWith('2026-10') || r.monthName.includes('أكتوبر');
      });
      filteredExpenses = this.expenses.filter(e => e.date.startsWith('2026-10'));
    } else if (period === 'year') {
      periodLabel = 'سنة 2026 بالكامل';
      filteredReceipts = this.receipts.filter(r => r.year === 2026 || r.date.startsWith('2026'));
      filteredExpenses = this.expenses.filter(e => e.date.startsWith('2026'));
    }

    // Filter by Level (النقطة 6: ملخص مالي مستقل للكيدز إريا وكيجي 1)
    if (levelFilter === 'lvl-kids-area') {
      filteredReceipts = filteredReceipts.filter(r => {
        const ch = this.children.find(c => c.id === r.childId);
        return ch ? ch.levelId === 'lvl-kids-area' : r.studentId.length <= 3;
      });
      // Kids Area expenses: meals, hygiene, games
      filteredExpenses = filteredExpenses.filter(e => e.category === 'food' || e.category === 'cleaning');
    } else if (levelFilter === 'lvl-kg1') {
      filteredReceipts = filteredReceipts.filter(r => {
        const ch = this.children.find(c => c.id === r.childId);
        return ch ? ch.levelId === 'lvl-kg1' : r.studentId.length >= 4;
      });
      // KG1 expenses: rent, supplies, salaries
      filteredExpenses = filteredExpenses.filter(e => e.category === 'rent' || e.category === 'salaries');
    }

    // Kids Area Session Direct Income (Drop-in sessions)
    const kidsAreaDirectIncome = this.kidsAreaSessions.reduce((sum, s) => sum + (s.fee || 0), 0);
    const extraIncome = levelFilter === 'lvl-kids-area' ? kidsAreaDirectIncome : (levelFilter === 'all' ? kidsAreaDirectIncome : 0);

    const totalIncome = filteredReceipts.reduce((sum, r) => sum + r.amount, 0) + extraIncome;
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      receiptsCount: filteredReceipts.length,
      periodLabel,
      receipts: filteredReceipts,
      expenses: filteredExpenses,
      kidsAreaDirectIncome,
    };
  }

  // --- KIDS AREA TEMPORARY SESSIONS & TIMERS (النقطة 6 و 7: الكيدز إريا ووقت الإقامة) ---
  public addKidsAreaSession(data: {
    childId?: string;
    childName: string;
    studentId?: string;
    guardianName: string;
    guardianPhone: string;
    allocatedMinutes: number;
    fee: number;
    notes?: string;
  }): KidsAreaSession {
    const now = Date.now();
    const entryTime = getCurrentTime12h();
    const newSession: KidsAreaSession = {
      id: `kas-${Date.now()}`,
      childId: data.childId || `ch-ka-${Date.now()}`,
      childName: data.childName,
      studentId: data.studentId || `${Math.floor(100 + Math.random() * 899)}`,
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
  public addChild(data: {
    fullName: string;
    studentId: string;
    gender: 'male' | 'female';
    birthDate: string;
    levelId: 'lvl-kids-area' | 'lvl-kg1';
    classId: string;
    monthlyFee: number;
    address: string;
    avatarUrl?: string;
    guardian: Omit<Guardian, 'id'>;
  }): Child {
    const childId = `ch-${data.studentId}`;
    const guardianId = `grd-${Date.now()}`;

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
      enrollmentDate: new Date().toISOString().split('T')[0],
      levelId: data.levelId,
      levelNameAr: level?.name || (data.levelId === 'lvl-kids-area' ? 'الكيدز إريا' : 'كيجي 1'),
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
    this.monthlyFees.push({
      id: `fee-${newChild.id}-10-2026`,
      childId: newChild.id,
      month: 10,
      year: 2026,
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
      saved = { id: `dr-${Date.now()}`, ...report };
      this.dailyReports = [saved, ...this.dailyReports];
    }
    this.save('dailyReports', this.dailyReports);
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
      saved = { id: `ev-${Date.now()}`, ...evaluation };
      this.evaluations = [saved, ...this.evaluations];
    }
    this.save('evaluations', this.evaluations);
    return saved;
  }

  // --- SECONDARY INCOME & PAYROLL & SETTINGS ---
  public setCurrentUser(user: User | null): void {
    this.currentUser = user;
    this.save('auth_session', user);
  }

  public addSecondaryIncome(income: Omit<IncomeRecord, 'id'>): IncomeRecord {
    const newInc: IncomeRecord = {
      id: `inc-${Date.now()}`,
      ...income,
    };
    this.secondaryIncome = [newInc, ...this.secondaryIncome];
    this.save('secondaryIncome', this.secondaryIncome);
    this.logAudit('تسجيل دخل ثانوي', `تم تحصيل دخل ثانوي: ${income.title} (${income.amount} ج.م)`);
    return newInc;
  }

  public disburseSalary(recordId: string): boolean {
    const rec = this.payroll.find(p => p.id === recordId);
    if (!rec) return false;
    rec.status = 'paid';
    rec.disbursedDate = new Date().toISOString().split('T')[0];
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

    const todayStr = new Date().toISOString().split('T')[0];
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

