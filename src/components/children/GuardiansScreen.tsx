import React from 'react';
import { NurseryStorageService } from '../../services/storage';

export const GuardiansScreen = ({ onBack }: { onBack: () => void }) => {
  const guardians = NurseryStorageService.getInstance().guardians;
  return (
    <div dir="rtl" className="p-3 space-y-2 pb-24 text-right">
      <button onClick={onBack} className="text-xs font-bold text-brand-primary dark:text-sky-400">← رجوع</button>
      {guardians.map(g => (
        <div key={g.id} className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
          <p className="text-sm font-bold dark:text-white">{g.fullName} <span className="text-xs text-slate-400">({g.relation})</span></p>
          <p className="text-xs text-slate-500" dir="ltr">{g.phone}</p>
        </div>
      ))}
      {guardians.length === 0 && <p className="text-center text-xs text-slate-400 py-8">لا يوجد أولياء أمور</p>}
    </div>
  );
};
