import { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Calendar,
  CheckSquare,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import type { Notification, NotificationType } from '../types';

interface NotificationPopupProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => Promise<boolean>;
  onMarkAllAsRead: () => Promise<boolean>;
  onDismiss: (id: string) => Promise<boolean>;
  onDismissAll: () => Promise<boolean>;
  onNavigateToEvent?: (eventId: string) => void;
  onNavigateToTask?: (taskId: string) => void;
}

const typeIcons: Record<NotificationType, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const typeColors: Record<NotificationType, string> = {
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
  success: 'text-green-500 bg-green-50 dark:bg-green-900/30',
  warning: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
  error: 'text-red-500 bg-red-50 dark:bg-red-900/30',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function NotificationPopup({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onDismissAll,
  onNavigateToEvent,
  onNavigateToTask,
}: NotificationPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [autoDismissTimers, setAutoDismissTimers] = useState<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Handle auto-dismiss timers
  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.autoDismissMs && !notification.dismissedAt && !autoDismissTimers.has(notification.id)) {
        const timer = setTimeout(() => {
          onDismiss(notification.id);
          setAutoDismissTimers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(notification.id);
            return newMap;
          });
        }, notification.autoDismissMs);

        setAutoDismissTimers((prev) => new Map(prev).set(notification.id, timer));
      }
    });

    // Cleanup timers for dismissed notifications
    return () => {
      autoDismissTimers.forEach((timer) => clearTimeout(timer));
    };
  }, [notifications]);

  const handleLinkClick = (link: { url?: string; eventId?: string; taskId?: string }) => {
    if (link.url) {
      window.open(link.url, '_blank');
    } else if (link.eventId && onNavigateToEvent) {
      onNavigateToEvent(link.eventId);
      setIsOpen(false);
    } else if (link.taskId && onNavigateToTask) {
      onNavigateToTask(link.taskId);
      setIsOpen(false);
    }
  };

  const activeNotifications = notifications.filter((n) => !n.dismissedAt);

  return (
    <>
      {/* Notification Bell Button - Bottom Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary hover:bg-primary/90 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
      >
        <Bell className="w-7 h-7 text-primary-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel - Above the bell button */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-foreground" />
              <span className="font-semibold text-primary-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-white/20 text-primary-foreground text-xs rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {activeNotifications.length > 0 && (
                <>
                  <button
                    onClick={() => onMarkAllAsRead()}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4 text-primary-foreground" />
                  </button>
                  <button
                    onClick={() => onDismissAll()}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Dismiss all"
                  >
                    <Trash2 className="w-4 h-4 text-primary-foreground" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {activeNotifications.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {activeNotifications.map((notification) => {
                  const Icon = typeIcons[notification.type];
                  const colorClass = typeColors[notification.type];
                  const isUnread = !notification.readAt;

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-secondary/50 transition-colors ${
                        isUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-medium text-foreground ${isUnread ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isUnread && (
                                <button
                                  onClick={() => onMarkAsRead(notification.id)}
                                  className="p-1 hover:bg-secondary rounded transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4 text-muted-foreground" />
                                </button>
                              )}
                              <button
                                onClick={() => onDismiss(notification.id)}
                                className="p-1 hover:bg-secondary rounded transition-colors"
                                title="Dismiss"
                              >
                                <X className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {notification.message}
                          </p>

                          {/* Links */}
                          {notification.links.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {notification.links.map((link, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleLinkClick(link)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                                >
                                  {link.url && <ExternalLink className="w-3 h-3" />}
                                  {link.eventId && <Calendar className="w-3 h-3" />}
                                  {link.taskId && <CheckSquare className="w-3 h-3" />}
                                  {link.label}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(notification.createdAt)}
                            {notification.source && (
                              <>
                                <span className="text-border">•</span>
                                <span>{notification.source}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
