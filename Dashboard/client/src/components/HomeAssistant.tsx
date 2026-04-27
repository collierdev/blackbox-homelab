import { useState, useRef, useEffect, useCallback } from 'react';
import { Home, Lightbulb, Thermometer, Music, Power, Wifi, WifiOff, Layers, Plus, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { ClimateCard } from './homeassistant/ClimateCard';
import { MediaPlayerCard } from './homeassistant/MediaPlayerCard';
import { FixtureCard } from './homeassistant/FixtureCard';
import { FixtureManagement } from './homeassistant/FixtureManagement';
import { CamerasSection } from './go2rtc/CamerasSection';
import type { HADevices, HAStatus, LightFixture, ColorValue } from '../types';

interface HomeAssistantProps {
  devices: HADevices | null;
  status: HAStatus;
  collapsed?: boolean;
  hiddenSections?: string[];
  hiddenLights?: string[];
  hiddenCameras?: string[];
  onToggle: (entityId: string) => Promise<boolean>;
  onLightBrightness: (entityId: string, brightness: number) => Promise<boolean>;
  onLightColor?: (entityId: string, rgb: [number, number, number]) => Promise<boolean>;
  onClimateTemperature: (entityId: string, temperature: number) => Promise<boolean>;
  onMediaAction: (entityId: string, action: string) => Promise<boolean>;
  onMediaVolume: (entityId: string, volume: number) => Promise<boolean>;
  // Fixture props
  fixtures?: LightFixture[];
  onFixtureToggle?: (fixtureId: string) => Promise<boolean>;
  onFixtureBrightness?: (fixtureId: string, brightness: number) => Promise<boolean>;
  onFixtureColor?: (fixtureId: string, colorValue: ColorValue) => Promise<boolean>;
  onFixtureCreate?: (data: { name: string; lightIds: string[]; icon?: string; room?: string }) => Promise<LightFixture | null>;
  onFixtureUpdate?: (id: string, data: { name?: string; lightIds?: string[]; icon?: string; room?: string }) => Promise<LightFixture | null>;
  onFixtureDelete?: (id: string) => Promise<boolean>;
}

function LightToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#f7be1d' : '#243356', boxShadow: on ? '0 0 12px #f7be1d55' : 'none', display: 'flex', alignItems: 'center', padding: '0 3px', cursor: 'pointer', transition: 'background 0.2s, box-shadow 0.2s', flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: on ? '#0b1326' : '#8892a4', marginLeft: on ? 20 : 0, transition: 'margin 0.2s, background 0.2s' }} />
    </div>
  );
}

function SectionHeader({ icon, label, extra }: { icon: React.ReactNode; label: string; extra?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      {icon}
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#e2e8f0' }}>{label}</span>
      {extra && <div style={{ marginLeft: 'auto' }}>{extra}</div>}
    </div>
  );
}

export function HomeAssistant({
  devices,
  status,
  collapsed = false,
  hiddenSections = [],
  hiddenLights = [],
  hiddenCameras = [],
  onToggle,
  onLightBrightness: _onLightBrightness,
  onLightColor: _onLightColor,
  onClimateTemperature,
  onMediaAction,
  onMediaVolume,
  // Fixture props
  fixtures = [],
  onFixtureToggle,
  onFixtureBrightness,
  onFixtureColor,
  onFixtureCreate,
  onFixtureUpdate,
  onFixtureDelete
}: HomeAssistantProps) {
  const [fixtureModalOpen, setFixtureModalOpen] = useState(false);
  const [editingFixture, setEditingFixture] = useState<LightFixture | null>(null);
  const fixtureScrollRef = useRef<HTMLDivElement>(null);
  const lightsScrollRef = useRef<HTMLDivElement>(null);
  const [canFixtureScrollLeft, setCanFixtureScrollLeft] = useState(false);
  const [canFixtureScrollRight, setCanFixtureScrollRight] = useState(false);
  const [canLightsScrollUp, setCanLightsScrollUp] = useState(false);
  const [canLightsScrollDown, setCanLightsScrollDown] = useState(false);
  const isSectionVisible = (sectionId: string) => !hiddenSections.includes(sectionId);
  const visibleLights = devices?.lights.filter((l) => !hiddenLights.includes(l.entity_id)) || [];

  // Count devices that are "on" or active
  const lightsOn = visibleLights.filter(l => l.state === 'on').length || 0;
  const switchesOn = devices?.switches.filter(s => s.state === 'on').length || 0;
  const climateActive = devices?.climate.filter(c => c.state !== 'off').length || 0;


  // Count fixtures with any light on
  const fixturesOn = fixtures.filter(fixture => {
    const fixtureLights = devices?.lights.filter(l => fixture.lightIds.includes(l.entity_id)) || [];
    return fixtureLights.some(l => l.state === 'on');
  }).length;

  const handleEditFixture = (fixtureId: string) => {
    const fixture = fixtures.find(f => f.id === fixtureId);
    if (fixture) {
      setEditingFixture(fixture);
      setFixtureModalOpen(true);
    }
  };

  const handleCloseFixtureModal = () => {
    setFixtureModalOpen(false);
    setEditingFixture(null);
  };

  const handleCreateFixture = async (data: { name: string; lightIds: string[]; icon?: string; room?: string }) => {
    if (onFixtureCreate) {
      const result = await onFixtureCreate(data);
      return result;
    }
    return null;
  };

  const handleUpdateFixture = async (id: string, data: { name?: string; lightIds?: string[]; icon?: string; room?: string }) => {
    if (onFixtureUpdate) {
      const result = await onFixtureUpdate(id, data);
      return result;
    }
    return null;
  };

  const checkFixtureScroll = useCallback(() => {
    const el = fixtureScrollRef.current;
    if (!el) return;
    setCanFixtureScrollLeft(el.scrollLeft > 2);
    setCanFixtureScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = fixtureScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkFixtureScroll, { passive: true });
    const t = setTimeout(checkFixtureScroll, 120);
    return () => {
      el.removeEventListener('scroll', checkFixtureScroll);
      clearTimeout(t);
    };
  }, [checkFixtureScroll, fixtures.length]);

  const nudgeFixtureRow = (dir: 'left' | 'right') => {
    fixtureScrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const checkLightsScroll = useCallback(() => {
    const el = lightsScrollRef.current;
    if (!el) return;
    setCanLightsScrollUp(el.scrollTop > 2);
    setCanLightsScrollDown(el.scrollTop < el.scrollHeight - el.clientHeight - 2);
  }, []);

  useEffect(() => {
    const el = lightsScrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkLightsScroll, { passive: true });
    const t = setTimeout(checkLightsScroll, 120);
    return () => {
      el.removeEventListener('scroll', checkLightsScroll);
      clearTimeout(t);
    };
  }, [checkLightsScroll, visibleLights.length]);

  const nudgeLightsColumn = (dir: 'up' | 'down') => {
    lightsScrollRef.current?.scrollBy({ top: dir === 'up' ? -140 : 140, behavior: 'smooth' });
  };

  // Collapsed view - just show summary
  if (collapsed) {
    return (
      <div className="bg-surface-container-low rounded-xl p-5 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${status.connected ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-on-surface uppercase tracking-wider text-sm">Smart Home</h2>
              <div className="flex items-center gap-1 text-xs text-on-surface-variant">
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
            <div className="bg-surface-container-high p-3 rounded-lg flex items-center gap-3">
              <Layers className={`w-5 h-5 ${fixturesOn > 0 ? 'text-tertiary' : 'text-on-surface-variant'}`} />
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-['Inter']">Fixtures</p>
                <p className="text-lg font-bold text-on-surface">{fixturesOn}/{fixtures.length}</p>
              </div>
            </div>
            <div className="bg-surface-container-high p-3 rounded-lg flex items-center gap-3">
              <Lightbulb className={`w-5 h-5 ${lightsOn > 0 ? 'text-tertiary' : 'text-on-surface-variant'}`} />
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-['Inter']">Lights</p>
                <p className="text-lg font-bold text-on-surface">{lightsOn}/{visibleLights.length}</p>
              </div>
            </div>
            <div className="bg-surface-container-high p-3 rounded-lg flex items-center gap-3">
              <Power className={`w-5 h-5 ${switchesOn > 0 ? 'text-primary' : 'text-on-surface-variant'}`} />
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-['Inter']">Switches</p>
                <p className="text-lg font-bold text-on-surface">{switchesOn}/{devices.switches.length}</p>
              </div>
            </div>
            <div className="bg-surface-container-high p-3 rounded-lg flex items-center gap-3">
              <Thermometer className={`w-5 h-5 ${climateActive > 0 ? 'text-error' : 'text-on-surface-variant'}`} />
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-['Inter']">Climate</p>
                <p className="text-lg font-bold text-on-surface">{climateActive}/{devices.climate.length}</p>
              </div>
            </div>
          </div>
        )}

        {!status.connected && (
          <div className="text-center text-on-surface-variant py-4">
            <p>Home Assistant not connected</p>
            <p className="text-xs mt-1 text-outline">Check configuration at http://192.168.50.39:8123</p>
          </div>
        )}
      </div>
    );
  }

  // Full view
  if (!status.connected) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: '#162040', border: '1px solid #243356' }}>
        <WifiOff className="w-12 h-12 mx-auto mb-4" style={{ color: '#8892a4' }} />
        <h2 className="text-xl mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: '#e2e8f0' }}>Home Assistant Not Connected</h2>
        <p className="mb-4" style={{ color: '#8892a4' }}>{status.error || 'Unable to connect to Home Assistant'}</p>
        <a
          href="http://192.168.50.39:8123"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors"
          style={{ background: 'rgba(173,198,255,0.1)', color: '#adc6ff', border: '1px solid rgba(173,198,255,0.2)' }}
        >
          <Home className="w-4 h-4" />
          Open Home Assistant
        </a>
      </div>
    );
  }

  if (!devices) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: '#162040', border: '1px solid #243356' }}>
        <div className="animate-pulse">
          <Home className="w-12 h-12 mx-auto mb-4" style={{ color: '#8892a4' }} />
          <p style={{ color: '#8892a4' }}>Loading devices...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Light Fixtures (grouped) */}
      {isSectionVisible('fixtures') && (fixtures.length > 0 || onFixtureCreate) && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<Layers style={{ width: 16, height: 16, color: '#adc6ff' }} />}
            label="Light Fixtures"
            extra={
              onFixtureCreate && (
                <button
                  onClick={() => { setEditingFixture(null); setFixtureModalOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#adc6ff', background: 'rgba(173,198,255,0.12)', padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}
                >
                  <Plus style={{ width: 12, height: 12 }} /> Add
                </button>
              )
            }
          />
          {fixtures.length === 0 ? (
            <div style={{ background: '#162040', borderRadius: 12, padding: '24px', textAlign: 'center', color: '#8892a4', fontSize: 13 }}>
              No fixtures yet. Click Add to group lights.
            </div>
          ) : (
            <div className="relative group/fixtures">
              {canFixtureScrollLeft && (
                <button
                  onClick={() => nudgeFixtureRow('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full opacity-0 group-hover/fixtures:opacity-100 transition-all duration-150"
                  style={{ width: 34, height: 34, background: '#243356cc', color: '#adc6ff', border: '1px solid #2a3d6a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#2e436f'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#243356cc'; }}
                  title="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {canFixtureScrollRight && (
                <button
                  onClick={() => nudgeFixtureRow('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full opacity-0 group-hover/fixtures:opacity-100 transition-all duration-150"
                  style={{ width: 34, height: 34, background: '#243356cc', color: '#adc6ff', border: '1px solid #2a3d6a' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#2e436f'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#243356cc'; }}
                  title="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <div
                ref={fixtureScrollRef}
                className="no-scrollbar"
                style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6, cursor: 'grab' }}
                onMouseDown={e => {
                  const el = e.currentTarget;
                  el.style.cursor = 'grabbing';
                  const startX = e.pageX - el.offsetLeft;
                  const startScroll = el.scrollLeft;
                  const onMove = (ev: MouseEvent) => { el.scrollLeft = startScroll - (ev.pageX - el.offsetLeft - startX); };
                  const onUp = () => {
                    el.style.cursor = 'grab';
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                }}
              >
                {fixtures.map(fixture => (
                  <div key={fixture.id} style={{ minWidth: 320, flexShrink: 0 }}>
                    <FixtureCard
                      fixture={fixture}
                      lights={devices.lights}
                      onToggle={onFixtureToggle || (async () => false)}
                      onBrightness={onFixtureBrightness || (async () => false)}
                      onColorChange={onFixtureColor || (async () => false)}
                      onEdit={onFixtureUpdate ? handleEditFixture : undefined}
                      onDelete={onFixtureDelete}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Lights + Switches — 2-col side-by-side */}
      {(isSectionVisible('lights') || isSectionVisible('switches')) && (visibleLights.length > 0 || devices.switches.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {isSectionVisible('lights') && visibleLights.length > 0 && (
            <div>
              <SectionHeader
                icon={<Lightbulb style={{ width: 16, height: 16, color: '#adc6ff' }} />}
                label="Smart Lights"
              />
              <div className="relative group/lights">
                {canLightsScrollUp && (
                  <button
                    onClick={() => nudgeLightsColumn('up')}
                    className="absolute right-2 top-2 z-10 flex items-center justify-center rounded-full opacity-0 group-hover/lights:opacity-100 transition-all duration-150"
                    style={{ width: 28, height: 28, background: '#243356cc', color: '#adc6ff', border: '1px solid #2a3d6a' }}
                    title="Scroll up"
                  >
                    <ChevronLeft className="w-4 h-4" style={{ transform: 'rotate(90deg)' }} />
                  </button>
                )}
                {canLightsScrollDown && (
                  <button
                    onClick={() => nudgeLightsColumn('down')}
                    className="absolute right-2 bottom-2 z-10 flex items-center justify-center rounded-full opacity-0 group-hover/lights:opacity-100 transition-all duration-150"
                    style={{ width: 28, height: 28, background: '#243356cc', color: '#adc6ff', border: '1px solid #2a3d6a' }}
                    title="Scroll down"
                  >
                    <ChevronRight className="w-4 h-4" style={{ transform: 'rotate(90deg)' }} />
                  </button>
                )}
                <div
                  ref={lightsScrollRef}
                  className="no-scrollbar"
                  style={{ background: '#162040', borderRadius: 12, padding: '0 20px', maxHeight: 220, overflowY: 'auto', cursor: 'grab' }}
                  onMouseDown={e => {
                    const el = e.currentTarget;
                    el.style.cursor = 'grabbing';
                    const startY = e.pageY - el.offsetTop;
                    const startScroll = el.scrollTop;
                    const onMove = (ev: MouseEvent) => { el.scrollTop = startScroll - (ev.pageY - el.offsetTop - startY); };
                    const onUp = () => {
                      el.style.cursor = 'grab';
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                >
                {visibleLights.map((light, i) => {
                  const isOn = light.state === 'on';
                  const name = light.attributes.friendly_name || light.entity_id.split('.')[1];
                  return (
                    <div key={light.entity_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < visibleLights.length - 1 ? '1px solid #243356' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Lightbulb style={{ width: 16, height: 16, color: isOn ? '#f7be1d' : '#8892a4' }} />
                        <span style={{ fontSize: 15, fontWeight: 500, color: '#e2e8f0' }}>{name}</span>
                      </div>
                      <LightToggle on={isOn} onToggle={() => onToggle(light.entity_id)} />
                    </div>
                  );
                })}
                </div>
              </div>
            </div>
          )}
          {isSectionVisible('switches') && devices.switches.length > 0 && (
            <div>
              <SectionHeader
                icon={<Power style={{ width: 16, height: 16, color: '#adc6ff' }} />}
                label="Switches & Relays"
              />
              <div style={{ background: '#162040', borderRadius: 12, padding: '0 20px', maxHeight: 220, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#243356 transparent' }}>
                {devices.switches.map((device, i) => {
                  const isOn = device.state === 'on';
                  const name = device.attributes.friendly_name || device.entity_id.split('.')[1];
                  return (
                    <div key={device.entity_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < devices.switches.length - 1 ? '1px solid #243356' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Power style={{ width: 16, height: 16, color: isOn ? '#adc6ff' : '#8892a4' }} />
                        <span style={{ fontSize: 15, fontWeight: 500, color: '#e2e8f0' }}>{name}</span>
                      </div>
                      <LightToggle on={isOn} onToggle={() => onToggle(device.entity_id)} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Climate Control */}
      {isSectionVisible('climate') && devices.climate.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<Thermometer style={{ width: 16, height: 16, color: '#adc6ff' }} />}
            label="Climate Control"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {devices.climate.map(climate => (
              <ClimateCard
                key={climate.entity_id}
                climate={climate}
                onSetTemperature={onClimateTemperature}
              />
            ))}
          </div>
        </div>
      )}

      {/* Media Players */}
      {isSectionVisible('media') && devices.media_players.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader
            icon={<Music style={{ width: 16, height: 16, color: '#adc6ff' }} />}
            label="Media Players"
          />
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'thin', scrollbarColor: '#243356 transparent', cursor: 'grab' }}
            onMouseDown={e => {
              const el = e.currentTarget;
              el.style.cursor = 'grabbing';
              const startX = e.pageX - el.offsetLeft;
              const startScroll = el.scrollLeft;
              const onMove = (ev: MouseEvent) => { el.scrollLeft = startScroll - (ev.pageX - el.offsetLeft - startX); };
              const onUp = () => { el.style.cursor = 'grab'; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          >
            {devices.media_players.map(player => (
              <div key={player.entity_id} style={{ minWidth: 280, flexShrink: 0 }}>
              <MediaPlayerCard
                player={player}
                onAction={onMediaAction}
                onVolume={onMediaVolume}
              />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Surveillance */}
      {isSectionVisible('surveillance') && (
      <div style={{ marginBottom: 24 }}>
        <SectionHeader
          icon={<Camera style={{ width: 16, height: 16, color: '#adc6ff' }} />}
          label="Surveillance"
          extra={
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#ffb4ab', background: 'rgba(255,180,171,0.12)', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffb4ab', display: 'inline-block' }} /> REC
            </div>
          }
        />
        <CamerasSection defaultExpanded={true} hiddenCameraIds={hiddenCameras} />
      </div>
      )}

      {/* No devices message */}
      {visibleLights.length === 0 && devices.switches.length === 0 && devices.climate.length === 0 && devices.media_players.length === 0 && fixtures.length === 0 && (
        <div style={{ background: '#162040', borderRadius: 12, padding: '32px', textAlign: 'center' }}>
          <Home style={{ width: 48, height: 48, margin: '0 auto 16px', color: '#8892a4' }} />
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>No Devices Found</h2>
          <p style={{ color: '#8892a4', marginBottom: 16 }}>Add devices to Home Assistant to control them here.</p>
          <a href="http://192.168.50.39:8123/config/integrations" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: 'rgba(173,198,255,0.1)', color: '#adc6ff', border: '1px solid rgba(173,198,255,0.2)' }}>
            Add Integrations
          </a>
        </div>
      )}

      {/* Fixture Management Modal */}
      <FixtureManagement
        isOpen={fixtureModalOpen}
        onClose={handleCloseFixtureModal}
        fixture={editingFixture}
        availableLights={visibleLights}
        onCreate={handleCreateFixture}
        onUpdate={handleUpdateFixture}
      />
    </div>
  );
}
