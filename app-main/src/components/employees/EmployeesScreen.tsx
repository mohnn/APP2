import React, { useState } from 'react';
import { ArrowRight, Phone, Briefcase, Plus, UserCheck, Shield } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { Employee, EmployeeRole } from '../../types/nursery';

interface EmployeesScreenProps {
  onBack: () => void;
  onOpenPayroll: () => void;
}

export const EmployeesScreen: React.FC<EmployeesScreenProps> = ({ onBack, onOpenPayroll }) => {
  const storage = NurseryStorageService.getInstance();
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<EmployeeRole>('teacher');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('القاهرة');
  const [basicSalary, setBasicSalary] = useState(8000);

  const rolesMap: Record<EmployeeRole, string> = {
    manager: 'مديرة الحضانة',
    teacher: 'معلمة فصول',
    assistant_teacher: 'مساعدة معلمات',
    accountant: 'محاسب مالي',
    reception: 'موظفة استقبال',
    worker: 'عاملة خدمات ونظافة',
    driver: 'سائق باص',
    bus_supervisor: 'مشرفة باص',
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert('يرجى كتابة الاسم ورقم الهاتف');
      return;
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: fullName.trim(),
      fullName: fullName.trim(),
      role,
      roleLabelAr: rolesMap[role] || 'موظف',
      phone: phone.trim(),
      address,
      hireDate: new Date().toISOString().split('T')[0],
      baseSalary: Number(basicSalary),
      basicSalary: Number(basicSalary),
      active: true,
    };

    storage.employees = [newEmp, ...storage.employees];
    // Add default payroll
    storage.payroll.push({
      id: `pay-${newEmp.id}-10`,
      employeeId: newEmp.id,
      employeeName: newEmp.name,
      month: 10,
      year: 2026,
      baseSalary: newEmp.baseSalary,
      basicSalary: newEmp.basicSalary,
      bonuses: 0,
      deductions: 0,
      advances: 0,
      netSalary: newEmp.baseSalary,
      status: 'pending',
    });

    storage.logAudit('إضافة موظف جديد', `تم تعيين ${newEmp.name} بوظيفة ${newEmp.roleLabelAr}`);
    setShowAddModal(false);
    setFullName('');
    setPhone('');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
              الكادر الإداري والتعليمي
            </h2>
            <span className="text-[10px] text-slate-400">المعلمات والموظفون ({storage.employees.length})</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenPayroll}
            className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors"
          >
            مسير الرواتب
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة موظف</span>
          </button>
        </div>
      </div>

      {/* Staff Cards Feed */}
      <div className="space-y-2 pb-4">
        {storage.employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0"
                style={{ backgroundColor: emp.avatarColor || '#3b82f6' }}
              >
                {(emp.fullName || emp.name || 'م')[0]}
              </div>

              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white truncate">
                    {emp.fullName || emp.name}
                  </span>
                  <span className="text-[9px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-1.5 py-0.2 rounded-md shrink-0">
                    {emp.roleLabelAr}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  الراتب الأساسي: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{emp.basicSalary} ج.م</span> · تاريخ التعيين: {emp.hireDate}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`tel:${emp.phone}`}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 transition-colors"
                title={`اتصال: ${emp.phone}`}
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-4 border border-slate-200 dark:border-slate-800 text-right space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-2 border-slate-100 dark:border-slate-800">
              إضافة موظف / معلمة جديدة
            </h3>

            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الاسم بالكامل</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="مثال: أ. دينا كمال حسان"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">المسمى الوظيفي</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as EmployeeRole)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
                  >
                    {Object.entries(rolesMap).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">الراتب الأساسي (ج.م)</label>
                  <input
                    type="number"
                    required
                    value={basicSalary}
                    onChange={e => setBasicSalary(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-left font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-left"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-bold"
                >
                  حفظ وتعيين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
