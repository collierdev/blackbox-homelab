import { useState, useEffect } from 'react';
import type { Event, Task } from '../types';

interface PlannerData {
  date: string;
  events: Event[];
  tasks: Task[];
  overdueTasks: Task[];
}

interface WeatherData {
  current_condition: Array<{
    temp_F: string;
    weatherDesc: Array<{ value: string }>;
    humidity: string;
    windspeedMiles: string;
  }>;
}

const WEATHER_ICONS: Record<string, string> = {
  sunny: '\u2600\uFE0F', clear: '\u{1F319}', partly: '\u26C5', cloud: '\u2601\uFE0F',
  overcast: '\u2601\uFE0F', rain: '\u{1F327}\uFE0F', drizzle: '\u{1F326}\uFE0F', snow: '\u{1F328}\uFE0F',
  thunder: '\u26C8\uFE0F', fog: '\u{1F32B}\uFE0F', mist: '\u{1F32B}\uFE0F', blizzard: '\u{1F328}\uFE0F',
};

function getWeatherIcon(desc: string): string {
  const lower = desc.toLowerCase();
  for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '\u{1F324}\uFE0F';
}

const MORNING_ROUTINE = ['Exercise / stretch', "Review today's goals", 'Breakfast', 'Morning journaling'];
const EVENING_ROUTINE = ['Personal projects', 'Wind down', 'Plan tomorrow', 'Journal / reflect'];
const FOCUS_ROUTINE = ['Deep work session', 'Clinical / data tasks', 'Review & QC', 'Pomodoro blocks'];

function ScheduleColumn({ events, now }: { events: Event[]; now: Date }) {
  const todayStr = now.toISOString().split('T')[0];
  const todayEvents = events
    .filter(e => e.startDateTime && e.startDateTime.startsWith(todayStr))
    .sort((a, b) => (a.startDateTime || '').localeCompare(b.startDateTime || ''))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <h2 className="text-2xl font-semibold uppercase tracking-widest text-on-surface-variant shrink-0 font-['Plus_Jakarta_Sans']">Schedule</h2>
      <div className="flex flex-col gap-3 overflow-hidden">
        {todayEvents.length === 0 ? (
          <p className="text-2xl text-outline-variant">No events today</p>
        ) : (
          todayEvents.map((event, i) => {
            const start = event.startDateTime ? new Date(event.startDateTime) : null;
            const isPast = start ? start < now : false;
            const isCurrent = start ? start <= now && new Date(start.getTime() + 60 * 60 * 1000) > now : false;
            return (
              <div key={i} className={`flex flex-col gap-0.5 transition-opacity ${isPast && !isCurrent ? 'opacity-30' : ''}`}>
                <span className={`text-xl font-medium leading-tight ${isCurrent ? 'text-tertiary' : 'text-on-surface'}`}>{event.title}</span>
                {start && (
                  <span className="text-lg text-on-surface-variant">
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{event.location ? ` \u00B7 ${event.location}` : ''}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TaskColumn({ tasks, overdue }: { tasks: Task[]; overdue: Task[] }) {
  const highPriority = tasks.filter(t => t.priority === 'high').slice(0, 3);
  const dueToday = tasks.filter(t => t.priority !== 'high' && t.dueDate).slice(0, 3);
  const shown = [...overdue.slice(0, 2), ...highPriority, ...dueToday].slice(0, 6);

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <h2 className="text-2xl font-semibold uppercase tracking-widest text-on-surface-variant shrink-0 font-['Plus_Jakarta_Sans']">Tasks</h2>
      <div className="flex flex-col gap-3 overflow-hidden">
        {shown.length === 0 ? (
          <p className="text-2xl text-outline-variant">All clear \u2728</p>
        ) : (
          shown.map((task, i) => {
            const isOverdue = overdue.some(o => o.id === task.id);
            return (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isOverdue ? 'bg-error' : task.priority === 'high' ? 'bg-tertiary' : 'bg-outline-variant'
                }`} />
                <span className={`text-2xl font-medium leading-tight ${isOverdue ? 'text-error' : 'text-on-surface'}`}>{task.title}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RoutineColumn({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <h2 className="text-2xl font-semibold uppercase tracking-widest text-on-surface-variant shrink-0 font-['Plus_Jakarta_Sans']">{label}</h2>
      <div className="flex flex-col gap-4 overflow-hidden">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="w-7 h-7 rounded-full border-2 border-outline-variant flex-shrink-0" />
            <span className="text-2xl text-secondary font-medium">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PANELS = ['schedule', 'tasks', 'routine'] as const;
type Panel = typeof PANELS[number];

export function DisplayPage() {
  const [now, setNow] = useState(new Date());
  const [plannerData, setPlannerData] = useState<PlannerData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [panelIndex, setPanelIndex] = useState(0);

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1_000); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setInterval(() => setPanelIndex(i => i + 1), 45_000); return () => clearInterval(id); }, []);

  useEffect(() => {
    const fetchPlanner = () => {
      fetch('/api/planner/today').then(r => r.ok ? r.json() : null).then(data => { if (data) setPlannerData(data); }).catch(() => {});
    };
    fetchPlanner();
    const id = setInterval(fetchPlanner, 120_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchWeather = () => {
      fetch('/api/planner/weather').then(r => r.ok ? r.json() : null).then(data => { if (data) setWeather(data); }).catch(() => {});
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 1_800_000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const routine = hour >= 6 && hour < 10 ? MORNING_ROUTINE : hour >= 17 && hour < 22 ? EVENING_ROUTINE : FOCUS_ROUTINE;
  const routineLabel = hour >= 6 && hour < 10 ? 'Morning Routine' : hour >= 17 && hour < 22 ? 'Evening Routine' : 'Focus Block';
  const activePanel: Panel = PANELS[panelIndex % PANELS.length];
  const weatherCond = weather?.current_condition?.[0];
  const tempF = weatherCond?.temp_F ?? '\u2014';
  const weatherDesc = weatherCond?.weatherDesc?.[0]?.value ?? '';
  const weatherIcon = weatherDesc ? getWeatherIcon(weatherDesc) : '\u{1F324}\uFE0F';

  return (
    <div className="w-screen h-screen bg-surface text-on-surface overflow-hidden flex flex-col font-['Inter']">
      {/* Top bar */}
      <div className="flex items-center justify-between px-16 py-8 border-b border-white/5 shrink-0">
        <div>
          <p className="text-3xl font-medium text-secondary">{dateStr}</p>
          <p className="text-xl text-outline-variant mt-1">blackbox \u00B7 Pi Dashboard</p>
        </div>
        <p className="text-[7rem] font-bold tabular-nums leading-none text-primary tracking-tight font-['Plus_Jakarta_Sans']">{timeStr}</p>
        <div className="text-right min-w-[180px]">
          {weatherCond ? (
            <>
              <p className="text-5xl font-bold text-tertiary font-['Plus_Jakarta_Sans']">{weatherIcon} {tempF}\u00B0F</p>
              <p className="text-2xl text-on-surface-variant mt-1">{weatherDesc}</p>
            </>
          ) : (
            <p className="text-2xl text-outline-variant">\u2014</p>
          )}
        </div>
      </div>

      {/* Content grid */}
      <div className="flex-1 grid grid-cols-3 gap-8 px-16 py-8 overflow-hidden">
        <ScheduleColumn events={plannerData?.events ?? []} now={now} />
        {activePanel === 'schedule' && <ScheduleColumn events={plannerData?.events ?? []} now={now} />}
        {activePanel === 'tasks' && <TaskColumn tasks={plannerData?.tasks ?? []} overdue={plannerData?.overdueTasks ?? []} />}
        {activePanel === 'routine' && <RoutineColumn label={routineLabel} items={routine} />}
        <TaskColumn tasks={plannerData?.tasks ?? []} overdue={plannerData?.overdueTasks ?? []} />
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 px-16 py-3 border-t border-white/5 flex justify-between text-lg text-outline-variant">
        <span>Center panel rotates every 45s</span>
        <span>{plannerData ? `${plannerData.events.length} events \u00B7 ${plannerData.tasks.length} tasks` : 'Loading\u2026'}</span>
      </div>
    </div>
  );
}
