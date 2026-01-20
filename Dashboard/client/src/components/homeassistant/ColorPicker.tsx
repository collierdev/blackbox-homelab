import { useRef, useEffect, useState } from 'react';

interface ColorPickerProps {
  rgb: [number, number, number];
  onChange: (rgb: [number, number, number]) => void;
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

  return [
    h * 360,
    s * 100,
    l * 100,
  ];
}

export function ColorPicker({ rgb, onChange }: ColorPickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hsl, setHsl] = useState(() => rgbToHsl(rgb[0], rgb[1], rgb[2]));

  const CANVAS_SIZE = 200;
  const CENTER = CANVAS_SIZE / 2;
  const RADIUS = 80;

  // Draw the color wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw color wheel
    const imageData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
    const data = imageData.data;

    for (let y = 0; y < CANVAS_SIZE; y++) {
      for (let x = 0; x < CANVAS_SIZE; x++) {
        const dx = x - CENTER;
        const dy = y - CENTER;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= RADIUS) {
          const angle = Math.atan2(dy, dx);
          let hueAngle = (angle * 180) / Math.PI + 180;
          const saturation = Math.min((distance / RADIUS) * 100, 100);

          const [r, g, b] = hslToRgb(hueAngle, saturation, 50);

          const index = (y * CANVAS_SIZE + x) * 4;
          data[index] = r;
          data[index + 1] = g;
          data[index + 2] = b;
          data[index + 3] = 255;
        } else {
          // Transparent outside circle
          const index = (y * CANVAS_SIZE + x) * 4;
          data[index + 3] = 0;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Draw current color indicator
    const [h, s] = hsl;
    const angle = (h * Math.PI) / 180 - Math.PI / 2;
    const saturationRadius = (s / 100) * RADIUS;
    const pointerX = CENTER + saturationRadius * Math.cos(angle);
    const pointerY = CENTER + saturationRadius * Math.sin(angle);

    // Draw circle outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pointerX, pointerY, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pointerX, pointerY, 8, 0, Math.PI * 2);
    ctx.stroke();
  }, [hsl]);

  const handleColorChange = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - CENTER;
    const dy = y - CENTER;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= RADIUS) {
      const angle = Math.atan2(dy, dx);
      let newHue = (angle * 180) / Math.PI + 180;
      if (newHue < 0) newHue += 360;
      if (newHue >= 360) newHue -= 360;

      const newSaturation = Math.min((distance / RADIUS) * 100, 100);

      const newHsl: [number, number, number] = [newHue, newSaturation, 50];
      setHsl(newHsl);

      const newRgb = hslToRgb(newHue, newSaturation, 50);
      onChange(newRgb);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleColorChange(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      handleColorChange(e);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="rounded-full cursor-crosshair border border-border shadow-lg"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
      />
      <div className="flex items-center gap-3 w-full">
        <div
          className="w-12 h-12 rounded-lg border border-border shadow-sm"
          style={{
            backgroundColor: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
          }}
        />
        <div className="text-xs text-muted-foreground">
          <div>RGB: {rgb[0]}, {rgb[1]}, {rgb[2]}</div>
          <div>H: {Math.round(hsl[0])}° S: {Math.round(hsl[1])}%</div>
        </div>
      </div>
    </div>
  );
}
