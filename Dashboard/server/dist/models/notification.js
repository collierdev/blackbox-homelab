"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.getNotificationById = getNotificationById;
exports.getAllNotifications = getAllNotifications;
exports.getUnreadCount = getUnreadCount;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.dismissNotification = dismissNotification;
exports.dismissAllNotifications = dismissAllNotifications;
exports.deleteNotification = deleteNotification;
exports.cleanupOldNotifications = cleanupOldNotifications;
const uuid_1 = require("uuid");
const neo4j_1 = require("../config/neo4j");
/**
 * Create a new notification
 */
async function createNotification(data) {
    const session = (0, neo4j_1.getSession)();
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    try {
        const result = await session.run(`
      CREATE (n:Notification {
        id: $id,
        title: $title,
        message: $message,
        type: $type,
        priority: $priority,
        links: $links,
        source: $source,
        metadata: $metadata,
        autoDismissMs: $autoDismissMs,
        createdAt: datetime($createdAt),
        readAt: $readAt,
        dismissedAt: $dismissedAt
      })
      RETURN n
      `, {
            id,
            title: data.title || '',
            message: data.message || '',
            type: data.type || 'info',
            priority: data.priority || 'normal',
            links: JSON.stringify(data.links || []),
            source: data.source || null,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            autoDismissMs: data.autoDismissMs || null,
            createdAt: now,
            readAt: null,
            dismissedAt: null,
        });
        const notification = result.records[0].get('n').properties;
        return convertNeo4jNotification(notification);
    }
    finally {
        await session.close();
    }
}
/**
 * Get notification by ID
 */
async function getNotificationById(id) {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (n:Notification {id: $id})
      RETURN n
      `, { id });
        if (result.records.length === 0) {
            return null;
        }
        const notification = result.records[0].get('n').properties;
        return convertNeo4jNotification(notification);
    }
    finally {
        await session.close();
    }
}
/**
 * Get all notifications (optionally filter by status)
 */
async function getAllNotifications(options) {
    const session = (0, neo4j_1.getSession)();
    try {
        const conditions = [];
        if (options?.unreadOnly) {
            conditions.push('n.readAt IS NULL');
        }
        if (options?.undismissedOnly) {
            conditions.push('n.dismissedAt IS NULL');
        }
        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';
        const limitClause = options?.limit
            ? `LIMIT ${options.limit}`
            : '';
        const result = await session.run(`
      MATCH (n:Notification)
      ${whereClause}
      RETURN n
      ORDER BY n.createdAt DESC
      ${limitClause}
      `);
        return result.records.map((record) => {
            const notification = record.get('n').properties;
            return convertNeo4jNotification(notification);
        });
    }
    finally {
        await session.close();
    }
}
/**
 * Get unread notification count
 */
async function getUnreadCount() {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (n:Notification)
      WHERE n.readAt IS NULL AND n.dismissedAt IS NULL
      RETURN count(n) as count
      `);
        return result.records[0].get('count').toNumber();
    }
    finally {
        await session.close();
    }
}
/**
 * Mark notification as read
 */
async function markAsRead(id) {
    const session = (0, neo4j_1.getSession)();
    const now = new Date().toISOString();
    try {
        const result = await session.run(`
      MATCH (n:Notification {id: $id})
      SET n.readAt = datetime($readAt)
      RETURN n
      `, { id, readAt: now });
        if (result.records.length === 0) {
            throw new Error(`Notification ${id} not found`);
        }
        const notification = result.records[0].get('n').properties;
        return convertNeo4jNotification(notification);
    }
    finally {
        await session.close();
    }
}
/**
 * Mark all notifications as read
 */
async function markAllAsRead() {
    const session = (0, neo4j_1.getSession)();
    const now = new Date().toISOString();
    try {
        const result = await session.run(`
      MATCH (n:Notification)
      WHERE n.readAt IS NULL
      SET n.readAt = datetime($readAt)
      RETURN count(n) as count
      `, { readAt: now });
        return result.records[0].get('count').toNumber();
    }
    finally {
        await session.close();
    }
}
/**
 * Dismiss notification
 */
async function dismissNotification(id) {
    const session = (0, neo4j_1.getSession)();
    const now = new Date().toISOString();
    try {
        const result = await session.run(`
      MATCH (n:Notification {id: $id})
      SET n.dismissedAt = datetime($dismissedAt)
      RETURN n
      `, { id, dismissedAt: now });
        if (result.records.length === 0) {
            throw new Error(`Notification ${id} not found`);
        }
        const notification = result.records[0].get('n').properties;
        return convertNeo4jNotification(notification);
    }
    finally {
        await session.close();
    }
}
/**
 * Dismiss all notifications
 */
async function dismissAllNotifications() {
    const session = (0, neo4j_1.getSession)();
    const now = new Date().toISOString();
    try {
        const result = await session.run(`
      MATCH (n:Notification)
      WHERE n.dismissedAt IS NULL
      SET n.dismissedAt = datetime($dismissedAt)
      RETURN count(n) as count
      `, { dismissedAt: now });
        return result.records[0].get('count').toNumber();
    }
    finally {
        await session.close();
    }
}
/**
 * Delete notification
 */
async function deleteNotification(id) {
    const session = (0, neo4j_1.getSession)();
    try {
        const result = await session.run(`
      MATCH (n:Notification {id: $id})
      DELETE n
      RETURN count(n) as deleted
      `, { id });
        return result.records[0].get('deleted').toNumber() > 0;
    }
    finally {
        await session.close();
    }
}
/**
 * Delete old dismissed notifications (cleanup)
 */
async function cleanupOldNotifications(olderThanDays = 30) {
    const session = (0, neo4j_1.getSession)();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    try {
        const result = await session.run(`
      MATCH (n:Notification)
      WHERE n.dismissedAt IS NOT NULL
        AND n.dismissedAt < datetime($cutoffDate)
      DELETE n
      RETURN count(n) as deleted
      `, { cutoffDate: cutoffDate.toISOString() });
        return result.records[0].get('deleted').toNumber();
    }
    finally {
        await session.close();
    }
}
/**
 * Convert Neo4j datetime objects to ISO strings and parse JSON fields
 */
function convertNeo4jNotification(notification) {
    return {
        ...notification,
        links: notification.links ? JSON.parse(notification.links) : [],
        metadata: notification.metadata ? JSON.parse(notification.metadata) : undefined,
        createdAt: notification.createdAt?.toString() || notification.createdAt,
        readAt: notification.readAt?.toString() || notification.readAt || undefined,
        dismissedAt: notification.dismissedAt?.toString() || notification.dismissedAt || undefined,
    };
}
//# sourceMappingURL=notification.js.map