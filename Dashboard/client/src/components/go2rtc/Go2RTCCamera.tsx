import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Maximize, Minimize, Settings, RefreshCw, AlertCircle, Video, Wifi, Volume2, VolumeX, Check, X } from 'lucide-react';
import type { Go2RTCCamera, StreamQuality, StreamMode } from '../../types';

interface Go2RTCCameraProps {
  camera: Go2RTCCamera;
  customName?: string;
  onRename?: (cameraId: string, newName: string) => void;
}

const STREAM_MODES: { mode: StreamMode; label: string; description: string }[] = [
  { mode: 'webrtc', label: 'WebRTC', description: 'Lowest latency' },
  { mode: 'auto', label: 'Auto', description: 'Best compatibility' },
  { mode: 'hls', label: 'HLS', description: 'Safari/mobile' },
  { mode: 'mjpeg', label: 'MJPEG', description: 'Universal fallback' },
];

export function Go2RTCCameraCard({ camera, customName, onRename }: Go2RTCCameraProps) {
  const [quality, setQuality] = useState<StreamQuality>('hd');
  const [streamMode, setStreamMode] = useState<StreamMode>(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isIOS ? 'hls' : 'auto';
  });
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

  const getStreamUrl = useCallback((): string | null => {
    if (!isAvailable) return null;
    switch (streamMode) {
      case 'webrtc': return stream.webrtcPage;
      case 'auto': return stream.streamPage;
      case 'hls': return stream.hls;
      case 'mjpeg': return stream.mjpeg;
      default: return stream.streamPage;
    }
  }, [streamMode, stream, isAvailable]);

  const streamUrl = getStreamUrl();
  const useIframe = streamMode === 'webrtc' || streamMode === 'auto';

  const handleIframeLoad = () => { setIsLoading(false); setError(null); };
  const handleIframeError = () => { setIsLoading(false); setError('Failed to load stream'); };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handleRetry = () => { setError(null); setIsLoading(true); setIframeKey(prev => prev + 1); };

  const changeStreamMode = (mode: StreamMode) => {
    setStreamMode(mode); setShowSettings(false); setIsLoading(true); setError(null); setIframeKey(prev => prev + 1);
  };

  const changeQuality = (q: StreamQuality) => {
    setQuality(q); setShowSettings(false); setIsLoading(true); setError(null); setIframeKey(prev => prev + 1);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const toggleFullscreen = async () => {
    if (!cardRef.current) return;
    if (!isFullscreen) {
      try { await cardRef.current.requestFullscreen(); setIsFullscreen(true); } catch (e) { console.error('Fullscreen failed:', e); }
    } else {
      document.exitFullscreen(); setIsFullscreen(false);
    }
  };

  const handleDoubleClick = () => {
    if (onRename) { setEditName(displayName); setIsEditing(true); }
  };

  const saveRename = () => {
    if (editName.trim() && onRename) onRename(camera.id, editName.trim());
    setIsEditing(false);
  };

  const cancelEditing = () => { setIsEditing(false); setEditName(''); };

  useEffect(() => {
    if (isEditing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [isEditing]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleMouseEnter = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    if (!showSettings) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 1000);
    }
  };

  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.settings-dropdown')) setShowSettings(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showSettings]);

  useEffect(() => {
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, []);

  const isLive = isAvailable && !error && !isLoading;

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-video'}`}
      style={{ borderRadius: isFullscreen ? 0 : '10px', background: '#0b1326', cursor: 'pointer' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video / Placeholder area */}
      {isAvailable && streamUrl ? (
        <>
          {useIframe ? (
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={streamUrl}
                className="absolute border-0"
                style={{ width: '110%', height: '130%', top: '-5%', left: '-5%', overflow: 'hidden' }}
                scrolling="no"
                allow="autoplay; fullscreen"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
              <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none" />
            </div>
          ) : streamMode === 'hls' ? (
            <video
              ref={videoRef}
              key={iframeKey}
              src={streamUrl}
              autoPlay muted={isMuted} playsInline controls={false}
              className="absolute inset-0 w-full h-full object-contain"
              onLoadedData={() => { setIsLoading(false); setError(null); }}
              onError={() => { setIsLoading(false); setError('HLS stream failed'); }}
            />
          ) : (
            <img
              key={iframeKey}
              src={streamUrl}
              alt={displayName}
              className="absolute inset-0 w-full h-full object-contain"
              onLoad={() => { setIsLoading(false); setError(null); }}
              onError={() => { setIsLoading(false); setError('MJPEG stream failed'); }}
            />
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1520, #0d1e30)' }}>
              <div className="text-center" style={{ color: '#8892a4' }}>
                <Camera style={{ width: '48px', height: '48px', opacity: 0.25, margin: '0 auto 8px' }} />
                <RefreshCw className="w-6 h-6 mx-auto animate-spin" style={{ color: '#adc6ff', opacity: 0.6 }} />
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
              <div className="text-center text-white">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm">{error}</p>
                <button onClick={handleRetry} className="mt-2 px-3 py-1 bg-white/20 rounded hover:bg-white/30 text-sm">Retry</button>
              </div>
            </div>
          )}

          {/* Hover controls bar */}
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent pt-8 pb-2 px-2 transition-opacity duration-300 ${
              showControls || showSettings || isFullscreen ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <span className="text-white/90 text-xs px-1.5 py-0.5 bg-white/20 rounded">{quality.toUpperCase()}</span>
                <span className="text-white/90 text-xs px-1.5 py-0.5 bg-white/20 rounded">{streamMode.toUpperCase()}</span>
              </div>

              <div className="flex items-center gap-1 flex-1 max-w-[180px]">
                {useIframe ? (
                  <span className="text-white/60 text-xs italic">Click stream for audio</span>
                ) : (
                  <>
                    <button onClick={toggleMute} className="p-1 rounded hover:bg-white/20 transition-colors text-white" title={isMuted ? "Unmute" : "Mute"}>
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-white
                        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    />
                  </>
                )}
              </div>

              <div className="flex items-center gap-1">
                {error && (
                  <button onClick={handleRetry} className="p-1.5 rounded bg-white/20 hover:bg-white/30 transition-colors text-yellow-400" title="Retry">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                <div className="relative settings-dropdown">
                  <button onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }} className="p-1.5 rounded bg-white/20 hover:bg-white/30 transition-colors text-white" title="Settings">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                <button onClick={toggleFullscreen} className="p-1.5 rounded bg-white/20 hover:bg-white/30 transition-colors text-white" title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Offline placeholder */
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a1520, #0d1e30)' }}>
          <Camera style={{ width: '48px', height: '48px', color: '#adc6ff', opacity: 0.25 }} />
        </div>
      )}

      {/* LIVE badge — top-left overlay */}
      {isLive && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: '#e53935', fontSize: '10px', fontWeight: 700, color: '#fff', letterSpacing: '0.06em' }}>
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}

      {/* Camera name — bottom-right overlay */}
      <div className="absolute bottom-2 right-2">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') cancelEditing(); }}
              onBlur={saveRename}
              className="px-2 py-0.5 text-xs bg-black/70 border border-white/30 rounded focus:outline-none focus:ring-1 focus:ring-primary text-white"
              style={{ width: '120px' }}
            />
            <button onClick={saveRename} className="p-1 rounded bg-black/50 text-green-400 hover:bg-black/70"><Check className="w-3 h-3" /></button>
            <button onClick={cancelEditing} className="p-1 rounded bg-black/50 text-red-400 hover:bg-black/70"><X className="w-3 h-3" /></button>
          </div>
        ) : (
          <span
            onDoubleClick={handleDoubleClick}
            title={onRename ? "Double-click to rename" : undefined}
            style={{ fontSize: '11px', color: '#8892a4', cursor: onRename ? 'pointer' : 'default', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
          >
            {displayName}
          </span>
        )}
      </div>

      {/* Settings dropdown */}
      {showSettings && (
        <div
          className="absolute bottom-10 right-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2 z-50 min-w-[180px] settings-dropdown"
          onClick={(e) => e.stopPropagation()}
        >
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
              <span className={`text-xs ${streamMode === mode ? 'text-primary-foreground/70' : 'text-zinc-500'}`}>{description}</span>
            </button>
          ))}
          <hr className="my-2 border-zinc-700" />
          <p className="text-xs text-zinc-400 mb-1 px-2 flex items-center gap-1">
            <Video className="w-3 h-3" /> Quality
          </p>
          <button onClick={() => changeQuality('hd')} className={`w-full text-left px-2 py-1.5 text-sm rounded ${quality === 'hd' ? 'bg-primary text-primary-foreground' : 'hover:bg-zinc-800 text-white'}`}>HD (High)</button>
          <button onClick={() => changeQuality('sd')} className={`w-full text-left px-2 py-1.5 text-sm rounded ${quality === 'sd' ? 'bg-primary text-primary-foreground' : 'hover:bg-zinc-800 text-white'}`}>SD (Low)</button>
        </div>
      )}
    </div>
  );
}
