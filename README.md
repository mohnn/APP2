# نظام إدارة الحضانة (Modern British Kids)

## التشغيل
```
npm install
npm run dev      # تشغيل محلي
npm run build    # بناء ملف واحد في dist/index.html
```

## ملاحظات
- البيانات تُحفظ في المتصفح (localStorage، والفيديو في IndexedDB) ولا يوجد سيرفر.
- الاسم السري لفتح دخول الإدارة: `src/config/access.ts` (`ADMIN_ACCESS_NAME`).
- إيقاف/تشغيل الإشعارات: `src/config/features.ts` (`NOTIFICATIONS_ENABLED`).
- بيانات دخول الإدارة مكتوبة داخل `src/services/mockData.ts` — غيّرها قبل النشر.
- الملفات التالية لم تكن في النسخة الأصلية وكتبتها أنا من استخدامها في الكود، وقد تختلف عن أصولك:
  `BottomNav`, `GlobalSearchModal`, `GuardiansScreen`, `CodeExporterScreen`, `QrCodeSvg`, `timeFormat`, `formatters`.
