import React from 'react';
import { User } from '../../types/nursery';

interface DeviceFrameProps {
  children: React.ReactNode;
  currentUser: User | null;
  onLogout: () => void;
  onOpenCodeExporter: () => void;
}

/**
 * يعرض التطبيق بملء شاشة الجهاز مباشرة (بدون شريط محاكاة هاتف/تابلت).
 */
export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased overflow-hidden">
      <main className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};
