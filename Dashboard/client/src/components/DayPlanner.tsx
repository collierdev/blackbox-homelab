import { useState, useEffect, useCallback } from 'react';
import type { Event, Task } from '../types';

interface PlannerData {
  date: string;
  events: Event[];
  tasks: Task[];
  overdueTasks: Task[];
}

interface WeatherCondition {
  temp_F: string;
  weatherDesc: Array<{ value: string }>;
  humidity: string;
  windspeedMiles: string;
  weatherIconUrl?: Array<{ value: string }>;
}

interface WeatherData {
  current_condition: WeatherCondition[];
  nearest_area?: Array<{
    areaName: Array<{ value: string }>;
    region: Array<{ value: string }>;
  }>;
}

interface Routine {
  label: string;
  timeRange: string;
  startHour: number;
  endHour: number;
  emoji: string;
  tasks: string[];
}

const ROUTINES: Routine[] = [
  {
    label: 'Morning',
    timeRange: '6:00 – 9:00',
    startHour: 6,
    endHour: 9,
    emoji: '🌅',
    tasks: ['Exercise / stretch', 'Review today\'s goals', 'Breakfast'],
  },
  {
    label: 'Deep Work',
    timeRange: '9:00 – 12:00',
    startHour: 9,
    endHour: 12,
    emoji: '💻',
    tasks: ['Focus sessions', 'Clinical data tasks', 'Research / analysis'],
  },
  {
    label: 'Afternoon',
    timeRange: '12:00 – 17:00',
    startHour: 12,
    endHour: 17,
    emoji: '☀️',
    tasks: ['Meetings & collaboration', 'Review / QC work', 'Admin & emails'],
  },
  {
    label: 'Evening',
    timeRange: '17:00 – 21:00',
    startHour: 17,
    endHour: 21,
    emoji: '🌆',
    tasks: ['Personal projects', 'Learning / reading', 'Family time'],
  },
  {
    label: 'Night',
    timeRange: '21:00 – 23:00',
    startHour: 21,
    endHour: 23,
    emoji: '🌙',
    tasks: ['Wind down', 'Plan tomorrow', 'Journal'],
  },
];

const WEATHER_ICONS: Record<string, string> = {
  'Sunny': '☀️',
  'Clear': '🌙',
  'Partly cloudy': '⛅',
  'Cloudy': '☁️',
  'Overcast': '☁️',
  'Mist': '🌫️',
  'Fog': '🌫️',
  'Light rain': '🌦️',
  'Moderate rain': '🌧️',
  'Heavy rain': '🌧️',
  'Thundery outbreaks possible': '⛈️',
  'Blizzard': '❄️',
  'Light snow': '🌨️',
  'Moderate snow': '❄️',
  'Heavy snow': '❄️',
  'Patchy rain possible': '🌦️',
};

function getWeatherEmoji(desc: string): string {
  for (const [key, emoji] of Object.entries(WEATHER_ICONS)) {
    if (desc.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '🌤️';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function priorityColor(p: string): string {
  if (p === 'high') return 'text-red-400';
  if (p === 'medium') return 'text-yellow-400';
  return 'text-slate-400';
}

export function DayPlanner() {
  const [now, setNow] = useState(new Date());
  const [plannerData, setPlannerData] = useState<PlannerData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState(false);

  // Tick clock every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fetchPlanner = useCallback(async () => {
    try {
      const res = await fetch('/api/planner/today');
      if (res.ok) setPlannerData(await res.json());
    } catch {}
  }, []);

  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch('/api/planner/weather');
      if (res.ok) {
        setWeather(await res.json());
        setWeatherError(false);
      } else {
        setWeatherError(true);
      }
    } catch {
      setWeatherError(true);
    }
  }, []);

  useEffect(() => {
    fetchPlanner();
    fetchWeather();
    const plannerInterval = setInterval(fetchPlanner, 2 * 60 * 1000);
    const weatherInterval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => {
      clearInterval(plannerInterval);
      clearInterval(weatherInterval);
    };
  }, [fetchPlanner, fetchWeather]);

  const hour = now.getHours();
  const currentRoutine = ROUTINES.find(r => hour >= r.startHour && hour < r.endHour);
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const secondsStr = now.toLocaleTimeString([], { second: '2-digit' }).split(':').pop() || '00';
  const dateStr = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const cond = weather?.current_condition?.[0];
  const weatherDesc = cond?.weatherDesc?.[0]?.value || '';
  const weatherEmoji = getWeatherEmoji(weatherDesc);
  const tempF = cond?.temp_F ? `${cond.temp_F}°F` : '';

  // Separate upcoming vs past events
  const upcoming = plannerData?.events.filter(e => new Date(e.endDateTime) >= now) || [];
  const past = plannerData?.events.filter(e => new Date(e.endDateTime) < now) || [];

  return (
    <div className="min-h-screen bg-[#080812] text-white font-sans select-none overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-10 pt-8 pb-4">
        <div>
          <p className="text-slate-400 text-lg font-medium tracking-widest uppercase">{greeting}, Josh</p>
          <p className="text-slate-500 text-sm mt-0.5">{dateStr}</p>
        </div>

        {/* Clock */}
        <div className="text-center">
          <div className="flex items-end justify-center gap-1">
            <span className="text-7xl font-bold tabular-nums text-white tracking-tight">{timeStr}</span>
            <span className="text-3xl font-light text-slate-500 mb-2 tabular-nums">{secondsStr}</span>
          </div>
        </div>

        {/* Weather */}
        <div className="text-right min-w-[160px]">
          {cond && !weatherError ? (
            <>
              <div className="flex items-center justify-end gap-3">
                <span className="text-4xl">{weatherEmoji}</span>
                <span className="text-4xl font-bold text-cyan-400">{tempF}</span>
              </div>
              <p className="text-slate-400 text-sm mt-1">{weatherDesc}</p>
              <p className="text-slate-600 text-xs">
                {cond.humidity}% humidity · {cond.windspeedMiles} mph wind
              </p>
            </>
          ) : (
            <span className="text-slate-600 text-sm">{weatherError ? 'Weather unavailable' : '...'}</span>
          )}
        </div>
      </div>

      {/* Accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-10 mb-6" />

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6 px-10 pb-8" style={{ height: 'calc(100vh - 200px)' }}>

        {/* Left — Routines */}
        <div className="flex flex-col gap-4 overflow-auto">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Daily Routines</h2>
          {ROUTINES.map(r => {
            const isActive = r === currentRoutine;
            return (
              <div
                key={r.label}
                className={`rounded-xl p-4 border transition-all ${
                  isActive
                    ? 'bg-cyan-950/60 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/40 border-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{r.emoji}</span>
                  <div>
                    <span className={`font-semibold text-sm ${isActive ? 'text-cyan-300' : 'text-slate-300'}`}>
                      {r.label}
                    </span>
                    {isActive && (
                      <span className="ml-2 text-xs bg-cyan-500 text-black font-bold px-1.5 py-0.5 rounded">
                        NOW
                      </span>
                    )}
                    <p className="text-slate-600 text-xs">{r.timeRange}</p>
                  </div>
                </div>
                <ul className="space-y-0.5">
                  {r.tasks.map(t => (
                    <li key={t} className="text-xs text-slate-500 flex gap-1.5 items-center">
                      <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isActive ? 'bg-cyan-500' : 'bg-slate-700'}`} />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Center — Today's Schedule */}
        <div className="flex flex-col gap-3 overflow-auto">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Today's Schedule
            {plannerData && (
              <span className="ml-2 normal-case text-slate-700">
                {plannerData.events.length} events
              </span>
            )}
          </h2>

          {!plannerData ? (
            <div className="text-slate-700 text-sm animate-pulse">Loading...</div>
          ) : plannerData.events.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-6 text-center">
              <p className="text-slate-600 text-sm">No events today</p>
              <p className="text-slate-700 text-xs mt-1">Clear calendar ✓</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Past events */}
              {past.map(e => (
                <div
                  key={e.id}
                  className="flex gap-3 items-start rounded-lg p-3 bg-slate-900/20 border border-slate-800/30 opacity-40"
                >
                  <div className="text-right min-w-[52px]">
                    <p className="text-xs text-slate-600 font-mono">{formatTime(e.startDateTime)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-500 truncate line-through">{e.title}</p>
                  </div>
                </div>
              ))}

              {/* Current / upcoming events */}
              {upcoming.map(e => {
                const isNow =
                  new Date(e.startDateTime) <= now && new Date(e.endDateTime) >= now;
                return (
                  <div
                    key={e.id}
                    className={`flex gap-3 items-start rounded-xl p-3 border transition-all ${
                      isNow
                        ? 'bg-cyan-950/60 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900/40 border-slate-800/50'
                    }`}
                  >
                    <div className="text-right min-w-[52px]">
                      <p className={`text-xs font-mono font-semibold ${isNow ? 'text-cyan-400' : 'text-slate-500'}`}>
                        {formatTime(e.startDateTime)}
                      </p>
                      <p className="text-xs text-slate-700 font-mono">{formatTime(e.endDateTime)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isNow ? 'text-cyan-200' : 'text-slate-300'}`}>
                        {isNow && <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 mb-0.5 animate-pulse" />}
                        {e.title}
                      </p>
                      {e.location && (
                        <p className="text-xs text-slate-600 truncate mt-0.5">📍 {e.location}</p>
                      )}
                      {e.isAllDay && (
                        <span className="text-xs text-slate-600">All day</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right — Tasks */}
        <div className="flex flex-col gap-4 overflow-auto">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Tasks & Focus</h2>

          {/* Overdue */}
          {plannerData && plannerData.overdueTasks.length > 0 && (
            <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-widest mb-2">
                ⚠ Overdue ({plannerData.overdueTasks.length})
              </p>
              <ul className="space-y-1.5">
                {plannerData.overdueTasks.slice(0, 5).map(t => (
                  <li key={t.id} className="flex gap-2 items-start text-sm text-red-300">
                    <span className="flex-shrink-0 mt-0.5">•</span>
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
                {plannerData.overdueTasks.length > 5 && (
                  <li className="text-xs text-red-700">+{plannerData.overdueTasks.length - 5} more</li>
                )}
              </ul>
            </div>
          )}

          {/* High priority today */}
          {plannerData && plannerData.tasks.filter(t => t.priority === 'high').length > 0 && (
            <div className="bg-orange-950/40 border border-orange-800/40 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-2">
                🎯 High Priority Today
              </p>
              <ul className="space-y-1.5">
                {plannerData.tasks
                  .filter(t => t.priority === 'high')
                  .slice(0, 4)
                  .map(t => (
                    <li key={t.id} className="flex gap-2 items-start text-sm text-orange-200">
                      <span className="flex-shrink-0 mt-0.5 text-orange-500">●</span>
                      <span className="truncate">{t.title}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Due today */}
          {plannerData && plannerData.tasks.filter(t => t.priority !== 'high').length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Due Today
              </p>
              <ul className="space-y-1.5">
                {plannerData.tasks
                  .filter(t => t.priority !== 'high')
                  .slice(0, 8)
                  .map(t => (
                    <li key={t.id} className="flex gap-2 items-start text-sm">
                      <span className={`flex-shrink-0 mt-0.5 text-xs ${priorityColor(t.priority)}`}>◆</span>
                      <span className="text-slate-400 truncate">{t.title}</span>
                    </li>
                  ))}
                {plannerData.tasks.filter(t => t.priority !== 'high').length > 8 && (
                  <li className="text-xs text-slate-700">
                    +{plannerData.tasks.filter(t => t.priority !== 'high').length - 8} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {plannerData && plannerData.tasks.length === 0 && plannerData.overdueTasks.length === 0 && (
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-6 text-center">
              <p className="text-2xl mb-2">✓</p>
              <p className="text-slate-500 text-sm">All caught up!</p>
              <p className="text-slate-700 text-xs mt-1">No tasks due today</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800/50 bg-[#080812]/80 backdrop-blur px-10 py-2 flex justify-between items-center">
        <span className="text-slate-700 text-xs">blackbox.local · Pi Dashboard</span>
        <span className="text-slate-700 text-xs">
          {plannerData ? `Synced ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Syncing...'}
        </span>
      </div>
    </div>
  );
}
