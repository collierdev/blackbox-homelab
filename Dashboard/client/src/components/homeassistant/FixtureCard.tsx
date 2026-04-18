import { useState } from 'react';
import { Lightbulb, Sun, Settings, Trash2, Edit2, Check, X } from 'lucide-react';
import { EnhancedColorPicker } from '../shared/EnhancedColorPicker';
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

export function FixtureCard({
  fixture,
  lights,
  onToggle,
  onBrightness,
  onColorChange,
  onEdit,
  onDelete
}: FixtureCardProps) {
  const [loading, setLoading] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get aggregated state from lights
  const fixtureLights = lights.filter(l => fixture.lightIds.includes(l.entity_id));
  const anyOn = fixtureLights.some(l => l.state === 'on');

  // Calculate average brightness
  const avgBrightness = fixtureLights.length > 0
    ? Math.round(
        fixtureLights.reduce((sum, l) => sum + (l.attributes.brightness || 0), 0) /
        fixtureLights.length
      )
    : 0;
  const brightnessPercent = Math.round((avgBrightness / 255) * 100);

  // Get first light's color attributes for the color picker
  const firstOnLight = fixtureLights.find(l => l.state === 'on') || fixtureLights[0];
  const currentColor = firstOnLight?.attributes.rgb_color || [255, 255, 255];
  const currentHsColor = firstOnLight?.attributes.hs_color;
  const currentKelvin = firstOnLight?.attributes.color_temp_kelvin;
  const effectList = firstOnLight?.attributes.effect_list;
  const currentEffect = firstOnLight?.attributes.effect;

  // Determine supported color modes
  const supportedModes = firstOnLight?.attributes.supported_color_modes || [];
  const supportsHs = supportedModes.includes('hs') || supportedModes.includes('rgb');
  const supportsColorTemp = supportedModes.includes('color_temp');
  const supportsColor = supportsHs || supportsColorTemp;

  // Get min/max color temp
  const minKelvin = firstOnLight?.attributes.min_color_temp_kelvin || 2000;
  const maxKelvin = firstOnLight?.attributes.max_color_temp_kelvin || 6500;

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(fixture.id);
    setLoading(false);
  };

  const handleBrightnessChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBrightness = Math.round((parseInt(e.target.value) / 100) * 255);
    await onBrightness(fixture.id, newBrightness);
  };

  const handleColorChange = async (colorValue: ColorValue) => {
    await onColorChange(fixture.id, colorValue);
  };

  const handleDelete = async () => {
    if (onDelete) {
      setLoading(true);
      await onDelete(fixture.id);
      setLoading(false);
    }
    setShowDeleteConfirm(false);
  };

  // Icon based on fixture icon property
  const getIcon = () => {
    switch (fixture.icon) {
      case 'ceiling':
        return '💡';
      case 'chandelier':
        return '🪔';
      case 'floor':
        return '🏮';
      case 'table':
        return '🔦';
      case 'strip':
        return '✨';
      default:
        return null;
    }
  };

  const iconEmoji = getIcon();

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${anyOn ? 'bg-yellow-500/20 text-yellow-500' : 'bg-muted text-muted-foreground'}`}>
            {iconEmoji ? (
              <span className="text-xl">{iconEmoji}</span>
            ) : (
              <Lightbulb className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-sm">{fixture.name}</h3>
            <p className="text-xs text-muted-foreground">
              {anyOn ? `${brightnessPercent}% · ${fixtureLights.filter(l => l.state === 'on').length}/${fixtureLights.length} on` : `${fixtureLights.length} lights`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit/Delete buttons */}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 mr-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(fixture.id)}
                  className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  title="Edit fixture"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && !showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  title="Delete fixture"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {showDeleteConfirm && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive"
                    title="Confirm delete"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Toggle switch */}
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              anyOn ? 'bg-yellow-500' : 'bg-muted'
            } ${loading ? 'opacity-50' : ''}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                anyOn ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Controls when on */}
      {anyOn && (
        <div className="space-y-4">
          {/* Brightness slider */}
          <div className="flex items-center gap-3">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <input
              type="range"
              min="1"
              max="100"
              value={brightnessPercent}
              onChange={handleBrightnessChange}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
            <span className="text-xs text-muted-foreground w-8">{brightnessPercent}%</span>
          </div>

          {/* Color picker */}
          {supportsColor && (
            <div>
              <button
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-semibold w-full justify-center shadow-sm"
              >
                <Settings className="w-4 h-4" />
                {colorPickerOpen ? 'Hide Color Controls' : 'Color & Effects'}
              </button>

              {colorPickerOpen && (
                <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 shadow-lg">
                  <EnhancedColorPicker
                    value={{
                      mode: currentKelvin && !currentHsColor ? 'color_temp' : 'hs',
                      rgb: currentColor as [number, number, number],
                      hs: currentHsColor,
                      kelvin: currentKelvin,
                      brightness: avgBrightness
                    }}
                    onChange={handleColorChange}
                    supportedModes={[
                      ...(supportsHs ? ['hs' as const] : []),
                      ...(supportsColorTemp ? ['color_temp' as const] : [])
                    ]}
                    minKelvin={minKelvin}
                    maxKelvin={maxKelvin}
                    effects={effectList}
                    currentEffect={currentEffect}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Room badge */}
      {fixture.room && (
        <div className="mt-3 pt-3 border-t border-border">
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
            {fixture.room}
          </span>
        </div>
      )}
    </div>
  );
}
