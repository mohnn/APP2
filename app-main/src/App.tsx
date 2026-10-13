/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DeviceFrame } from './components/layout/DeviceFrame';
import { TopAppBar } from './components/layout/TopAppBar';
import { BottomNav, MainTab } from './components/layout/BottomNav';
import { DrawerMenu, SubModuleView } from './components/layout/DrawerMenu';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';

// Auth & Parent Portal Screens
import { LoginScreen } from './components/auth/LoginScreen';
import { ParentPortalScreen } from './components/parent/ParentPortalScreen';

// Management Screens
import { DashboardScreen } from './components/dashboard/DashboardScreen';
import { ChildrenListScreen } from './components/children/ChildrenListScreen';
import { ChildProfileScreen } from './components/children/ChildProfileScreen';
import { AddChildModal } from './components/children/AddChildModal';
import { AttendanceScreen } from './components/attendance/AttendanceScreen';
import { QrPrintModal } from './components/attendance/QrPrintModal';
import { FinanceScreen } from './components/finance/FinanceScreen';
import { CollectFeeModal } from './components/finance/CollectFeeModal';
import { ReceiptModal } from './components/finance/ReceiptModal';
import { ExpensesScreen } from './components/finance/ExpensesScreen';
import { SecondaryIncomeScreen } from './components/finance/SecondaryIncomeScreen';
import { FinancialOverviewScreen } from './components/finance/FinancialOverviewScreen';
import { EmployeesScreen } from './components/employees/EmployeesScreen';
import { PayrollScreen } from './components/employees/PayrollScreen';
import { DailyReportsScreen } from './components/education/DailyReportsScreen';
import { EvaluationsScreen } from './components/education/EvaluationsScreen';
import { LevelsClassesScreen } from './components/education/LevelsClassesScreen';
import { GuardiansScreen } from './components/children/GuardiansScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { CodeExporterScreen } from './components/exporter/CodeExporterScreen';
import { KidsAreaScreen } from './components/kidsarea/KidsAreaScreen';

import { NurseryStorageService } from './services/storage';
import { User, Child, PaymentReceipt } from './types/nursery';

export default function App() {
  const storage = NurseryStorageService.getInstance();

  // Persistent Auth State (النقطة 1: حفظ جلسة تسجيل الدخول وتذكرها تلقائياً)
  const [currentUser, setCurrentUser] = useState<User | null>(storage.currentUser);
  const [currentParentChild, setCurrentParentChild] = useState<Child | null>(() => {
    if (storage.currentUser?.role === 'parent' && storage.currentUser.childId) {
      return storage.children.find(c => c.id === storage.currentUser!.childId) || storage.children[0];
    }
    return null;
  });

  // Navigation State
  const [mainTab, setMainTab] = useState<MainTab>('dashboard');
  const [activeSubModule, setActiveSubModule] = useState<SubModuleView | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Modals State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isQrPrintOpen, setIsQrPrintOpen] = useState(false);
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [preSelectedFeeChildId, setPreSelectedFeeChildId] = useState<string | undefined>(undefined);
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(null);

  // Handle successful login
  const handleLoginSuccess = (user: User, child?: Child) => {
    setCurrentUser(user);
    if (user.role === 'parent' && child) {
      setCurrentParentChild(child);
    } else if (user.role === 'parent' && user.childId) {
      const foundChild = storage.children.find(c => c.id === user.childId) || storage.children[0];
      setCurrentParentChild(foundChild);
    } else {
      setCurrentParentChild(null);
    }
  };

  // Full Keyboard Shortcuts (النقطة 12: تفعيل أزرار الكيبورد كاملة)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT' ||
        (activeEl as HTMLElement).isContentEditable
      );

      // Global Escape key
      if (e.key === 'Escape') {
        if (isSearchOpen) { setIsSearchOpen(false); return; }
        if (isAddChildOpen) { setIsAddChildOpen(false); return; }
        if (isQrPrintOpen) { setIsQrPrintOpen(false); return; }
        if (isCollectFeeOpen) { setIsCollectFeeOpen(false); return; }
        if (activeReceipt) { setActiveReceipt(null); return; }
        if (isDrawerOpen) { setIsDrawerOpen(false); return; }
        if (selectedChildId) { setSelectedChildId(null); return; }
        if (activeSubModule) { setActiveSubModule(null); return; }
      }

      // Ctrl/Cmd shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setIsQrPrintOpen(prev => !prev);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsCollectFeeOpen(prev => !prev);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsDrawerOpen(prev => !prev);
        return;
      }

      // Quick numbers navigation when not inside an input
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === '1') { handleTabChange('dashboard'); }
        else if (e.key === '2') { handleTabChange('children'); }
        else if (e.key === '3') { handleTabChange('attendance'); }
        else if (e.key === '4') { handleTabChange('finance'); }
        else if (e.key === '5') { setIsDrawerOpen(true); }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isAddChildOpen, isQrPrintOpen, isCollectFeeOpen, activeReceipt, isDrawerOpen, selectedChildId, activeSubModule]);

  // Handle logout
  const handleLogout = () => {
    storage.logout();
    setCurrentUser(null);
    setCurrentParentChild(null);
    setSelectedChildId(null);
    setActiveSubModule(null);
    setMainTab('dashboard');
  };

  const handleTabChange = (tab: MainTab) => {
    if (tab === 'more') {
      setIsDrawerOpen(true);
      return;
    }
    setMainTab(tab);
    setActiveSubModule(null);
    setSelectedChildId(null);
  };

  const handleSelectSubModule = (module: SubModuleView) => {
    setActiveSubModule(module);
    setSelectedChildId(null);
  };

  const handleOpenCollectForChild = (childId?: string) => {
    setPreSelectedFeeChildId(childId);
    setIsCollectFeeOpen(true);
  };

  // Determine App Title
  const getAppTitle = () => {
    if (selectedChildId) return 'ملف الطفل';
    if (activeSubModule) {
      const titles: Record<SubModuleView, string> = {
        kids_area: 'ركن الكيدز إريا (Kids Area)',
        guardians: 'أولياء الأمور',
        levels_classes: 'المستويات والفصول',
        employees: 'الموظفون',
        payroll: 'مسير الرواتب',
        advances: 'السلف',
        expenses: 'المصروفات',
        secondary_income: 'الدخل الثانوي',
        financial_overview: 'الملخص المالي',
        daily_reports: 'المتابعة اليومية',
        evaluations: 'تقييم الأطفال',
        reports: 'التقارير الرسمية',
        audit_logs: 'سجل العمليات',
        settings: 'إعدادات الحضانة',
        code_exporter: 'تصدير Flutter و Laravel',
      };
      return titles[activeSubModule];
    }
    if (mainTab === 'children') return 'قائمة الأطفال';
    if (mainTab === 'attendance') return 'حضور الأطفال';
    if (mainTab === 'finance') return 'الحسابات والمصروفات';
    return undefined; // Shows Brand Logo
  };

  // Back button handler
  const handleBack = () => {
    if (selectedChildId) {
      setSelectedChildId(null);
    } else if (activeSubModule) {
      setActiveSubModule(null);
    } else if (mainTab !== 'dashboard') {
      setMainTab('dashboard');
    }
  };

  const showBackButton = Boolean(selectedChildId || activeSubModule);

  return (
    <DeviceFrame
      currentUser={currentUser}
      onLogout={handleLogout}
      onOpenCodeExporter={() => setActiveSubModule('code_exporter')}
    >
      {!currentUser ? (
        /* Login Screen (خيارين: إدارة أو ولي أمر مع حفظ الجلسة - النقطة 1) */
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : currentUser.role === 'parent' ? (
        /* Parent Portal Screen (بوابة ولي الأمر مع إثبات حضور QR وطلب إجازة) */
        <ParentPortalScreen
          user={currentUser}
          child={currentParentChild || storage.children[0]}
          onLogout={handleLogout}
        />
      ) : (
        /* Administration Nursery System (حساب Nihel - النقطة 12) */
        <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-50 dark:bg-slate-950">
          {/* Top App Bar */}
          <TopAppBar
            title={getAppTitle()}
            showBack={showBackButton}
            onBack={handleBack}
            currentUser={currentUser}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenQrScanner={() => setIsQrPrintOpen(true)}
            onLogout={handleLogout}
          />

          {/* Screen Body */}
          <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-50 dark:bg-slate-950">
            {selectedChildId ? (
              <ChildProfileScreen
                childId={selectedChildId}
                onBack={() => setSelectedChildId(null)}
                onOpenCollect={(cid) => handleOpenCollectForChild(cid)}
              />
            ) : activeSubModule ? (
              activeSubModule === 'kids_area' ? (
                <KidsAreaScreen onBack={() => setActiveSubModule(null)} />
              ) : activeSubModule === 'code_exporter' ? (
                <CodeExporterScreen onBack={() => setActiveSubModule(null)} />
              ) : activeSubModule === 'financial_overview' ? (
                <FinancialOverviewScreen onBack={() => setActiveSubModule(null)} currentUser={currentUser} />
              ) : activeSubModule === 'expenses' ? (
                <ExpensesScreen onBack={() => setActiveSubModule(null)} />
              ) : activeSubModule === 'secondary_income' ? (
                <SecondaryIncomeScreen onBack={() => setActiveSubModule(null)} />
              ) : activeSubModule === 'employees' ? (
                <EmployeesScreen onBack={() => setActiveSubModule(null)} onOpenPayroll={() => setActiveSubModule('payroll')} />
              ) : activeSubModule === 'payroll' ? (
                <PayrollScreen onBack={() => setActiveSubModule(null)} />
              ) : activeSubModule === 'daily_reports' ? (
                <DailyReportsScreen onBack={() => setActiveSubModule(null)} />
              ) : activeSubModule === 'evaluations' ? (
                <EvaluationsScreen onBack={() => setActiveSubModule(null)} />
              ) : activeSubModule === 'levels_classes' ? (
                <LevelsClassesScreen onBack={() => setActiveSubModule(null)} />
              ) : activeSubModule === 'guardians' ? (
                <GuardiansScreen onBack={() => setActiveSubModule(null)} />
              ) : activeSubModule === 'reports' ? (
                <ReportsScreen onBack={() => setActiveSubModule(null)} />
              ) : (
                <SettingsScreen onBack={() => setActiveSubModule(null)} />
              )
            ) : (
              /* Main 4 Tabs */
              mainTab === 'dashboard' ? (
                <DashboardScreen
                  currentUser={currentUser}
                  onNavigateToChildren={() => setMainTab('children')}
                  onNavigateToAttendance={() => setMainTab('attendance')}
                  onNavigateToFinance={() => setMainTab('finance')}
                  onOpenQuickQr={() => setIsQrPrintOpen(true)}
                  onOpenQuickCollect={() => handleOpenCollectForChild()}
                  onOpenAddChild={() => setIsAddChildOpen(true)}
                  onOpenKidsArea={() => setActiveSubModule('kids_area')}
                />
              ) : mainTab === 'children' ? (
                <ChildrenListScreen
                  onSelectChild={(cid) => setSelectedChildId(cid)}
                  onOpenAddChild={() => setIsAddChildOpen(true)}
                  onOpenCollectForChild={(cid) => handleOpenCollectForChild(cid)}
                />
              ) : mainTab === 'attendance' ? (
                <AttendanceScreen
                  onOpenQrPrintModal={() => setIsQrPrintOpen(true)}
                  onSelectChild={(cid) => setSelectedChildId(cid)}
                />
              ) : (
                <FinanceScreen
                  onOpenCollectModal={(cid) => handleOpenCollectForChild(cid)}
                  onViewReceipt={(rec) => setActiveReceipt(rec)}
                  onOpenFinancialOverview={() => setActiveSubModule('financial_overview')}
                />
              )
            )}
          </div>

          {/* Fixed Bottom Navigation Bar (النقطة 10: شريط سفلي ثابت أثناء التمرير) */}
          <BottomNav
            activeTab={mainTab}
            onTabChange={handleTabChange}
          />

          {/* Drawer / More Sheet */}
          <DrawerMenu
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onSelectModule={handleSelectSubModule}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          {/* Global Search Modal */}
          <GlobalSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelectChild={(cid) => {
              setSelectedChildId(cid);
              setIsSearchOpen(false);
            }}
          />

          {/* Add Child Modal (النقطة 2: 3 أرقام للكيدز إريا و 4 أرقام لكيجي 1) */}
          <AddChildModal
            isOpen={isAddChildOpen}
            onClose={() => setIsAddChildOpen(false)}
            onChildAdded={(cid) => setSelectedChildId(cid)}
          />

          {/* QR Print / Download PDF Poster Modal (النقطة 3: بديل الكاميرا للإدارة) */}
          <QrPrintModal
            isOpen={isQrPrintOpen}
            onClose={() => setIsQrPrintOpen(false)}
          />

          {/* Collect Fee Modal (النقطة 4: كاش فقط وبدون رقم العملية) */}
          <CollectFeeModal
            isOpen={isCollectFeeOpen}
            onClose={() => setIsCollectFeeOpen(false)}
            preSelectedChildId={preSelectedFeeChildId}
            onReceiptGenerated={(rec) => setActiveReceipt(rec)}
          />

          {/* Official Receipt Modal */}
          <ReceiptModal
            receipt={activeReceipt}
            isOpen={Boolean(activeReceipt)}
            onClose={() => setActiveReceipt(null)}
          />
        </div>
      )}
    </DeviceFrame>
  );
}
