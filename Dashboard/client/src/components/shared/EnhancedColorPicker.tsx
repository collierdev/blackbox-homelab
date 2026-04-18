import { useState, useCallback } from 'react';
import { Palette, Thermometer, Sun, Sparkles } from 'lucide-react';
import type { ColorMode, ColorValue } from '../../types';

interface EnhancedColorPickerProps {
  value: ColorValue;
  onChange: (value: ColorValue) => void;
  supportedModes?: ColorMode[];
  minKelvin?: number;
  maxKelvin?: number;
  effects?: string[];
  currentEffect?: string;
}

// Color conversion utilities
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

// Convert Kelvin to RGB for preview
function kelvinToRgb(kelvin: number): [number, number, number] {
  const temp = kelvin / 100;
  let r: number, g: number, b: number;

  if (temp <= 66) {
    r = 255;
    g = Math.min(255, Math.max(0, 99.4708025861 * Math.log(temp) - 161.1195681661));
  } else {
    r = Math.min(255, Math.max(0, 329.698727446 * Math.pow(temp - 60, -0.1332047592)));
    g = Math.min(255, Math.max(0, 288.1221695283 * Math.pow(temp - 60, -0.0755148492)));
  }

  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = Math.min(255, Math.max(0, 138.5177312231 * Math.log(temp - 10) - 305.0447927307));
  }

  return [Math.round(r), Math.round(g), Math.round(b)];
}

// Preset colors for quick selection
const PRESET_COLORS = [
  { name: 'Warm White', rgb: [255, 244, 229] as [number, number, number] },
  { name: 'Cool White', rgb: [255, 255, 255] as [number, number, number] },
  { name: 'Daylight', rgb: [255, 250, 244] as [number, number, number] },
  { name: 'Red', rgb: [255, 0, 0] as [number, number, number] },
  { name: 'Orange', rgb: [255, 165, 0] as [number, number, number] },
  { name: 'Yellow', rgb: [255, 255, 0] as [number, number, number] },
  { name: 'Green', rgb: [0, 255, 0] as [number, number, number] },
  { name: 'Cyan', rgb: [0, 255, 255] as [number, number, number] },
  { name: 'Blue', rgb: [0, 0, 255] as [number, number, number] },
  { name: 'Purple', rgb: [128, 0, 255] as [number, number, number] },
  { name: 'Magenta', rgb: [255, 0, 255] as [number, number, number] },
  { name: 'Pink', rgb: [255, 182, 193] as [number, number, number] },
];

// Color temperature presets
const TEMP_PRESETS = [
  { name: 'Candle', kelvin: 2000 },
  { name: 'Warm', kelvin: 2700 },
  { name: 'Soft', kelvin: 3000 },
  { name: 'Neutral', kelvin: 4000 },
  { name: 'Cool', kelvin: 5000 },
  { name: 'Daylight', kelvin: 6500 },
];

export function EnhancedColorPicker({
  value,
  onChange,
  supportedModes = ['hs', 'color_temp'],
  minKelvin = 2000,
  maxKelvin = 6500,
  effects = [],
  currentEffect = ''
}: EnhancedColorPickerProps) {
  const hasColorTemp = supportedModes.includes('color_temp');
  const hasColor = supportedModes.includes('hs') || supportedModes.includes('rgb');
  const hasEffects = effects.length > 0;

  // Local state for UI
  const [activeMode, setActiveMode] = useState<ColorMode>(value.mode || (hasColor ? 'hs' : 'color_temp'));
  const [hue, setHue] = useState(() => value.hs?.[0] ?? 0);
  const [saturation, setSaturation] = useState(() => value.hs?.[1] ?? 100);
  const [brightness, setBrightness] = useState(() =>
    Math.round(((value.brightness ?? 255) / 255) * 100)
  );
  const [kelvin, setKelvin] = useState(() => value.kelvin ?? 4000);
  const [selectedEffect, setSelectedEffect] = useState(currentEffect);

  // Get preview color for the current mode
  const getPreviewRgb = useCallback((): [number, number, number] => {
    if (activeMode === 'color_temp') {
      return kelvinToRgb(kelvin);
    }
    return hslToRgb(hue, saturation, 50);
  }, [activeMode, hue, saturation, kelvin]);

  // Handle mode change
  const handleModeChange = (mode: ColorMode) => {
    setActiveMode(mode);
    // Emit change with new mode
    if (mode === 'color_temp') {
      onChange({
        mode: 'color_temp',
        kelvin,
        brightness: Math.round((brightness / 100) * 255)
      });
    } else {
      onChange({
        mode: 'hs',
        hs: [hue, saturation],
        rgb: hslToRgb(hue, saturation, 50),
        brightness: Math.round((brightness / 100) * 255)
      });
    }
  };

  // Handle hue/saturation changes
  const handleHSChange = useCallback((newHue: number, newSat: number) => {
    setHue(newHue);
    setSaturation(newSat);
    onChange({
      mode: 'hs',
      hs: [newHue, newSat],
      rgb: hslToRgb(newHue, newSat, 50),
      brightness: Math.round((brightness / 100) * 255)
    });
  }, [brightness, onChange]);

  // Handle color temperature changes
  const handleColorTempChange = useCallback((newKelvin: number) => {
    setKelvin(newKelvin);
    onChange({
      mode: 'color_temp',
      kelvin: newKelvin,
      brightness: Math.round((brightness / 100) * 255)
    });
  }, [brightness, onChange]);

  // Handle brightness changes
  const handleBrightnessChange = useCallback((newBrightness: number) => {
    setBrightness(newBrightness);
    const brightnessValue = Math.round((newBrightness / 100) * 255);

    if (activeMode === 'color_temp') {
      onChange({
        mode: 'color_temp',
        kelvin,
        brightness: brightnessValue
      });
    } else {
      onChange({
        mode: 'hs',
        hs: [hue, saturation],
        rgb: hslToRgb(hue, saturation, 50),
        brightness: brightnessValue
      });
    }
  }, [activeMode, hue, saturation, kelvin, onChange]);

  // Handle preset color selection
  const handlePresetClick = useCallback((rgb: [number, number, number]) => {
    const [h, s] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    setHue(h);
    setSaturation(s);
    onChange({
      mode: 'hs',
      hs: [h, s],
      rgb,
      brightness: Math.round((brightness / 100) * 255)
    });
  }, [brightness, onChange]);

  const previewRgb = getPreviewRgb();
  const previewColor = `rgb(${previewRgb[0]}, ${previewRgb[1]}, ${previewRgb[2]})`;

  return (
    <div className="space-y-4">
      {/* Mode Tabs */}
      {hasColor && hasColorTemp && (
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button
            onClick={() => handleModeChange('hs')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeMode === 'hs' || activeMode === 'rgb'
                ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            Color
          </button>
          <button
            onClick={() => handleModeChange('color_temp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeMode === 'color_temp'
                ? 'bg-white dark:bg-gray-600 shadow-sm text-orange-600 dark:text-orange-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            Temperature
          </button>
        </div>
      )}

      {/* Color Preview */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-xl shadow-inner border-2 border-gray-200 dark:border-gray-600"
          style={{ backgroundColor: previewColor }}
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {activeMode === 'color_temp' ? `${kelvin}K` : `H: ${Math.round(hue)}° S: ${Math.round(saturation)}%`}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {activeMode === 'color_temp'
              ? (kelvin < 3500 ? 'Warm White' : kelvin > 5000 ? 'Cool White' : 'Neutral')
              : `RGB: ${previewRgb.join(', ')}`}
          </div>
        </div>
      </div>

      {/* Color Mode Content */}
      {(activeMode === 'hs' || activeMode === 'rgb') && hasColor && (
        <div className="space-y-4">
          {/* Hue Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Palette className="w-4 h-4" /> Hue
            </label>
            <input
              type="range"
              min="0"
              max="360"
              value={hue}
              onChange={(e) => handleHSChange(Number(e.target.value), saturation)}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right,
                  hsl(0, 100%, 50%),
                  hsl(60, 100%, 50%),
                  hsl(120, 100%, 50%),
                  hsl(180, 100%, 50%),
                  hsl(240, 100%, 50%),
                  hsl(300, 100%, 50%),
                  hsl(360, 100%, 50%))`
              }}
            />
          </div>

          {/* Saturation Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Saturation: {Math.round(saturation)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={saturation}
              onChange={(e) => handleHSChange(hue, Number(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right,
                  hsl(${hue}, 0%, 50%),
                  hsl(${hue}, 100%, 50%))`
              }}
            />
          </div>

          {/* Color Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quick Colors
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetClick(preset.rgb)}
                  className="w-8 h-8 rounded-lg shadow-sm border-2 border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: `rgb(${preset.rgb.join(',')})` }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Color Temperature Content */}
      {activeMode === 'color_temp' && hasColorTemp && (
        <div className="space-y-4">
          {/* Kelvin Slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Thermometer className="w-4 h-4" /> Color Temperature
            </label>
            <input
              type="range"
              min={minKelvin}
              max={maxKelvin}
              value={kelvin}
              onChange={(e) => handleColorTempChange(Number(e.target.value))}
              className="w-full h-3 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right,
                  rgb(255, 180, 107),
                  rgb(255, 228, 206),
                  rgb(255, 255, 255),
                  rgb(201, 226, 255))`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{minKelvin}K Warm</span>
              <span>{maxKelvin}K Cool</span>
            </div>
          </div>

          {/* Temperature Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Quick Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TEMP_PRESETS.filter(p => p.kelvin >= minKelvin && p.kelvin <= maxKelvin).map((preset) => {
                const rgb = kelvinToRgb(preset.kelvin);
                return (
                  <button
                    key={preset.name}
                    onClick={() => handleColorTempChange(preset.kelvin)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                      Math.abs(kelvin - preset.kelvin) < 200
                        ? 'ring-2 ring-blue-500 ring-offset-1'
                        : ''
                    }`}
                    style={{
                      backgroundColor: `rgb(${rgb.join(',')})`,
                      color: preset.kelvin > 4500 ? '#333' : '#fff'
                    }}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Brightness Slider (always visible) */}
      <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Sun className="w-4 h-4" /> Brightness: {brightness}%
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={brightness}
          onChange={(e) => handleBrightnessChange(Number(e.target.value))}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-300 to-yellow-400 dark:from-gray-600 dark:to-yellow-500"
        />
      </div>

      {/* Effects Dropdown (if supported) */}
      {hasEffects && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Effect
          </label>
          <select
            value={selectedEffect}
            onChange={(e) => setSelectedEffect(e.target.value)}
            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">None</option>
            {effects.map((effect) => (
              <option key={effect} value={effect}>
                {effect}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
