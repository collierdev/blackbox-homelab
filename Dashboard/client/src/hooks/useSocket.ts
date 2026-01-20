import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { SystemStats, HADevices, HAStatus, Event, Task, Project, SyncAccount } from '../types';

const SOCKET_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [connected, setConnected] = useState(false);

  // Home Assistant state
  const [haDevices, setHaDevices] = useState<HADevices | null>(null);
  const [haStatus, setHaStatus] = useState<HAStatus>({ connected: false });

  // Calendar & Todo state
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [syncAccounts, setSyncAccounts] = useState<SyncAccount[]>([]);

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
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const setLightBrightness = useCallback(async (entityId: string, brightness: number) => {
    try {
      const res = await fetch(`${API_URL}/api/homeassistant/lights/${entityId}/brightness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brightness })
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

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
      return res.ok;
    } catch {
      return false;
    }
  }, []);

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
    setClimateTemperature,
    mediaPlayerAction,
    setMediaVolume,
    refreshCameraSnapshot,
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
    disconnectSyncAccount
  };
}
