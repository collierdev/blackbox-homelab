import type { CalendarView, Project } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const C = {
  l2: '#162040', l3: '#1c2a4a', l4: '#243356',
  blue: '#adc6ff', text: '#e2e8f0', dimmer: '#8892a4',
};

interface CalendarHeaderProps {
  currentView: CalendarView;
  currentDate: Date;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewEvent: () => void;
  projects: Project[];
  selectedProjectFilter: string | null;
  onProjectFilterChange: (projectId: string | null) => void;
}

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: 'month',    label: 'Month' },
  { value: 'week',     label: 'Week' },
  { value: 'day',      label: 'Day' },
  { value: '2month',   label: '2 Months' },
  { value: 'circular', label: 'Circular' },
];

export default function CalendarHeader({
  currentView, currentDate, onViewChange, onPrevious, onNext, onToday,
  projects, selectedProjectFilter, onProjectFilterChange,
}: CalendarHeaderProps) {
  const getTitle = () => {
    switch (currentView) {
      case 'month':    return format(currentDate, 'MMMM yyyy');
      case 'week':     return format(currentDate, 'MMM d, yyyy');
      case 'day':      return format(currentDate, 'MMMM d, yyyy');
      case '2month':
        return format(currentDate, 'MMM yyyy') + ' – ' +
               format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1), 'MMM yyyy');
      case 'circular': return format(currentDate, 'yyyy');
      default: return '';
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
      {/* Left: nav + title + Today */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onPrevious} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, color: C.dimmer, cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = C.l3)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronLeft style={{ width: 16, height: 16 }} />
        </button>
        <button onClick={onNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, color: C.dimmer, cursor: 'pointer', transition: 'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = C.l3)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: C.text, minWidth: 160 }}>
          {getTitle()}
        </span>
        <button onClick={onToday} style={{ fontSize: 12, color: C.dimmer, padding: '4px 12px', background: C.l2, borderRadius: 6, cursor: 'pointer', border: 'none' }}>
          Today
        </button>
        {projects.length > 0 && (
          <select
            value={selectedProjectFilter || ''}
            onChange={e => onProjectFilterChange(e.target.value || null)}
            style={{ fontSize: 12, color: C.dimmer, background: C.l2, border: `1px solid ${C.l4}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', outline: 'none' }}
          >
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* Right: view tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {VIEWS.map(v => (
          <button
            key={v.value}
            onClick={() => onViewChange(v.value)}
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: currentView === v.value ? C.l4 : 'transparent',
              color: currentView === v.value ? C.text : C.dimmer,
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
