import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Maximize, Minimize, Settings, RefreshCw, AlertCircle, Video, Wifi, Volume2, VolumeX, Check, X } from 'lucide-react';
import type { Go2RTCCamera, StreamQuality, StreamMode } from '../../types';

interface Go2RTCCameraProps {
  camera: Go2RTCCamera;
  customName?: string;
  onRename?: (cameraId: string, newName: string) => void;
}

// Stream mode labels and descriptions
const STREAM_MODES: { mode: StreamMode; label: string; description: string }[] = [
  { mode: 'webrtc', label: 'WebRTC', description: 'Lowest latency' },
  { mode: 'auto', label: 'Auto', description: 'Best compatibility' },
  { mode: 'hls', label: 'HLS', description: 'Safari/mobile' },
  { mode: 'mjpeg', label: 'MJPEG', description: 'Universal fallback' },
];

export function Go2RTCCameraCard({ camera, customName, onRename }: Go2RTCCameraProps) {
  const [quality, setQuality] = useState<StreamQuality>('sd');
  const [streamMode, setStreamMode] = useState<StreamMode>('webrtc');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = customName || camera.name;
  const stream = quality === 'hd' ? camera.streams.hd : camera.streams.sd;
  const isAvailable = stream.available;

  // Get the appropriate URL based on stream mode
  const getStreamUrl = useCallback((): string | null => {
    if (!isAvailable) return null;

    switch (streamMode) {
      case 'webrtc':
        return stream.webrtcPage;
      case 'auto':
        return stream.streamPage;
      case 'hls':
        return stream.hls;
      case 'mjpeg':
        return stream.mjpeg;
      default:
        return stream.streamPage;
    }
  }, [streamMode, stream, isAvailable]);

  const streamUrl = getStreamUrl();

  // Determine if we should use iframe or direct embed
  const useIframe = streamMode === 'webrtc' || streamMode === 'auto';

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load stream');
  };

  // Update volume when it changes (for non-iframe modes)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Retry connection
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  // Change stream mode
  const changeStreamMode = (mode: StreamMode) => {
    setStreamMode(mode);
    setShowSettings(false);
    setIsLoading(true);
    setError(null);
    setIframeKey(prev => prev + 1);
  };

  // Change quality
  const changeQuality = (q: StreamQuality) => {
    setQuality(q);
    setShowSettings(false);
    setIsLoading(true);
    setError(null);
    setIframeKey(prev => prev + 1);
  };

  // Volume control
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Fullscreen handling
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

  // Handle rename - double click to start editing
  const handleDoubleClick = () => {
    if (onRename) {
      setEditName(displayName);
      setIsEditing(true);
    }
  };

  const saveRename = () => {
    if (editName.trim() && onRename) {
      onRename(camera.id, editName.trim());
    }
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditName('');
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Show/hide controls on hover
  const handleMouseEnter = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    if (!showSettings) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1000);
    }
  };

  // Close settings when clicking outside
  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.settings-dropdown')) {
        setShowSettings(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative bg-card border border-border rounded-lg ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none flex flex-col overflow-hidden' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Minimal Header - just camera name and status */}
      <div className="px-3 py-2 flex items-center justify-between bg-card/90">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`p-1 rounded ${
            isAvailable ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            <Camera className="w-3.5 h-3.5" />
          </div>
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRename();
                  if (e.key === 'Escape') cancelEditing();
                }}
                onBlur={saveRename}
                className="flex-1 px-2 py-0.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={saveRename}
                className="p-1 rounded hover:bg-secondary text-green-500"
                title="Save"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={cancelEditing}
                className="p-1 rounded hover:bg-secondary text-red-500"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              className="min-w-0 cursor-pointer"
              onDoubleClick={handleDoubleClick}
              title={onRename ? "Double-click to rename" : undefined}
            >
              <h3 className="font-medium text-sm truncate">{displayName}</h3>
              <p className="text-xs text-muted-foreground">{camera.ip}</p>
            </div>
          )}
        </div>
        {/* Live indicator */}
        {isAvailable && !error && !isLoading && !isEditing && (
          <div className="flex items-center gap-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}
      </div>

      {/* Video feed */}
      <div className={`relative bg-black ${isFullscreen ? 'flex-1' : 'aspect-video'} overflow-hidden`}>
        {isAvailable && streamUrl ? (
          <>
            {useIframe ? (
              <div className="relative w-full h-full overflow-hidden">
                <iframe
                  ref={iframeRef}
                  key={iframeKey}
                  src={streamUrl}
                  className="absolute border-0"
                  style={{
                    // Make iframe larger than container to hide native controls
                    width: '110%',
                    height: '130%',
                    top: '-5%',
                    left: '-5%',
                    overflow: 'hidden'
                  }}
                  scrolling="no"
                  allow="autoplay; fullscreen"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />
                {/* Overlay to block iframe native controls */}
                <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none" />
              </div>
            ) : streamMode === 'hls' ? (
              <video
                ref={videoRef}
                key={iframeKey}
                src={streamUrl}
                autoPlay
                muted={isMuted}
                playsInline
                controls={false}
                className="w-full h-full object-contain"
                onLoadedData={() => { setIsLoading(false); setError(null); }}
                onError={() => { setIsLoading(false); setError('HLS stream failed'); }}
              />
            ) : (
              <img
                key={iframeKey}
                src={streamUrl}
                alt={displayName}
                className="w-full h-full object-contain"
                onLoad={() => { setIsLoading(false); setError(null); }}
                onError={() => { setIsLoading(false); setError('MJPEG stream failed'); }}
              />
            )}

            {/* Video Overlay Controls - appears on hover */}
            <div
              className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-2 px-2 transition-opacity duration-300 ${
                showControls || showSettings || isFullscreen ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Playbar / Controls */}
              <div className="flex items-center justify-between gap-2">
                {/* Left side - Quality & Mode badges */}
                <div className="flex items-center gap-1">
                  <span className="text-white/90 text-xs px-1.5 py-0.5 bg-white/20 rounded">
                    {quality.toUpperCase()}
                  </span>
                  <span className="text-white/90 text-xs px-1.5 py-0.5 bg-white/20 rounded">
                    {streamMode.toUpperCase()}
                  </span>
                </div>

                {/* Center - Volume control (only for non-iframe modes) */}
                <div className="flex items-center gap-1 flex-1 max-w-[180px]">
                  {useIframe ? (
                    /* For iframe modes, audio is controlled within the stream */
                    <span className="text-white/60 text-xs italic">
                      Click stream for audio
                    </span>
                  ) : (
                    /* For HLS/MJPEG, we can control volume directly */
                    <>
                      <button
                        onClick={toggleMute}
                        className="p-1 rounded hover:bg-white/20 transition-colors text-white"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                          [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white
                          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                        title="Volume"
                      />
                    </>
                  )}
                </div>

                {/* Right side - Control buttons */}
                <div className="flex items-center gap-1">
                  {/* Retry button (shown on error) */}
                  {error && (
                    <button
                      onClick={handleRetry}
                      className="p-1.5 rounded bg-white/20 hover:bg-white/30 transition-colors text-yellow-400"
                      title="Retry connection"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}

                  {/* Settings dropdown */}
                  <div className="relative settings-dropdown">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSettings(!showSettings);
                      }}
                      className="p-1.5 rounded bg-white/20 hover:bg-white/30 transition-colors text-white"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Fullscreen button */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded bg-white/20 hover:bg-white/30 transition-colors text-white"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Connecting...</p>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-center text-white">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="mt-2 px-3 py-1 bg-white/20 rounded hover:bg-white/30 text-sm"
                  >
                    Retry
                  </button>
                  <p className="mt-2 text-xs text-white/60">
                    Try switching to a different stream mode
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Camera unavailable</p>
              <p className="text-xs mt-1">{camera.ip}</p>
            </div>
          </div>
        )}
      </div>

      {/* Settings dropdown - positioned outside overflow-hidden container */}
      {showSettings && (
        <div
          className="absolute bottom-16 right-4 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2 z-50 min-w-[180px] settings-dropdown"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Stream Mode */}
          <p className="text-xs text-zinc-400 mb-1 px-2 flex items-center gap-1">
            <Wifi className="w-3 h-3" /> Stream Mode
          </p>
          {STREAM_MODES.map(({ mode, label, description }) => (
            <button
              key={mode}
              onClick={() => changeStreamMode(mode)}
              className={`w-full text-left px-2 py-1.5 text-sm rounded flex justify-between items-center ${
                streamMode === mode ? 'bg-primary text-primary-foreground' : 'hover:bg-zinc-800 text-white'
              }`}
            >
              <span>{label}</span>
              <span className={`text-xs ${streamMode === mode ? 'text-primary-foreground/70' : 'text-zinc-500'}`}>
                {description}
              </span>
            </button>
          ))}

          <hr className="my-2 border-zinc-700" />

          {/* Quality */}
          <p className="text-xs text-zinc-400 mb-1 px-2 flex items-center gap-1">
            <Video className="w-3 h-3" /> Quality
          </p>
          <button
            onClick={() => changeQuality('hd')}
            className={`w-full text-left px-2 py-1.5 text-sm rounded ${
              quality === 'hd' ? 'bg-primary text-primary-foreground' : 'hover:bg-zinc-800 text-white'
            }`}
          >
            HD (High)
          </button>
          <button
            onClick={() => changeQuality('sd')}
            className={`w-full text-left px-2 py-1.5 text-sm rounded ${
              quality === 'sd' ? 'bg-primary text-primary-foreground' : 'hover:bg-zinc-800 text-white'
            }`}
          >
            SD (Low)
          </button>
        </div>
      )}
    </div>
  );
}
