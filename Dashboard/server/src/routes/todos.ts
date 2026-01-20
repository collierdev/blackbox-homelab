import { Router } from 'express';
import {
  createTask,
  getAllTasks,
  getTaskById,
  getTasksByProject,
  updateTask,
  deleteTask,
  completeTask,
  createSubtask,
  reorderTasks,
} from '../models/task';

const router = Router();

// Get all tasks or filter by project
router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;

    const tasks = projectId
      ? await getTasksByProject(projectId as string)
      : await getAllTasks();

    res.json(tasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Get single task (with subtasks)
router.get('/:id', async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(task);
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const { title, projectId } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Missing required field: title' });
      return;
    }

    const task = await createTask({
      ...req.body,
      projectId: projectId || 'default',
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const task = await updateTask(req.params.id, req.body);
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task (and subtasks)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteTask(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Toggle task completion
router.post('/:id/complete', async (req, res) => {
  try {
    const task = await completeTask(req.params.id);
    res.json(task);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Add subtask to task
router.post('/:id/subtasks', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Missing required field: title' });
      return;
    }

    const subtask = await createSubtask(req.params.id, req.body);
    res.status(201).json(subtask);
  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

// Reorder tasks within a project
router.post('/reorder', async (req, res) => {
  try {
    const { projectId, taskIds } = req.body;

    if (!projectId || !Array.isArray(taskIds)) {
      res.status(400).json({
        error: 'Missing required fields: projectId, taskIds (array)',
      });
      return;
    }

    await reorderTasks(projectId, taskIds);
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

export default router;
