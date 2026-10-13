import { 
  Child, 
  Guardian, 
  PickupPerson, 
  NurseryLevel, 
  NurseryClass, 
  ChildMonthlyFee, 
  PaymentReceipt, 
  ExpenseRecord, 
  DailyReport, 
  EvaluationRecord, 
  User, 
  NurserySettings,
  AuditLog
} from '../types/nursery';

// Raw Royal Emblem SVG for inline vector rendering
export const NURSERY_ROYAL_EMBLEM_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%">
  <defs>
    <radialGradient id="mbkNavyBg" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="65%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <linearGradient id="mbkGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="35%" stop-color="#f59e0b" />
      <stop offset="70%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <linearGradient id="mbkGoldLight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="100%" stop-color="#fbbf24" />
    </linearGradient>
    <filter id="mbkShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Outer Ring -->
  <circle cx="120" cy="120" r="114" fill="url(#mbkNavyBg)" stroke="url(#mbkGoldGrad)" stroke-width="6" filter="url(#mbkShadow)" />
  <circle cx="120" cy="120" r="105" fill="none" stroke="#fbbf24" stroke-width="1.8" stroke-dasharray="3,3" opacity="0.9" />
  <circle cx="120" cy="120" r="100" fill="none" stroke="url(#mbkGoldGrad)" stroke-width="2" />

  <!-- British Royal Shield -->
  <path d="M120 40 C162 40 186 56 186 94 C186 156 120 196 120 196 C120 196 54 156 54 94 C54 56 78 40 120 40 Z" fill="#1e293b" stroke="url(#mbkGoldGrad)" stroke-width="3.5" filter="url(#mbkShadow)" />
  <path d="M120 45 C156 45 178 58 178 92 C178 150 120 187 120 187 C120 187 62 150 62 92 C62 58 84 45 120 45 Z" fill="#0f172a" opacity="0.7" />

  <!-- Royal Crown -->
  <g transform="translate(120, 68)">
    <path d="M-36 12 L-26 -14 L0 8 L26 -14 L36 12 Z" fill="url(#mbkGoldGrad)" stroke="#78350f" stroke-width="1.5" />
    <rect x="-38" y="12" width="76" height="7" rx="3.5" fill="url(#mbkGoldLight)" stroke="#92400e" stroke-width="1" />
    <circle cx="-26" cy="-16" r="4.5" fill="#fef08a" stroke="#d97706" stroke-width="1" />
    <circle cx="0" cy="-18" r="6" fill="#fef08a" stroke="#d97706" stroke-width="1.2" />
    <circle cx="26" cy="-16" r="4.5" fill="#fef08a" stroke="#d97706" stroke-width="1" />
    <!-- Crown Jewels -->
    <circle cx="-16" cy="15" r="2.5" fill="#dc2626" />
    <circle cx="0" cy="15" r="2.8" fill="#2563eb" />
    <circle cx="16" cy="15" r="2.5" fill="#16a34a" />
  </g>

  <!-- Golden Stars -->
  <g fill="url(#mbkGoldLight)">
    <polygon points="40,88 42,93 47,93 43,96 45,101 40,98 35,101 37,96 33,93 38,93" />
    <polygon points="48,114 50,119 55,119 51,122 53,127 48,124 43,127 45,122 41,119 46,119" />
    <polygon points="200,88 202,93 207,93 203,96 205,101 200,98 195,101 197,96 193,93 198,93" />
    <polygon points="192,114 194,119 199,119 195,122 197,127 192,124 187,127 189,122 185,119 190,119" />
  </g>

  <!-- Open Book of Knowledge & Excellence -->
  <g transform="translate(120, 126)">
    <path d="M-36 12 C-20 6 -8 6 0 10 C8 6 20 6 36 12 C34 32 18 28 0 32 C-18 28 -34 32 -36 12 Z" fill="#ffffff" stroke="url(#mbkGoldGrad)" stroke-width="1.5" />
    <line x1="0" y1="10" x2="0" y2="32" stroke="#94a3b8" stroke-width="1.5" />
    <line x1="-28" y1="18" x2="-6" y2="16" stroke="#cbd5e1" stroke-width="1.5" />
    <line x1="-26" y1="23" x2="-6" y2="21" stroke="#cbd5e1" stroke-width="1.5" />
    <line x1="6" y1="16" x2="28" y2="18" stroke="#cbd5e1" stroke-width="1.5" />
    <line x1="6" y1="21" x2="26" y2="23" stroke="#cbd5e1" stroke-width="1.5" />
    <!-- Lion Emblem Head above book -->
    <circle cx="0" cy="-14" r="13" fill="url(#mbkGoldGrad)" stroke="#78350f" stroke-width="1" />
    <circle cx="-11" cy="-22" r="5" fill="url(#mbkGoldGrad)" stroke="#78350f" stroke-width="1" />
    <circle cx="11" cy="-22" r="5" fill="url(#mbkGoldGrad)" stroke="#78350f" stroke-width="1" />
    <circle cx="-5" cy="-15" r="1.8" fill="#1e293b" />
    <circle cx="5" cy="-15" r="1.8" fill="#1e293b" />
    <polygon points="0,-11 -3,-8 3,-8" fill="#78350f" />
  </g>

  <!-- Royal Ribbon Banner -->
  <g transform="translate(120, 196)">
    <path d="M-92 0 C-46 16 46 16 92 0 C82 22 46 26 0 24 C-46 26 -82 22 -92 0 Z" fill="url(#mbkGoldGrad)" stroke="#78350f" stroke-width="1.5" filter="url(#mbkShadow)" />
    <text x="0" y="14" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="9.5" text-anchor="middle" letter-spacing="1.2">MODERN BRITISH KIDS</text>
  </g>
</svg>`;

// Base64 Data URL for Modern British Kids (100% valid URI across all browsers and img elements)
export const DEFAULT_NURSERY_LOGO_DATA_URL = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(NURSERY_ROYAL_EMBLEM_SVG)))}`;

export const DEFAULT_LOGIN_BACKGROUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1736" />
      <stop offset="40%" stop-color="#112255" />
      <stop offset="80%" stop-color="#0a132c" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
    <radialGradient id="sunGlow" cx="25%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#1e3a8a" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#172554" />
      <stop offset="100%" stop-color="#030712" />
    </linearGradient>
  </defs>
  <rect width="1440" height="900" fill="url(#bgGrad)" />
  <rect width="1440" height="900" fill="url(#sunGlow)" />
  <g opacity="0.35" stroke="#f59e0b" stroke-width="2.5" fill="none">
    <path d="M120 460 V220 A100 100 0 0 1 320 220 V460 Z" />
    <line x1="220" y1="120" x2="220" y2="460" />
    <line x1="120" y1="260" x2="320" y2="260" />
    <path d="M400 440 V200 A120 120 0 0 1 640 200 V440 Z" />
    <line x1="520" y1="80" x2="520" y2="440" />
    <line x1="400" y1="240" x2="640" y2="240" />
    <path d="M800 440 V200 A120 120 0 0 1 1040 200 V440 Z" />
    <line x1="920" y1="80" x2="920" y2="440" />
    <line x1="800" y1="240" x2="1040" y2="240" />
    <path d="M1120 460 V220 A100 100 0 0 1 1320 220 V460 Z" />
    <line x1="1220" y1="120" x2="1220" y2="460" />
    <line x1="1120" y1="260" x2="1320" y2="260" />
  </g>
  <path d="M0 620 L1440 620 L1440 900 L0 900 Z" fill="url(#floorGrad)" opacity="0.85" />
  <line x1="0" y1="620" x2="1440" y2="620" stroke="#f59e0b" stroke-width="1.5" opacity="0.4" />
  <g fill="#1e3a8a" opacity="0.3">
    <ellipse cx="280" cy="720" rx="140" ry="40" />
    <ellipse cx="280" cy="710" rx="135" ry="36" fill="#1e293b" />
    <circle cx="160" cy="710" r="22" />
    <circle cx="400" cy="710" r="22" />
    <rect x="1180" y="440" width="200" height="260" rx="8" />
    <rect x="1195" y="460" width="170" height="40" rx="4" fill="#0f172a" />
    <rect x="1195" y="520" width="170" height="40" rx="4" fill="#0f172a" />
    <rect x="1195" y="580" width="170" height="40" rx="4" fill="#0f172a" />
  </g>
  <g fill="#fef08a" opacity="0.25">
    <circle cx="340" cy="280" r="4" />
    <circle cx="480" cy="180" r="5" />
    <circle cx="560" cy="320" r="3" />
    <circle cx="860" cy="240" r="4" />
    <circle cx="940" cy="160" r="6" />
    <circle cx="1060" cy="300" r="3.5" />
    <circle cx="720" cy="200" r="4.5" />
  </g>
</svg>`;

export const DEFAULT_LOGIN_BACKGROUND_DATA_URL = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(DEFAULT_LOGIN_BACKGROUND_SVG)))}`;

export const INITIAL_SETTINGS: NurserySettings = {
  nurseryName: 'Modern British Kids',
  tagline: 'حضانة بريطانية دولية للغات والتعليم المبكر',
  address: 'القاهرة الجديدة - التجمع الخامس - فيلا 72',
  phone: '01098765432',
  whatsapp: '01098765432',
  currency: 'EGP',
  logoUrl: DEFAULT_NURSERY_LOGO_DATA_URL,
  loginBackgroundUrl: DEFAULT_LOGIN_BACKGROUND_DATA_URL,
  startTime: '07:30',         // بداية الحضور بـ QR
  lateThresholdTime: '08:30', // بعد 08:30 يعتبر متأخر
  checkoutTime: '14:00',      // انصراف وخروج الطلاب دائماً الساعة 2:00 م
  academicYear: '2026 / 2027',
};

// Admin user as requested: Nihel with fixed credentials (Modern British / Kids340)
export const ADMIN_USER: User = {
  id: 'u-admin-nihel',
  name: 'Nihel',
  username: 'Modern British',
  role: 'admin',
  roleLabelAr: 'إدارة الحضانة (Nihel)',
  avatar: '👩‍💼',
  phone: '01098765432',
};

export const INITIAL_LEVELS: NurseryLevel[] = [
  {
    id: 'lvl-kids-area',
    name: 'الكيدز إريا (Kids Area)',
    description: 'رعاية فائقة وأنشطة ترفيهية وتعليمية للأطفال الصغار',
    idFormatDesc: 'معرف الطالب لا يتعدى 3 أرقام (مثال: 101)',
    defaultFee: 2500,
  },
  {
    id: 'lvl-kg1',
    name: 'كيجي 1 (KG 1)',
    description: 'تأسيس ثنائي اللغة بالإنجليزية والصوتيات ومفاهيم الحساب والعلوم',
    idFormatDesc: 'معرف الطالب لا يتعدى 4 أرقام (مثال: 1001)',
    defaultFee: 2800,
  },
];

export const INITIAL_CLASSES: NurseryClass[] = [
  {
    id: 'cls-ka-1',
    name: 'ركن الكيدز إريا',
    levelId: 'lvl-kids-area',
    color: '#3b82f6',
  },
  {
    id: 'cls-kg-1',
    name: 'فصل كيجي 1',
    levelId: 'lvl-kg1',
    color: '#10b981',
  },
];

// Clean empty database as requested by user ("تشيلي كل حاجه متسجلها في التطبيق يعني يبق فاضي من الطلاب")
export const INITIAL_GUARDIANS: Guardian[] = [];
export const INITIAL_PICKUP_PERSONS: PickupPerson[] = [];
export const INITIAL_CHILDREN: Child[] = [];
export const INITIAL_MONTHLY_FEES: ChildMonthlyFee[] = [];
export const INITIAL_RECEIPTS: PaymentReceipt[] = [];
export const INITIAL_EXPENSES: ExpenseRecord[] = [];
export const INITIAL_DAILY_REPORTS: DailyReport[] = [];
export const INITIAL_EVALUATIONS: EvaluationRecord[] = [];
export const INITIAL_KIDS_AREA_SESSIONS: any[] = [];

const todayDateStr = new Date().toISOString().split('T')[0];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-sys-start',
    timestamp: `${todayDateStr} 08:00 ص`,
    userId: 'u-admin-nihel',
    userName: 'Nihel',
    userRole: 'admin',
    action: 'تهيئة النظام',
    details: 'تم تفريغ النظام وتجهيز قاعدة البيانات بنجاح لاستقبال تسجيل الطلاب الجدد.',
  },
];
