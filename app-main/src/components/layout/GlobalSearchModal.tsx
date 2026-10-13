import React, { useState, useMemo } from 'react';
import { Search, X, User, Receipt, Phone, School, ArrowLeft } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';
import { Child } from '../../types/nursery';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChild: (childId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectChild,
}) => {
  const [query, setQuery] = useState('');
  const storage = NurseryStorageService.getInstance();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { children: [], guardians: [], receipts: [], staff: [] };

    const matchedChildren = storage.children.filter(
      c => c.fullName.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );

    const matchedGuardians = storage.guardians.filter(
      g => g.fullName.toLowerCase().includes(q) || g.phone.includes(q) || (g.whatsapp && g.whatsapp.includes(q))
    );

    const matchedReceipts = storage.receipts.filter(
      r => r.receiptNumber.toLowerCase().includes(q) || r.childName.toLowerCase().includes(q)
    );

    const matchedStaff = (storage.employees || []).filter(
      (e: any) => (e.fullName || e.name || '').toLowerCase().includes(q) || (e.phone || '').includes(q) || (e.roleLabelAr || '').includes(q)
    );

    return {
      children: matchedChildren.slice(0, 5),
      guardians: matchedGuardians.slice(0, 4),
      receipts: matchedReceipts.slice(0, 4),
      staff: matchedStaff.slice(0, 4),
    };
  }, [query, storage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث بالاسم، كود الطفل (MBK-..)، الهاتف، رقم الإيصال..."
            autoFocus
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none text-right"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            إغلاق
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {!query ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-500" />
              ابدأ بكتابة اسم الطفل أو ولي الأمر للبحث الفوري
            </div>
          ) : results.children.length === 0 &&
            results.guardians.length === 0 &&
            results.receipts.length === 0 &&
            results.staff.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              لم يتم العثور على نتائج مطابقة لـ "{query}"
            </div>
          ) : (
            <>
              {/* Children */}
              {results.children.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 mb-1.5 px-2">
                    الأطفال ({results.children.length})
                  </div>
                  <div className="space-y-1">
                    {results.children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => {
                          onSelectChild(child.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-right transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: child.avatarColor }}
                          >
                            {child.fullName[0]}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">
                              {child.fullName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              كود: {child.code} · {child.gender === 'male' ? 'ولد' : 'بنت'}
                            </div>
                          </div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Guardians */}
              {results.guardians.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 mb-1.5 px-2">
                    أولياء الأمور ({results.guardians.length})
                  </div>
                  <div className="space-y-1">
                    {results.guardians.map(g => (
                      <div
                        key={g.id}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-right"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {g.fullName} ({g.relation})
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>هاتف: {g.phone}</span>
                            {g.job && <span>· {g.job}</span>}
                          </div>
                        </div>
                        <a
                          href={`tel:${g.phone}`}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Receipts */}
              {results.receipts.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 mb-1.5 px-2">
                    الإيصالات المالية ({results.receipts.length})
                  </div>
                  <div className="space-y-1">
                    {results.receipts.map(r => (
                      <div
                        key={r.id}
                        className="p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 flex items-center justify-between text-right"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            إيصال {r.receiptNumber} - {r.childName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            المبلغ: {r.amount} ج.م · {r.date} · {r.paymentMethod}
                          </div>
                        </div>
                        <Receipt className="w-4 h-4 text-amber-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Staff */}
              {results.staff.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 mb-1.5 px-2">
                    الموظفون ({results.staff.length})
                  </div>
                  <div className="space-y-1">
                    {results.staff.map((emp: any) => (
                      <div
                        key={emp.id}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-right"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {emp.fullName || emp.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {emp.roleLabelAr} · {emp.phone}
                          </div>
                        </div>
                        <span className="text-xs">👩‍🏫</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
