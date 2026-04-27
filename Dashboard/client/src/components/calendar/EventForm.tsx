import { useEffect, useState } from 'react';
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
  recurrenceRule: z.string().optional(),
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
  onCreateProject?: (name: string, color?: string) => Promise<Project | null>;
}

export default function EventForm({ event, projects, onClose, onSave, onCreateProject }: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
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

  useEffect(() => {
    if (!event) {
      reset({
        title: '',
        startDateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endDateTime: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"),
        location: '',
        description: '',
        color: '#3b82f6',
        projectId: null,
        isAllDay: false,
        reminders: [],
        recurrenceRule: '',
      });
      return;
    }

    reset({
      title: event.title,
      startDateTime: format(new Date(event.startDateTime), "yyyy-MM-dd'T'HH:mm"),
      endDateTime: format(new Date(event.endDateTime), "yyyy-MM-dd'T'HH:mm"),
      location: event.location || '',
      description: event.description || '',
      color: event.color || '#3b82f6',
      projectId: event.projectId || null,
      isAllDay: event.isAllDay || false,
      reminders: event.reminders || [],
      recurrenceRule: event.recurrenceRule || '',
    });
  }, [event, reset]);

  const isAllDay = watch('isAllDay');
  const [repeatType, setRepeatType] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('none');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatEnds, setRepeatEnds] = useState<'never' | 'on'>('never');
  const [repeatUntil, setRepeatUntil] = useState('');
  const [customRRule, setCustomRRule] = useState('');
  const [recurrenceDirty, setRecurrenceDirty] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  useEffect(() => {
    if (isAllDay) {
      const startDate = watch('startDateTime');
      setValue('startDateTime', format(new Date(startDate), 'yyyy-MM-dd'));
      setValue('endDateTime', format(new Date(startDate), 'yyyy-MM-dd'));
    }
  }, [isAllDay, watch, setValue]);

  useEffect(() => {
    const existingRule = event?.recurrenceRule;
    setRecurrenceDirty(false);
    if (!existingRule) {
      setRepeatType('none');
      setRepeatInterval(1);
      setRepeatEnds('never');
      setRepeatUntil('');
      setCustomRRule('');
      return;
    }

    const parts = existingRule.split(';').filter(Boolean);
    const map: Record<string, string> = {};
    for (const part of parts) {
      const [k, v] = part.split('=');
      if (k && v) map[k.toUpperCase()] = v;
    }

    const freq = (map.FREQ || '').toUpperCase();
    if (freq === 'DAILY') setRepeatType('daily');
    else if (freq === 'WEEKLY') setRepeatType('weekly');
    else if (freq === 'MONTHLY') setRepeatType('monthly');
    else if (freq === 'YEARLY') setRepeatType('yearly');
    else setRepeatType('custom');

    setRepeatInterval(Number(map.INTERVAL || 1) || 1);
    if (map.UNTIL) {
      setRepeatEnds('on');
      const until = map.UNTIL.endsWith('Z') ? map.UNTIL.slice(0, -1) : map.UNTIL;
      if (until.length >= 8) {
        const y = until.slice(0, 4);
        const m = until.slice(4, 6);
        const d = until.slice(6, 8);
        setRepeatUntil(`${y}-${m}-${d}`);
      }
    } else {
      setRepeatEnds('never');
      setRepeatUntil('');
    }
    setCustomRRule(existingRule);
  }, [event?.recurrenceRule]);

  useEffect(() => {
    if (!recurrenceDirty) return;
    if (repeatType === 'none') {
      setValue('recurrenceRule', '');
      return;
    }
    if (repeatType === 'custom') {
      setValue('recurrenceRule', customRRule.trim());
      return;
    }

    const freqMap: Record<string, string> = {
      daily: 'DAILY',
      weekly: 'WEEKLY',
      monthly: 'MONTHLY',
      yearly: 'YEARLY',
    };
    const parts = [`FREQ=${freqMap[repeatType]}`, `INTERVAL=${Math.max(1, repeatInterval)}`];
    if (repeatEnds === 'on' && repeatUntil) {
      const normalized = repeatUntil.replace(/-/g, '');
      parts.push(`UNTIL=${normalized}T235959Z`);
    }
    setValue('recurrenceRule', parts.join(';'));
  }, [repeatType, repeatInterval, repeatEnds, repeatUntil, customRRule, recurrenceDirty, setValue]);

  const normalizeDateTimeForSave = (value: string, allDay: boolean): string => {
    if (!value) return value;
    if (allDay) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toISOString();
  };

  const onSubmit = (data: EventFormData) => {
    const nextRecurrenceRule = recurrenceDirty
      ? (data.recurrenceRule || undefined)
      : (event?.recurrenceRule || undefined);

    onSave({
      ...data,
      startDateTime: normalizeDateTimeForSave(data.startDateTime, data.isAllDay),
      endDateTime: normalizeDateTimeForSave(data.endDateTime, data.isAllDay),
      projectId: data.projectId || undefined,
      recurrenceRule: nextRecurrenceRule,
    });
  };

  const handleCreateProjectInline = async () => {
    const name = newProjectName.trim();
    if (!name || !onCreateProject || isCreatingProject) return;
    setIsCreatingProject(true);
    try {
      const created = await onCreateProject(name, '#3B82F6');
      if (!created) {
        alert('Failed to create project');
        return;
      }
      setValue('projectId', created.id);
      setNewProjectName('');
    } finally {
      setIsCreatingProject(false);
    }
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
          <input type="hidden" {...register('recurrenceRule')} />
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

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Repeat
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={repeatType}
                onChange={(e) => {
                  setRecurrenceDirty(true);
                  setRepeatType(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom');
                }}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={inputStyle}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom RRULE</option>
              </select>
              {repeatType !== 'none' && repeatType !== 'custom' && (
                <input
                  type="number"
                  min={1}
                  value={repeatInterval}
                  onChange={(e) => {
                    setRecurrenceDirty(true);
                    setRepeatInterval(Math.max(1, Number(e.target.value) || 1));
                  }}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                  placeholder="Every N"
                />
              )}
            </div>

            {repeatType !== 'none' && repeatType !== 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <select
                  value={repeatEnds}
                  onChange={(e) => {
                    setRecurrenceDirty(true);
                    setRepeatEnds(e.target.value as 'never' | 'on');
                  }}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                >
                  <option value="never">Ends: Never</option>
                  <option value="on">Ends: On date</option>
                </select>
                {repeatEnds === 'on' && (
                  <input
                    type="date"
                    value={repeatUntil}
                    onChange={(e) => {
                      setRecurrenceDirty(true);
                      setRepeatUntil(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={inputStyle}
                  />
                )}
              </div>
            )}

            {repeatType === 'custom' && (
              <textarea
                value={customRRule}
                onChange={(e) => {
                  setRecurrenceDirty(true);
                  setCustomRRule(e.target.value);
                }}
                rows={2}
                className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mt-2"
                style={inputStyle}
                placeholder="FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR"
              />
            )}
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
            <div className="space-y-2">
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreateProjectInline(); } }}
                  placeholder="Create new project..."
                  className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => void handleCreateProjectInline()}
                  disabled={!newProjectName.trim() || isCreatingProject || !onCreateProject}
                  className="px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: '#adc6ff',
                    color: '#0b1326',
                    cursor: !newProjectName.trim() || isCreatingProject || !onCreateProject ? 'not-allowed' : 'pointer',
                    opacity: !newProjectName.trim() || isCreatingProject || !onCreateProject ? 0.6 : 1,
                  }}
                >
                  {isCreatingProject ? 'Creating...' : 'Add'}
                </button>
              </div>
            </div>
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
