import { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { Plus, Filter } from 'lucide-react';
import TodoTask from './TodoTask';
import TaskForm from './TaskForm';

export default function TodoList() {
  const { tasks, projects, createTask, updateTask, deleteTask, completeTask, createSubtask } = useSocket();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const editingTask = editingTaskId ? tasks.find(t => t.id === editingTaskId) : null;

  // Group tasks by project
  const groupedTasks = tasks.reduce((acc, task) => {
    // Skip parent tasks (they're shown as subtasks)
    if (task.parentTaskId) return acc;

    // Apply filters
    if (selectedProjectFilter && task.projectId !== selectedProjectFilter) return acc;
    if (!showCompleted && task.completed) return acc;

    const projectId = task.projectId || 'no-project';
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  // Sort tasks by order
  Object.keys(groupedTasks).forEach(projectId => {
    groupedTasks[projectId].sort((a, b) => a.order - b.order);
  });

  const handleNewTask = () => {
    setEditingTaskId(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
    setIsTaskFormOpen(true);
  };

  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false);
    setEditingTaskId(null);
  };

  const handleSaveTask = async (taskData: any) => {
    try {
      if (editingTaskId) {
        await updateTask(editingTaskId, taskData);
      } else {
        await createTask(taskData);
      }
      handleCloseTaskForm();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Delete this task and all its subtasks?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleAddSubtask = async (parentTaskId: string, subtaskData: any) => {
    try {
      await createSubtask(parentTaskId, subtaskData);
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  };

  const getProjectName = (projectId: string) => {
    if (projectId === 'no-project') return 'No Project';
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getProjectColor = (projectId: string) => {
    if (projectId === 'no-project') return '#6b7280';
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#3b82f6';
  };

  const totalTasks = tasks.filter(t => !t.parentTaskId).length;
  const completedTasks = tasks.filter(t => !t.parentTaskId && t.completed).length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900" data-testid="todo-list">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="tasks-header">Tasks</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {completedTasks} of {totalTasks} completed
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Project Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                data-testid="project-filter"
                value={selectedProjectFilter || ''}
                onChange={(e) => setSelectedProjectFilter(e.target.value || null)}
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

            {/* Show Completed Toggle */}
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                data-testid="show-completed-toggle"
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Show completed
            </label>

            {/* New Task Button */}
            <button
              data-testid="new-task-button"
              onClick={handleNewTask}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.keys(groupedTasks).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No tasks yet. Create your first task to get started!
            </p>
            <button
              onClick={handleNewTask}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Task
            </button>
          </div>
        ) : (
          Object.entries(groupedTasks).map(([projectId, projectTasks]) => (
            <div key={projectId} className="space-y-3">
              {/* Project Header */}
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getProjectColor(projectId) }}
                />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {getProjectName(projectId)}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({projectTasks.length})
                </span>
              </div>

              {/* Tasks */}
              <div className="space-y-2 pl-5">
                {projectTasks.map((task) => (
                  <TodoTask
                    key={task.id}
                    task={task}
                    allTasks={tasks}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onComplete={handleCompleteTask}
                    onAddSubtask={handleAddSubtask}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Form Modal */}
      {isTaskFormOpen && (
        <TaskForm
          task={editingTask || undefined}
          projects={projects}
          onClose={handleCloseTaskForm}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}
