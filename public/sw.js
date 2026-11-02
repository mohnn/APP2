// عامل خدمة بسيط (بدون تخزين مؤقت) يجعل المتصفح يعرض خيار "تثبيت التطبيق" دون أن يعلق على نسخة قديمة
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
