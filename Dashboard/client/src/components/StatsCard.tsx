import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export function StatsCard({ title, icon, children }: StatsCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-primary">{icon}</div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
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

  const getColor = () => {
    if (color === 'primary') return 'bg-primary';
    if (color === 'success') return 'bg-success';
    if (color === 'warning') return 'bg-warning';
    if (color === 'destructive') return 'bg-destructive';
    return 'bg-primary';
  };

  const getDynamicColor = () => {
    if (percentage < 50) return 'bg-success';
    if (percentage < 80) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium text-foreground">{value.toFixed(1)}%</span>
        </div>
      )}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${color === 'primary' ? getDynamicColor() : getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
