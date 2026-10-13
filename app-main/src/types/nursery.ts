export type UserRole = 
  | 'admin'    // إدارة الحضانة (Nihel)
  | 'parent';   // ولي أمر الطالب

export interface User {
  id: string;
  name: string;
  username?: string;
  role: UserRole;
  roleLabelAr: string;
  avatar: string;
  phone?: string;
  childId?: string; // For parent account
}

export type ChildStatus = 'active' | 'leave' | 'suspended' | 'withdrawn' | 'graduated';

export interface Child {
  id: string;
  studentId: string; // 3 digits for Kids Area (e.g. 101), 4 digits for KG1 (e.g. 1001)
  code: string; // Display code e.g. ID-101
  password?: string; // Parent login password
  fullName: string;
  gender: 'male' | 'female';
  birthDate: string; // YYYY-MM-DD
  enrollmentDate: string; // YYYY-MM-DD
  levelId: 'lvl-kids-area' | 'lvl-kg1';
  levelNameAr: string;
  classId?: string; // Optional legacy
  classNameAr?: string; // Optional legacy
  monthlyFee: number;
  status: ChildStatus;
  avatarUrl: string; // Photo of the child
  avatarColor: string;
  address: string;
  qrPayload: string;
  allergies?: string;
  notes?: string;
  leaveReason?: string;
  guardianId: string;
  allocatedMinutes?: number; // For kids area stay
  entryTime?: string; // For kids area
}

export interface KidsAreaSession {
  id: string;
  childId: string;
  childName: string;
  studentId: string;
  guardianName: string;
  guardianPhone: string;
  entryTime: string; // Standard 12-hour e.g. 01:30 م
  entryTimestamp: number;
  allocatedMinutes: number; // e.g. 60 or 120 minutes
  expiryTimestamp: number;
  status: 'active' | 'completed';
  fee: number;
  notes?: string;
  leftAt?: string;
}

export interface Guardian {
  id: string;
  fullName: string;
  relation: string; // الأب، الأم، ولي أمر
  phone: string;
  whatsapp: string;
  secondPhone?: string;
  job?: string;
  email?: string;
  address: string;
  notes?: string;
}

export interface PickupPerson {
  id: string;
  childId: string;
  fullName: string;
  relation: string;
  phone: string;
  avatar: string;
  notes?: string;
}

export interface NurseryLevel {
  id: 'lvl-kids-area' | 'lvl-kg1';
  name: string;
  description: string;
  idFormatDesc: string; // 3 أرقام أو 4 أرقام
  defaultFee: number;
  ageRange?: string;
}

export interface NurseryClass {
  id: string;
  name: string;
  levelId: 'lvl-kids-area' | 'lvl-kg1';
  color: string;
  roomNumber?: string;
  maxCapacity?: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface AttendanceRecord {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string; // HH:mm
  checkOutTime?: string; // HH:mm (default 14:00)
  method: 'manual' | 'qr';
  recordedByUserId: string;
  leaveReason?: string; // سبب الإجازة
  notes?: string;
}

export type PaymentMethod = 'cash'; // Only Cash per prompt requirements

export interface ChildMonthlyFee {
  id: string;
  childId: string;
  month: number; // 1-12
  year: number;  // 2026
  baseFee: number;
  discount: number;
  activitiesFee: number;
  totalRequired: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'unpaid' | 'partial' | 'paid';
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // REC-2026-1042
  childId: string;
  childName: string;
  studentId: string;
  childCode?: string;
  guardianName: string;
  monthName: string;
  year: number;
  amount: number;
  paymentMethod: 'cash';
  remainingChildBalance: number;
  date: string; // YYYY-MM-DD HH:mm
  issuedByUserId: string;
  issuedByUserName: string;
  idempotencyKey: string;
  transactionRef?: string;
  notes?: string;
}

export type ExpenseCategory = string;

export interface ExpenseRecord {
  id: string;
  amount: number;
  category: string;
  categoryLabelAr: string;
  date: string; // YYYY-MM-DD
  description: string;
  supplier?: string;
  paymentMethod?: string;
  recordedByUserId: string;
}

export type IncomeCategory = string;

export interface IncomeRecord {
  id: string;
  title?: string;
  description?: string;
  category: string;
  categoryLabelAr: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  notes?: string;
  childId?: string;
  childName?: string;
}

export type EmployeeRole = string;

export interface Employee {
  id: string;
  name: string;
  fullName?: string;
  role: string;
  roleLabelAr: string;
  phone: string;
  baseSalary: number;
  basicSalary?: number;
  address?: string;
  hireDate: string;
  active: boolean;
  avatarColor?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  baseSalary: number;
  basicSalary?: number;
  bonuses: number;
  deductions: number;
  advances: number;
  advancesDeduction?: number;
  netSalary: number;
  status: 'paid' | 'pending';
  disbursedDate?: string;
  disbursedAt?: string;
}

export interface MonthClosingRecord {
  id: string;
  month: number;
  year: number;
  isClosed: boolean;
  closedAt?: string;
  closedBy?: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export interface DailyReport {
  id: string;
  childId: string;
  date: string;
  foodIntake: 'excellent' | 'good' | 'little' | 'none';
  sleepDuration: 'none' | '30min' | '1hour' | '2hours';
  mood: 'happy' | 'calm' | 'fussy' | 'crying';
  activityLevel: 'very_active' | 'normal' | 'low';
  toiletVisits: number;
  homeworkDone: boolean;
  notes?: string;
}

export interface EvaluationRecord {
  id: string;
  childId: string;
  month: number;
  year: number;
  arabicLanguage: number; // 1 to 5
  englishLanguage: number; // 1 to 5
  numbersMath: number; // 1 to 5
  fineMotorSkills: number; // 1 to 5
  socialSkills: number; // 1 to 5
  independence: number; // 1 to 5
  artAndCreativity: number; // 1 to 5
  quranAndEtiquette: number; // 1 to 5
  overallFeedback: string;
}

export interface NurserySettings {
  nurseryName: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  currency: string;
  logoUrl?: string;
  loginBackgroundUrl?: string;
  startTime: string; // 07:30 (بداية تسجيل الحضور بـ QR)
  lateThresholdTime: string; // 08:30 (بعد هذا الوقت يعتبر متأخر)
  checkoutTime: string; // 14:00 (موعد خروج الطلاب الساعة 2:00 م)
  academicYear: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
}
