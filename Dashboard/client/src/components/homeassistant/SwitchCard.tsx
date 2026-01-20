import { useState } from 'react';
import { Power } from 'lucide-react';
import type { HASwitch } from '../../types';

interface SwitchCardProps {
  device: HASwitch;
  onToggle: (entityId: string) => Promise<boolean>;
}

export function SwitchCard({ device, onToggle }: SwitchCardProps) {
  const [loading, setLoading] = useState(false);
  const isOn = device.state === 'on';
  const friendlyName = device.attributes.friendly_name || device.entity_id.split('.')[1];

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(device.entity_id);
    setLoading(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOn ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{friendlyName}</h3>
            <p className="text-xs text-muted-foreground">
              {isOn ? 'On' : 'Off'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isOn ? 'bg-success' : 'bg-muted'
          } ${loading ? 'opacity-50' : ''}`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              isOn ? 'left-7' : 'left-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
