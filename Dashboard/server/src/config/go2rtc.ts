// go2rtc configuration
// go2rtc provides RTSP to WebRTC/MSE/HLS streaming for cameras

export interface CameraConfig {
  id: string;           // Unique identifier (e.g., 'camera1')
  name: string;         // Display name (e.g., 'Kitchen Camera')
  ip: string;           // Camera IP address
  streamHD: string;     // go2rtc stream name for HD
  streamSD: string;     // go2rtc stream name for SD
}

// Camera configurations - maps to go2rtc streams
export const CAMERAS: CameraConfig[] = [
  {
    id: 'camera1',
    name: 'Camera 1',
    ip: '192.168.50.242',
    streamHD: 'camera1_hd',
    streamSD: 'camera1_sd'
  },
  {
    id: 'camera2',
    name: 'Camera 2',
    ip: '192.168.50.246',
    streamHD: 'camera2_hd',
    streamSD: 'camera2_sd'
  },
  {
    id: 'camera3',
    name: 'Camera 3',
    ip: '192.168.50.227',
    streamHD: 'camera3_hd',
    streamSD: 'camera3_sd'
  },
  {
    id: 'camera4',
    name: 'Camera 4',
    ip: '192.168.50.73',
    streamHD: 'camera4_hd',
    streamSD: 'camera4_sd'
  },
  {
    id: 'camera5',
    name: 'Camera 3',
    ip: '192.168.50.114',
    streamHD: 'camera5_hd',
    streamSD: 'camera5_sd'
  }
];

// go2rtc server configuration
// GO2RTC_URL: Used by backend to make API calls to go2rtc (use localhost in container)
// GO2RTC_PUBLIC_URL: Used by frontend to access go2rtc from browser (use proxy URL)
export const GO2RTC_URL = process.env.GO2RTC_URL || 'http://192.168.50.39:1984';
export const GO2RTC_PUBLIC_URL = process.env.GO2RTC_PUBLIC_URL || GO2RTC_URL;

// Stream URL builders - iframe-friendly pages (preferred)
// These return public URLs for browser access
export function getWebRTCPageUrl(streamName: string): string {
  return `${GO2RTC_PUBLIC_URL}/webrtc.html?src=${streamName}`;
}

export function getStreamPageUrl(streamName: string): string {
  return `${GO2RTC_PUBLIC_URL}/stream.html?src=${streamName}`;
}

// Stream URL builders - API endpoints
// These return public URLs for browser access
export function getMSEStreamUrl(streamName: string): string {
  return `${GO2RTC_PUBLIC_URL}/api/ws?src=${streamName}`;
}

export function getWebRTCUrl(streamName: string): string {
  return `${GO2RTC_PUBLIC_URL}/api/webrtc?src=${streamName}`;
}

export function getHLSUrl(streamName: string): string {
  return `${GO2RTC_PUBLIC_URL}/api/stream.m3u8?src=${streamName}`;
}

export function getMJPEGUrl(streamName: string): string {
  return `${GO2RTC_PUBLIC_URL}/api/stream.mjpeg?src=${streamName}`;
}

export function getSnapshotUrl(streamName: string): string {
  return `${GO2RTC_PUBLIC_URL}/api/frame.jpeg?src=${streamName}`;
}
