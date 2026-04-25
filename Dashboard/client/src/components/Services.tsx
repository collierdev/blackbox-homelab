import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Loader2, X, Square, RotateCcw, Play, ExternalLink, ChevronRight, ChevronLeft, Database } from 'lucide-react';
import type { ServiceInfo } from '../types';
import { ServiceCard } from './ServiceCard';

interface ExpandedCardProps {
  service: ServiceInfo;
  onAction: (id: string, type: string, action: 'start' | 'stop' | 'restart') => Promise<void>;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
  'pi-dashboard': '/vite.svg',
};

function ExpandedServiceCard({ service, onAction, onClose }: ExpandedCardProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setLoading(action);
    try {
      await onAction(service.id, service.type, action);
    } finally {
      setLoading(null);
    }
  };

  const iconUrl = service.customIcon || DEFAULT_ICONS[service.name.toLowerCase()] || null;
  const isRunning = service.status === 'running';

  return (
    <div
      className="rounded-xl flex-shrink-0 flex flex-col relative"
      style={{
        width: '280px',
        background: '#1c2a4a',
        border: '1px solid #2a3d6a',
        padding: '16px',
        scrollSnapAlign: 'start',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 rounded-lg flex items-center justify-center transition-all"
        style={{ color: '#8892a4', width: '24px', height: '24px' }}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ background: '#162040' }}
        >
          {iconUrl ? (
            <img src={iconUrl} alt={service.name} className="w-6 h-6 object-contain" />
          ) : (
            <Database className="w-5 h-5" style={{ color: '#8892a4' }} />
          )}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm capitalize truncate" style={{ color: '#e2e8f0' }}>
            {service.name}
          </div>
          <div
            className="text-xs uppercase font-bold"
            style={{ color: isRunning ? '#22c55e' : '#8892a4' }}
          >
            {service.status}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4 text-xs" style={{ color: '#8892a4' }}>
        {service.uptime && (
          <div className="flex justify-between">
            <span>Uptime</span>
            <span style={{ color: '#c2c6d6' }}>{service.uptime}</span>
          </div>
        )}
        {service.type && (
          <div className="flex justify-between">
            <span>Type</span>
            <span style={{ color: '#c2c6d6' }} className="uppercase">{service.type}</span>
          </div>
        )}
        {service.memoryUsage !== undefined && (
          <div className="flex justify-between">
            <span>RAM</span>
            <span style={{ color: '#c2c6d6' }}>{formatBytes(service.memoryUsage || 0)}</span>
          </div>
        )}
        {service.cpuPercent !== undefined && (
          <div className="flex justify-between">
            <span>CPU</span>
            <span style={{ color: '#c2c6d6' }}>{service.cpuPercent.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto">
        {isRunning ? (
          <>
            <button
              onClick={() => handleAction('stop')}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg text-xs font-medium transition-all"
              style={{
                padding: '6px 10px',
                background: 'rgba(255,180,171,0.1)',
                color: '#ffb4ab',
                border: '1px solid rgba(255,180,171,0.2)',
              }}
            >
              {loading === 'stop' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              Stop
            </button>
            <button
              onClick={() => handleAction('restart')}
              disabled={loading !== null}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg text-xs font-medium transition-all"
              style={{
                padding: '6px 10px',
                background: 'rgba(247,190,29,0.1)',
                color: '#f7be1d',
                border: '1px solid rgba(247,190,29,0.2)',
              }}
            >
              {loading === 'restart' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              Restart
            </button>
          </>
        ) : (
          <button
            onClick={() => handleAction('start')}
            disabled={loading !== null}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg text-xs font-medium transition-all"
            style={{
              padding: '6px 10px',
              background: 'rgba(34,197,94,0.1)',
              color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.2)',
            }}
          >
            {loading === 'start' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Start
          </button>
        )}
        {service.url && (
          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 flex items-center justify-center rounded-lg transition-all"
            style={{
              background: 'rgba(173,198,255,0.1)',
              color: '#adc6ff',
              border: '1px solid rgba(173,198,255,0.2)',
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

interface CollapsedCardProps {
  service: ServiceInfo;
  onClick: () => void;
}

function CollapsedServiceCard({ service, onClick }: CollapsedCardProps) {
  const iconUrl = service.customIcon || DEFAULT_ICONS[service.name.toLowerCase()] || null;
  const isRunning = service.status === 'running';

  return (
    <button
      onClick={onClick}
      className="rounded-xl flex-shrink-0 flex flex-col text-left transition-all group"
      style={{
        width: '180px',
        background: '#1c2a4a',
        border: '1px solid #243356',
        padding: '14px',
        scrollSnapAlign: 'start',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#2a3d6a';
        (e.currentTarget as HTMLElement).style.background = '#243356';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#243356';
        (e.currentTarget as HTMLElement).style.background = '#1c2a4a';
      }}
    >
      {/* Icon + status dot */}
      <div className="relative mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden"
          style={{ background: '#162040' }}
        >
          {iconUrl ? (
            <img src={iconUrl} alt={service.name} className="w-6 h-6 object-contain" />
          ) : (
            <Database className="w-5 h-5" style={{ color: '#8892a4' }} />
          )}
        </div>
        <span
          className="absolute rounded-full border-2"
          style={{
            bottom: '-2px',
            right: '-2px',
            width: '10px',
            height: '10px',
            background: isRunning ? '#22c55e' : '#8892a4',
            borderColor: '#1c2a4a',
          }}
        />
      </div>

      {/* Name */}
      <div className="font-semibold text-sm capitalize mb-1 truncate" style={{ color: '#e2e8f0' }}>
        {service.name}
      </div>
      <div className="text-xs uppercase font-bold" style={{ color: isRunning ? '#22c55e' : '#8892a4' }}>
        {service.status}
      </div>

      {/* Uptime */}
      {service.uptime && (
        <div className="mt-2 text-xs truncate" style={{ color: '#8892a4' }}>
          {service.uptime}
        </div>
      )}

      {/* Expand indicator */}
      <div className="mt-auto pt-3 flex items-center justify-end" style={{ color: '#8892a4' }}>
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

export function Services() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAllModal, setShowAllModal] = useState(false);

  // Scroll / drag state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    // Delay initial check so cards have rendered
    const t = setTimeout(checkScroll, 200);
    return () => { el.removeEventListener('scroll', checkScroll); clearTimeout(t); };
  }, [checkScroll, services]);

  const nudge = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  // Mouse drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.pageX - (scrollRef.current?.offsetLeft ?? 0);
    dragScrollLeft.current = scrollRef.current?.scrollLeft ?? 0;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grabbing';
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = dragScrollLeft.current - (x - dragStartX.current) * 1.2;
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const handleAction = async (id: string, type: string, action: 'start' | 'stop' | 'restart') => {
    try {
      const res = await fetch(`/api/services/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Action failed');
      }
      setTimeout(fetchServices, 1000);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(`Failed to ${action} service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleNotesUpdate = async (name: string, notes: string) => {
    try {
      const res = await fetch(`/api/services/${name}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (!res.ok) throw new Error('Failed to save notes');
      fetchServices();
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    }
  };

  const handleIconUpload = async (name: string, icon: string | null) => {
    try {
      const res = await fetch(`/api/services/${name}/icon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon })
      });
      if (!res.ok) throw new Error('Failed to upload icon');
      fetchServices();
    } catch (error) {
      console.error('Error uploading icon:', error);
      alert('Failed to upload icon');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            className="font-extrabold tracking-tight"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '20px', color: '#e2e8f0' }}
          >
            DOCKER CONTAINERS
          </h2>
        </div>
        <div className="no-scrollbar flex gap-4 overflow-x-auto" style={{ scrollSnapType: 'x mandatory' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="rounded-xl flex-shrink-0 animate-pulse"
              style={{ width: '180px', height: '160px', background: '#1c2a4a', scrollSnapAlign: 'start' }}
            />
          ))}
        </div>
      </div>
    );
  }

  const runningCount = services.filter(s => s.status === 'running').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-extrabold tracking-tight"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '20px', color: '#e2e8f0' }}
          >
            DOCKER CONTAINERS
          </h2>
          <p style={{ fontSize: '12px', color: '#8892a4' }}>
            {runningCount} of {services.length} running
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllModal(true)}
            className="flex items-center gap-2 rounded-lg text-xs font-medium transition-all"
            style={{
              padding: '6px 14px',
              background: 'rgba(173,198,255,0.1)',
              color: '#adc6ff',
              border: '1px solid rgba(173,198,255,0.2)',
            }}
          >
            VIEW ALL
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg text-xs transition-all disabled:opacity-50"
            style={{
              padding: '6px 12px',
              background: '#1c2a4a',
              color: '#8892a4',
              border: '1px solid #243356',
            }}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Horizontal scroll row with arrow nav + drag */}
      <div className="relative group/scroll">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => nudge('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-150"
            style={{ width: '32px', height: '32px', background: '#243356', color: '#adc6ff', border: '1px solid #2a3d6a', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => nudge('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-150"
            style={{ width: '32px', height: '32px', background: '#243356', color: '#adc6ff', border: '1px solid #2a3d6a', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-4 overflow-x-auto select-none"
          style={{ scrollSnapType: 'x mandatory', cursor: 'grab' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {services.map(service => (
            expandedId === service.id ? (
              <ExpandedServiceCard
                key={service.id}
                service={service}
                onAction={handleAction}
                onClose={() => setExpandedId(null)}
              />
            ) : (
              <CollapsedServiceCard
                key={service.id}
                service={service}
                onClick={() => setExpandedId(service.id)}
              />
            )
          ))}

          {services.length === 0 && (
            <div className="text-center py-12 w-full" style={{ color: '#8892a4' }}>
              No services found
            </div>
          )}
        </div>
      </div>

      {/* VIEW ALL Modal */}
      {showAllModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(11,19,38,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAllModal(false);
          }}
        >
          <div
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: '#121f38',
              border: '1px solid #243356',
              width: '90vw',
              maxWidth: '1100px',
              maxHeight: '85vh',
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #243356' }}
            >
              <div>
                <h2
                  className="font-extrabold"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '18px', color: '#e2e8f0' }}
                >
                  ALL SERVICES
                </h2>
                <p style={{ fontSize: '12px', color: '#8892a4' }}>
                  {runningCount} of {services.length} running
                </p>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="rounded-xl flex items-center justify-center transition-all"
                style={{
                  width: '36px',
                  height: '36px',
                  background: '#1c2a4a',
                  color: '#8892a4',
                  border: '1px solid #243356',
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal grid */}
            <div className="overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onAction={handleAction}
                    onNotesUpdate={handleNotesUpdate}
                    onIconUpload={handleIconUpload}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
