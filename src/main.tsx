import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initTheme } from './utils/theme';
import { NurseryStorageService } from './services/storage';
import { initCloud } from './services/cloudSync';

initTheme();

const rootEl = document.getElementById('root')!;
rootEl.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;font-family:sans-serif;color:#64748b" dir="rtl">جاري التحميل...</div>';
const root = createRoot(rootEl);

// نسحب أحدث بيانات السحابة قبل عرض التطبيق (وإن تعذّر الاتصال نعمل بالنسخة المحلية)
initCloud(NurseryStorageService.getInstance().cloudBridge())
  .catch(() => false)
  .finally(() => root.render(<App />));

// تثبيت التطبيق على الشاشة الرئيسية عند الفتح من متصفح (ليس داخل تطبيق الأندرويد)
if ('serviceWorker' in navigator && !(window as any).Capacitor?.isNativePlatform?.() && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* ignore */ });
}
