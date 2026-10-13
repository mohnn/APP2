import { NurseryStorageService } from './storage';
import { 
  Child, 
  PaymentReceipt, 
  AttendanceRecord, 
  PaymentMethod, 
  ExpenseRecord, 
  IncomeRecord, 
  DailyReport, 
  EvaluationRecord,
  User
} from '../types/nursery';

export const storage = NurseryStorageService.getInstance();

export const api = {
  // Authentication (النقطة 1: تسجيل دخول الإدارة وولي الأمر)
  loginAdmin: async (username: string, pass: string) => {
    return storage.loginAdmin(username, pass);
  },

  loginParent: async (studentId: string, pass: string) => {
    return storage.loginParent(studentId, pass);
  },

  getCurrentUser: (): User | null => {
    return storage.currentUser;
  },

  logout: () => {
    storage.logout();
  },

  // Children
  getChildren: (params?: { search?: string; levelId?: string; classId?: string; status?: string }): Child[] => {
    let list = [...storage.children];
    if (params?.search) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(c => 
        c.fullName.toLowerCase().includes(q) || 
        c.studentId.includes(q) ||
        c.code.toLowerCase().includes(q)
      );
    }
    if (params?.levelId && params.levelId !== 'all') {
      list = list.filter(c => c.levelId === params.levelId);
    }
    if (params?.classId && params.classId !== 'all') {
      list = list.filter(c => c.classId === params.classId);
    }
    if (params?.status && params.status !== 'all') {
      list = list.filter(c => c.status === params.status);
    }
    return list;
  },

  getChildById: (id: string): Child | undefined => {
    return storage.children.find(c => c.id === id);
  },

  updateChildPhoto: (childId: string, photoUrl: string) => {
    return storage.updateChildPhoto(childId, photoUrl);
  },

  // Attendance (النقطة 6: الحضور 7:30 - 8:30 و 15: الانصراف 14:00)
  getTodayAttendance: () => {
    const today = new Date().toISOString().split('T')[0];
    return storage.attendance.filter(a => a.date === today);
  },

  recordQrScan: (childId: string) => {
    return storage.recordQrScan(childId);
  },

  markLeaveWithReason: (childId: string, reason: string) => {
    return storage.markLeaveWithReason(childId, reason);
  },

  markAllPresent: () => {
    storage.markAllPresent();
  },

  // Payments & Fees (النقطة 4: كاش فقط)
  collectFee: (data: {
    childId: string;
    month: number;
    year: number;
    amount: number;
    notes?: string;
  }) => {
    return storage.collectChildFee(data);
  },

  // Financial summary (النقطة 5)
  getFinancialSummary: (period: 'today' | 'week' | 'month' | 'year') => {
    return storage.getFinancialSummary(period);
  },

  // Expenses & Income
  addExpense: (data: Omit<ExpenseRecord, 'id' | 'recordedByUserId'>) => {
    return storage.addExpense(data);
  },

  addSecondaryIncome: (data: Omit<IncomeRecord, 'id'>) => {
    return storage.addSecondaryIncome(data);
  },

  // Payroll
  disburseSalary: (payrollId: string) => {
    return storage.disburseSalary(payrollId);
  },

  // Month Closing
  closeMonth: (month: number, year: number) => {
    return storage.closeMonth(month, year);
  },

  reopenMonth: (month: number, year: number) => {
    return storage.reopenMonth(month, year);
  },

  // Daily Reports & Evaluations
  saveDailyReport: (report: Omit<DailyReport, 'id'>) => {
    return storage.saveDailyReport(report);
  },

  saveEvaluation: (evaluation: Omit<EvaluationRecord, 'id'>) => {
    return storage.saveEvaluation(evaluation);
  },
};
