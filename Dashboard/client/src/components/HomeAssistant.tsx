import { useState } from 'react';
import { Home, ChevronDown, ChevronUp, Lightbulb, Thermometer, Music, Power, Wifi, WifiOff } from 'lucide-react';
import { LightCard } from './homeassistant/LightCard';
import { SwitchCard } from './homeassistant/SwitchCard';
import { ClimateCard } from './homeassistant/ClimateCard';
import { MediaPlayerCard } from './homeassistant/MediaPlayerCard';
import { CamerasSection } from './go2rtc/CamerasSection';
import type { HADevices, HAStatus } from '../types';

interface HomeAssistantProps {
  devices: HADevices | null;
  status: HAStatus;
  collapsed?: boolean;
  onToggle: (entityId: string) => Promise<boolean>;
  onLightBrightness: (entityId: string, brightness: number) => Promise<boolean>;
  onLightColor?: (entityId: string, rgb: [number, number, number]) => Promise<boolean>;
  onClimateTemperature: (entityId: string, temperature: number) => Promise<boolean>;
  onMediaAction: (entityId: string, action: string) => Promise<boolean>;
  onMediaVolume: (entityId: string, volume: number) => Promise<boolean>;
}

interface DeviceSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function DeviceSection({ title, icon, count, expanded, onToggle, children }: DeviceSectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-medium">{title}</span>
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{count}</span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {expanded && (
        <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function HomeAssistant({
  devices,
  status,
  collapsed = false,
  onToggle,
  onLightBrightness,
  onLightColor,
  onClimateTemperature,
  onMediaAction,
  onMediaVolume
}: HomeAssistantProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    lights: true,
    switches: false,
    climate: false,
    media: false,
    cameras: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Count devices that are "on" or active
  const lightsOn = devices?.lights.filter(l => l.state === 'on').length || 0;
  const switchesOn = devices?.switches.filter(s => s.state === 'on').length || 0;
  const climateActive = devices?.climate.filter(c => c.state !== 'off').length || 0;
  const mediaPlaying = devices?.media_players.filter(m => m.state === 'playing').length || 0;

  // Collapsed view - just show summary
  if (collapsed) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${status.connected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Smart Home</h2>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {status.connected ? (
                  <>
                    <Wifi className="w-3 h-3 text-success" />
                    <span>Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-destructive" />
                    <span>{status.error || 'Disconnected'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {status.connected && devices && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <Lightbulb className={`w-5 h-5 mx-auto mb-1 ${lightsOn > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              <p className="text-lg font-bold">{lightsOn}/{devices.lights.length}</p>
              <p className="text-xs text-muted-foreground">Lights On</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <Power className={`w-5 h-5 mx-auto mb-1 ${switchesOn > 0 ? 'text-success' : 'text-muted-foreground'}`} />
              <p className="text-lg font-bold">{switchesOn}/{devices.switches.length}</p>
              <p className="text-xs text-muted-foreground">Switches On</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <Thermometer className={`w-5 h-5 mx-auto mb-1 ${climateActive > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              <p className="text-lg font-bold">{climateActive}/{devices.climate.length}</p>
              <p className="text-xs text-muted-foreground">Climate Active</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <Music className={`w-5 h-5 mx-auto mb-1 ${mediaPlaying > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-lg font-bold">{mediaPlaying}/{devices.media_players.length}</p>
              <p className="text-xs text-muted-foreground">Playing</p>
            </div>
          </div>
        )}

        {!status.connected && (
          <div className="text-center text-muted-foreground py-4">
            <p>Home Assistant not connected</p>
            <p className="text-xs mt-1">Check configuration at http://192.168.50.39:8123</p>
          </div>
        )}
      </div>
    );
  }

  // Full view
  if (!status.connected) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">Home Assistant Not Connected</h2>
        <p className="text-muted-foreground mb-4">{status.error || 'Unable to connect to Home Assistant'}</p>
        <a
          href="http://192.168.50.39:8123"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Home className="w-4 h-4" />
          Open Home Assistant
        </a>
      </div>
    );
  }

  if (!devices) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <div className="animate-pulse">
          <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lights Section */}
      {devices.lights.length > 0 && (
        <DeviceSection
          title="Lights"
          icon={<Lightbulb className={`w-5 h-5 ${lightsOn > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />}
          count={devices.lights.length}
          expanded={expandedSections.lights}
          onToggle={() => toggleSection('lights')}
        >
          {devices.lights.map(light => (
            <LightCard
              key={light.entity_id}
              light={light}
              onToggle={onToggle}
              onBrightness={onLightBrightness}
              onColor={onLightColor}
            />
          ))}
        </DeviceSection>
      )}

      {/* Switches Section */}
      {devices.switches.length > 0 && (
        <DeviceSection
          title="Switches & Outlets"
          icon={<Power className={`w-5 h-5 ${switchesOn > 0 ? 'text-success' : 'text-muted-foreground'}`} />}
          count={devices.switches.length}
          expanded={expandedSections.switches}
          onToggle={() => toggleSection('switches')}
        >
          {devices.switches.map(device => (
            <SwitchCard
              key={device.entity_id}
              device={device}
              onToggle={onToggle}
            />
          ))}
        </DeviceSection>
      )}

      {/* Climate Section */}
      {devices.climate.length > 0 && (
        <DeviceSection
          title="Climate"
          icon={<Thermometer className={`w-5 h-5 ${climateActive > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />}
          count={devices.climate.length}
          expanded={expandedSections.climate}
          onToggle={() => toggleSection('climate')}
        >
          {devices.climate.map(climate => (
            <ClimateCard
              key={climate.entity_id}
              climate={climate}
              onSetTemperature={onClimateTemperature}
            />
          ))}
        </DeviceSection>
      )}

      {/* Media Players Section */}
      {devices.media_players.length > 0 && (
        <DeviceSection
          title="Media Players"
          icon={<Music className={`w-5 h-5 ${mediaPlaying > 0 ? 'text-primary' : 'text-muted-foreground'}`} />}
          count={devices.media_players.length}
          expanded={expandedSections.media}
          onToggle={() => toggleSection('media')}
        >
          {devices.media_players.map(player => (
            <MediaPlayerCard
              key={player.entity_id}
              player={player}
              onAction={onMediaAction}
              onVolume={onMediaVolume}
            />
          ))}
        </DeviceSection>
      )}

      {/* Cameras Section - Using go2rtc integration */}
      <CamerasSection defaultExpanded={expandedSections.cameras} />

      {/* No devices message */}
      {devices.lights.length === 0 &&
        devices.switches.length === 0 &&
        devices.climate.length === 0 &&
        devices.media_players.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Devices Found</h2>
            <p className="text-muted-foreground mb-4">
              Add devices to Home Assistant to control them here.
            </p>
            <a
              href="http://192.168.50.39:8123/config/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Integrations
            </a>
          </div>
        )}
    </div>
  );
}
