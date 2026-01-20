import { useState } from 'react';
import { Lightbulb, Sun, Palette } from 'lucide-react';
import LightColorPicker from '../shared/LightColorPicker';
import { supportsColor } from '../../utils/lightCapabilities';
import type { HALight } from '../../types';

interface LightCardProps {
  light: HALight;
  onToggle: (entityId: string) => Promise<boolean>;
  onBrightness: (entityId: string, brightness: number) => Promise<boolean>;
  onColor?: (entityId: string, rgb: [number, number, number]) => Promise<boolean>;
}

export function LightCard({ light, onToggle, onBrightness, onColor }: LightCardProps) {
  const [loading, setLoading] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const isOn = light.state === 'on';
  const brightness = light.attributes.brightness || 0;
  const brightnessPercent = Math.round((brightness / 255) * 100);
  const friendlyName = light.attributes.friendly_name || light.entity_id.split('.')[1];
  const showColorPicker = supportsColor(light);
  const currentColor = light.attributes.rgb_color || [255, 255, 255];

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(light.entity_id);
    setLoading(false);
  };

  const handleBrightnessChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBrightness = Math.round((parseInt(e.target.value) / 100) * 255);
    await onBrightness(light.entity_id, newBrightness);
  };

  const handleColorChange = async (rgb: [number, number, number]) => {
    if (onColor) {
      await onColor(light.entity_id, rgb);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOn ? 'bg-yellow-500/20 text-yellow-500' : 'bg-muted text-muted-foreground'}`}>
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{friendlyName}</h3>
            <p className="text-xs text-muted-foreground">
              {isOn ? `${brightnessPercent}% brightness` : 'Off'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isOn ? 'bg-yellow-500' : 'bg-muted'
          } ${loading ? 'opacity-50' : ''}`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              isOn ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>

      {isOn && (
        <div className="space-y-4">
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

          {showColorPicker && (
            <div>
              <button
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-semibold w-full justify-center shadow-sm"
              >
                <Palette className="w-4 h-4" />
                {colorPickerOpen ? 'Hide Color Picker' : 'Choose Color'}
              </button>
              {colorPickerOpen && (
                <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600 shadow-lg">
                  <LightColorPicker
                    rgb={currentColor}
                    onChange={handleColorChange}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
