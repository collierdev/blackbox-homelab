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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
      case 'low':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
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
        className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${
          task.completed
            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
        }`}
      >
        {/* Expand/Collapse Button */}
        {hasSubtasks && !isSubtask && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}

        {/* Complete Checkbox */}
        <button
          onClick={() => onComplete(task.id)}
          className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-all ${
            hasSubtasks && !isSubtask ? 'ml-0' : !hasSubtasks && !isSubtask ? 'ml-7' : ''
          } ${
            task.completed
              ? 'bg-green-500 text-white'
              : 'border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500'
          }`}
        >
          {task.completed ? (
            <Check className="w-3 h-3" />
          ) : (
            <Circle className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className={`text-base font-medium ${
                  task.completed
                    ? 'line-through text-gray-500 dark:text-gray-400'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {task.title}
              </h4>

              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {task.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-2">
                {/* Priority Badge */}
                {task.priority && task.priority !== 'none' && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    <AlertCircle className="w-3 h-3" />
                    {getPriorityLabel(task.priority)}
                  </span>
                )}

                {/* Due Date */}
                {task.dueDate && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${
                      isOverdue
                        ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                        : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}
                  >
                    <Calendar className="w-3 h-3" />
                    {format(new Date(task.dueDate), 'MMM d, yyyy')}
                    {isOverdue && ' (Overdue)'}
                  </span>
                )}

                {/* Subtask Progress */}
                {hasSubtasks && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {completedSubtasks}/{subtasks.length} subtasks
                  </span>
                )}

                {/* Todo.md Origin */}
                {task.todoMdOrigin && (
                  <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
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
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Add subtask"
                  >
                    <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
                <button
                  onClick={() => onEdit(task.id)}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
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
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingSubtask(false);
                setSubtaskTitle('');
              }}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded transition-colors"
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
