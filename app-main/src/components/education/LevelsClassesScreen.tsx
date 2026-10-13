import React from 'react';
import { ArrowRight, Layers, Sparkles, GraduationCap, Users, CheckCircle } from 'lucide-react';
import { NurseryStorageService } from '../../services/storage';

interface LevelsClassesScreenProps {
  onBack: () => void;
}

export const LevelsClassesScreen: React.FC<LevelsClassesScreenProps> = ({ onBack }) => {
  const storage = NurseryStorageService.getInstance();
  const kidsAreaChildren = storage.children.filter(c => c.levelId === 'lvl-kids-area');
  const kg1Children = storage.children.filter(c => c.levelId === 'lvl-kg1');

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-4 space-y-3.5 text-right font-sans select-none pb-24">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            المستويين التعليميين بالحضانة
          </h2>
          <span className="text-[10px] text-slate-400">نظام المستويين بدون فصول (الكيدز إريا مكان واحد موحد + كيجي 1)</span>
        </div>
      </div>

      {/* Level 1: الكيدز إريا (مكان واحد) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-amber-400/80 dark:border-amber-500/50 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">
                1. ركن الكيدز إريا (Kids Area)
              </span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                مكان واحد موحد ومفتوح (معرف الطالب 3 أرقام كحد أقصى)
              </span>
            </div>
          </div>
          <span className="font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg">
            2,500 ج.م / شهرياً
          </span>
        </div>

        <p className="text-slate-500 leading-relaxed text-[11px]">
          مساحة لعب وأنشطة تفاعلية موحدة للأطفال الصغار تحت إشراف متخصص، مع إمكانية الدخول بالوقت المؤقت أو الاشتراك الشهري.
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <span className="text-slate-400">الفئة العمرية: 1 إلى 3.5 سنوات</span>
          <span className="text-amber-600 font-bold">
            عدد الطلاب المسجلين: {kidsAreaChildren.length} أطفال
          </span>
        </div>
      </div>

      {/* Level 2: كيجي 1 */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-blue-400/80 dark:border-blue-500/50 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white block">
                2. مرحلة الروضة الأولى (KG 1)
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                المرحلة التمهيدية الأكاديمية (معرف الطالب 4 أرقام كحد أقصى)
              </span>
            </div>
          </div>
          <span className="font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg">
            2,800 ج.م / شهرياً
          </span>
        </div>

        <p className="text-slate-500 leading-relaxed text-[11px]">
          مناهج التأسيس الأكاديمي واللغات (Oxford Phonics والحساب والمهارات الحركية والسلوكية) مع خطة تقييم ومتابعة شهرية معتمدة.
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <span className="text-slate-400">الفئة العمرية: 3.5 إلى 5 سنوات</span>
          <span className="text-blue-600 font-bold">
            عدد الطلاب المسجلين: {kg1Children.length} أطفال
          </span>
        </div>
      </div>
    </div>
  );
};
