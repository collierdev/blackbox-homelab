import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Event, Project } from '../../types';
import { format } from 'date-fns';
import { X } from 'lucide-react';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startDateTime: z.string().min(1, 'Start date/time is required'),
  endDateTime: z.string().min(1, 'End date/time is required'),
  location: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  projectId: z.string().nullable(),
  isAllDay: z.boolean(),
  reminders: z.array(z.number()).optional(),
}).refine(data => {
  return new Date(data.startDateTime) < new Date(data.endDateTime);
}, {
  message: 'End date/time must be after start date/time',
  path: ['endDateTime'],
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  event?: Event;
  projects: Project[];
  onClose: () => void;
  onSave: (data: Partial<Event>) => void;
}

export default function EventForm({ event, projects, onClose, onSave }: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event ? {
      title: event.title,
      startDateTime: format(new Date(event.startDateTime), "yyyy-MM-dd'T'HH:mm"),
      endDateTime: format(new Date(event.endDateTime), "yyyy-MM-dd'T'HH:mm"),
      location: event.location || '',
      description: event.description || '',
      color: event.color || '#3b82f6',
      projectId: event.projectId || null,
      isAllDay: event.isAllDay || false,
      reminders: event.reminders || [],
    } : {
      title: '',
      startDateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      endDateTime: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"),
      location: '',
      description: '',
      color: '#3b82f6',
      projectId: null,
      isAllDay: false,
      reminders: [],
    },
  });

  const isAllDay = watch('isAllDay');

  useEffect(() => {
    if (isAllDay) {
      const startDate = watch('startDateTime');
      setValue('startDateTime', format(new Date(startDate), 'yyyy-MM-dd'));
      setValue('endDateTime', format(new Date(startDate), 'yyyy-MM-dd'));
    }
  }, [isAllDay, watch, setValue]);

  const onSubmit = (data: EventFormData) => {
    onSave({
      ...data,
      projectId: data.projectId || undefined,
    });
  };

  const colorOptions = [
    { value: '#ef4444', label: 'Red' },
    { value: '#f97316', label: 'Orange' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#eab308', label: 'Yellow' },
    { value: '#84cc16', label: 'Lime' },
    { value: '#22c55e', label: 'Green' },
    { value: '#10b981', label: 'Emerald' },
    { value: '#14b8a6', label: 'Teal' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#0ea5e9', label: 'Sky' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#6366f1', label: 'Indigo' },
    { value: '#8b5cf6', label: 'Violet' },
    { value: '#a855f7', label: 'Purple' },
    { value: '#d946ef', label: 'Fuchsia' },
    { value: '#ec4899', label: 'Pink' },
  ];

  const inputStyle = {
    background: '#162040',
    border: '1px solid #243356',
    color: '#e2e8f0',
  };

  const labelStyle = { color: '#8892a4' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4"
        style={{ background: '#1c2a4a', border: '1px solid #243356' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: '1px solid #243356' }}
        >
          <h2 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: '#8892a4' }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Title *
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
              placeholder="Event title"
            />
            {errors.title && (
              <p className="mt-1 text-sm" style={{ color: '#ffb4ab' }}>{errors.title.message}</p>
            )}
          </div>

          {/* All Day Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('isAllDay')}
              id="isAllDay"
              className="w-4 h-4 rounded focus:ring-blue-500"
              style={{ borderColor: '#243356' }}
            />
            <label htmlFor="isAllDay" className="ml-2 text-sm font-medium" style={labelStyle}>
              All day event
            </label>
          </div>

          {/* Start & End DateTime */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>
                Start *
              </label>
              <input
                type={isAllDay ? 'date' : 'datetime-local'}
                {...register('startDateTime')}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={inputStyle}
              />
              {errors.startDateTime && (
                <p className="mt-1 text-sm" style={{ color: '#ffb4ab' }}>{errors.startDateTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={labelStyle}>
                End *
              </label>
              <input
                type={isAllDay ? 'date' : 'datetime-local'}
                {...register('endDateTime')}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={inputStyle}
              />
              {errors.endDateTime && (
                <p className="mt-1 text-sm" style={{ color: '#ffb4ab' }}>{errors.endDateTime.message}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Location
            </label>
            <input
              type="text"
              {...register('location')}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
              placeholder="Add location"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              style={inputStyle}
              placeholder="Add description"
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Project
            </label>
            <select
              {...register('projectId')}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={inputStyle}
            >
              <option value="">No project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-2" style={labelStyle}>
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <label key={color.value} className="cursor-pointer">
                  <input
                    type="radio"
                    {...register('color')}
                    value={color.value}
                    className="sr-only"
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2"
                    style={{
                      backgroundColor: color.value,
                      borderColor: watch('color') === color.value ? '#e2e8f0' : 'transparent',
                    }}
                    title={color.label}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              data-testid="cancel-button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg transition-colors"
              style={{
                border: '1px solid #243356',
                color: '#c2c6d6',
                background: 'transparent',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium"
              style={{ background: '#adc6ff', color: '#0b1326' }}
            >
              {event ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
