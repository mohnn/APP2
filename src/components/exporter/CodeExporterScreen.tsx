import React from 'react';

export const CodeExporterScreen = ({ onBack }: { onBack: () => void }) => (
  <div dir="rtl" className="p-4 text-right">
    <button onClick={onBack} className="text-xs font-bold text-brand-primary dark:text-sky-400">← رجوع</button>
    <p className="mt-4 text-sm text-slate-500">هذه الشاشة غير متوفرة في النسخة التجريبية.</p>
  </div>
);
