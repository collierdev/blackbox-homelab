import type { CalendarView, Project } from '../../types';
import { ChevronLeft, ChevronRight, Plus, Filter, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface CalendarHeaderProps {
  currentView: CalendarView;
  currentDate: Date;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewEvent: () => void;
  onSettings: () => void;
  projects: Project[];
  selectedProjectFilter: string | null;
  onProjectFilterChange: (projectId: string | null) => void;
}

export default function CalendarHeader({
  currentView,
  currentDate,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onNewEvent,
  onSettings,
  projects,
  selectedProjectFilter,
  onProjectFilterChange,
}: CalendarHeaderProps) {
  const getDateRangeText = () => {
    switch (currentView) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        return format(currentDate, 'MMM d, yyyy');
      case 'day':
        return format(currentDate, 'MMMM d, yyyy');
      case '2month':
        return format(currentDate, 'MMM yyyy') + ' - ' + format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1), 'MMM yyyy');
      case 'circular':
        return format(currentDate, 'yyyy');
      default:
        return '';
    }
  };

  const views: { value: CalendarView; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: '2month', label: '2 Months' },
    { value: 'circular', label: 'Circular' },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50">
      {/* Top Row: Date Navigation and Actions */}
      <div className="flex items-center justify-between">
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToday}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-sm hover:shadow"
          >
            Today
          </button>

          <div className="flex items-center gap-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
            <button
              onClick={onPrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-l-lg transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
            <button
              onClick={onNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white min-w-[200px]">
            {getDateRangeText()}
          </h2>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Project Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={selectedProjectFilter || ''}
              onChange={(e) => onProjectFilterChange(e.target.value || null)}
              className="pl-9 pr-8 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer transition-colors"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Settings Button */}
          <button
            onClick={onSettings}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Calendar settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* New Event Button */}
          <button
            onClick={onNewEvent}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>

      {/* Bottom Row: View Selector */}
      <div className="flex gap-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-1 shadow-sm">
        {views.map((view) => (
          <button
            key={view.value}
            onClick={() => onViewChange(view.value)}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              currentView === view.value
                ? 'bg-blue-500 text-white shadow-md transform scale-[1.02]'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}
