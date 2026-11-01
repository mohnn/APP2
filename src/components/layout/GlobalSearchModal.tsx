import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';

export const GlobalSearchModal = ({ isOpen, onClose, onSelectChild }: {
  isOpen: boolean; onClose: () => void; onSelectChild: (id: string) => void;
}) => {
  const [q, setQ] = useState('');
  if (!isOpen) return null;
  const term = q.trim().toLowerCase();
  const results = term
    ? NurseryStorageService.getInstance().children
        .filter(c => c.fullName.toLowerCase().includes(term) || c.code.toLowerCase().includes(term) || c.studentId.includes(term))
        .slice(0, 20)
    : [];
  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div dir="rtl" className="w-full bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3">
          <Search size={16} className="text-slate-400" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث عن طفل بالاسم أو الكود"
            className="flex-1 bg-transparent py-2.5 text-sm outline-none dark:text-white" />
          <button onClick={onClose}><X size={16} className="text-slate-400" /></button>
        </div>
        <div className="mt-2 max-h-72 overflow-y-auto">
          {results.map(c => (
            <button key={c.id} onClick={() => { onSelectChild(c.id); setQ(''); }}
              className="w-full text-right px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm dark:text-white">
              {c.fullName} <span className="text-xs text-slate-400">({c.code})</span>
            </button>
          ))}
          {term && results.length === 0 && <p className="text-center text-xs text-slate-400 py-4">لا توجد نتائج</p>}
        </div>
      </div>
    </div>
  );
};
