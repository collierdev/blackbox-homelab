import { Router, Request, Response } from 'express';
import { getEventsByDateRange } from '../models/event';
import { getAllTasks } from '../models/task';

const router = Router();

router.get('/today', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [events, allTasks] = await Promise.all([
      getEventsByDateRange(startOfDay.toISOString(), endOfDay.toISOString()),
      getAllTasks(),
    ]);

    const dueTodayOrOverdue = allTasks.filter(task => {
      if (task.isCompleted) return false;
      if (!task.dueDate) return false;
      return new Date(task.dueDate) <= endOfDay;
    });

    res.json({
      date: now.toISOString(),
      events: events
        .filter(e => !e.isCompleted)
        .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()),
      tasks: dueTodayOrOverdue.filter(t => new Date(t.dueDate!) >= startOfDay),
      overdueTasks: dueTodayOrOverdue.filter(t => new Date(t.dueDate!) < startOfDay),
    });
  } catch (error) {
    console.error('Planner error:', error);
    res.status(500).json({ error: 'Failed to get today data', details: String(error) });
  }
});

router.get('/weather', async (_req: Request, res: Response) => {
  try {
    const response = await fetch('https://wttr.in/?format=j1', {
      headers: { 'User-Agent': 'curl/7.0' }
    });
    if (!response.ok) throw new Error('wttr.in unavailable');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Weather unavailable' });
  }
});

export default router;
