"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_1 = require("../models/event");
const router = (0, express_1.Router)();
// Get all events or filter by date range
router.get('/', async (req, res) => {
    try {
        const { start, end, projectId } = req.query;
        let events;
        if (projectId) {
            events = await (0, event_1.getEventsByProject)(projectId);
        }
        else if (start && end) {
            events = await (0, event_1.getEventsByDateRange)(start, end);
        }
        else {
            events = await (0, event_1.getAllEvents)();
        }
        res.json(events);
    }
    catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ error: 'Failed to get events' });
    }
});
// Get single event
router.get('/:id', async (req, res) => {
    try {
        const event = await (0, event_1.getEventById)(req.params.id);
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        res.json(event);
    }
    catch (error) {
        console.error('Error getting event:', error);
        res.status(500).json({ error: 'Failed to get event' });
    }
});
// Create new event
router.post('/', async (req, res) => {
    try {
        const { title, startDateTime, endDateTime } = req.body;
        if (!title || !startDateTime || !endDateTime) {
            res.status(400).json({
                error: 'Missing required fields: title, startDateTime, endDateTime',
            });
            return;
        }
        const event = await (0, event_1.createEvent)(req.body);
        res.status(201).json(event);
    }
    catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
});
// Update event
router.put('/:id', async (req, res) => {
    try {
        const event = await (0, event_1.updateEvent)(req.params.id, req.body);
        res.json(event);
    }
    catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});
// Delete event
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await (0, event_1.deleteEvent)(req.params.id);
        if (!deleted) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});
// Mark event as completed
router.post('/:id/complete', async (req, res) => {
    try {
        const event = await (0, event_1.completeEvent)(req.params.id);
        res.json(event);
    }
    catch (error) {
        console.error('Error completing event:', error);
        res.status(500).json({ error: 'Failed to complete event' });
    }
});
exports.default = router;
//# sourceMappingURL=calendar.js.map