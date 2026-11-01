import React from 'react';
import { User } from '../../types/nursery';

interface DeviceFrameProps {
  children: React.ReactNode;
  currentUser: User | null;
  onLogout: () => void;
  onOpenCodeExporter: () => void;
}

/**
 * يعرض التطبيق بملء شاشة الجهاز مع ترك مسافة آمنة (Safe Area) أعلى الشاشة
 * (الوقت / البطارية / الشبكة) وأسفلها (أزرار التنقل) كي لا يغطيها المحتوى.
 */
const safe = (side: 'top' | 'bottom' | 'left' | 'right') =>
  `max(env(safe-area-inset-${side}, 0px), var(--safe-area-inset-${side}, 0px))`;

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  return (
    <div
      className="fixed inset-0 flex flex-col bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased overflow-hidden"
      style={{
        paddingTop: safe('top'),
        paddingBottom: safe('bottom'),
        paddingLeft: safe('left'),
        paddingRight: safe('right'),
      }}
    >
      <main className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
};
