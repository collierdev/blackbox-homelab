import type { Event, Project } from '../../types';
import { format } from 'date-fns';
import { X, MapPin, FileText, Calendar, Check, Edit, Trash2 } from 'lucide-react';

interface EventModalProps {
  event: Event;
  projects: Project[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}

export default function EventModal({
  event,
  projects,
  onClose,
  onEdit,
  onDelete,
  onComplete,
}: EventModalProps) {
  const project = projects.find(p => p.id === event.projectId);

  const formatDateTime = (start: string, end: string, isAllDay: boolean) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isAllDay) {
      if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
        return format(startDate, 'EEEE, MMMM d, yyyy');
      }
      return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
    }

    if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
      return `${format(startDate, 'EEEE, MMMM d, yyyy')}\n${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
    }

    return `${format(startDate, 'MMM d, h:mm a')} - ${format(endDate, 'MMM d, h:mm a')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with color bar */}
        <div
          className="h-2 rounded-t-lg"
          style={{ backgroundColor: event.color || '#3b82f6' }}
        />

        <div className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 pr-8">
            {event.title}
          </h2>

          {/* Project Badge */}
          {project && (
            <div className="mb-4">
              <span
                className="inline-block px-3 py-1 text-sm font-medium rounded-full"
                style={{
                  backgroundColor: project.color + '20',
                  color: project.color,
                }}
              >
                {project.name}
              </span>
            </div>
          )}

          {/* Date & Time */}
          <div className="flex items-start gap-3 mb-4">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {formatDateTime(event.startDateTime, event.endDateTime, event.isAllDay || false)}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-gray-700 dark:text-gray-300">
                {event.location}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3 mb-4">
              <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {event.description}
              </div>
            </div>
          )}

          {/* Completion Status */}
          {event.completed && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Completed on {format(new Date(event.completedAt!), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Sync Info */}
          {event.syncAccountId && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Synced from external calendar
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            {!event.completed && (
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark Complete
              </button>
            )}

            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>

            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

          {/* Metadata */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <div>Created: {format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}</div>
            <div>Updated: {format(new Date(event.updatedAt), 'MMM d, yyyy h:mm a')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
