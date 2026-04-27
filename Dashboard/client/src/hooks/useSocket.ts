import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { SystemStats, HADevices, HAStatus, Event, Task, Project, SyncAccount, LightFixture, ColorValue, Notification } from '../types';

const SOCKET_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [connected, setConnected] = useState(false);

  // Home Assistant state
  const [haDevices, setHaDevices] = useState<HADevices | null>(null);
  const [haStatus, setHaStatus] = useState<HAStatus>({ connected: false });
  const [lightFixtures, setLightFixtures] = useState<LightFixture[]>([]);

  // Calendar & Todo state
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [syncAccounts, setSyncAccounts] = useState<SyncAccount[]>([]);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const refreshHaDevices = useCallback(async (): Promise<void> => {
    try {
      const [statusRes, devicesRes] = await Promise.all([
        fetch(`${API_URL}/api/homeassistant/status`),
        fetch(`${API_URL}/api/homeassistant/devices`)
      ]);

      if (statusRes.ok) {
        const status = await statusRes.json();
        setHaStatus(status);
      }

      if (devicesRes.ok) {
        const devices = await devicesRes.json();
        setHaDevices(devices);
      }
    } catch {
      // Silent fail - socket polling will recover state on next interval
    }
  }, []);

  const refreshHaDevicesWithDelay = useCallback(async (): Promise<void> => {
    await refreshHaDevices();
    // Some cloud-backed integrations (for example Govee) can report
    // state changes slightly after service call acknowledgement.
    setTimeout(() => {
      void refreshHaDevices();
    }, 1500);
  }, [refreshHaDevices]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('systemStats', (data: SystemStats) => {
      setStats(data);
    });

    // Home Assistant events
    newSocket.on('haDevices', (data: HADevices) => {
      setHaDevices(data);
    });

    newSocket.on('haStatus', (data: HAStatus) => {
      setHaStatus(data);
    });

    // Calendar & Todo events
    newSocket.on('calendarEvents', (data: Event[]) => {
      setEvents(data);
    });

    newSocket.on('todos', (data: Task[]) => {
      setTasks(data);
    });

    newSocket.on('projects', (data: Project[]) => {
      setProjects(data);
    });

    // Light fixtures events
    newSocket.on('lightFixtures', (data: LightFixture[]) => {
      setLightFixtures(data);
    });

    // Notification events
    newSocket.on('notifications', (data: Notification[]) => {
      setNotifications(data);
    });

    newSocket.on('notificationCount', (count: number) => {
      setUnreadNotificationCount(count);
    });

    newSocket.on('newNotification', (notification: Notification) => {
      // Add new notification to the top of the list
      setNotifications(prev => [notification, ...prev.filter(n => n.id !== notification.id)]);
      setUnreadNotificationCount(prev => prev + 1);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Home Assistant API functions
  const toggleEntity = useCallback(async (entityId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/homeassistant/entities/${entityId}/toggle`, {
        method: 'POST'
      });
      if (res.ok) {
        void refreshHaDevicesWithDelay();
      }
      return res.ok;
    } catch {
      return false;
    }
  }, [refreshHaDevicesWithDelay]);

  const setLightBrightness = useCallback(async (entityId: string, brightness: number) => {
    try {
      const res = await fetch(`${API_URL}/api/homeassistant/lights/${entityId}/brightness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brightness })
      });
      if (res.ok) {
        void refreshHaDevicesWithDelay();
      }
      return res.ok;
    } catch {
      return false;
    }
  }, [refreshHaDevicesWithDelay]);

  const setClimateTemperature = useCallback(async (entityId: string, temperature: number) => {
    try {
      const res = await fetch(`${API_URL}/api/homeassistant/climate/${entityId}/temperature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature })
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const mediaPlayerAction = useCallback(async (entityId: string, action: string) => {
    try {
      const res = await fetch(`${API_URL}/api/homeassistant/media_player/${entityId}/${action}`, {
        method: 'POST'
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const setMediaVolume = useCallback(async (entityId: string, volumeLevel: number) => {
    try {
      const res = await fetch(`${API_URL}/api/homeassistant/media_player/${entityId}/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume_level: volumeLevel })
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const refreshCameraSnapshot = useCallback(async (entityId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/homeassistant/camera/${entityId}/snapshot`, {
        method: 'POST'
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const setLightColor = useCallback(async (entityId: string, rgb: [number, number, number]): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/homeassistant/lights/${entityId}/color`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rgb_color: rgb })
      });
      if (res.ok) {
        void refreshHaDevicesWithDelay();
      }
      return res.ok;
    } catch {
      return false;
    }
  }, [refreshHaDevicesWithDelay]);

  const setLightHsColor = useCallback(async (entityId: string, hsColor: [number, number]): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/homeassistant/lights/${entityId}/hs_color`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hs_color: hsColor })
      });
      if (res.ok) {
        void refreshHaDevicesWithDelay();
      }
      return res.ok;
    } catch {
      return false;
    }
  }, [refreshHaDevicesWithDelay]);

  const setLightColorTemp = useCallback(async (entityId: string, kelvin: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/homeassistant/lights/${entityId}/color_temp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelvin })
      });
      if (res.ok) {
        void refreshHaDevicesWithDelay();
      }
      return res.ok;
    } catch {
      return false;
    }
  }, [refreshHaDevicesWithDelay]);

  const setLightEffect = useCallback(async (entityId: string, effect: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/homeassistant/lights/${entityId}/effect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ effect })
      });
      if (res.ok) {
        void refreshHaDevicesWithDelay();
      }
      return res.ok;
    } catch {
      return false;
    }
  }, [refreshHaDevicesWithDelay]);

  // Fixture API functions
  const createFixture = useCallback(async (data: { name: string; lightIds: string[]; icon?: string; room?: string }): Promise<LightFixture | null> => {
    try {
      const res = await fetch(`${API_URL}/api/fixtures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const updateFixture = useCallback(async (id: string, data: { name?: string; lightIds?: string[]; icon?: string; room?: string }): Promise<LightFixture | null> => {
    try {
      const res = await fetch(`${API_URL}/api/fixtures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const deleteFixture = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/fixtures/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const toggleFixture = useCallback(async (fixtureId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/fixtures/${fixtureId}/toggle`, {
        method: 'POST'
      });
      if (res.ok) {
        void refreshHaDevicesWithDelay();
      }
      return res.ok;
    } catch {
      return false;
    }
  }, [refreshHaDevicesWithDelay]);

  const setFixtureBrightness = useCallback(async (fixtureId: string, brightness: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/fixtures/${fixtureId}/brightness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brightness })
      });
      if (res.ok) {
        void refreshHaDevicesWithDelay();
      }
      return res.ok;
    } catch {
      return false;
    }
  }, [refreshHaDevicesWithDelay]);

  const setFixtureColor = useCallback(async (fixtureId: string, colorValue: ColorValue): Promise<boolean> => {
    try {
      // Determine which endpoint to call based on color mode
      let endpoint: string;
      let payload: Record<string, unknown>;

      if (colorValue.mode === 'color_temp' && colorValue.kelvin !== undefined) {
        endpoint = `${API_URL}/api/fixtures/${fixtureId}/color_temp`;
        payload = { kelvin: colorValue.kelvin };
      } else if (colorValue.mode === 'hs' && colorValue.hs) {
        endpoint = `${API_URL}/api/fixtures/${fixtureId}/hs_color`;
        payload = { hs_color: colorValue.hs };
      } else if (colorValue.rgb) {
        endpoint = `${API_URL}/api/fixtures/${fixtureId}/color`;
        payload = { rgb_color: colorValue.rgb };
      } else {
        return false;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        void refreshHaDevicesWithDelay();
      }
      return res.ok;
    } catch {
      return false;
    }
  }, [refreshHaDevicesWithDelay]);

  // Calendar API functions
  const createEvent = useCallback(async (event: Partial<Event>): Promise<Event | null> => {
    try {
      const res = await fetch(`${API_URL}/api/calendar/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const updateEvent = useCallback(async (id: string, event: Partial<Event>): Promise<Event | null> => {
    try {
      const res = await fetch(`${API_URL}/api/calendar/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/calendar/events/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const completeEvent = useCallback(async (id: string): Promise<Event | null> => {
    try {
      const res = await fetch(`${API_URL}/api/calendar/events/${id}/complete`, {
        method: 'POST'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  // Todo API functions
  const createTask = useCallback(async (task: Partial<Task>): Promise<Task | null> => {
    try {
      const res = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const updateTask = useCallback(async (id: string, task: Partial<Task>): Promise<Task | null> => {
    try {
      const res = await fetch(`${API_URL}/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/todos/${id}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const completeTask = useCallback(async (id: string): Promise<Task | null> => {
    try {
      const res = await fetch(`${API_URL}/api/todos/${id}/complete`, {
        method: 'POST'
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const createSubtask = useCallback(async (parentId: string, subtask: Partial<Task>): Promise<Task | null> => {
    try {
      const res = await fetch(`${API_URL}/api/todos/${parentId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subtask)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const reorderTasks = useCallback(async (projectId: string, taskIds: string[]): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/todos/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, taskIds })
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // Project API functions
  const createProject = useCallback(async (name: string, color?: string): Promise<Project | null> => {
    try {
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const updateProject = useCallback(async (id: string, project: Partial<Project>): Promise<Project | null> => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const deleteProject = useCallback(async (id: string, cascade = false): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${id}?cascade=${cascade}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const reorderProjects = useCallback(async (projectIds: string[]): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/projects/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds })
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  // Sync Account API functions
  const fetchSyncAccounts = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(`${API_URL}/api/sync/accounts`);
      if (res.ok) {
        const accounts = await res.json();
        setSyncAccounts(accounts);
      }
    } catch {
      // Silent fail
    }
  }, []);

  const disconnectSyncAccount = useCallback(async (id: string, deleteEvents = false): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/sync/accounts/${id}?deleteEvents=${deleteEvents}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchSyncAccounts();
      }
      return res.ok;
    } catch {
      return false;
    }
  }, [fetchSyncAccounts]);

  // Fetch sync accounts on mount
  useEffect(() => {
    fetchSyncAccounts();
  }, [fetchSyncAccounts]);

  // Notification API functions
  const markNotificationAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: 'POST'
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: 'POST'
      });
      if (res.ok) {
        setUnreadNotificationCount(0);
      }
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const dismissNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/dismiss`, {
        method: 'POST'
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const dismissAllNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/dismiss-all`, {
        method: 'POST'
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadNotificationCount(0);
      }
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const createNotification = useCallback(async (data: {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    links?: Array<{ label: string; url?: string; eventId?: string; taskId?: string }>;
    source?: string;
    metadata?: Record<string, unknown>;
    autoDismissMs?: number;
  }): Promise<Notification | null> => {
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  return {
    socket,
    stats,
    connected,
    // Home Assistant
    haDevices,
    haStatus,
    toggleEntity,
    setLightBrightness,
    setLightColor,
    setLightHsColor,
    setLightColorTemp,
    setLightEffect,
    setClimateTemperature,
    mediaPlayerAction,
    setMediaVolume,
    refreshCameraSnapshot,
    // Light Fixtures
    lightFixtures,
    createFixture,
    updateFixture,
    deleteFixture,
    toggleFixture,
    setFixtureBrightness,
    setFixtureColor,
    // Calendar & Todo
    events,
    tasks,
    projects,
    syncAccounts,
    createEvent,
    updateEvent,
    deleteEvent,
    completeEvent,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    createSubtask,
    reorderTasks,
    createProject,
    updateProject,
    deleteProject,
    reorderProjects,
    fetchSyncAccounts,
    disconnectSyncAccount,
    // Notifications
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    dismissNotification,
    dismissAllNotifications,
    createNotification
  };
}
