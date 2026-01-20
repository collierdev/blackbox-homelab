export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    speed: number;
    temperature: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
  };
  network: {
    interfaces: NetworkInterface[];
    services: NetworkService[];
  };
  processes: ProcessMemory[];
  uptime: number;
  hostname: string;
  platform: string;
}

export interface NetworkInterface {
  name: string;
  ip4: string;
  ip6: string;
  mac: string;
  type: string;
  speed: number | null;
}

export interface NetworkService {
  name: string;
  url: string;
  ip: string;
  port: number;
}

export interface ProcessMemory {
  name: string;
  pid: number;
  memory: number;
  memoryPercent: number;
  cpu: number;
}

export interface ServiceInfo {
  id: string;
  name: string;
  type: 'docker' | 'systemd';
  status: 'running' | 'stopped' | 'error' | 'unknown';
  url?: string;
  port?: number;
  image?: string;
  uptime?: string;
  memoryUsage?: number;
  memoryLimit?: number;
  memoryPercent?: number;
  cpuPercent?: number;
  notes?: string;
  customIcon?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
}

// Home Assistant Types
export interface HAEntityAttributes {
  friendly_name?: string;
  icon?: string;
  [key: string]: unknown;
}

export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: HAEntityAttributes;
  last_changed: string;
  last_updated: string;
}

export interface HALight extends HAEntity {
  attributes: HAEntityAttributes & {
    brightness?: number;
    color_mode?: 'onoff' | 'brightness' | 'color_temp' | 'hs' | 'xy' | 'rgb' | 'rgbw' | 'rgbww' | 'white' | 'unknown';
    rgb_color?: [number, number, number];
    hs_color?: [number, number];
    xy_color?: [number, number];
    color_temp_kelvin?: number;
    min_color_temp_kelvin?: number;
    max_color_temp_kelvin?: number;
    supported_color_modes?: string[];
  };
}

export interface HAClimate extends HAEntity {
  attributes: HAEntityAttributes & {
    current_temperature?: number;
    temperature?: number;
    target_temp_high?: number;
    target_temp_low?: number;
    hvac_modes?: string[];
    hvac_action?: string;
    min_temp?: number;
    max_temp?: number;
  };
}

export interface HAMediaPlayer extends HAEntity {
  attributes: HAEntityAttributes & {
    media_title?: string;
    media_artist?: string;
    media_album_name?: string;
    media_duration?: number;
    media_position?: number;
    volume_level?: number;
    is_volume_muted?: boolean;
    source?: string;
    source_list?: string[];
  };
}

export interface HASwitch extends HAEntity {
  // Uses base HAEntity - on/off state
}

export interface HACamera extends HAEntity {
  attributes: HAEntityAttributes & {
    entity_picture?: string;
    frontend_stream_type?: string;
    supported_features?: number;
    brand?: string;
    model?: string;
  };
}

export interface HADevices {
  lights: HALight[];
  switches: HASwitch[];
  climate: HAClimate[];
  media_players: HAMediaPlayer[];
  cameras: HACamera[];
}

export interface HAStatus {
  connected: boolean;
  error?: string;
}

// go2rtc Camera Types
export interface Go2RTCStreamInfo {
  name: string;
  available: boolean;
  // Iframe-friendly pages (preferred for embedding)
  webrtcPage: string;  // WebRTC viewer page
  streamPage: string;  // Auto-select stream page
  // Direct API endpoints
  mse: string;
  webrtc: string;
  hls: string;
  mjpeg: string;
  snapshot: string;
}

export interface Go2RTCCamera {
  id: string;
  name: string;
  ip: string;
  available: boolean;
  streams: {
    hd: Go2RTCStreamInfo;
    sd: Go2RTCStreamInfo;
  };
}

export type StreamQuality = 'hd' | 'sd';
// Stream types in order of preference
export type StreamMode = 'webrtc' | 'auto' | 'hls' | 'mjpeg';

// Calendar & Todo Types
export interface Event {
  id: string;
  title: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;
  location?: string;
  description?: string; // UI-friendly single description
  notes: string[];
  links: string[];
  origin: 'local' | 'google' | 'microsoft' | 'caldav';
  priority: 'low' | 'medium' | 'high';
  color?: string;
  isCompleted: boolean;
  completed?: boolean; // Alias for isCompleted
  completedAt?: string; // When was it completed
  isAllDay?: boolean;
  projectId?: string;
  tagIds: string[];
  taskIds: string[];
  reminders?: number[]; // Reminder times in minutes before event
  createdAt: string;
  updatedAt: string;
  syncAccountId?: string;
  remoteId?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  startDateTime?: string;
  endDateTime?: string;
  priority: 'low' | 'medium' | 'high' | 'none';
  isCompleted: boolean;
  completed?: boolean; // Alias for isCompleted
  projectId?: string;
  tagIds: string[];
  subtasks: Task[];
  parentTaskId?: string; // Parent task ID for subtasks
  eventId?: string;
  order: number;
  origin: 'local' | 'todomd';
  todoMdOrigin?: boolean; // Quick check if from TODO.md
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  order: number;
  createdAt: string;
}

export interface SyncAccount {
  id: string;
  provider: 'google' | 'microsoft' | 'caldav';
  email: string;
  lastSync?: string;
  status: 'connected' | 'error' | 'syncing';
  errorMessage?: string;
  createdAt: string;
}

export type CalendarView = 'month' | 'week' | 'day' | '2month' | 'circular';

export interface SyncConflict {
  eventId: string;
  localVersion: Event;
  remoteVersion: unknown;
  conflictType: 'both_modified' | 'local_deleted_remote_modified' | 'remote_deleted_local_modified';
}
