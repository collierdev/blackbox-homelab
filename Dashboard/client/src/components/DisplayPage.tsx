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
  sunny: '☀️', clear: '🌙', partly: '⛅', cloud: '☁️',
  overcast: '☁️', rain: '🌧️', drizzle: '🌦️', snow: '❄️',
  thunder: '⛈️', fog: '🌫️', mist: '🌫️', blizzard: '🌨️',
};

function getWeatherIcon(desc: string): string {
  const lower = desc.toLowerCase();
  for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '🌡️';
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
      <h2 className="text-2xl font-semibold uppercase tracking-widest text-slate-500 shrink-0">
        Schedule
      </h2>
      <div className="flex flex-col gap-3 overflow-hidden">
        {todayEvents.length === 0 ? (
          <p className="text-2xl text-slate-700">No events today</p>
        ) : (
          todayEvents.map((event, i) => {
            const start = event.startDateTime ? new Date(event.startDateTime) : null;
            const isPast = start ? start < now : false;
            const isCurrent = start
              ? start <= now && new Date(start.getTime() + 60 * 60 * 1000) > now
              : false;

            return (
              <div
                key={i}
                className={`flex flex-col gap-0.5 transition-opacity ${isPast && !isCurrent ? 'opacity-30' : ''}`}
              >
                <span className={`text-xl font-medium leading-tight ${isCurrent ? 'text-cyan-400' : 'text-white'}`}>
                  {event.title}
                </span>
                {start && (
                  <span className="text-lg text-slate-500">
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {event.location ? ` · ${event.location}` : ''}
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
  const dueToday = tasks
    .filter(t => t.priority !== 'high' && t.dueDate)
    .slice(0, 3);
  const shown = [...overdue.slice(0, 2), ...highPriority, ...dueToday].slice(0, 6);

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <h2 className="text-2xl font-semibold uppercase tracking-widest text-slate-500 shrink-0">
        Tasks
      </h2>
      <div className="flex flex-col gap-3 overflow-hidden">
        {shown.length === 0 ? (
          <p className="text-2xl text-slate-700">All clear ✓</p>
        ) : (
          shown.map((task, i) => {
            const isOverdue = overdue.some(o => o.id === task.id);
            return (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isOverdue ? 'bg-red-500' :
                  task.priority === 'high' ? 'bg-orange-400' : 'bg-slate-600'
                }`} />
                <span className={`text-2xl font-medium leading-tight ${
                  isOverdue ? 'text-red-400' : 'text-white'
                }`}>
                  {task.title}
                </span>
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
      <h2 className="text-2xl font-semibold uppercase tracking-widest text-slate-500 shrink-0">
        {label}
      </h2>
      <div className="flex flex-col gap-4 overflow-hidden">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="w-7 h-7 rounded-full border-2 border-slate-700 flex-shrink-0" />
            <span className="text-2xl text-slate-300 font-medium">{item}</span>
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

  // 1-second clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  // 45-second center panel rotation
  useEffect(() => {
    const id = setInterval(() => setPanelIndex(i => i + 1), 45_000);
    return () => clearInterval(id);
  }, []);

  // Planner data — fetch every 2 minutes
  useEffect(() => {
    const fetchPlanner = () => {
      fetch('/api/planner/today')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setPlannerData(data); })
        .catch(() => {});
    };
    fetchPlanner();
    const id = setInterval(fetchPlanner, 120_000);
    return () => clearInterval(id);
  }, []);

  // Weather — fetch every 30 minutes
  useEffect(() => {
    const fetchWeather = () => {
      fetch('/api/planner/weather')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setWeather(data); })
        .catch(() => {});
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 1_800_000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const routine = hour >= 6 && hour < 10 ? MORNING_ROUTINE
               : hour >= 17 && hour < 22 ? EVENING_ROUTINE
               : FOCUS_ROUTINE;
  const routineLabel = hour >= 6 && hour < 10 ? 'Morning Routine'
                     : hour >= 17 && hour < 22 ? 'Evening Routine'
                     : 'Focus Block';

  const activePanel: Panel = PANELS[panelIndex % PANELS.length];

  const weatherCond = weather?.current_condition?.[0];
  const tempF = weatherCond?.temp_F ?? '—';
  const weatherDesc = weatherCond?.weatherDesc?.[0]?.value ?? '';
  const weatherIcon = weatherDesc ? getWeatherIcon(weatherDesc) : '🌡️';

  return (
    <div className="w-screen h-screen bg-[#06060f] text-white overflow-hidden flex flex-col">
      {/* Top bar: date | clock | weather */}
      <div className="flex items-center justify-between px-16 py-8 border-b border-slate-800/50 shrink-0">
        {/* Date left */}
        <div>
          <p className="text-3xl font-medium text-slate-300">{dateStr}</p>
          <p className="text-xl text-slate-600 mt-1">blackbox · Pi Dashboard</p>
        </div>

        {/* Clock center */}
        <p className="text-[7rem] font-bold tabular-nums leading-none text-white tracking-tight">
          {timeStr}
        </p>

        {/* Weather right */}
        <div className="text-right min-w-[180px]">
          {weatherCond ? (
            <>
              <p className="text-5xl font-bold text-cyan-400">
                {weatherIcon} {tempF}°F
              </p>
              <p className="text-2xl text-slate-400 mt-1">{weatherDesc}</p>
            </>
          ) : (
            <p className="text-2xl text-slate-700">—</p>
          )}
        </div>
      </div>

      {/* 3-column content grid */}
      <div className="flex-1 grid grid-cols-3 gap-8 px-16 py-8 overflow-hidden">
        {/* Column 1: Schedule (always visible) */}
        <ScheduleColumn events={plannerData?.events ?? []} now={now} />

        {/* Column 2: Rotating center panel */}
        {activePanel === 'schedule' && (
          <ScheduleColumn events={plannerData?.events ?? []} now={now} />
        )}
        {activePanel === 'tasks' && (
          <TaskColumn
            tasks={plannerData?.tasks ?? []}
            overdue={plannerData?.overdueTasks ?? []}
          />
        )}
        {activePanel === 'routine' && (
          <RoutineColumn label={routineLabel} items={routine} />
        )}

        {/* Column 3: Tasks (always visible) */}
        <TaskColumn
          tasks={plannerData?.tasks ?? []}
          overdue={plannerData?.overdueTasks ?? []}
        />
      </div>

      {/* Bottom status bar */}
      <div className="shrink-0 px-16 py-3 border-t border-slate-800/50 flex justify-between text-lg text-slate-700">
        <span>Center panel rotates every 45s</span>
        <span>
          {plannerData
            ? `${plannerData.events.length} events · ${plannerData.tasks.length} tasks`
            : 'Loading…'}
        </span>
      </div>
    </div>
  );
}
