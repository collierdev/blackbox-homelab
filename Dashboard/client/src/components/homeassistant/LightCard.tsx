import { useState } from 'react';
import { supportsColor } from '../../utils/lightCapabilities';
import type { HALight } from '../../types';

const PRESETS = ['#fff8e1','#e3f2fd','#fce4ec','#e8f5e9','#ede7f6','#ff6b6b','#ffd166','#06d6a0','#118ab2','#ffffff'];
const EFFECTS = ['Static','Breathe','Pulse','Strobe','Fade','Cycle'];

function Toggle({ on, onChange, loading }: { on: boolean; onChange: () => void; loading: boolean }) {
  return (
    <div
      onClick={!loading ? onChange : undefined}
      style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#f7be1d' : '#243356', boxShadow: on ? '0 0 12px #f7be1d55' : 'none', display: 'flex', alignItems: 'center', padding: '0 3px', cursor: loading ? 'default' : 'pointer', transition: 'background 0.2s, box-shadow 0.2s', opacity: loading ? 0.5 : 1, flexShrink: 0 }}
    >
      <div style={{ width: 18, height: 18, borderRadius: 9, background: on ? '#0b1326' : '#8892a4', marginLeft: on ? 20 : 0, transition: 'margin 0.2s, background 0.2s' }} />
    </div>
  );
}

function rgbToHex(rgb: [number, number, number]): string {
  return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
}

function extractRoom(entityId: string): string {
  const name = entityId.replace(/^\w+\./, '');
  const parts = name.split('_').filter(p => !['light', 'lamp', 'lights', 'bulb'].includes(p));
  const room = parts.slice(0, -1);
  return (room.length > 0 ? room : parts).join(' ').toUpperCase();
}

interface LightCardProps {
  light: HALight;
  onToggle: (entityId: string) => Promise<boolean>;
  onBrightness: (entityId: string, brightness: number) => Promise<boolean>;
  onColor?: (entityId: string, rgb: [number, number, number]) => Promise<boolean>;
}

export function LightCard({ light, onToggle, onBrightness, onColor }: LightCardProps) {
  const [loading, setLoading] = useState(false);
  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const [activeEffect, setActiveEffect] = useState('Static');

  const isOn = light.state === 'on';
  const brightness = light.attributes.brightness || 0;
  const brightnessPercent = Math.round((brightness / 255) * 100);
  const friendlyName = light.attributes.friendly_name || light.entity_id.split('.')[1];
  const room = (light.attributes as { area_name?: string }).area_name?.toUpperCase() || extractRoom(light.entity_id);
  const showColorPicker = supportsColor(light);
  const currentRgb = (light.attributes.rgb_color as [number, number, number]) || [255, 255, 255];
  const currentHex = rgbToHex(currentRgb);

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(light.entity_id);
    setLoading(false);
  };

  const handleBrightness = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await onBrightness(light.entity_id, Math.round((parseInt(e.target.value) / 100) * 255));
  };

  const handleColor = async (rgb: [number, number, number]) => {
    if (onColor) await onColor(light.entity_id, rgb);
  };

  const handlePresetHex = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    handleColor([r, g, b]);
  };

  return (
    <div style={{
      background: '#162040', borderRadius: 12, padding: '20px', transition: 'all 0.2s',
      border: '1px solid #243356',
      boxShadow: colorPanelOpen && isOn ? `0 0 0 1px ${currentHex}55, 0 8px 32px ${currentHex}22` : 'none',
    }}>
      {/* Header: name + toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 16, color: '#e2e8f0' }}>{friendlyName}</span>
        <Toggle on={isOn} onChange={handleToggle} loading={loading} />
      </div>

      {/* Room label */}
      <div style={{ fontSize: 11, color: '#8892a4', letterSpacing: '0.06em', marginBottom: 16 }}>{room}</div>

      {/* Brightness row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 20, height: 20, borderRadius: 10, background: isOn ? currentHex : '#243356', border: '1.5px solid #243356', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <input
            type="range" min={0} max={100} value={brightnessPercent}
            onChange={handleBrightness} disabled={!isOn}
            style={{ width: '100%', accentColor: isOn ? currentHex : '#8892a4', cursor: isOn ? 'pointer' : 'default' }}
          />
        </div>
        <span style={{ fontSize: 13, color: isOn ? '#e2e8f0' : '#8892a4', minWidth: 30, textAlign: 'right' }}>{brightnessPercent}%</span>
      </div>

      {/* COLOR & EFFECTS button */}
      {showColorPicker && (
        <>
          <button
            onClick={() => isOn && setColorPanelOpen(!colorPanelOpen)}
            style={{
              width: '100%', background: colorPanelOpen ? `${currentHex}22` : isOn ? '#243356' : '#1c2a4a',
              borderRadius: 8, padding: '9px', fontSize: 12, letterSpacing: '0.08em',
              color: colorPanelOpen ? currentHex : isOn ? '#adc6ff' : '#8892a4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              border: `1px solid ${colorPanelOpen ? currentHex + '44' : 'transparent'}`,
              transition: 'all 0.2s', cursor: isOn ? 'pointer' : 'default',
            }}
          >
            ★ COLOR &amp; EFFECTS {colorPanelOpen ? '▲' : '▼'}
          </button>

          {colorPanelOpen && isOn && (
            <div style={{ marginTop: 14, borderTop: '1px solid #243356', paddingTop: 14 }}>
              {/* Color presets */}
              <div style={{ fontSize: 11, color: '#8892a4', letterSpacing: '0.06em', marginBottom: 8 }}>COLOR</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {PRESETS.map(p => (
                  <div key={p} onClick={() => handlePresetHex(p)}
                    style={{ width: 24, height: 24, borderRadius: 12, background: p, cursor: 'pointer',
                      boxShadow: currentHex === p ? `0 0 0 2px #0b1326, 0 0 0 4px ${p}` : 'none',
                      transition: 'box-shadow 0.15s', flexShrink: 0 }} />
                ))}
                <label style={{ width: 24, height: 24, borderRadius: 12, background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)', cursor: 'pointer', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  <input type="color" value={currentHex} onChange={e => handlePresetHex(e.target.value)}
                    style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                </label>
              </div>

              {/* Color temp */}
              <div style={{ fontSize: 11, color: '#8892a4', letterSpacing: '0.06em', marginBottom: 8 }}>COLOR TEMP</div>
              <div
                style={{ height: 10, borderRadius: 5, marginBottom: 14, background: 'linear-gradient(to right, #ffe0a0, #fff8e1, #e3f2fd, #bbdefb)', cursor: 'pointer' }}
                onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const t = (e.clientX - rect.left) / rect.width;
                  const temps: [number, number, number][] = [[255,224,160],[255,248,225],[227,242,253],[187,222,251]];
                  handleColor(temps[Math.min(Math.round(t * 3), 3)]);
                }}
              />

              {/* Effects */}
              <div style={{ fontSize: 11, color: '#8892a4', letterSpacing: '0.06em', marginBottom: 8 }}>EFFECT</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {EFFECTS.map(ef => (
                  <button key={ef} onClick={() => setActiveEffect(ef)}
                    style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                      background: activeEffect === ef ? `${currentHex}33` : '#1c2a4a',
                      color: activeEffect === ef ? currentHex : '#8892a4',
                      border: `1px solid ${activeEffect === ef ? currentHex + '55' : 'transparent'}`,
                      transition: 'all 0.15s', cursor: 'pointer' }}>
                    {ef}
                  </button>
                ))}
              </div>

              {/* Preview swatch */}
              <div style={{ borderRadius: 8, padding: '12px', textAlign: 'center', background: `${currentHex}18`, border: `1px solid ${currentHex}33` }}>
                <div style={{ display: 'inline-block', width: 40, height: 40, borderRadius: 20, background: currentHex, boxShadow: `0 0 20px ${currentHex}aa, 0 0 40px ${currentHex}55`, marginBottom: 6 }} />
                <div style={{ fontSize: 11, color: '#8892a4' }}>{activeEffect} · {brightnessPercent}%</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
