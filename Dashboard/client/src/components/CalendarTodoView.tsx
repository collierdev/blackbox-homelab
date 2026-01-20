import { useState } from 'react';
import Calendar from './calendar/Calendar';
import TodoList from './todos/TodoList';

export default function CalendarTodoView() {
  const [activeView, setActiveView] = useState<'calendar' | 'todos'>('calendar');

  const handleViewChange = (view: 'calendar' | 'todos') => {
    console.log('[CalendarTodoView] Switching to:', view);
    setActiveView(view);
  };

  return (
    <div className="flex flex-col h-full" data-testid="calendar-todo-view">
      {/* View Selector */}
      <div className="flex gap-1 p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleViewChange('calendar')}
          data-testid="calendar-view-button"
          className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
            activeView === 'calendar'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Calendar
        </button>
        <button
          onClick={() => handleViewChange('todos')}
          data-testid="tasks-view-button"
          className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
            activeView === 'todos'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Tasks
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" data-testid={`${activeView}-view-content`}>
        {activeView === 'calendar' ? <Calendar /> : <TodoList />}
      </div>
    </div>
  );
}
