/**
 * إعدادات Firebase (المزامنة السحابية بين كل الأجهزة).
 * املأ القيم من: Firebase Console ← Project settings ← Your apps ← Web app ← firebaseConfig.
 * وطالما apiKey فارغ يعمل التطبيق محلياً على الجهاز فقط (كما كان).
 */
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyA3vZWZzDbrrvi4FA2_jcMXD030dLaFf8w',
  authDomain: 'modern-british-b1326.firebaseapp.com',
  projectId: 'modern-british-b1326',
  storageBucket: 'modern-british-b1326.firebasestorage.app',
  messagingSenderId: '1035861688837',
  appId: '1:1035861688837:web:bd57ed4acb972b4249d26c',
};

export const isCloudConfigured = (): boolean => !!FIREBASE_CONFIG.apiKey && !!FIREBASE_CONFIG.projectId;
