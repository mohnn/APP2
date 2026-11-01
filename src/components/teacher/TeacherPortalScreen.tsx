import { NOTIFICATIONS_ENABLED } from '../../config/features';
import { NotificationBell } from '../notifications/NotificationBell';
import { recipientTeacher } from '../../services/notifications';
import React, { useState } from 'react';
import { LogOut, Users, ClipboardList, Award, School } from 'lucide-react';
import { User } from '../../types/nursery';
import { NurseryStorageService } from '../../services/storage';
import { localDateStr } from '../../utils/dateUtils';
import { ThemeToggleButton } from '../common/ThemeToggleButton';
import { DailyReportsScreen } from '../education/DailyReportsScreen';
import { EvaluationsScreen } from '../education/EvaluationsScreen';

interface TeacherPortalScreenProps {
  user: User;
  onLogout: () => void;
}

type TeacherTab = 'children' | 'daily' | 'evaluations';

const STATUS_AR: Record<string, string> = {
  present: 'حاضر',
  late: 'متأخر',
  absent: 'غائب',
  leave: 'إجازة',
  pending: 'لم يصل بعد',
  none: 'بدون حالة',
};
const STATUS_STYLE: Record<string, string> = {
  present: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  late: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  absent: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  leave: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  none: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

/** لوحة المعلم: فصوله وأطفاله فقط + المتابعة اليومية + التقييم */
export const TeacherPortalScreen: React.FC<TeacherPortalScreenProps> = ({ user, onLogout }) => {
  const storage = NurseryStorageService.getInstance();
  const [tab, setTab] = useState<TeacherTab>('children');
  const teacher = storage.teachers.find(t => t.id === user.teacherId);

  if (!teacher) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3 bg-slate-50 dark:bg-slate-950">
        <span className="text-4xl">🔒</span>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">هذا الحساب لم يعد متاحاً. تواصل مع إدارة الحضانة.</p>
        <button onClick={onLogout} className="px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold">
          الرجوع لتسجيل الدخول
        </button>
      </div>
    );
  }

  const classes = storage.getTeacherClasses(teacher.id);
  const kids = storage.getTeacherChildren(teacher.id);
  const ids = kids.map(c => c.id);
  const today = localDateStr();
  const rows = kids.map(c => ({ child: c, view: storage.getAttendanceView(c.id, today) }));
  const presentNow = rows.filter(r => r.view.status === 'present' || r.view.status === 'late').length;
  const levelLabel = (id: string) => (id === 'lvl-pre-kg' ? 'بري كيجي' : 'كيجي 1');

  const tabs: { id: TeacherTab; label: string; icon: React.ReactNode }[] = [
    { id: 'children', label: 'أطفالي', icon: <Users className="w-4 h-4" /> },
    { id: 'daily', label: 'المتابعة اليومية', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'evaluations', label: 'التقييم', icon: <Award className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-slate-50 dark:bg-slate-950 text-right font-sans">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shrink-0 shadow-xs">
            {user.avatar || '👩‍🏫'}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{teacher.fullName}</div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold truncate">مدرس/ة {teacher.subject}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {NOTIFICATIONS_ENABLED && <NotificationBell user={user} recipient={recipientTeacher(user.teacherId || '')} />}
          <ThemeToggleButton />
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-1 text-xs font-bold shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              tab === t.id ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'children' && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="font-mono font-bold text-lg text-blue-700 dark:text-blue-300">{classes.length}</div>
              <div className="text-[10px] text-slate-500">فصولي</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="font-mono font-bold text-lg text-amber-700 dark:text-amber-300">{kids.length}</div>
              <div className="text-[10px] text-slate-500">أطفالي</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="font-mono font-bold text-lg text-emerald-700 dark:text-emerald-300">{presentNow}</div>
              <div className="text-[10px] text-slate-500">حضروا اليوم</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {classes.map(c => (
              <span key={c.id} className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold flex items-center gap-1">
                <School className="w-3 h-3" /> {c.name}
              </span>
            ))}
          </div>

          {rows.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              لا يوجد أطفال في فصولك حتى الآن.
            </div>
          ) : (
            <div className="space-y-1.5">
              {rows.map(({ child, view }) => (
                <div key={child.id} className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                  {child.avatarUrl ? (
                    <img src={child.avatarUrl} alt={child.fullName} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: child.avatarColor }}>
                      {child.fullName[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{child.fullName}</div>
                    <div className="text-[10px] text-slate-400">
                      {levelLabel(child.levelId)} · ID: <span className="font-mono">{child.studentId}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${STATUS_STYLE[view.status]}`}>
                    {STATUS_AR[view.status]}
                    {view.record?.checkInTime ? ` · ${view.record.checkInTime}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'daily' && <DailyReportsScreen onBack={() => setTab('children')} allowedChildIds={ids} />}
      {tab === 'evaluations' && <EvaluationsScreen onBack={() => setTab('children')} allowedChildIds={ids} />}
    </div>
  );
};
