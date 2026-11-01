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

## المزامنة السحابية (Firebase) — لتظهر البيانات على كل الأجهزة
بدونها يخزّن كل جهاز بياناته لوحده (طالب مسجّل من تليفون لا يظهر في آخر).

1. افتح https://console.firebase.google.com ← **Add project** (اسم مثل `nursery`، ويمكن تعطيل Analytics).
2. من القائمة **Build ← Firestore Database ← Create database** (اختر موقعاً قريباً مثل `eur3`) ثم **Start in test mode**.
3. **Project settings ← General ← Your apps ← Web (`</>`)** ← سجّل التطبيق وانسخ `firebaseConfig`.
4. الصق القيم في `src/config/firebase.ts`، ثم `npm run build` وأعد تثبيت التطبيق/نشره.
5. اذهب إلى **Firestore ← Rules** والصق محتوى `firestore.rules` ثم **Publish**.
6. أول دخول للإدارة من الجهاز الذي عليه البيانات يرفعها للسحابة تلقائياً (مرة واحدة فقط وعندما تكون السحابة فارغة). بعدها كل جهاز يفتح التطبيق يسحب نفس البيانات، وأي تغيير (طالب جديد، تغيير صورة الخلفية...) يصل لباقي الأجهزة خلال ثوانٍ دون إعادة تثبيت.

### تنبيهات مهمة
- قواعد `firestore.rules` الحالية **مفتوحة للجميع** وهي للاختبار فقط. قبل التشغيل الفعلي تلزم مرحلة الأمان: تسجيل دخول حقيقي وقواعد تجعل كل ولي أمر يرى طفله فقط.
- الصور والتقارير تُزامَن، أما **الفيديو فما زال محلياً على الجهاز** (يلزمه Firebase Storage).
- الحصة المجانية لـ Firestore (قراءات/كتابات يومية) تكفي حضانة صغيرة، لكن راجع الأسعار الحالية.
- في تطبيق Capacitor الفعلي نفّذ `npm install firebase` ثم `npx cap sync` بعد نسخ ملفات `src/services/cloudSync.ts` و`firestoreRemote.ts` و`src/config/firebase.ts`.

## بناء تطبيق الأندرويد (APK)
المشروع جاهز كتطبيق أندرويد عبر Capacitor (مجلد `android/`). يلزمك **Android Studio** على جهازك.

1. ثبّت Android Studio (https://developer.android.com/studio) وافتحه مرة لتنزيل Android SDK.
2. في فولدر المشروع: `npm install` ثم `npm run android:sync` (يبني الموقع وينسخه داخل تطبيق الأندرويد).
3. `npm run android:open` يفتح المشروع في Android Studio، وانتظر انتهاء Gradle Sync.
4. لتجربة سريعة: وصّل تليفونك (تفعيل USB debugging) واضغط ▶ Run.
5. لملف APK للتوزيع: **Build ← Build Bundle(s)/APK(s) ← Build APK(s)**، ويظهر الملف في `android/app/build/outputs/apk/debug/`.
6. بعد أي تعديل في الكود كرّر الخطوة 2 ثم ابنِ APK جديد.

ملاحظات:
- معرّف التطبيق `com.modernbritishkids.app` (في `capacitor.config.ts`). لو عندك تطبيق منشور بمعرّف آخر، غيّره لنفس المعرّف القديم ليتحدّث بدل أن يُثبَّت كتطبيق منفصل.
- إعدادات Firebase تُسجَّل كـ "Web app" في لوحة Firebase حتى لو الناتج تطبيق أندرويد (هي فقط مفاتيح الاتصال).
- لم أستطع بناء الـ APK في بيئتي (يلزمه Android SDK)، فجرّب البناء عندك وأرسل لي أي خطأ يظهر.
