import { useState, useEffect } from 'react';
import {
  Bell, X, Check, CheckCheck, Trash2, ExternalLink,
  Calendar, CheckSquare, Info, AlertTriangle, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import type { Notification, NotificationType } from '../types';

interface NotificationPopupProps {
  notifications: Notification[];
  unreadCount: number;
  mode?: 'floating' | 'inline';
  onMarkAsRead: (id: string) => Promise<boolean>;
  onMarkAllAsRead: () => Promise<boolean>;
  onDismiss: (id: string) => Promise<boolean>;
  onDismissAll: () => Promise<boolean>;
  onNavigateToEvent?: (eventId: string) => void;
  onNavigateToTask?: (taskId: string) => void;
}

const typeIcons: Record<NotificationType, typeof Info> = {
  info: Info, success: CheckCircle, warning: AlertTriangle, error: AlertCircle,
};

const typeColors: Record<NotificationType, string> = {
  info: 'text-primary bg-primary/10',
  success: 'text-[#7dd99b] bg-[#7dd99b]/10',
  warning: 'text-tertiary bg-tertiary/10',
  error: 'text-error bg-error/10',
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
  notifications, unreadCount, mode = 'floating', onMarkAsRead, onMarkAllAsRead,
  onDismiss, onDismissAll, onNavigateToEvent, onNavigateToTask,
}: NotificationPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [autoDismissTimers, setAutoDismissTimers] = useState<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.autoDismissMs && !notification.dismissedAt && !autoDismissTimers.has(notification.id)) {
        const timer = setTimeout(() => {
          onDismiss(notification.id);
          setAutoDismissTimers((prev) => { const m = new Map(prev); m.delete(notification.id); return m; });
        }, notification.autoDismissMs);
        setAutoDismissTimers((prev) => new Map(prev).set(notification.id, timer));
      }
    });
    return () => { autoDismissTimers.forEach((timer) => clearTimeout(timer)); };
  }, [notifications]);

  useEffect(() => {
    if (unreadCount <= 0) return;
    setIsBlinking(true);
    const timer = setTimeout(() => setIsBlinking(false), 2800);
    return () => clearTimeout(timer);
  }, [unreadCount]);

  const handleLinkClick = (link: { url?: string; eventId?: string; taskId?: string }) => {
    if (link.url) window.open(link.url, '_blank');
    else if (link.eventId && onNavigateToEvent) { onNavigateToEvent(link.eventId); setIsOpen(false); }
    else if (link.taskId && onNavigateToTask) { onNavigateToTask(link.taskId); setIsOpen(false); }
  };

  const activeNotifications = notifications.filter((n) => !n.dismissedAt);
  const isFloating = mode === 'floating';

  return (
    <>
      {/* Bell Button */}
      <button onClick={() => setIsOpen(!isOpen)}
        className={
          isFloating
            ? "fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary-container hover:bg-primary-fixed rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center justify-center transition-all hover:scale-105 border border-primary/20"
            : "relative flex items-center justify-center transition-colors"
        }
        style={isFloating ? undefined : { color: '#8892a4' }}
        title="Notifications"
      >
        <Bell className={isFloating ? "w-7 h-7 text-[#00285d]" : "w-4 h-4"} />
        {unreadCount > 0 && (
          <span
            className={isFloating ? "absolute -top-1 -right-1 w-6 h-6 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-surface" : `absolute rounded-full border-2 ${isBlinking ? 'animate-pulse' : ''}`}
            style={
              isFloating
                ? undefined
                : {
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    background: '#ffb4ab',
                    borderColor: '#0f1a2e',
                    animation: isBlinking ? 'pulse 0.9s ease-in-out infinite' : 'none',
                  }
            }
          >
            {isFloating ? (unreadCount > 9 ? '9+' : unreadCount) : null}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="z-50 w-96 max-h-[500px] bg-surface-container-low border border-white/5 rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden"
          style={
            isFloating
              ? { position: 'fixed', bottom: '6rem', right: '1.5rem' }
              : { position: 'absolute', top: 'calc(100% + 10px)', right: 0 }
          }
        >
          {/* Header */}
          <div className="bg-surface-container-high px-4 py-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <span className="font-semibold text-on-surface font-['Plus_Jakarta_Sans']">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-bold">{unreadCount} unread</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {activeNotifications.length > 0 && (
                <>
                  <button onClick={() => onMarkAllAsRead()} className="p-1.5 hover:bg-surface-bright rounded-lg transition-colors" title="Mark all as read">
                    <CheckCheck className="w-4 h-4 text-on-surface-variant" />
                  </button>
                  <button onClick={() => onDismissAll()} className="p-1.5 hover:bg-surface-bright rounded-lg transition-colors" title="Dismiss all">
                    <Trash2 className="w-4 h-4 text-on-surface-variant" />
                  </button>
                </>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-surface-bright rounded-lg transition-colors">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {activeNotifications.length === 0 ? (
              <div className="text-center text-on-surface-variant py-12">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {activeNotifications.map((notification) => {
                  const Icon = typeIcons[notification.type];
                  const colorClass = typeColors[notification.type];
                  const isUnread = !notification.readAt;
                  return (
                    <div key={notification.id} className={`p-4 hover:bg-surface-container-high/50 transition-colors ${isUnread ? 'bg-primary/5' : ''}`}>
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`font-medium text-on-surface ${isUnread ? 'font-semibold' : ''}`}>{notification.title}</h4>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isUnread && (
                                <button onClick={() => onMarkAsRead(notification.id)} className="p-1 hover:bg-surface-container-high rounded transition-colors" title="Mark as read">
                                  <Check className="w-4 h-4 text-on-surface-variant" />
                                </button>
                              )}
                              <button onClick={() => onDismiss(notification.id)} className="p-1 hover:bg-surface-container-high rounded transition-colors" title="Dismiss">
                                <X className="w-4 h-4 text-on-surface-variant" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-on-surface-variant mt-1 whitespace-pre-wrap">{notification.message}</p>
                          {notification.links.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {notification.links.map((link, idx) => (
                                <button key={idx} onClick={() => handleLinkClick(link)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors">
                                  {link.url && <ExternalLink className="w-3 h-3" />}
                                  {link.eventId && <Calendar className="w-3 h-3" />}
                                  {link.taskId && <CheckSquare className="w-3 h-3" />}
                                  {link.label}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-on-surface-variant">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(notification.createdAt)}
                            {notification.source && (
                              <><span className="text-outline-variant">\u00B7</span><span>{notification.source}</span></>
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
