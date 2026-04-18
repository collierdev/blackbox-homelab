import { Router } from 'express';
import {
  createNotification,
  getAllNotifications,
  getNotificationById,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  dismissAllNotifications,
  deleteNotification,
  cleanupOldNotifications,
} from '../models/notification';

const router = Router();

// Get all notifications (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { unreadOnly, undismissedOnly, limit } = req.query;

    const notifications = await getAllNotifications({
      unreadOnly: unreadOnly === 'true',
      undismissedOnly: undismissedOnly === 'true',
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Get unread count
router.get('/count', async (req, res) => {
  try {
    const count = await getUnreadCount();
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get single notification
router.get('/:id', async (req, res) => {
  try {
    const notification = await getNotificationById(req.params.id);

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json(notification);
  } catch (error) {
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

    const notification = await createNotification({
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
    const { emitNotification } = await import('../index');
    emitNotification(notification);

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read
router.post('/:id/read', async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id);
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all as read
router.post('/read-all', async (req, res) => {
  try {
    const count = await markAllAsRead();
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Dismiss notification
router.post('/:id/dismiss', async (req, res) => {
  try {
    const notification = await dismissNotification(req.params.id);
    res.json(notification);
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ error: 'Failed to dismiss notification' });
  }
});

// Dismiss all notifications
router.post('/dismiss-all', async (req, res) => {
  try {
    const count = await dismissAllNotifications();
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error dismissing all notifications:', error);
    res.status(500).json({ error: 'Failed to dismiss all notifications' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteNotification(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Cleanup old notifications
router.post('/cleanup', async (req, res) => {
  try {
    const { olderThanDays } = req.body;
    const deleted = await cleanupOldNotifications(olderThanDays || 30);
    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({ error: 'Failed to cleanup notifications' });
  }
});

export default router;
