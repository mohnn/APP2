import React, { useState } from 'react';
import { ArrowLeft, UserIcon } from './nameGateIcons';
import { LoginBrandHeader } from './LoginBrandHeader';
import { NurseryStorageService } from '../../services/storage';
import { DEFAULT_LOGIN_BACKGROUND_DATA_URL } from '../../services/mockData';
import { DeviceRole, isAdminAccessName } from '../../config/access';

interface NameGateScreenProps {
  onContinue: (role: DeviceRole) => void;
}

/**
 * شاشة الترحيب الأولى (تظهر مرة واحدة فقط لكل جهاز).
 * شكلها محايد تماماً: أي اسم يؤدي إلى دخول ولي الأمر، والاسم السري فقط يفتح دخول الإدارة.
 */
export const NameGateScreen: React.FC<NameGateScreenProps> = ({ onContinue }) => {
  const storage = NurseryStorageService.getInstance();
  const [name, setName] = useState('');
  const bg = storage.settings.loginBackgroundUrl || DEFAULT_LOGIN_BACKGROUND_DATA_URL;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onContinue(isAdminAccessName(name) ? 'admin' : 'parent');
  };

  return (
    <div className="relative flex-1 w-full h-full min-h-screen text-white flex flex-col justify-center px-4 py-6 overflow-y-auto font-sans text-right select-none">
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <img src={bg} alt="" className="w-full h-full object-cover object-center select-none" />
        <div className="absolute inset-0 bg-slate-950/50 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-blue-950/40 to-slate-950/60 pointer-events-none" />
      </div>

      <div className="w-full max-w-sm mx-auto space-y-4 relative z-10 my-auto">
        <LoginBrandHeader />

        <form
          onSubmit={submit}
          className="bg-slate-900/85 backdrop-blur-xl p-5 rounded-3xl border border-slate-700/70 shadow-2xl space-y-3.5 text-xs"
        >
          <div className="text-center pb-1">
            <span className="text-sm font-bold text-amber-300 block mb-0.5">أهلاً بك 👋</span>
            <span className="text-[11px] text-slate-400">من فضلك اكتب اسمك للمتابعة</span>
          </div>

          <div className="relative">
            <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="اسمك"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="w-full pr-9 pl-3 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>متابعة</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
