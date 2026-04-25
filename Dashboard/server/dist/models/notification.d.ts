export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export interface NotificationLink {
    label: string;
    url?: string;
    eventId?: string;
    taskId?: string;
}
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    links: NotificationLink[];
    source?: string;
    metadata?: Record<string, unknown>;
    autoDismissMs?: number;
    createdAt: string;
    readAt?: string;
    dismissedAt?: string;
}
/**
 * Create a new notification
 */
export declare function createNotification(data: Partial<Notification>): Promise<Notification>;
/**
 * Get notification by ID
 */
export declare function getNotificationById(id: string): Promise<Notification | null>;
/**
 * Get all notifications (optionally filter by status)
 */
export declare function getAllNotifications(options?: {
    unreadOnly?: boolean;
    undismissedOnly?: boolean;
    limit?: number;
}): Promise<Notification[]>;
/**
 * Get unread notification count
 */
export declare function getUnreadCount(): Promise<number>;
/**
 * Mark notification as read
 */
export declare function markAsRead(id: string): Promise<Notification>;
/**
 * Mark all notifications as read
 */
export declare function markAllAsRead(): Promise<number>;
/**
 * Dismiss notification
 */
export declare function dismissNotification(id: string): Promise<Notification>;
/**
 * Dismiss all notifications
 */
export declare function dismissAllNotifications(): Promise<number>;
/**
 * Delete notification
 */
export declare function deleteNotification(id: string): Promise<boolean>;
/**
 * Delete old dismissed notifications (cleanup)
 */
export declare function cleanupOldNotifications(olderThanDays?: number): Promise<number>;
//# sourceMappingURL=notification.d.ts.map