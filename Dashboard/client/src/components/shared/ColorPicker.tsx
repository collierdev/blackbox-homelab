import { useState, useEffect } from 'react';
import { Palette, Pipette } from 'lucide-react';

interface ColorPickerProps {
  color: string; // Hex color like "#EF4444"
  onChange: (color: string) => void;
  showPresets?: boolean;
  presetColors?: string[];
  label?: string;
}

const DEFAULT_PRESETS = [
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#10B981', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#A855F7', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#64748B', // Slate
  '#78716C', // Stone
  '#000000', // Black
];

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export default function ColorPicker({
  color,
  onChange,
  showPresets = true,
  presetColors = DEFAULT_PRESETS,
  label = 'Choose Color',
}: ColorPickerProps) {
  const [rgb, setRgb] = useState<[number, number, number]>(hexToRgb(color));
  const [hsl, setHsl] = useState<[number, number, number]>(rgbToHsl(...hexToRgb(color)));
  const [hexInput, setHexInput] = useState(color.toUpperCase());
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const newRgb = hexToRgb(color);
    setRgb(newRgb);
    setHsl(rgbToHsl(...newRgb));
    setHexInput(color.toUpperCase());
  }, [color]);

  const updateColor = (newRgb: [number, number, number]) => {
    setRgb(newRgb);
    const newHsl = rgbToHsl(...newRgb);
    setHsl(newHsl);
    const hex = rgbToHex(...newRgb);
    setHexInput(hex.toUpperCase());
    onChange(hex);
  };

  const handleHueChange = (newHue: number) => {
    const [, s, l] = hsl;
    const newRgb = hslToRgb(newHue, s, l);
    updateColor(newRgb);
  };

  const handleSaturationChange = (newSaturation: number) => {
    const [h, , l] = hsl;
    const newRgb = hslToRgb(h, newSaturation, l);
    updateColor(newRgb);
  };

  const handleLightnessChange = (newLightness: number) => {
    const [h, s] = hsl;
    const newRgb = hslToRgb(h, s, newLightness);
    updateColor(newRgb);
  };

  const handleHexInput = (value: string) => {
    setHexInput(value);
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      const newRgb = hexToRgb(value);
      setRgb(newRgb);
      setHsl(rgbToHsl(...newRgb));
      onChange(value);
    }
  };

  const handlePresetClick = (presetColor: string) => {
    const newRgb = hexToRgb(presetColor);
    updateColor(newRgb);
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{label}</span>
        </div>
      )}

      {/* Color Preview and Hex Input */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: rgbToHex(...rgb) }}
        />
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Hex Color
          </label>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#000000"
            maxLength={7}
          />
        </div>
      </div>

      {/* Hue Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Hue</label>
          <span className="text-xs font-mono text-gray-500 dark:text-gray-500">{Math.round(hsl[0])}°</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="360"
            value={hsl[0]}
            onChange={(e) => handleHueChange(parseFloat(e.target.value))}
            className="w-full color-slider"
            style={{
              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
            }}
          />
        </div>
      </div>

      {/* Saturation Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Saturation</label>
          <span className="text-xs font-mono text-gray-500 dark:text-gray-500">{Math.round(hsl[1])}%</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={hsl[1]}
            onChange={(e) => handleSaturationChange(parseFloat(e.target.value))}
            className="w-full color-slider"
            style={{
              background: `linear-gradient(to right, hsl(${hsl[0]}, 0%, ${hsl[2]}%), hsl(${hsl[0]}, 100%, ${hsl[2]}%))`,
            }}
          />
        </div>
      </div>

      {/* Lightness Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Lightness</label>
          <span className="text-xs font-mono text-gray-500 dark:text-gray-500">{Math.round(hsl[2])}%</span>
        </div>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            value={hsl[2]}
            onChange={(e) => handleLightnessChange(parseFloat(e.target.value))}
            className="w-full color-slider"
            style={{
              background: `linear-gradient(to right, hsl(${hsl[0]}, ${hsl[1]}%, 0%), hsl(${hsl[0]}, ${hsl[1]}%, 50%), hsl(${hsl[0]}, ${hsl[1]}%, 100%))`,
            }}
          />
        </div>
      </div>

      {/* Advanced RGB Controls Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Pipette className="w-3 h-3" />
        {showAdvanced ? 'Hide' : 'Show'} RGB Values
      </button>

      {/* RGB Inputs */}
      {showAdvanced && (
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
          <div>
            <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1">R</label>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb[0]}
              onChange={(e) => updateColor([parseInt(e.target.value) || 0, rgb[1], rgb[2]])}
              className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-green-600 dark:text-green-400 mb-1">G</label>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb[1]}
              onChange={(e) => updateColor([rgb[0], parseInt(e.target.value) || 0, rgb[2]])}
              className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">B</label>
            <input
              type="number"
              min="0"
              max="255"
              value={rgb[2]}
              onChange={(e) => updateColor([rgb[0], rgb[1], parseInt(e.target.value) || 0])}
              className="w-full px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Preset Colors */}
      {showPresets && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Quick Presets</label>
          <div className="grid grid-cols-8 gap-2">
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                onClick={() => handlePresetClick(presetColor)}
                className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 hover:shadow-lg ${
                  presetColor.toUpperCase() === hexInput
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                style={{ backgroundColor: presetColor }}
                title={presetColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
