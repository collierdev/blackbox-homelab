"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_1 = require("../models/notification");
const router = (0, express_1.Router)();
// Get all notifications (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { unreadOnly, undismissedOnly, limit } = req.query;
        const notifications = await (0, notification_1.getAllNotifications)({
            unreadOnly: unreadOnly === 'true',
            undismissedOnly: undismissedOnly === 'true',
            limit: limit ? parseInt(limit, 10) : undefined,
        });
        res.json(notifications);
    }
    catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});
// Get unread count
router.get('/count', async (req, res) => {
    try {
        const count = await (0, notification_1.getUnreadCount)();
        res.json({ count });
    }
    catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});
// Get single notification
router.get('/:id', async (req, res) => {
    try {
        const notification = await (0, notification_1.getNotificationById)(req.params.id);
        if (!notification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }
        res.json(notification);
    }
    catch (error) {
        console.error('Error getting notification:', error);
        res.status(500).json({ error: 'Failed to get notification' });
    }
});
// Create new notification
router.post('/', async (req, res) => {
    try {
        const { title, message, type, priority, links, source, metadata, autoDismissMs } = req.body;
        if (!title || !message) {
            res.status(400).json({ error: 'Missing required fields: title, message' });
            return;
        }
        const notification = await (0, notification_1.createNotification)({
            title,
            message,
            type: type || 'info',
            priority: priority || 'normal',
            links: links || [],
            source,
            metadata,
            autoDismissMs,
        });
        // Emit socket event for real-time delivery
        // Note: We'll need to access the io instance from index.ts
        const { emitNotification } = await Promise.resolve().then(() => __importStar(require('../index')));
        emitNotification(notification);
        res.status(201).json(notification);
    }
    catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});
// Mark notification as read
router.post('/:id/read', async (req, res) => {
    try {
        const notification = await (0, notification_1.markAsRead)(req.params.id);
        res.json(notification);
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});
// Mark all as read
router.post('/read-all', async (req, res) => {
    try {
        const count = await (0, notification_1.markAllAsRead)();
        res.json({ success: true, count });
    }
    catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});
// Dismiss notification
router.post('/:id/dismiss', async (req, res) => {
    try {
        const notification = await (0, notification_1.dismissNotification)(req.params.id);
        res.json(notification);
    }
    catch (error) {
        console.error('Error dismissing notification:', error);
        res.status(500).json({ error: 'Failed to dismiss notification' });
    }
});
// Dismiss all notifications
router.post('/dismiss-all', async (req, res) => {
    try {
        const count = await (0, notification_1.dismissAllNotifications)();
        res.json({ success: true, count });
    }
    catch (error) {
        console.error('Error dismissing all notifications:', error);
        res.status(500).json({ error: 'Failed to dismiss all notifications' });
    }
});
// Delete notification
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await (0, notification_1.deleteNotification)(req.params.id);
        if (!deleted) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});
// Cleanup old notifications
router.post('/cleanup', async (req, res) => {
    try {
        const { olderThanDays } = req.body;
        const deleted = await (0, notification_1.cleanupOldNotifications)(olderThanDays || 30);
        res.json({ success: true, deleted });
    }
    catch (error) {
        console.error('Error cleaning up notifications:', error);
        res.status(500).json({ error: 'Failed to cleanup notifications' });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map