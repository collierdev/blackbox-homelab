import { useState } from 'react';
import type { Task } from '../../types';
import { format } from 'date-fns';
import { Check, Circle, ChevronRight, ChevronDown, Edit, Trash2, Plus, Calendar, AlertCircle } from 'lucide-react';

interface TodoTaskProps {
  task: Task;
  allTasks: Task[];
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onAddSubtask: (parentTaskId: string, subtaskData: any) => void;
  isSubtask?: boolean;
}

export default function TodoTask({
  task,
  allTasks,
  onEdit,
  onDelete,
  onComplete,
  onAddSubtask,
  isSubtask = false,
}: TodoTaskProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');

  const subtasks = allTasks.filter(t => t.parentTaskId === task.id);
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasks = subtasks.filter(t => t.completed).length;

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return { color: '#ffb4ab', background: 'rgba(255, 180, 171, 0.15)' };
      case 'medium':
        return { color: '#f7be1d', background: 'rgba(247, 190, 29, 0.15)' };
      case 'low':
        return { color: '#adc6ff', background: 'rgba(173, 198, 255, 0.15)' };
      default:
        return { color: '#8892a4', background: 'rgba(136, 146, 164, 0.15)' };
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  const handleAddSubtaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;

    await onAddSubtask(task.id, { title: subtaskTitle });
    setSubtaskTitle('');
    setIsAddingSubtask(false);
    setIsExpanded(true);
  };

  return (
    <div className={`${isSubtask ? 'ml-6' : ''}`}>
      <div
        className="group flex items-start gap-3 p-3 rounded-lg transition-all"
        style={{
          background: task.completed ? 'rgba(22, 32, 64, 0.5)' : '#162040',
          border: '1px solid #243356',
          opacity: task.completed ? 0.6 : 1,
        }}
      >
        {/* Expand/Collapse Button */}
        {hasSubtasks && !isSubtask && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded transition-colors flex-shrink-0"
            style={{ color: '#8892a4' }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Complete Checkbox */}
        <button
          onClick={() => onComplete(task.id)}
          className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all ${
            hasSubtasks && !isSubtask ? 'ml-0' : !hasSubtasks && !isSubtask ? 'ml-7' : ''
          }`}
          style={
            task.completed
              ? { background: '#22c55e', color: 'white' }
              : { border: '2px solid #243356', color: 'transparent' }
          }
        >
          {task.completed ? (
            <Check className="w-3 h-3" />
          ) : (
            <Circle className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#22c55e' }} />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className="text-base font-medium"
                style={{
                  color: task.completed ? '#8892a4' : '#e2e8f0',
                  textDecoration: task.completed ? 'line-through' : 'none',
                }}
              >
                {task.title}
              </h4>

              {task.description && (
                <p className="text-sm mt-1" style={{ color: '#8892a4' }}>
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Priority Badge */}
                {task.priority && task.priority !== 'none' && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
                    style={getPriorityStyle(task.priority)}
                  >
                    <AlertCircle className="w-3 h-3" />
                    {getPriorityLabel(task.priority)}
                  </span>
                )}

                {/* Due Date */}
                {task.dueDate && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
                    style={
                      isOverdue
                        ? { color: '#ffb4ab', background: 'rgba(255, 180, 171, 0.15)' }
                        : { color: '#8892a4', background: 'rgba(136, 146, 164, 0.15)' }
                    }
                  >
                    <Calendar className="w-3 h-3" />
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    {isOverdue && ' (Overdue)'}
                  </span>
                )}

                {/* Subtask Progress */}
                {hasSubtasks && (
                  <span className="text-xs" style={{ color: '#8892a4' }}>
                    {completedSubtasks}/{subtasks.length} subtasks
                  </span>
                )}

                {/* Todo.md Origin */}
                {task.todoMdOrigin && (
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ color: '#c084fc', background: 'rgba(192, 132, 252, 0.15)' }}
                  >
                    TODO.md
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {!task.completed && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {!isSubtask && (
                  <button
                    onClick={() => setIsAddingSubtask(true)}
                    className="p-1.5 rounded transition-colors"
                    title="Add subtask"
                    style={{ color: '#8892a4' }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(task.id)}
                  className="p-1.5 rounded transition-colors"
                  title="Edit"
                  style={{ color: '#8892a4' }}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1.5 rounded transition-colors"
                  title="Delete"
                  style={{ color: '#ffb4ab' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Subtask Form */}
      {isAddingSubtask && (
        <form onSubmit={handleAddSubtaskSubmit} className="ml-14 mt-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Subtask title..."
              autoFocus
              className="flex-1 px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                background: '#162040',
                border: '1px solid #243356',
                color: '#e2e8f0',
              }}
            />
            <button
              type="submit"
              className="px-3 py-2 text-sm rounded transition-colors"
              style={{ background: '#adc6ff', color: '#0b1326' }}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingSubtask(false);
                setSubtaskTitle('');
              }}
              className="px-3 py-2 text-sm rounded transition-colors"
              style={{ background: '#243356', color: '#c2c6d6' }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Subtasks */}
      {hasSubtasks && isExpanded && (
        <div className="mt-2 space-y-2">
          {subtasks.map((subtask) => (
            <TodoTask
              key={subtask.id}
              task={subtask}
              allTasks={allTasks}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
              onAddSubtask={onAddSubtask}
              isSubtask
            />
          ))}
        </div>
      )}
    </div>
  );
}
