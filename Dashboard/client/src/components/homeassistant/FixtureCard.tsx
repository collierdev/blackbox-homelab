import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { LightFixture, HALight, ColorValue } from '../../types';

interface FixtureCardProps {
  fixture: LightFixture;
  lights: HALight[];
  onToggle: (fixtureId: string) => Promise<boolean>;
  onBrightness: (fixtureId: string, brightness: number) => Promise<boolean>;
  onColorChange: (fixtureId: string, colorValue: ColorValue) => Promise<boolean>;
  onEdit?: (fixtureId: string) => void;
  onDelete?: (fixtureId: string) => Promise<boolean>;
}

const C = {
  bg: '#0b1326',
  l2: '#162040',
  l3: '#1c2a4a',
  l4: '#243356',
  blue: '#adc6ff',
  amber: '#f7be1d',
  green: '#22c55e',
  red: '#ffb4ab',
  text: '#e2e8f0',
  dim: '#c2c6d6',
  dimmer: '#8892a4',
};

const PRESETS = ['#fff8e1', '#e3f2fd', '#fce4ec', '#e8f5e9', '#ede7f6', '#ff6b6b', '#ffd166', '#06d6a0', '#118ab2', '#ffffff'];
const EFFECTS = ['Static', 'Breathe', 'Pulse', 'Strobe', 'Fade', 'Cycle'];

const Toggle = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
  <div
    onClick={() => onChange(!on)}
    style={{
      width: 44,
      height: 24,
      borderRadius: 12,
      cursor: 'pointer',
      background: on ? C.amber : C.l4,
      position: 'relative',
      transition: 'background 0.2s',
      boxShadow: on ? `0 0 12px ${C.amber}55` : 'none',
      flexShrink: 0,
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 3,
        left: on ? 23 : 3,
        width: 18,
        height: 18,
        borderRadius: 9,
        background: on ? C.bg : C.dimmer,
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      }}
    />
  </div>
);

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(rgb?: [number, number, number]): string {
  if (!rgb) return '#fff8e1';
  return `#${rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

export function FixtureCard({
  fixture, lights, onToggle, onBrightness, onColorChange
}: FixtureCardProps) {
  const [loading, setLoading] = useState(false);
  const [colorPanelOpen, setColorPanelOpen] = useState(false);
  const [effect, setEffect] = useState<string>('Static');

  const fixtureLights = lights.filter(l => fixture.lightIds.includes(l.entity_id));
  const anyOn = fixtureLights.some(l => l.state === 'on');
  const avgBrightness = fixtureLights.length > 0
    ? Math.round(fixtureLights.reduce((sum, l) => sum + (l.attributes.brightness || 0), 0) / fixtureLights.length)
    : 0;
  const brightnessPercent = Math.round((avgBrightness / 255) * 100);

  const firstOnLight = fixtureLights.find(l => l.state === 'on') || fixtureLights[0];
  const currentColorHex = rgbToHex(firstOnLight?.attributes.rgb_color as [number, number, number] | undefined);

  const handleToggle = async (to: boolean) => {
    setLoading(true);
    await onToggle(fixture.id);
    if (!to) setColorPanelOpen(false);
    setLoading(false);
  };
  const handleBrightnessChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBrightness = Math.round((parseInt(e.target.value) / 100) * 255);
    await onBrightness(fixture.id, newBrightness);
  };
  const handleColorChange = async (hex: string) => {
    const rgb = hexToRgb(hex);
    await onColorChange(fixture.id, { mode: 'rgb', rgb, brightness: avgBrightness });
  };

  return (
    <div
      style={{
        background: C.l2,
        borderRadius: 12,
        padding: 20,
        transition: 'all 0.2s',
        boxShadow: colorPanelOpen ? `0 0 0 1px ${currentColorHex}55, 0 8px 32px ${currentColorHex}22` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{fixture.name}</div>
        <div style={loading ? { opacity: 0.5 } : undefined}>
          <Toggle on={anyOn} onChange={handleToggle} />
        </div>
      </div>

      <div style={{ fontSize: 11, color: C.dimmer, letterSpacing: '0.06em', marginBottom: 16, fontFamily: "'Inter', sans-serif" }}>
        {(fixture.room || 'No room').toUpperCase()}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: anyOn ? currentColorHex : C.l4, border: `1.5px solid ${C.l4}`, flexShrink: 0 }} />
        <input
          className="fixture-neutral-slider"
          type="range"
          min="1"
          max="100"
          value={brightnessPercent}
          onChange={handleBrightnessChange}
          disabled={!anyOn}
          style={{ flex: 1, cursor: anyOn ? 'pointer' : 'default' }}
        />
        <span style={{ fontSize: 13, color: anyOn ? C.text : C.dimmer, minWidth: 30, textAlign: 'right' }}>{brightnessPercent}%</span>
      </div>

      <button
        onClick={() => anyOn && setColorPanelOpen(v => !v)}
        disabled={!anyOn}
        style={{
          width: '100%',
          borderRadius: 8,
          padding: 9,
          fontSize: 12,
          letterSpacing: '0.08em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          transition: 'all 0.2s',
          border: colorPanelOpen ? `1px solid ${currentColorHex}44` : '1px solid transparent',
          background: !anyOn ? C.l3 : colorPanelOpen ? `${currentColorHex}22` : C.l4,
          color: !anyOn ? C.dimmer : colorPanelOpen ? currentColorHex : C.blue,
          cursor: anyOn ? 'pointer' : 'default',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
        }}
      >
        <Sparkles size={14} />
        {`COLOR & EFFECTS ${colorPanelOpen ? '▲' : '▼'}`}
      </button>

      {colorPanelOpen && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${C.l4}`, paddingTop: 14 }}>
          <div style={{ fontSize: 11, color: C.dimmer, marginBottom: 8 }}>COLOR</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => void handleColorChange(p)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: 'none',
                  background: p,
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s',
                  boxShadow: currentColorHex.toLowerCase() === p.toLowerCase() ? `0 0 0 2px ${C.bg}, 0 0 0 4px ${p}` : 'none',
                }}
                title={p}
              />
            ))}
            <label style={{ width: 24, height: 24, borderRadius: '50%', background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)', position: 'relative', cursor: 'pointer' }}>
              <input
                type="color"
                value={currentColorHex}
                onChange={e => void handleColorChange(e.target.value)}
                style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }}
              />
            </label>
          </div>

          <div style={{ fontSize: 11, color: C.dimmer, marginBottom: 8 }}>COLOR TEMP</div>
          <div
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              const t = (e.clientX - rect.left) / rect.width;
              const stops = ['#ffe0a0', '#fff8e1', '#e3f2fd', '#bbdefb'];
              const idx = Math.max(0, Math.min(3, Math.round(t * 3)));
              void handleColorChange(stops[idx]);
            }}
            style={{
              height: 10,
              borderRadius: 5,
              marginBottom: 14,
              background: 'linear-gradient(to right, #ffe0a0, #fff8e1, #e3f2fd, #bbdefb)',
              cursor: 'pointer',
            }}
          />

          <div style={{ fontSize: 11, color: C.dimmer, marginBottom: 8 }}>EFFECT</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EFFECTS.map(name => (
              <button
                key={name}
                onClick={() => setEffect(name)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: effect === name ? `1px solid ${currentColorHex}55` : '1px solid transparent',
                  background: effect === name ? `${currentColorHex}33` : C.l3,
                  color: effect === name ? currentColorHex : C.dimmer,
                }}
              >
                {name}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14, borderRadius: 8, padding: 12, textAlign: 'center', background: anyOn ? `${currentColorHex}18` : C.l3, border: `1px solid ${currentColorHex}33` }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: currentColorHex, boxShadow: `0 0 20px ${currentColorHex}aa, 0 0 40px ${currentColorHex}55`, margin: '0 auto 6px' }} />
            <div style={{ fontSize: 11, color: C.dimmer }}>
              {effect} · {brightnessPercent}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
