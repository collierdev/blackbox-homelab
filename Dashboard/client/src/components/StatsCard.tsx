import type { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  icon: ReactNode;
  value: string;
  unit?: string;
  accentColor?: string;
  progress?: number; // 0-100
  progressColor?: string;
  progressGlow?: string;
  subtext?: string;
  /** Legacy support — children rendered below the value */
  children?: ReactNode;
  /** Legacy support — title alias */
  title?: string;
}

export function StatsCard({
  label,
  title,
  icon,
  value,
  unit,
  accentColor = '#adc6ff',
  progress,
  progressColor,
  progressGlow,
  subtext,
  children,
}: StatsCardProps) {
  const displayLabel = label || title || '';
  const fillColor = progressColor || accentColor;
  const glowColor = progressGlow || accentColor;

  return (
    <div
      className="rounded-xl flex-1 min-w-0 relative overflow-hidden"
      style={{ background: '#162040', padding: '20px 24px' }}
    >
      {/* Label + icon row */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="uppercase tracking-widest font-medium"
          style={{ fontSize: '11px', color: '#8892a4', letterSpacing: '0.1em' }}
        >
          {displayLabel}
        </span>
        <div style={{ color: '#8892a4' }}>{icon}</div>
      </div>

      {/* Big value */}
      <div className="flex items-baseline gap-1.5 mb-3">
        <span
          className="font-bold leading-none"
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: '42px',
            color: '#e2e8f0',
          }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="font-semibold"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '18px',
              color: accentColor,
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div
          className="rounded-full overflow-hidden mb-2"
          style={{ height: '4px', background: '#243356' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(progress, 100)}%`,
              background: fillColor,
              boxShadow: `0 0 8px ${glowColor}88`,
            }}
          />
        </div>
      )}

      {/* Sub-text */}
      {subtext && (
        <div style={{ fontSize: '11px', color: '#8892a4' }}>{subtext}</div>
      )}

      {/* Legacy children (e.g. old stat details) */}
      {children}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = 'primary',
  showLabel = true,
  label
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorMap: Record<string, { fill: string; glow: string }> = {
    primary: { fill: '#adc6ff', glow: '#adc6ff' },
    success: { fill: '#22c55e', glow: '#22c55e' },
    warning: { fill: '#f7be1d', glow: '#f7be1d' },
    destructive: { fill: '#ffb4ab', glow: '#ffb4ab' },
  };

  const getDynamicColors = () => {
    if (percentage < 50) return colorMap.success;
    if (percentage < 80) return colorMap.warning;
    return colorMap.destructive;
  };

  const { fill, glow } = color === 'primary' ? getDynamicColors() : (colorMap[color] || colorMap.primary);

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span style={{ color: '#8892a4' }}>{label}</span>
          <span className="font-medium" style={{ color: '#e2e8f0' }}>{value.toFixed(1)}%</span>
        </div>
      )}
      <div
        className="rounded-full overflow-hidden"
        style={{ height: '4px', background: '#243356' }}
      >
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${percentage}%`,
            background: fill,
            boxShadow: `0 0 8px ${glow}88`,
          }}
        />
      </div>
    </div>
  );
}
