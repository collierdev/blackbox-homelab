import { useState, useRef } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  ExternalLink,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  StickyNote,
  ImagePlus,
  X,
  Cpu,
  HardDrive
} from 'lucide-react';
import type { ServiceInfo } from '../types';

interface ServiceCardProps {
  service: ServiceInfo;
  onAction: (id: string, type: string, action: 'start' | 'stop' | 'restart') => Promise<void>;
  onNotesUpdate: (name: string, notes: string) => Promise<void>;
  onIconUpload: (name: string, icon: string | null) => Promise<void>;
}

const DEFAULT_ICONS: Record<string, string> = {
  jellyfin: 'https://raw.githubusercontent.com/jellyfin/jellyfin-ux/master/branding/SVG/icon-transparent.svg',
  n8n: 'https://raw.githubusercontent.com/n8n-io/n8n/master/assets/n8n-logo.png',
  portainer: 'https://raw.githubusercontent.com/portainer/portainer/develop/app/assets/ico/apple-touch-icon.png',
  plex: 'https://raw.githubusercontent.com/plexinc/plex-media-player/master/resources/images/icon.svg',
  ollama: 'https://ollama.com/public/ollama.png',
  tailscaled: 'https://tailscale.com/files/favicon-32x32.png',
  samba: '/samba.svg',
  homeassistant: 'https://raw.githubusercontent.com/home-assistant/assets/master/logo/logo.svg',
  'home-assistant': 'https://raw.githubusercontent.com/home-assistant/assets/master/logo/logo.svg',
  'pi-dashboard': '/vite.svg'
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function ServiceCard({ service, onAction, onNotesUpdate, onIconUpload }: ServiceCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(service.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setLoading(action);
    try {
      await onAction(service.id, service.type, action);
    } finally {
      setLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await onNotesUpdate(service.name, notes);
      setShowNotes(false);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await onIconUpload(service.name, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleClearIcon = async () => {
    await onIconUpload(service.name, null);
  };

  const getStatusIcon = () => {
    switch (service.status) {
      case 'running':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'stopped':
        return <XCircle className="w-5 h-5 text-muted-foreground" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <AlertCircle className="w-5 h-5 text-warning" />;
    }
  };

  const getStatusBadge = () => {
    const base = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1';
    switch (service.status) {
      case 'running':
        return `${base} bg-[#7dd87d]/10 text-[#7dd87d] border-[#7dd87d]/20`;
      case 'stopped':
        return `${base} bg-surface-variant text-on-surface-variant border-outline-variant/40`;
      case 'error':
        return `${base} bg-destructive/10 text-destructive border-destructive/30`;
      default:
        return `${base} bg-warning/10 text-warning border-warning/20`;
    }
  };

  const getIconUrl = () => {
    if (service.customIcon) return service.customIcon;
    return DEFAULT_ICONS[service.name.toLowerCase()] || null;
  };

  const iconUrl = getIconUrl();

  return (
    <div className="bg-surface-container-high rounded-lg p-5 hover:bg-surface-bright transition-colors border border-outline-variant/20 relative group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center overflow-hidden relative group">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={service.name}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              getStatusIcon()
            )}
            {/* Icon overlay for upload */}
            <div
              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground capitalize">{service.name}</h3>
            <span className="text-xs text-muted-foreground uppercase">{service.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-1 rounded hover:bg-surface-container-low transition-colors ${service.notes ? 'text-primary' : 'text-on-surface-variant'}`}
            title="Notes"
          >
            <StickyNote className="w-4 h-4" />
          </button>
          <span className={getStatusBadge()}>{service.status}</span>
        </div>
      </div>

      {/* Stats - only show for running services with data */}
      {service.status === 'running' && (service.memoryPercent !== undefined || service.cpuPercent !== undefined) && (
        <div className="grid grid-cols-2 gap-2 mb-6">
          {service.memoryPercent !== undefined && (
            <div className="bg-surface-container-low rounded-lg p-2">
              <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-1">
                <HardDrive className="w-3 h-3" />
                <span>RAM</span>
              </div>
              <div className="text-sm font-medium">
                {formatBytes(service.memoryUsage || 0)}
              </div>
              <div className="w-full bg-surface-variant rounded-full h-1 mt-1">
                <div
                  className="bg-primary h-1 rounded-full transition-all"
                  style={{ width: `${Math.min(service.memoryPercent, 100)}%` }}
                />
              </div>
            </div>
          )}
          {service.cpuPercent !== undefined && (
            <div className="bg-surface-container-low rounded-lg p-2">
              <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-1">
                <Cpu className="w-3 h-3" />
                <span>CPU</span>
              </div>
              <div className="text-sm font-medium">
                {service.cpuPercent.toFixed(1)}%
              </div>
              <div className="w-full bg-surface-variant rounded-full h-1 mt-1">
                <div
                  className="bg-primary h-1 rounded-full transition-all"
                  style={{ width: `${Math.min(service.cpuPercent, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Uptime */}
      {service.uptime && (
        <p className="text-xs text-on-surface-variant mb-3">{service.uptime}</p>
      )}

      {/* Notes Panel */}
      {showNotes && (
        <div className="mb-3 p-3 bg-surface-container-low rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Notes</span>
            <button onClick={() => setShowNotes(false)} className="text-on-surface-variant hover:text-on-surface">
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-surface border border-outline-variant/30 rounded-lg p-2 text-sm resize-none"
            rows={3}
            placeholder="Add notes about this service..."
          />
          <div className="flex justify-between mt-2">
            {service.customIcon && (
              <button
                onClick={handleClearIcon}
                className="text-xs text-on-surface-variant hover:text-destructive"
              >
                Clear custom icon
              </button>
            )}
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="ml-auto px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {savingNotes ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input for icon upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleIconUpload}
      />

      {/* Action Buttons */}
      <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        {service.status !== 'running' && (
          <button
            onClick={() => handleAction('start')}
            disabled={loading !== null}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-success rounded text-xs transition-colors disabled:opacity-50"
          >
            {loading === 'start' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Start
          </button>
        )}

        {service.status === 'running' && (
          <>
            <button
              onClick={() => handleAction('stop')}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-destructive rounded text-xs transition-colors disabled:opacity-50"
            >
              {loading === 'stop' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              Stop
            </button>

            <button
              onClick={() => handleAction('restart')}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-warning rounded text-xs transition-colors disabled:opacity-50"
            >
              {loading === 'restart' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Restart
            </button>
          </>
        )}

        {service.url && (
          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container text-primary rounded text-xs transition-colors ml-auto"
          >
            <ExternalLink className="w-4 h-4" />
            Open
          </a>
        )}
      </div>
    </div>
  );
}
