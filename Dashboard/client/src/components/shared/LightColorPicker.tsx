import { useState } from 'react';
import ColorPicker from './ColorPicker';

interface LightColorPickerProps {
  rgb: [number, number, number];
  onChange: (rgb: [number, number, number]) => void;
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [255, 255, 255];
}

const LIGHT_PRESETS = [
  '#FFFFFF', // Warm White
  '#FFE4B5', // Soft White
  '#FFDAB9', // Peach
  '#FFCCCC', // Soft Pink
  '#FFB6C1', // Light Pink
  '#FF69B4', // Hot Pink
  '#FF0000', // Red
  '#FF4500', // Orange Red
  '#FFA500', // Orange
  '#FFD700', // Gold
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#00FFFF', // Cyan
  '#1E90FF', // Dodger Blue
  '#0000FF', // Blue
  '#8B00FF', // Electric Purple
];

export default function LightColorPicker({ rgb, onChange }: LightColorPickerProps) {
  const [hexColor, setHexColor] = useState(rgbToHex(rgb[0], rgb[1], rgb[2]));

  const handleColorChange = (newHex: string) => {
    setHexColor(newHex);
    const newRgb = hexToRgb(newHex);
    onChange(newRgb);
  };

  return (
    <ColorPicker
      color={hexColor}
      onChange={handleColorChange}
      showPresets={true}
      presetColors={LIGHT_PRESETS}
      label="Light Color"
    />
  );
}
