import React, { useState } from 'react';
import { ArrowRight, Phone, MessageCircle, Users, Search } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';

interface GuardiansScreenProps {
  onBack: () => void;
}

export const GuardiansScreen: React.FC<GuardiansScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();
  const [query, setQuery] = useState('');

  const filteredGuardians = storage.guardians.filter(
    g => g.fullName.includes(query) || g.phone.includes(query)
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            أولياء الأمور والمفوضين بالاستلام
          </h2>
          <span className="text-[10px] text-slate-400">سجل التواصل مع عائلات الأطفال</span>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ابحث باسم ولي الأمر أو رقم الهاتف..."
          className="w-full pr-9 pl-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="space-y-2.5 pb-4">
        {filteredGuardians.map((g) => {
          const children = storage.children.filter(c => c.guardianId === g.id);

          return (
            <div
              key={g.id}
              className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">
                    {g.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {g.relation} {g.job ? `· ${g.job}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${g.phone}`}
                    className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600"
                    title="اتصال"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  <a
                    href={`https://wa.me/2${g.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
                    title="واتساب"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Children attached */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">الأبناء المسجلون:</span>
                <div className="flex gap-1 flex-wrap">
                  {children.map(c => (
                    <span key={c.id} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                      {c.fullName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
