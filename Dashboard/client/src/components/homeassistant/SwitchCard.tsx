import { useState } from 'react';
import { Power } from 'lucide-react';
import type { HASwitch } from '../../types';

interface SwitchCardProps {
  device: HASwitch;
  onToggle: (entityId: string) => Promise<boolean>;
  isLast?: boolean;
}

function Toggle({ on, onChange, loading }: { on: boolean; onChange: () => void; loading: boolean }) {
  return (
    <div
      onClick={!loading ? onChange : undefined}
      style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#f7be1d' : '#243356', boxShadow: on ? '0 0 12px #f7be1d55' : 'none', display: 'flex', alignItems: 'center', padding: '0 3px', cursor: loading ? 'default' : 'pointer', transition: 'background 0.2s, box-shadow 0.2s', opacity: loading ? 0.5 : 1, flexShrink: 0 }}
    >
      <div style={{ width: 18, height: 18, borderRadius: 9, background: on ? '#0b1326' : '#8892a4', marginLeft: on ? 20 : 0, transition: 'margin 0.2s, background 0.2s' }} />
    </div>
  );
}

export function SwitchCard({ device, onToggle, isLast = false }: SwitchCardProps) {
  const [loading, setLoading] = useState(false);
  const isOn = device.state === 'on';
  const friendlyName = device.attributes.friendly_name || device.entity_id.split('.')[1];

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(device.entity_id);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: isLast ? 'none' : '1px solid #243356' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Power style={{ width: 16, height: 16, color: isOn ? '#adc6ff' : '#8892a4' }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#e2e8f0' }}>{friendlyName}</div>
          <div style={{ fontSize: 11, color: '#8892a4', letterSpacing: '0.06em' }}>{isOn ? 'ON' : 'STANDBY'}</div>
        </div>
      </div>
      <Toggle on={isOn} onChange={handleToggle} loading={loading} />
    </div>
  );
}
