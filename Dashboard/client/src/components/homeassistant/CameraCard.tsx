import { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Maximize, Minimize, Play, Square } from 'lucide-react';
import type { HACamera } from '../../types';

interface CameraCardProps {
  camera: HACamera;
  onRefresh: (entityId: string) => Promise<boolean>;
}

export function CameraCard({ camera, onRefresh }: CameraCardProps) {
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [snapshotKey, setSnapshotKey] = useState(Date.now());
  const cardRef = useRef<HTMLDivElement>(null);

  const friendlyName = camera.attributes.friendly_name || camera.entity_id.split('.')[1];
  const isAvailable = camera.state !== 'unavailable';
  const isIdle = camera.state === 'idle';
  const isRecording = camera.state === 'recording';
  const isStreamingState = camera.state === 'streaming';

  // Get API base URL
  const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

  // Snapshot URL through our proxy (cache-bust with key)
  const snapshotUrl = `${API_URL}/api/homeassistant/camera/${camera.entity_id}/snapshot?t=${snapshotKey}`;

  // Stream URL through our proxy
  const streamUrl = `${API_URL}/api/homeassistant/camera/${camera.entity_id}/stream`;

  const handleRefresh = async () => {
    setLoading(true);
    setImageError(false);
    await onRefresh(camera.entity_id);
    // Update key to force image reload
    setSnapshotKey(Date.now());
    setLoading(false);
  };

  const toggleStream = () => {
    setIsStreaming(!isStreaming);
    setImageError(false);
  };

  const toggleFullscreen = async () => {
    if (!cardRef.current) return;

    if (!isFullscreen) {
      try {
        await cardRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (e) {
        console.error('Fullscreen failed:', e);
      }
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-refresh snapshot every 30 seconds when not streaming
  useEffect(() => {
    if (isStreaming || !isAvailable) return;

    const interval = setInterval(() => {
      setSnapshotKey(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, [isStreaming, isAvailable]);

  return (
    <div
      ref={cardRef}
      className={`bg-card border border-border rounded-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col' : ''
      }`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isAvailable ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{friendlyName}</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {isRecording && <span className="text-red-500">Recording</span>}
              {isStreamingState && <span className="text-green-500">Streaming</span>}
              {isIdle && 'Idle'}
              {!isAvailable && 'Unavailable'}
            </p>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-1">
          {isAvailable && (
            <>
              <button
                onClick={toggleStream}
                className={`p-2 rounded-lg transition-colors ${
                  isStreaming
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                    : 'hover:bg-secondary'
                }`}
                title={isStreaming ? 'Stop stream' : 'Start live stream'}
              >
                {isStreaming ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              {!isStreaming && (
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
                  title="Refresh snapshot"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Camera feed */}
      <div className={`relative bg-black ${isFullscreen ? 'flex-1' : 'aspect-video'}`}>
        {isAvailable ? (
          <>
            {isStreaming ? (
              <img
                src={streamUrl}
                alt={`${friendlyName} live stream`}
                className="w-full h-full object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <img
                key={snapshotKey}
                src={snapshotUrl}
                alt={`${friendlyName} snapshot`}
                className="w-full h-full object-contain"
                onError={() => setImageError(true)}
              />
            )}

            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Failed to load camera feed</p>
                  <button
                    onClick={handleRefresh}
                    className="mt-2 px-3 py-1 bg-white/20 rounded hover:bg-white/30 text-sm"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Live indicator */}
            {isStreaming && !imageError && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-xs px-2 py-1 rounded">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Camera unavailable</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
