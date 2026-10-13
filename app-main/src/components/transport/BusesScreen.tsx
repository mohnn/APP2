import React from 'react';
import { ArrowRight, Bus } from 'lucide-react';

interface BusesScreenProps {
  onBack: () => void;
}

export const BusesScreen: React.FC<BusesScreenProps> = ({ onBack }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 space-y-4 text-right font-sans">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
          خدمة الباص المدرسي
        </h2>
      </div>

      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <Bus className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          خدمة الباصات غير مفعلة
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          تم إيقاف خدمة الباصات في حضانة Modern British Kids بناءً على رغبة الإدارة وأولياء الأمور، حيث يتم الاستلام والتسليم المباشر عند بوابة الحضانة بمرافقة أولياء الأمور والمفوضين.
        </p>
      </div>
    </div>
  );
};
