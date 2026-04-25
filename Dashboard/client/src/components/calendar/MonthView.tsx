import type { Event } from '../../types';

const C = {
  bg: '#0b1326', l2: '#162040', l3: '#1c2a4a', l4: '#243356',
  blue: '#adc6ff', text: '#e2e8f0', dimmer: '#8892a4',
};

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MAX_PILLS = 3;

interface MonthViewProps {
  events: Event[];
  currentDate: Date;
  onEventClick: (eventId: string) => void;
  onEventDoubleClick: (eventId: string) => void;
  onNewEvent: (date?: Date) => void;
}

function isToday(d: Date) {
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function eventsOnDay(events: Event[], day: Date): Event[] {
  return events.filter(e => {
    try { return isSameDay(new Date(e.startDateTime), day); } catch { return false; }
  });
}

export default function MonthView({ events, currentDate, onEventClick, onNewEvent }: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = 42;

  // Build cell array: null = blank padding, Date = real day
  const cells: (Date | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ...Array<null>(totalCells - firstDayOfWeek - daysInMonth).fill(null),
  ];

  return (
    <div style={{ flex: 1, background: C.l2, display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: 7, overflow: 'hidden' }}>

      {/* Weekday header row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: C.l3, flexShrink: 0 }}>
        {WEEKDAYS.map(day => (
          <div key={day} style={{ padding: 10, textAlign: 'center', fontSize: 11, fontWeight: 600, color: C.dimmer, letterSpacing: '0.08em' }}>
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', flex: 1, minHeight: 0 }}>
        {cells.map((day, idx) => {
          const col = idx % 7;
          const today = day ? isToday(day) : false;
          const dayEvents = day ? eventsOnDay(events, day) : [];
          const visible = dayEvents.slice(0, MAX_PILLS);
          const overflow = dayEvents.length - MAX_PILLS;

          return (
            <div
              key={idx}
              onClick={() => day && onNewEvent(day)}
              style={{
                padding: '10px 12px',
                minHeight: 100,
                borderTop: `1px solid ${C.l3}`,
                borderLeft: col === 0 ? 'none' : `1px solid ${C.l3}`,
                cursor: day ? 'pointer' : 'default',
                background: today ? C.l4 : 'transparent',
                transition: 'background 0.15s',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => { if (day && !today) (e.currentTarget as HTMLElement).style.background = C.l3; }}
              onMouseLeave={e => { if (day && !today) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {day && (
                <>
                  {/* Day number circle */}
                  <div style={{ marginBottom: 4 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 26, height: 26, borderRadius: 13,
                      background: today ? C.blue : 'transparent',
                      color: today ? C.bg : C.text,
                      fontSize: 13, fontWeight: today ? 700 : 400,
                    }}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Event pills */}
                  {visible.map(evt => (
                    <div
                      key={evt.id}
                      onClick={e => { e.stopPropagation(); onEventClick(evt.id); }}
                      style={{
                        fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 4, marginBottom: 2,
                        background: (evt.color || C.blue) + '28',
                        color: evt.color || C.blue,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        cursor: 'pointer',
                      }}
                    >
                      {evt.title}
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div style={{ fontSize: 10, color: C.dimmer, paddingLeft: 2 }}>+{overflow} more</div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
