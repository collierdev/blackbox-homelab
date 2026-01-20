import { useState, useEffect, useCallback } from 'react';
import { Camera, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Go2RTCCameraCard } from './Go2RTCCamera';
import type { Go2RTCCamera } from '../../types';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';
const STORAGE_KEY = 'pi-dashboard-camera-names';

interface CamerasSectionProps {
  defaultExpanded?: boolean;
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

export function CamerasSection({ defaultExpanded = true }: CamerasSectionProps) {
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

  const onlineCameras = cameras.filter(c => c.available).length;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${onlineCameras > 0 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h2 className="font-semibold">Security Cameras</h2>
            <p className="text-xs text-muted-foreground">
              {onlineCameras} of {cameras.length} cameras online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchCameras();
            }}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title="Refresh cameras"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Camera grid */}
      {expanded && (
        <div className="p-4 pt-0">
          {loading && cameras.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p>Loading cameras...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Failed to load cameras</p>
              <button
                onClick={fetchCameras}
                className="mt-2 px-3 py-1 bg-secondary rounded hover:bg-secondary/80 text-sm"
              >
                Retry
              </button>
            </div>
          ) : cameras.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No cameras configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {cameras.map(camera => (
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
