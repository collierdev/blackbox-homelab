import type { CalendarView, Project } from '../../types';
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';

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

export default function CalendarHeader({
  currentView,
  currentDate,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onNewEvent,
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
    <div className="flex flex-col gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Top Row: Date Navigation and Actions */}
      <div className="flex items-center justify-between">
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={onPrevious}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={onNext}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white min-w-[200px]">
            {getDateRangeText()}
          </h2>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Project Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedProjectFilter || ''}
              onChange={(e) => onProjectFilterChange(e.target.value || null)}
              className="pl-9 pr-8 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* New Event Button */}
          <button
            onClick={onNewEvent}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>

      {/* Bottom Row: View Selector */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded p-1">
        {views.map((view) => (
          <button
            key={view.value}
            onClick={() => onViewChange(view.value)}
            className={`flex-1 px-4 py-1.5 text-sm font-medium rounded transition-colors ${
              currentView === view.value
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>
    </div>
  );
}
