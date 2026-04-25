import { useState } from 'react';
import { Music, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { HAMediaPlayer } from '../../types';

interface MediaPlayerCardProps {
  player: HAMediaPlayer;
  onAction: (entityId: string, action: string) => Promise<boolean>;
  onVolume: (entityId: string, volume: number) => Promise<boolean>;
}

export function MediaPlayerCard({ player, onAction, onVolume }: MediaPlayerCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const friendlyName = player.attributes.friendly_name || player.entity_id.split('.')[1];
  const isPlaying = player.state === 'playing';
  const isOff = player.state === 'off' || player.state === 'unavailable';
  const volume = player.attributes.volume_level || 0;
  const volumePercent = Math.round(volume * 100);
  const isMuted = player.attributes.is_volume_muted;
  const mediaTitle = player.attributes.media_title;
  const mediaArtist = player.attributes.media_artist;

  const handleAction = async (action: string) => {
    setLoading(action);
    await onAction(player.entity_id, action);
    setLoading(null);
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value) / 100;
    await onVolume(player.entity_id, newVolume);
  };

  return (
    <div className="bg-surface-container-high border border-white/5 rounded-lg p-4 hover:bg-surface-bright transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${isPlaying ? 'bg-primary/20 text-primary' : 'bg-surface-container-low text-on-surface-variant'}`}>
          <Music className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate text-on-surface">{friendlyName}</h3>
          {mediaTitle ? (
            <p className="text-xs text-on-surface-variant truncate">
              {mediaTitle}{mediaArtist ? ` - ${mediaArtist}` : ''}
            </p>
          ) : (
            <p className="text-xs text-on-surface-variant capitalize">{player.state}</p>
          )}
        </div>
      </div>

      {!isOff && (
        <>
          <div className="flex items-center justify-center gap-2 mb-3">
            <button
              onClick={() => handleAction('previous')}
              disabled={loading !== null}
              className="p-2 rounded-lg hover:bg-surface-container-low transition-colors disabled:opacity-50 text-on-surface-variant"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleAction('play_pause')}
              disabled={loading !== null}
              className={`p-3 rounded-full transition-colors disabled:opacity-50 ${
                isPlaying ? 'bg-primary text-[#002e6a]' : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => handleAction('next')}
              disabled={loading !== null}
              className="p-2 rounded-lg hover:bg-surface-container-low transition-colors disabled:opacity-50 text-on-surface-variant"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-on-surface-variant" />
            ) : (
              <Volume2 className="w-4 h-4 text-on-surface-variant" />
            )}
            <input
              type="range"
              min="0"
              max="100"
              value={volumePercent}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-xs text-on-surface-variant w-8">{volumePercent}%</span>
          </div>
        </>
      )}

      {isOff && (
        <div className="text-center text-on-surface-variant text-sm py-2">
          {player.state === 'unavailable' ? 'Unavailable' : 'Off'}
        </div>
      )}
    </div>
  );
}
