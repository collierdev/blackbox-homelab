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
      <div className="flex gap-2 p-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleViewChange('calendar')}
          data-testid="calendar-view-button"
          className={`flex-1 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeView === 'calendar'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 shadow-sm'
          }`}
        >
          Calendar
        </button>
        <button
          onClick={() => handleViewChange('todos')}
          data-testid="tasks-view-button"
          className={`flex-1 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeView === 'todos'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 shadow-sm'
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
