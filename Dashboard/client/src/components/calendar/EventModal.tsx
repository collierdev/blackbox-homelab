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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-xl w-full max-w-lg m-4"
        style={{ background: '#1c2a4a', border: '1px solid #243356' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with color bar */}
        <div
          className="h-2 rounded-t-lg"
          style={{ backgroundColor: event.color || '#adc6ff' }}
        />

        <div className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded transition-colors"
            style={{ color: '#8892a4' }}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-4 pr-8" style={{ color: '#e2e8f0' }}>
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
            <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#8892a4' }} />
            <div className="whitespace-pre-line" style={{ color: '#c2c6d6' }}>
              {formatDateTime(event.startDateTime, event.endDateTime, event.isAllDay || false)}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#8892a4' }} />
              <div style={{ color: '#c2c6d6' }}>
                {event.location}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3 mb-4">
              <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#8892a4' }} />
              <div className="whitespace-pre-line" style={{ color: '#c2c6d6' }}>
                {event.description}
              </div>
            </div>
          )}

          {/* Completion Status */}
          {event.completed && (
            <div
              className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
            >
              <Check className="w-5 h-5" style={{ color: '#22c55e' }} />
              <span className="text-sm font-medium" style={{ color: '#22c55e' }}>
                Completed on {format(new Date(event.completedAt!), 'MMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Sync Info */}
          {event.syncAccountId && (
            <div className="text-xs mb-4" style={{ color: '#8892a4' }}>
              Synced from external calendar
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid #243356' }}>
            {!event.completed && (
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{ background: '#22c55e', color: 'white' }}
              >
                <Check className="w-4 h-4" />
                Mark Complete
              </button>
            )}

            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{ background: '#adc6ff', color: '#0b1326' }}
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>

            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ml-auto"
              style={{ background: 'rgba(255, 180, 171, 0.2)', color: '#ffb4ab', border: '1px solid rgba(255, 180, 171, 0.3)' }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

          {/* Metadata */}
          <div className="mt-4 pt-4 text-xs" style={{ borderTop: '1px solid #243356', color: '#8892a4' }}>
            <div>Created: {format(new Date(event.createdAt), 'MMM d, yyyy h:mm a')}</div>
            <div>Updated: {format(new Date(event.updatedAt), 'MMM d, yyyy h:mm a')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
