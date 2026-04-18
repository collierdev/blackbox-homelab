import { v4 as uuidv4 } from 'uuid';
import { getSession } from '../config/neo4j';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationLink {
  label: string;
  url?: string;          // External URL
  eventId?: string;      // Link to calendar event
  taskId?: string;       // Link to task
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  links: NotificationLink[];
  source?: string;       // e.g., 'nightly-automation', 'system', 'user'
  metadata?: Record<string, unknown>;  // Additional data (build results, etc.)
  autoDismissMs?: number;  // Auto-dismiss after X milliseconds (null = manual)
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
}

/**
 * Create a new notification
 */
export async function createNotification(data: Partial<Notification>): Promise<Notification> {
  const session = getSession();
  const id = uuidv4();
  const now = new Date().toISOString();

  try {
    const result = await session.run(
      `
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
      `,
      {
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
      }
    );

    const notification = result.records[0].get('n').properties;
    return convertNeo4jNotification(notification);
  } finally {
    await session.close();
  }
}

/**
 * Get notification by ID
 */
export async function getNotificationById(id: string): Promise<Notification | null> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (n:Notification {id: $id})
      RETURN n
      `,
      { id }
    );

    if (result.records.length === 0) {
      return null;
    }

    const notification = result.records[0].get('n').properties;
    return convertNeo4jNotification(notification);
  } finally {
    await session.close();
  }
}

/**
 * Get all notifications (optionally filter by status)
 */
export async function getAllNotifications(options?: {
  unreadOnly?: boolean;
  undismissedOnly?: boolean;
  limit?: number;
}): Promise<Notification[]> {
  const session = getSession();

  try {
    const conditions: string[] = [];

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

    const result = await session.run(
      `
      MATCH (n:Notification)
      ${whereClause}
      RETURN n
      ORDER BY n.createdAt DESC
      ${limitClause}
      `
    );

    return result.records.map((record) => {
      const notification = record.get('n').properties;
      return convertNeo4jNotification(notification);
    });
  } finally {
    await session.close();
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (n:Notification)
      WHERE n.readAt IS NULL AND n.dismissedAt IS NULL
      RETURN count(n) as count
      `
    );

    return result.records[0].get('count').toNumber();
  } finally {
    await session.close();
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(id: string): Promise<Notification> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    const result = await session.run(
      `
      MATCH (n:Notification {id: $id})
      SET n.readAt = datetime($readAt)
      RETURN n
      `,
      { id, readAt: now }
    );

    if (result.records.length === 0) {
      throw new Error(`Notification ${id} not found`);
    }

    const notification = result.records[0].get('n').properties;
    return convertNeo4jNotification(notification);
  } finally {
    await session.close();
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<number> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    const result = await session.run(
      `
      MATCH (n:Notification)
      WHERE n.readAt IS NULL
      SET n.readAt = datetime($readAt)
      RETURN count(n) as count
      `,
      { readAt: now }
    );

    return result.records[0].get('count').toNumber();
  } finally {
    await session.close();
  }
}

/**
 * Dismiss notification
 */
export async function dismissNotification(id: string): Promise<Notification> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    const result = await session.run(
      `
      MATCH (n:Notification {id: $id})
      SET n.dismissedAt = datetime($dismissedAt)
      RETURN n
      `,
      { id, dismissedAt: now }
    );

    if (result.records.length === 0) {
      throw new Error(`Notification ${id} not found`);
    }

    const notification = result.records[0].get('n').properties;
    return convertNeo4jNotification(notification);
  } finally {
    await session.close();
  }
}

/**
 * Dismiss all notifications
 */
export async function dismissAllNotifications(): Promise<number> {
  const session = getSession();
  const now = new Date().toISOString();

  try {
    const result = await session.run(
      `
      MATCH (n:Notification)
      WHERE n.dismissedAt IS NULL
      SET n.dismissedAt = datetime($dismissedAt)
      RETURN count(n) as count
      `,
      { dismissedAt: now }
    );

    return result.records[0].get('count').toNumber();
  } finally {
    await session.close();
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(id: string): Promise<boolean> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (n:Notification {id: $id})
      DELETE n
      RETURN count(n) as deleted
      `,
      { id }
    );

    return result.records[0].get('deleted').toNumber() > 0;
  } finally {
    await session.close();
  }
}

/**
 * Delete old dismissed notifications (cleanup)
 */
export async function cleanupOldNotifications(olderThanDays: number = 30): Promise<number> {
  const session = getSession();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  try {
    const result = await session.run(
      `
      MATCH (n:Notification)
      WHERE n.dismissedAt IS NOT NULL
        AND n.dismissedAt < datetime($cutoffDate)
      DELETE n
      RETURN count(n) as deleted
      `,
      { cutoffDate: cutoffDate.toISOString() }
    );

    return result.records[0].get('deleted').toNumber();
  } finally {
    await session.close();
  }
}

/**
 * Convert Neo4j datetime objects to ISO strings and parse JSON fields
 */
function convertNeo4jNotification(notification: any): Notification {
  return {
    ...notification,
    links: notification.links ? JSON.parse(notification.links) : [],
    metadata: notification.metadata ? JSON.parse(notification.metadata) : undefined,
    createdAt: notification.createdAt?.toString() || notification.createdAt,
    readAt: notification.readAt?.toString() || notification.readAt || undefined,
    dismissedAt: notification.dismissedAt?.toString() || notification.dismissedAt || undefined,
  };
}
