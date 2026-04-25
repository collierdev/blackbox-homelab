import { useState, useEffect, useCallback } from 'react';
import { Clipboard, Zap, CheckCircle, CalendarDays, Thermometer, Droplets } from 'lucide-react';
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
}

interface WeatherData {
  current_condition: WeatherCondition[];
}

const C = {
  bg: '#0b1326', l1: '#121f38', l2: '#162040', l3: '#1c2a4a', l4: '#243356',
  blue: '#adc6ff', amber: '#f7be1d', green: '#22c55e', red: '#ffb4ab',
  text: '#e2e8f0', dim: '#c2c6d6', dimmer: '#8892a4',
};

const MORNING_ROUTINES = [
  { id: 1, label: 'Hydrate' },
  { id: 2, label: 'Review Logs' },
  { id: 3, label: 'Clear Inbox' },
  { id: 4, label: 'Set Priorities' },
];

const DAILY_SNIPPET = { quote: '"The best way to predict the future is to invent it."', author: 'Alan Kay' };

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function DayPlanner() {
  const [now, setNow] = useState(new Date());
  const [plannerData, setPlannerData] = useState<PlannerData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherError, setWeatherError] = useState(false);
  const [routineDone, setRoutineDone] = useState<Record<number, boolean>>({});

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
      if (res.ok) { setWeather(await res.json()); setWeatherError(false); }
      else setWeatherError(true);
    } catch { setWeatherError(true); }
  }, []);

  useEffect(() => {
    fetchPlanner();
    fetchWeather();
    const pi = setInterval(fetchPlanner, 2 * 60 * 1000);
    const wi = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => { clearInterval(pi); clearInterval(wi); };
  }, [fetchPlanner, fetchWeather]);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

  const cond = weather?.current_condition?.[0];
  const tempF = cond?.temp_F ? `${cond.temp_F}°` : '';
  const humidity = cond?.humidity || '';

  const upcoming = plannerData?.events.filter(e => new Date(e.endDateTime) >= now) || [];
  const past = plannerData?.events.filter(e => new Date(e.endDateTime) < now) || [];

  // Current focus: event happening right now, or next upcoming event
  const activeEvent = upcoming.find(e => new Date(e.startDateTime) <= now);
  const nextEvent = !activeEvent ? upcoming[0] : null;

  // Right col stats
  const tasksDone = (plannerData?.tasks?.filter((t: Task & { status?: string }) => t.status === 'completed').length || 0) + 9;
  const eventsLeft = upcoming.length;

  // Toggle routine
  const toggleRoutine = (id: number) => setRoutineDone(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ height: '100%', background: C.bg, color: C.text, fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 32px 20px', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 12, color: C.dimmer, letterSpacing: '0.06em' }}>{dateStr}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: C.dimmer, marginTop: 2 }}>{greeting}, JOSH</div>
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 700, color: C.text }}>
          {timeStr}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.amber }}>
          {!weatherError && cond ? (
            <>
              <Zap style={{ width: 18, height: 18, color: C.amber }} />
              <span style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{tempF}</span>
            </>
          ) : (
            <span style={{ fontSize: 13, color: C.dimmer }}>—</span>
          )}
        </div>
      </div>

      {/* Main 3-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 220px', gap: 20, padding: '0 32px 28px', flex: 1, minHeight: 0 }}>

        {/* LEFT — Schedule + Tasks */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Today's Schedule */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Clipboard style={{ width: 14, height: 14, color: C.dimmer }} />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: C.dimmer }}>TODAY'S SCHEDULE</span>
            </div>
            <div style={{ position: 'relative', paddingLeft: 20 }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, background: C.l4 }} />
              {past.slice(-2).map(e => (
                <div key={e.id} style={{ marginBottom: 14, opacity: 0.4 }}>
                  <div style={{ fontSize: 12, color: C.dimmer, marginBottom: 6 }}>{formatTime(e.startDateTime)}</div>
                  <div style={{ background: C.l2, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, textDecoration: 'line-through', color: C.dimmer }}>{e.title}</div>
                  </div>
                </div>
              ))}
              {upcoming.slice(0, 4).map(e => {
                const isNow = new Date(e.startDateTime) <= now && new Date(e.endDateTime) >= now;
                return (
                  <div key={e.id} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: isNow ? C.amber : C.dimmer, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {formatTime(e.startDateTime)}
                      {isNow && <span style={{ width: 5, height: 5, borderRadius: 3, background: C.amber, display: 'inline-block' }} />}
                    </div>
                    <div style={{ background: isNow ? C.l3 : C.l2, borderRadius: 10, padding: '12px 14px', border: isNow ? `1px solid ${C.amber}33` : '1px solid transparent' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isNow ? 6 : 0 }}>
                        <div style={{ fontSize: 13, fontWeight: isNow ? 600 : 500, color: isNow ? C.text : C.dim }}>{e.title}</div>
                        {isNow && <span style={{ fontSize: 11, color: C.amber, background: `${C.amber}20`, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>ACTIVE</span>}
                      </div>
                      {e.location && <div style={{ fontSize: 11, color: C.blue, marginTop: 2 }}>{e.location}</div>}
                    </div>
                  </div>
                );
              })}
              {!plannerData && <div style={{ fontSize: 13, color: C.dimmer }}>Loading...</div>}
              {plannerData && plannerData.events.length === 0 && (
                <div style={{ background: C.l2, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 13, color: C.dimmer }}>No events today</div>
                </div>
              )}
            </div>
          </div>

          {/* Pending Tasks */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: C.dimmer }}>PENDING TASKS</span>
              {plannerData && plannerData.overdueTasks.length > 0 && (
                <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>{plannerData.overdueTasks.length} OVERDUE</span>
              )}
            </div>
            {plannerData?.overdueTasks.slice(0, 3).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.l3}` }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${C.red}`, background: 'transparent', marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.red }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: C.dimmer, marginTop: 2 }}>OVERDUE</div>
                </div>
              </div>
            ))}
            {plannerData?.tasks.slice(0, 4).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.l3}` }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${C.l4}`, background: 'transparent', marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: C.dimmer, marginTop: 2 }}>
                    {(t as Task & { priority?: string }).priority === 'high' ? 'HIGH PRIORITY' : 'FLEXIBLE'}
                  </div>
                </div>
              </div>
            ))}
            {plannerData && plannerData.tasks.length === 0 && plannerData.overdueTasks.length === 0 && (
              <div style={{ fontSize: 13, color: C.dimmer, textAlign: 'center', padding: '16px 0' }}>All caught up ✓</div>
            )}
          </div>
        </div>

        {/* CENTER — Current Focus + Daily Routines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          {/* Current Focus */}
          <div style={{ background: C.l2, borderRadius: 12, padding: '24px' }}>
            <div style={{ fontSize: 11, color: C.dimmer, letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap style={{ width: 13, height: 13, color: C.dimmer }} /> CURRENT FOCUS
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, color: C.text }}>
                  {activeEvent ? activeEvent.title : nextEvent ? nextEvent.title : 'Free Time'}
                </div>
                {(activeEvent || nextEvent) && (
                  <div style={{ fontSize: 12, color: C.dimmer, marginTop: 4 }}>
                    {activeEvent ? 'In progress' : `Up next at ${formatTime(nextEvent!.startDateTime)}`}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 40, fontWeight: 800, color: C.amber, lineHeight: 1 }}>
                  {upcoming.length > 0 ? upcoming.length : '—'}
                </div>
                <div style={{ fontSize: 11, color: C.dimmer, letterSpacing: '0.08em' }}>EVENTS LEFT</div>
              </div>
            </div>
          </div>

          {/* Daily Routines 2x2 */}
          <div style={{ background: C.l2, borderRadius: 12, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle style={{ width: 14, height: 14 }} /> DAILY ROUTINES
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: C.dimmer }}>MORNING STARTUP</span>
              <span style={{ fontSize: 12, color: C.green }}>{Object.values(routineDone).filter(Boolean).length}/{MORNING_ROUTINES.length} Done</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {MORNING_ROUTINES.map(r => (
                <div key={r.id} onClick={() => toggleRoutine(r.id)}
                  style={{ background: routineDone[r.id] ? C.l4 : C.l3, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'background 0.2s' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 11, background: routineDone[r.id] ? C.blue : 'transparent', border: `1.5px solid ${routineDone[r.id] ? C.blue : C.l4}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {routineDone[r.id] && <span style={{ fontSize: 13, color: C.bg, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: routineDone[r.id] ? C.text : C.dimmer, textDecoration: routineDone[r.id] ? 'line-through' : 'none' }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Stats + Up Next + Snippet + Environment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {/* Stats 2x2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: C.l2, borderRadius: 10, padding: '16px', textAlign: 'center' }}>
              <CheckCircle style={{ width: 20, height: 20, color: C.dimmer, margin: '0 auto' }} />
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 800, marginTop: 8, color: C.text }}>{tasksDone}</div>
              <div style={{ fontSize: 10, color: C.dimmer, letterSpacing: '0.06em' }}>TASKS DONE</div>
            </div>
            <div style={{ background: C.l2, borderRadius: 10, padding: '16px', textAlign: 'center' }}>
              <CalendarDays style={{ width: 20, height: 20, color: C.amber, margin: '0 auto' }} />
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 800, color: C.amber, marginTop: 8 }}>{eventsLeft}</div>
              <div style={{ fontSize: 10, color: C.dimmer, letterSpacing: '0.06em' }}>EVENTS LEFT</div>
            </div>
          </div>

          {/* Up Next */}
          <div style={{ background: C.l2, borderRadius: 10, padding: '16px' }}>
            <div style={{ fontSize: 11, color: C.dimmer, letterSpacing: '0.06em', marginBottom: 12 }}>UP NEXT</div>
            {upcoming.slice(0, 3).map(e => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 3, background: C.blue, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: C.dim }}>{e.title}</span>
                </div>
                <span style={{ fontSize: 12, color: C.dimmer, flexShrink: 0 }}>{formatTime(e.startDateTime)}</span>
              </div>
            ))}
            {upcoming.length === 0 && <div style={{ fontSize: 12, color: C.dimmer }}>No upcoming events</div>}
          </div>

          {/* Daily Snippet */}
          <div style={{ background: C.l2, borderRadius: 10, padding: '16px' }}>
            <div style={{ fontSize: 10, color: C.dimmer, letterSpacing: '0.08em', marginBottom: 10 }}>✦ DAILY SNIPPET</div>
            <p style={{ fontSize: 13, fontStyle: 'italic', color: C.dim, lineHeight: 1.6, margin: 0 }}>{DAILY_SNIPPET.quote}</p>
            <div style={{ fontSize: 11, color: C.dimmer, marginTop: 8 }}>— {DAILY_SNIPPET.author}</div>
          </div>

          {/* Environment */}
          <div style={{ background: C.l2, borderRadius: 10, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: C.dimmer, letterSpacing: '0.08em' }}>ENVIRONMENT</div>
              {!weatherError && cond && <span style={{ width: 6, height: 6, borderRadius: 3, background: C.green }} />}
            </div>
            {!weatherError && cond ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <Thermometer style={{ width: 16, height: 16, color: C.dimmer, margin: '0 auto' }} />
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, marginTop: 4, color: C.text }}>{cond.temp_F}°F</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Droplets style={{ width: 16, height: 16, color: C.blue, margin: '0 auto' }} />
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 700, marginTop: 4, color: C.text }}>{humidity}%</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: C.dimmer }}>Weather unavailable</div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ borderTop: `1px solid ${C.l3}40`, background: `${C.bg}cc`, padding: '6px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: C.dimmer }}>blackbox.local · Pi Dashboard</span>
        <span style={{ fontSize: 11, color: C.dimmer }}>
          {plannerData ? `Synced ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Syncing...'}
        </span>
      </div>
    </div>
  );
}
