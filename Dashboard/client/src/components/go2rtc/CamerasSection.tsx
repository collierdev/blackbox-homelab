import { useState, useEffect, useCallback } from 'react';
import { Camera, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Go2RTCCameraCard } from './Go2RTCCamera';
import type { Go2RTCCamera } from '../../types';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
const STORAGE_KEY = 'pi-dashboard-camera-names';

interface CamerasSectionProps {
  defaultExpanded?: boolean;
  hiddenCameraIds?: string[];
}

// Load custom camera names from localStorage
function loadCameraNames(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save custom camera names to localStorage
function saveCameraNames(names: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    // Ignore storage errors
  }
}

export function CamerasSection({ defaultExpanded = true, hiddenCameraIds = [] }: CamerasSectionProps) {
  const [cameras, setCameras] = useState<Go2RTCCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [customNames, setCustomNames] = useState<Record<string, string>>(loadCameraNames);

  const fetchCameras = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/go2rtc/cameras`);
      if (!res.ok) throw new Error('Failed to fetch cameras');
      const data = await res.json();
      setCameras(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, []);

  // Handle camera rename
  const handleRename = useCallback((cameraId: string, newName: string) => {
    setCustomNames(prev => {
      const updated = { ...prev, [cameraId]: newName };
      saveCameraNames(updated);
      return updated;
    });
  }, []);

  const visibleCameras = cameras.filter((camera) => !hiddenCameraIds.includes(camera.id));

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
        style={{ marginBottom: expanded ? '16px' : 0 }}
      >
        <div className="flex items-center gap-2">
          <Camera style={{ width: '16px', height: '16px', color: '#adc6ff' }} />
          <span style={{ fontSize: '12px', letterSpacing: '0.08em', color: '#8892a4', textTransform: 'uppercase', fontWeight: 500 }}>Security Feeds</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); fetchCameras(); }}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Refresh cameras"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} style={{ color: '#8892a4' }} />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4" style={{ color: '#8892a4' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#8892a4' }} />}
        </div>
      </button>

      {/* Camera grid */}
      {expanded && (
        <div>
          {loading && cameras.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#8892a4' }}>
              <Camera className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p className="text-sm">Loading cameras...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8" style={{ color: '#8892a4' }}>
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Failed to load cameras</p>
              <button onClick={fetchCameras} className="mt-2 px-3 py-1 rounded text-sm" style={{ background: '#1c2a4a', color: '#adc6ff' }}>Retry</button>
            </div>
          ) : visibleCameras.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#8892a4' }}>
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No visible cameras configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {visibleCameras.map(camera => (
                <Go2RTCCameraCard
                  key={camera.id}
                  camera={camera}
                  customName={customNames[camera.id]}
                  onRename={handleRename}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
