import { Cpu, MemoryStick, HardDrive, Thermometer, Clock, Network, Lightbulb, Wind, Lock, Droplet } from 'lucide-react';
import type { SystemStats as Stats, HADevices, HAStatus } from '../types';
import { StatsCard } from './StatsCard';
import { Services } from './Services';
import { CamerasSection } from './go2rtc/CamerasSection';

interface SystemStatsProps {
  stats: Stats | null;
  haDevices?: HADevices | null;
  haStatus?: HAStatus;
  hiddenCameraIds?: string[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptimeStr(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function SystemStats({ stats, haDevices, haStatus, hiddenCameraIds = [] }: SystemStatsProps) {
  if (!stats) {
    return (
      <div className="h-full overflow-y-auto" style={{ padding: '28px 32px' }}>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-1 rounded-xl animate-pulse" style={{ background: '#162040', height: '120px' }} />
          ))}
        </div>
      </div>
    );
  }

  const cpuUsage = stats.cpu.usage;
  const memUsage = stats.memory.usedPercent;
  const diskUsage = stats.disk.usedPercent;
  const temp = stats.cpu.temperature;
  const uptimeStr = formatUptimeStr(stats.uptime);

  const cpuColor = cpuUsage < 50 ? '#22c55e' : cpuUsage < 80 ? '#f7be1d' : '#ffb4ab';
  const memColor = memUsage < 50 ? '#22c55e' : memUsage < 80 ? '#f7be1d' : '#ffb4ab';
  const diskColor = diskUsage < 50 ? '#22c55e' : diskUsage < 80 ? '#f7be1d' : '#ffb4ab';
  const tempColor = temp < 50 ? '#22c55e' : temp < 70 ? '#f7be1d' : '#ffb4ab';

  const lightsOn = haDevices?.lights?.filter(l => l.state === 'on').length || 0;
  const mediaPlaying = haDevices?.media_players?.filter(m => m.state === 'playing').length || 0;
  const climateStat = haDevices?.climate?.[0]?.attributes?.temperature
    ? `${haDevices.climate[0].attributes.temperature}°`
    : '--';
  const switchesOn = haDevices?.switches?.filter(s => s.state === 'on').length || 0;

  const networkInterfaces = stats.network?.interfaces || [];

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100%' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '28px', fontWeight: 800, marginBottom: '4px', color: '#e2e8f0' }}>Pi Dashboard</h1>
          <div style={{ fontSize: '12px', color: '#8892a4', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Blackbox Environment</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#162040', borderRadius: '8px', padding: '8px 16px' }}>
          <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '4px', background: haStatus?.connected !== false ? '#22c55e' : '#ffb4ab', boxShadow: `0 0 6px ${haStatus?.connected !== false ? '#22c55e' : '#ffb4ab'}` }} />
          <span style={{ fontSize: '13px', color: haStatus?.connected !== false ? '#22c55e' : '#ffb4ab', fontWeight: 600, letterSpacing: '0.04em' }}>{haStatus?.connected !== false ? 'CONNECTED' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* 5 stat cards */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <StatsCard
          label="CPU Usage"
          icon={<Cpu className="w-[18px] h-[18px]" />}
          value={cpuUsage.toFixed(0)}
          unit="%"
          accentColor={cpuColor}
          progress={cpuUsage}
          progressColor={cpuColor}
          subtext={`${stats.cpu.cores} cores · ${stats.cpu.speed} GHz`}
        />
        <StatsCard
          label="Memory"
          icon={<MemoryStick className="w-[18px] h-[18px]" />}
          value={memUsage.toFixed(0)}
          unit="%"
          accentColor={memColor}
          progress={memUsage}
          progressColor={memColor}
          subtext={`${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total)}`}
        />
        <StatsCard
          label="Disk I/O"
          icon={<HardDrive className="w-[18px] h-[18px]" />}
          value={diskUsage.toFixed(0)}
          unit="%"
          accentColor={diskColor}
          progress={diskUsage}
          progressColor={diskColor}
          subtext={`${formatBytes(stats.disk.used)} / ${formatBytes(stats.disk.total)}`}
        />
        <StatsCard
          label="Core Temp"
          icon={<Thermometer className="w-[18px] h-[18px]" />}
          value={temp.toFixed(1)}
          unit="°C"
          accentColor={tempColor}
          progress={(temp / 100) * 100}
          progressColor={tempColor}
          subtext="CPU Temperature"
        />
        {/* Uptime card */}
        <div style={{ background: '#1c2a4a', borderRadius: '12px', padding: '20px 24px', flex: 1 }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#f7be1d', textTransform: 'uppercase', fontWeight: 500, marginBottom: '8px' }}>System Uptime</div>
          <Clock style={{ width: '22px', height: '22px', color: '#f7be1d' }} />
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 800, marginTop: '8px', color: '#e2e8f0' }}>
            {uptimeStr}
          </div>
          <div style={{ fontSize: '11px', color: '#8892a4', marginTop: '6px' }}>{stats.platform}</div>
        </div>
      </div>

      {/* 2-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, overflow: 'hidden' }}>
          <Services />
          <CamerasSection defaultExpanded={true} hiddenCameraIds={hiddenCameraIds} />
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          {/* Smart Home State */}
          <div style={{ background: '#162040', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.08em', color: '#8892a4', textTransform: 'uppercase', fontWeight: 500, marginBottom: '14px' }}>Smart Home State</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'LIGHTS ON', val: String(lightsOn), color: '#f7be1d', icon: <Lightbulb style={{ width: '20px', height: '20px' }} /> },
                { label: 'CLIMATE', val: climateStat, color: '#adc6ff', icon: <Wind style={{ width: '20px', height: '20px' }} /> },
                { label: 'SWITCHES ON', val: String(switchesOn), color: '#adc6ff', icon: <Lock style={{ width: '20px', height: '20px' }} /> },
                { label: 'MEDIA', val: mediaPlaying > 0 ? String(mediaPlaying) : 'IDLE', color: '#22c55e', icon: <Droplet style={{ width: '20px', height: '20px' }} /> },
              ].map(x => (
                <div key={x.label} style={{ background: '#1c2a4a', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ color: x.color, display: 'flex', justifyContent: 'center' }}>{x.icon}</div>
                  <div style={{ fontSize: '10px', color: '#8892a4', letterSpacing: '0.06em', marginTop: '6px', marginBottom: '4px' }}>{x.label}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '20px', fontWeight: 700, color: x.color }}>{x.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Network Interfaces */}
          <div style={{ background: '#162040', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Network style={{ width: '14px', height: '14px', color: '#8892a4' }} />
              <span style={{ fontSize: '12px', letterSpacing: '0.08em', color: '#8892a4', textTransform: 'uppercase', fontWeight: 500 }}>Network Interfaces</span>
            </div>
            {networkInterfaces.length > 0 ? networkInterfaces.map((iface, i) => {
              const isActive = !!iface.ip4 && iface.ip4 !== '';
              return (
                <div key={iface.name} style={{ paddingTop: i ? '12px' : 0, marginTop: i ? '12px' : 0, borderTop: i ? '1px solid #243356' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0' }}>{iface.name}</span>
                    <span style={{ fontSize: '12px', color: isActive ? '#22c55e' : '#ffb4ab' }}>{isActive ? 'Active' : 'Down'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                    <span style={{ fontSize: '12px', color: '#8892a4' }}>{iface.ip4 || 'Disconnected'}</span>
                    <span style={{ fontSize: '12px', color: '#8892a4' }}>{iface.speed ? `${iface.speed} MB/s` : ''}</span>
                  </div>
                </div>
              );
            }) : (
              <div style={{ fontSize: '12px', color: '#8892a4' }}>No interfaces detected</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
