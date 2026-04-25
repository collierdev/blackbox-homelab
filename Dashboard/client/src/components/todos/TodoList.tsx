import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCheck, ChevronDown, ChevronRight, Plus, Search, X } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

const C = {
  bg: '#0b1326',
  l2: '#162040',
  l3: '#1c2a4a',
  l4: '#243356',
  blue: '#adc6ff',
  amber: '#f7be1d',
  green: '#22c55e',
  red: '#ffb4ab',
  text: '#e2e8f0',
  dim: '#c2c6d6',
  dimmer: '#8892a4',
};

const PRIORITIES = { high: C.red, medium: C.amber, low: C.blue } as const;
const CATEGORIES = ['All', 'System', 'Personal', 'Work', 'Home'] as const;
const TASK_CATEGORIES = ['System', 'Personal', 'Work', 'Home'] as const;
type Category = (typeof CATEGORIES)[number];
type Priority = keyof typeof PRIORITIES;

interface UiTask {
  id: number;
  title: string;
  cat: Exclude<Category, 'All'>;
  priority: Priority;
  due: string;
  done: boolean;
  notes: string;
}

const NEW_TASK_DEFAULT: Omit<UiTask, 'id' | 'done' | 'notes'> = {
  title: '',
  cat: 'Personal',
  priority: 'low',
  due: 'Today',
};

function toDueLabel(input?: string): string {
  if (!input) return 'Upcoming';
  const lower = input.trim().toLowerCase();
  if (lower === 'today') return 'Today';
  if (lower === 'tomorrow') return 'Tomorrow';
  if (lower === 'yesterday') return 'Yesterday';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (ymd(date) === ymd(today)) return 'Today';
  if (ymd(date) === ymd(tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dueGroup(due: string, done: boolean): 'TODAY' | 'TOMORROW' | 'UPCOMING' | 'COMPLETED' {
  if (done) return 'COMPLETED';
  if (due === 'Today') return 'TODAY';
  if (due === 'Tomorrow') return 'TOMORROW';
  return 'UPCOMING';
}

export default function TodoList() {
  const { tasks: socketTasks } = useSocket();
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [filter, setFilter] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newTask, setNewTask] = useState(NEW_TASK_DEFAULT);

  useEffect(() => {
    const mapped: UiTask[] = socketTasks
      .filter(t => !t.parentTaskId)
      .slice(0, 60)
      .map((t, i) => ({
        id: i + 1,
        title: t.title,
        cat: TASK_CATEGORIES[i % TASK_CATEGORIES.length],
        priority: t.priority === 'none' ? 'low' : (t.priority as Priority),
        due: toDueLabel(t.dueDate),
        done: Boolean(t.isCompleted || t.completed),
        notes: t.description || '',
      }));
    setTasks(mapped);
  }, [socketTasks]);

  const filtered = useMemo(() => {
    return tasks.filter(task => {
      if (!showDone && task.done) return false;
      if (filter !== 'All' && task.cat !== filter) return false;
      if (search.trim() && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, showDone, filter, search]);

  const grouped = useMemo(() => {
    const groups: Record<'TODAY' | 'TOMORROW' | 'UPCOMING' | 'COMPLETED', UiTask[]> = {
      TODAY: [],
      TOMORROW: [],
      UPCOMING: [],
      COMPLETED: [],
    };
    filtered.forEach(task => groups[dueGroup(task.due, task.done)].push(task));
    return groups;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const completed = filtered.filter(t => t.done).length;
    const open = total - completed;
    const high = filtered.filter(t => !t.done && t.priority === 'high').length;
    const today = filtered.filter(t => !t.done && t.due === 'Today').length;
    return { total, completed, open, high, today };
  }, [filtered]);

  const progress = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100);
  const ringR = 32;
  const circumference = 2 * Math.PI * ringR;
  const dashOffset = circumference * (1 - progress / 100);

  const addTask = () => {
    const title = newTask.title.trim();
    if (!title) return;
    const next: UiTask = {
      id: Date.now(),
      title,
      cat: newTask.cat,
      priority: newTask.priority,
      due: newTask.due.trim() || 'Upcoming',
      done: false,
      notes: '',
    };
    setTasks(prev => [next, ...prev]);
    setNewTask(NEW_TASK_DEFAULT);
    setAddingNew(false);
    setExpandedId(next.id);
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        overflow: 'hidden',
        height: '100%',
        fontFamily: "'Inter', sans-serif",
      }}
      data-testid="todo-list"
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <div style={{ flex: 1, background: C.l2, borderRadius: 8, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} color={C.dimmer} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.text }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ border: 'none', background: 'transparent', color: C.dimmer, cursor: 'pointer', display: 'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', background: C.l2, borderRadius: 8 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  padding: '6px 11px',
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: filter === cat ? C.l4 : 'transparent',
                  color: filter === cat ? C.text : C.dimmer,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowDone(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 500,
              padding: '6px 10px',
              background: showDone ? `${C.blue}22` : C.l2,
              color: showDone ? C.blue : C.dimmer,
            }}
          >
            <CheckCheck size={12} />
            Completed
          </button>

          <button
            onClick={() => setAddingNew(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: C.blue,
              color: C.bg,
              padding: '6px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Plus size={12} />
            Add Task
          </button>
        </div>

        {addingNew && (
          <div style={{ background: C.l2, borderRadius: 10, padding: 16, border: `1px solid ${C.blue}33`, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={newTask.title}
                onChange={e => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
                style={{ flex: 1, background: C.l3, borderRadius: 8, border: 'none', padding: '8px 12px', color: C.text, fontSize: 14, outline: 'none' }}
                onKeyDown={e => {
                  if (e.key === 'Enter') addTask();
                  if (e.key === 'Escape') setAddingNew(false);
                }}
              />
              <input
                value={newTask.due}
                onChange={e => setNewTask(prev => ({ ...prev, due: e.target.value }))}
                placeholder="Today"
                style={{ width: 130, background: C.l3, borderRadius: 8, border: 'none', padding: '8px 12px', color: C.text, fontSize: 14, outline: 'none' }}
                onKeyDown={e => {
                  if (e.key === 'Enter') addTask();
                  if (e.key === 'Escape') setAddingNew(false);
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {(['high', 'medium', 'low'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setNewTask(prev => ({ ...prev, priority: p }))}
                    style={{
                      borderRadius: 10,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      border: newTask.priority === p ? `1px solid ${PRIORITIES[p]}44` : '1px solid transparent',
                      background: newTask.priority === p ? `${PRIORITIES[p]}22` : C.l3,
                      color: newTask.priority === p ? PRIORITIES[p] : C.dimmer,
                    }}
                  >
                    {p}
                  </button>
                ))}
                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewTask(prev => ({ ...prev, cat }))}
                    style={{
                      borderRadius: 10,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      background: newTask.cat === cat ? C.l4 : C.l3,
                      color: newTask.cat === cat ? C.text : C.dimmer,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setAddingNew(false)} style={{ border: 'none', cursor: 'pointer', borderRadius: 6, fontSize: 11, fontWeight: 600, padding: '6px 10px', color: C.dimmer, background: C.l3 }}>
                  Cancel
                </button>
                <button onClick={addTask} style={{ border: 'none', cursor: 'pointer', borderRadius: 6, fontSize: 11, fontWeight: 600, padding: '6px 10px', color: C.bg, background: C.blue }}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
          {(['TODAY', 'TOMORROW', 'UPCOMING', 'COMPLETED'] as const).map(groupName => {
            const groupTasks = grouped[groupName];
            if (groupTasks.length === 0) return null;
            const hasHigh = groupName === 'TODAY' && groupTasks.some(t => t.priority === 'high' && !t.done);
            return (
              <div key={groupName} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: C.dimmer, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{groupName}</span>
                  <span style={{ background: C.l3, borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 600, color: C.dim }}>{groupTasks.length}</span>
                  {hasHigh && <span style={{ background: `${C.red}18`, color: C.red, borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>HIGH</span>}
                </div>
                {groupTasks.map(task => {
                  const isExpanded = expandedId === task.id;
                  const priorityColor = PRIORITIES[task.priority];
                  return (
                    <div
                      key={task.id}
                      style={{
                        background: isExpanded ? C.l3 : C.l2,
                        borderRadius: 10,
                        marginBottom: 5,
                        border: `1px solid ${isExpanded ? C.l4 : 'transparent'}`,
                        opacity: task.done ? 0.55 : 1,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div
                        onClick={() => setExpandedId(prev => (prev === task.id ? null : task.id))}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer' }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, done: !t.done } : t)));
                          }}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: `1.5px solid ${task.done ? C.blue : C.l4}`,
                            background: task.done ? C.blue : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          {task.done && <Check size={11} color={C.bg} />}
                        </button>
                        <div style={{ width: 2, height: 22, borderRadius: 2, background: priorityColor, opacity: task.done ? 0.4 : 1, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: C.text, textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</div>
                          <div style={{ marginTop: 2, display: 'flex', gap: 7, alignItems: 'center' }}>
                            <span style={{ background: `${priorityColor}18`, borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 600, color: priorityColor, textTransform: 'capitalize' }}>{task.priority}</span>
                            <span style={{ fontSize: 10, color: C.dimmer }}>{task.cat}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: task.due === 'Today' ? C.amber : C.dimmer, fontWeight: task.due === 'Today' ? 600 : 400, flexShrink: 0 }}>{task.due}</span>
                        {isExpanded ? <ChevronDown size={13} color={C.dimmer} /> : <ChevronRight size={13} color={C.dimmer} />}
                      </div>

                      {isExpanded && (
                        <div style={{ padding: '0 12px 10px 40px', borderTop: `1px solid ${C.l4}22` }}>
                          <textarea
                            rows={2}
                            value={task.notes}
                            onChange={e => setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, notes: e.target.value } : t)))}
                            style={{ marginTop: 12, width: '100%', resize: 'none', border: 'none', borderRadius: 8, background: C.l4, padding: '8px 12px', fontSize: 12, color: C.dim, outline: 'none', boxSizing: 'border-box' }}
                            placeholder="Add notes..."
                          />
                          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, done: !t.done } : t)))}
                              style={{
                                border: 'none',
                                borderRadius: 6,
                                padding: '6px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: task.done ? C.l4 : `${C.amber}18`,
                                color: task.done ? C.dim : C.amber,
                              }}
                            >
                              {task.done ? 'Mark Incomplete' : 'Mark Done'}
                            </button>
                            <button
                              onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))}
                              style={{ border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: `${C.red}18`, color: C.red }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ width: 116, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {[
          { label: 'OPEN TASKS', value: stats.open, color: C.blue },
          { label: 'COMPLETED', value: stats.completed, color: C.green },
          { label: 'HIGH PRIORITY', value: stats.high, color: C.red },
          { label: 'DUE TODAY', value: stats.today, color: C.amber },
        ].map(card => (
          <div key={card.label} style={{ background: C.l2, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 42, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
            <div style={{ marginTop: 6, fontSize: 9, color: C.dimmer, letterSpacing: '0.08em' }}>{card.label}</div>
          </div>
        ))}

        <div style={{ background: C.l2, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: C.dimmer, marginBottom: 10, letterSpacing: '0.08em' }}>COMPLETION</div>
          <div style={{ position: 'relative', width: 74, height: 74, margin: '0 auto' }}>
            <svg viewBox="0 0 80 80" style={{ width: 74, height: 74, transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r={ringR} fill="none" stroke={C.l4} strokeWidth="8" />
              <circle
                cx="40"
                cy="40"
                r={ringR}
                fill="none"
                stroke={C.green}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: C.text }}>
              {progress}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
