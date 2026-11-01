import React from 'react';
import { NurseryStorageService } from '../../services/storage';
import { DEFAULT_NURSERY_LOGO_DATA_URL } from '../../services/mockData';

/** رأس شاشات الدخول: الشعار الرسمي الثابت (يتغير فقط من إعدادات الإدارة) */
export const LoginBrandHeader: React.FC = () => {
  const storage = NurseryStorageService.getInstance();
  const logo = storage.settings.logoUrl || DEFAULT_NURSERY_LOGO_DATA_URL;
  return (
    <div className="text-center space-y-2">
      <div className="inline-block p-1.5 rounded-3xl bg-white shadow-2xl border-2 border-amber-400">
        <img
          src={logo}
          alt="Modern British Kids"
          className="w-44 h-40 object-contain rounded-2xl select-none"
          draggable={false}
        />
      </div>
      <p className="text-xs text-amber-300 font-semibold drop-shadow-sm">
        حضانة بريطانية دولية للغات والتعليم المبكر
      </p>
    </div>
  );
};
