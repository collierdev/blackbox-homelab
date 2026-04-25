import { useEffect, useRef, useState } from 'react';
import Calendar from './calendar/Calendar';
import TodoList from './todos/TodoList';

const C = {
  bg: '#0b1326', l2: '#162040', l3: '#1c2a4a', l4: '#243356',
  blue: '#adc6ff', text: '#e2e8f0', dimmer: '#8892a4',
};
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export default function CalendarTodoView() {
  const [activeView, setActiveView] = useState<'calendar' | 'todos'>('calendar');
  const [newEventRequest, setNewEventRequest] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const newEventRef = useRef(0);
  const quickActionsRef = useRef<HTMLDivElement | null>(null);

  const fireNewEvent = () => {
    newEventRef.current += 1;
    setNewEventRequest(newEventRef.current);
    if (activeView !== 'calendar') setActiveView('calendar');
    setShowQuickActions(false);
    setShowTaskForm(false);
    setShowProjectForm(false);
  };

  const handleCreateTask = async () => {
    const title = taskTitle.trim();
    if (!title || isCreatingTask) return;

    setIsCreatingTask(true);
    try {
      const res = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority: 'low' }),
      });
      if (!res.ok) {
        alert('Failed to create task');
        return;
      }
      setTaskTitle('');
      setShowTaskForm(false);
      setShowQuickActions(false);
      setActiveView('todos');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCreateProject = async () => {
    const name = projectName.trim();
    if (!name || isCreatingProject) return;

    setIsCreatingProject(true);
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: '#3B82F6' }),
      });
      if (!res.ok) {
        alert('Failed to create project');
        return;
      }
      setProjectName('');
      setShowProjectForm(false);
      setShowQuickActions(false);
      if (activeView !== 'calendar') setActiveView('calendar');
    } finally {
      setIsCreatingProject(false);
    }
  };

  useEffect(() => {
    if (!showQuickActions) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!quickActionsRef.current) return;
      if (!quickActionsRef.current.contains(e.target as Node)) {
        setShowQuickActions(false);
        setShowTaskForm(false);
        setShowProjectForm(false);
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [showQuickActions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }} data-testid="calendar-todo-view">

      {/* Header row — padded */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '28px 32px 20px', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1.1 }}>Calendar &amp; Tasks</h1>
          <div style={{ fontSize: 13, color: C.dimmer, marginTop: 5 }}>Manage schedules and system tasks across all nodes.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Segmented toggle */}
          <div style={{ display: 'flex', background: C.l2, borderRadius: 8, overflow: 'hidden' }}>
            {(['calendar', 'todos'] as const).map(v => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                data-testid={`${v === 'calendar' ? 'calendar' : 'tasks'}-view-button`}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  background: activeView === v ? C.l4 : 'transparent',
                  color: activeView === v ? C.text : C.dimmer,
                }}
              >
                {v === 'calendar' ? 'Calendar' : 'Tasks'}
              </button>
            ))}
          </div>
          {/* + New actions */}
          <div ref={quickActionsRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowQuickActions(v => !v)}
              style={{
                padding: '8px 18px', background: C.blue, color: C.bg,
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 800,
                borderRadius: 8, border: 'none', cursor: 'pointer',
              }}
            >
              + New
            </button>

            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 220,
                borderRadius: 10,
                border: `1px solid ${C.l4}`,
                background: C.l2,
                boxShadow: '0 14px 32px rgba(0,0,0,0.35)',
                padding: 8,
                opacity: showQuickActions ? 1 : 0,
                transform: showQuickActions ? 'translateY(0)' : 'translateY(-6px)',
                transition: 'opacity 0.18s ease, transform 0.18s ease',
                pointerEvents: showQuickActions ? 'auto' : 'none',
                zIndex: 20,
              }}
            >
              <button
                onClick={fireNewEvent}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'transparent',
                  color: C.text,
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.l3; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                New Event
              </button>
              <button
                onClick={() => {
                  setShowTaskForm(v => !v);
                  setShowProjectForm(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: showTaskForm ? C.l3 : 'transparent',
                  color: C.text,
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { if (!showTaskForm) e.currentTarget.style.background = C.l3; }}
                onMouseLeave={e => { if (!showTaskForm) e.currentTarget.style.background = 'transparent'; }}
              >
                New Task
              </button>
              <button
                onClick={() => {
                  setShowProjectForm(v => !v);
                  setShowTaskForm(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: showProjectForm ? C.l3 : 'transparent',
                  color: C.text,
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { if (!showProjectForm) e.currentTarget.style.background = C.l3; }}
                onMouseLeave={e => { if (!showProjectForm) e.currentTarget.style.background = 'transparent'; }}
              >
                New Project
              </button>

              <div
                style={{
                  overflow: 'hidden',
                  maxHeight: showTaskForm ? 120 : 0,
                  opacity: showTaskForm ? 1 : 0,
                  transform: showTaskForm ? 'translateY(0)' : 'translateY(-4px)',
                  transition: 'max-height 0.22s ease, opacity 0.2s ease, transform 0.2s ease',
                }}
              >
                <div style={{ borderTop: `1px solid ${C.l4}`, marginTop: 6, paddingTop: 8 }}>
                  <input
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') void handleCreateTask();
                      if (e.key === 'Escape') {
                        setShowTaskForm(false);
                        setTaskTitle('');
                      }
                    }}
                    placeholder="Task title"
                    style={{
                      width: '100%',
                      background: C.bg,
                      border: `1px solid ${C.l4}`,
                      borderRadius: 7,
                      color: C.text,
                      fontSize: 12,
                      padding: '7px 9px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    autoFocus={showTaskForm}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                    <button
                      onClick={() => { setShowTaskForm(false); setTaskTitle(''); }}
                      style={{ background: C.l3, color: C.dimmer, border: 'none', borderRadius: 6, padding: '5px 9px', fontSize: 11, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void handleCreateTask()}
                      disabled={!taskTitle.trim() || isCreatingTask}
                      style={{
                        background: C.blue,
                        color: C.bg,
                        border: 'none',
                        borderRadius: 6,
                        padding: '5px 9px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: !taskTitle.trim() || isCreatingTask ? 'not-allowed' : 'pointer',
                        opacity: !taskTitle.trim() || isCreatingTask ? 0.6 : 1,
                      }}
                    >
                      {isCreatingTask ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={{
                  overflow: 'hidden',
                  maxHeight: showProjectForm ? 120 : 0,
                  opacity: showProjectForm ? 1 : 0,
                  transform: showProjectForm ? 'translateY(0)' : 'translateY(-4px)',
                  transition: 'max-height 0.22s ease, opacity 0.2s ease, transform 0.2s ease',
                }}
              >
                <div style={{ borderTop: `1px solid ${C.l4}`, marginTop: 6, paddingTop: 8 }}>
                  <input
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') void handleCreateProject();
                      if (e.key === 'Escape') {
                        setShowProjectForm(false);
                        setProjectName('');
                      }
                    }}
                    placeholder="Project name"
                    style={{
                      width: '100%',
                      background: C.bg,
                      border: `1px solid ${C.l4}`,
                      borderRadius: 7,
                      color: C.text,
                      fontSize: 12,
                      padding: '7px 9px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    autoFocus={showProjectForm}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                    <button
                      onClick={() => { setShowProjectForm(false); setProjectName(''); }}
                      style={{ background: C.l3, color: C.dimmer, border: 'none', borderRadius: 6, padding: '5px 9px', fontSize: 11, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void handleCreateProject()}
                      disabled={!projectName.trim() || isCreatingProject}
                      style={{
                        background: C.blue,
                        color: C.bg,
                        border: 'none',
                        borderRadius: 6,
                        padding: '5px 9px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: !projectName.trim() || isCreatingProject ? 'not-allowed' : 'pointer',
                        opacity: !projectName.trim() || isCreatingProject ? 0.6 : 1,
                      }}
                    >
                      {isCreatingProject ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }} data-testid={`${activeView}-view-content`}>
        {activeView === 'calendar'
          ? <Calendar newEventRequest={newEventRequest} />
          : (
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
              <TodoList />
            </div>
          )
        }
      </div>
    </div>
  );
}
