"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_1 = require("../models/event");
const task_1 = require("../models/task");
const router = (0, express_1.Router)();
router.get('/today', async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const [events, allTasks] = await Promise.all([
            (0, event_1.getEventsByDateRange)(startOfDay.toISOString(), endOfDay.toISOString()),
            (0, task_1.getAllTasks)(),
        ]);
        const dueTodayOrOverdue = allTasks.filter(task => {
            if (task.isCompleted)
                return false;
            if (!task.dueDate)
                return false;
            return new Date(task.dueDate) <= endOfDay;
        });
        res.json({
            date: now.toISOString(),
            events: events
                .filter(e => !e.isCompleted)
                .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()),
            tasks: dueTodayOrOverdue.filter(t => new Date(t.dueDate) >= startOfDay),
            overdueTasks: dueTodayOrOverdue.filter(t => new Date(t.dueDate) < startOfDay),
        });
    }
    catch (error) {
        console.error('Planner error:', error);
        res.status(500).json({ error: 'Failed to get today data', details: String(error) });
    }
});
router.get('/weather', async (_req, res) => {
    try {
        const response = await fetch('https://wttr.in/?format=j1', {
            headers: { 'User-Agent': 'curl/7.0' }
        });
        if (!response.ok)
            throw new Error('wttr.in unavailable');
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        res.status(503).json({ error: 'Weather unavailable' });
    }
});
exports.default = router;
//# sourceMappingURL=planner.js.map