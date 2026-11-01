import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // مهم: لو عندك تطبيق منشور بالفعل استخدم نفس appId القديم ليتحدّث التطبيق بدل أن يُثبَّت كتطبيق جديد
  appId: 'com.modernbritishkids.app',
  appName: 'Modern British Kids',
  webDir: 'dist',
  android: { allowMixedContent: false },
};

export default config;
