import { useState, useEffect } from 'react';
import { Cpu, MemoryStick, HardDrive, Thermometer, Clock, Network, ArrowUpDown, ExternalLink } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { SystemStats as Stats } from '../types';
import { StatsCard, ProgressBar } from './StatsCard';
import { CollapsiblePanel } from './CollapsiblePanel';

interface SystemStatsProps {
  stats: Stats | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getTempColor(temp: number): string {
  if (temp < 50) return 'text-success';
  if (temp < 70) return 'text-warning';
  return 'text-destructive';
}

type SortField = 'name' | 'memory' | 'memoryPercent' | 'cpu';
type SortDirection = 'asc' | 'desc';

export function SystemStats({ stats }: SystemStatsProps) {
  const [showProcesses, setShowProcesses] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [sortField, setSortField] = useState<SortField>('memoryPercent');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [panelOrder, setPanelOrder] = useState<string[]>(['network-services', 'process-memory']);

  // Initialize sensors for drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Load panel order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('dashboard-panel-order');
    if (savedOrder) {
      try {
        setPanelOrder(JSON.parse(savedOrder));
      } catch {
        // Use default if parsing fails
      }
    }
  }, []);

  // Save panel order to localStorage
  const handlePanelDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = panelOrder.indexOf(active.id);
    const newIndex = panelOrder.indexOf(over.id);

    const newOrder = arrayMove(panelOrder, oldIndex, newIndex);
    setPanelOrder(newOrder);
    localStorage.setItem('dashboard-panel-order', JSON.stringify(newOrder));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedProcesses = stats?.processes?.slice().sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'name') {
      return multiplier * a.name.localeCompare(b.name);
    }
    return multiplier * (a[sortField] - b[sortField]);
  }) || [];

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
            <div className="h-4 bg-secondary rounded w-1/2 mb-4" />
            <div className="h-8 bg-secondary rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="CPU" icon={<Cpu className="w-5 h-5" />}>
          <ProgressBar value={stats.cpu.usage} label="Usage" />
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Cores:</span>
              <span className="ml-1 font-medium">{stats.cpu.cores}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Speed:</span>
              <span className="ml-1 font-medium">{stats.cpu.speed} GHz</span>
            </div>
          </div>
        </StatsCard>

        <StatsCard title="Memory" icon={<MemoryStick className="w-5 h-5" />}>
          <ProgressBar value={stats.memory.usedPercent} label="Usage" />
          <div className="mt-3 text-sm">
            <span className="text-muted-foreground">
              {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
            </span>
          </div>
        </StatsCard>

        <StatsCard title="Disk" icon={<HardDrive className="w-5 h-5" />}>
          <ProgressBar value={stats.disk.usedPercent} label="Usage" />
          <div className="mt-3 text-sm">
            <span className="text-muted-foreground">
              {formatBytes(stats.disk.used)} / {formatBytes(stats.disk.total)}
            </span>
          </div>
        </StatsCard>

        <StatsCard title="Temperature" icon={<Thermometer className="w-5 h-5" />}>
          <div className="flex items-end gap-2">
            <span className={`text-4xl font-bold ${getTempColor(stats.cpu.temperature)}`}>
              {stats.cpu.temperature.toFixed(1)}
            </span>
            <span className="text-xl text-muted-foreground mb-1">°C</span>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">CPU Temperature</div>
        </StatsCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard title="Uptime" icon={<Clock className="w-5 h-5" />}>
          <div className="text-2xl font-bold text-foreground">
            {formatUptime(stats.uptime)}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {stats.platform}
          </div>
        </StatsCard>

        <StatsCard title="Network Interfaces" icon={<Network className="w-5 h-5" />}>
          <div className="space-y-2">
            {stats.network.interfaces.slice(0, 4).map(iface => (
              <div key={iface.name} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{iface.name}</span>
                <span className="font-mono font-medium">{iface.ip4}</span>
              </div>
            ))}
          </div>
        </StatsCard>
      </div>

      {/* Draggable Panels */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePanelDragEnd}>
        <SortableContext items={panelOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {panelOrder.map(panelId => {
              if (panelId === 'network-services') {
                return (
                  <CollapsiblePanel
                    key={panelId}
                    id={panelId}
                    title="Network Services"
                    icon={<Network className="w-5 h-5 text-primary" />}
                    badge={`${stats.network.services?.length || 0} services`}
                    isOpen={showServices}
                    onToggle={() => setShowServices(!showServices)}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">IP Address</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Port</th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">URL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {stats.network.services?.map((service, idx) => (
                            <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                              <td className="px-4 py-3 font-medium">{service.name}</td>
                              <td className="px-4 py-3 font-mono text-muted-foreground">{service.ip}</td>
                              <td className="px-4 py-3 font-mono">{service.port}</td>
                              <td className="px-4 py-3">
                                {service.url && !service.url.startsWith('\\') ? (
                                  <a
                                    href={service.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-primary hover:underline"
                                  >
                                    {service.url}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="font-mono text-muted-foreground">{service.url || '-'}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CollapsiblePanel>
                );
              } else if (panelId === 'process-memory') {
                return (
                  <CollapsiblePanel
                    key={panelId}
                    id={panelId}
                    title="Memory Usage by Process"
                    icon={<MemoryStick className="w-5 h-5 text-primary" />}
                    badge={`Top ${sortedProcesses.length} processes`}
                    isOpen={showProcesses}
                    onToggle={() => setShowProcesses(!showProcesses)}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th
                              className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                              onClick={() => handleSort('name')}
                            >
                              <div className="flex items-center gap-1">
                                Process
                                <ArrowUpDown className="w-3 h-3" />
                              </div>
                            </th>
                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">PID</th>
                            <th
                              className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                              onClick={() => handleSort('memory')}
                            >
                              <div className="flex items-center gap-1">
                                Memory
                                <ArrowUpDown className="w-3 h-3" />
                              </div>
                            </th>
                            <th
                              className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                              onClick={() => handleSort('memoryPercent')}
                            >
                              <div className="flex items-center gap-1">
                                Mem %
                                <ArrowUpDown className="w-3 h-3" />
                              </div>
                            </th>
                            <th
                              className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                              onClick={() => handleSort('cpu')}
                            >
                              <div className="flex items-center gap-1">
                                CPU %
                                <ArrowUpDown className="w-3 h-3" />
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {sortedProcesses.map((proc, idx) => (
                            <tr key={`${proc.pid}-${idx}`} className="hover:bg-secondary/30 transition-colors">
                              <td className="px-4 py-3 font-medium">{proc.name}</td>
                              <td className="px-4 py-3 font-mono text-muted-foreground">{proc.pid}</td>
                              <td className="px-4 py-3 font-mono">{formatBytes(proc.memory)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-primary rounded-full transition-all"
                                      style={{ width: `${Math.min(proc.memoryPercent * 10, 100)}%` }}
                                    />
                                  </div>
                                  <span className="font-mono text-sm">{proc.memoryPercent.toFixed(1)}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-warning rounded-full transition-all"
                                      style={{ width: `${Math.min(proc.cpu, 100)}%` }}
                                    />
                                  </div>
                                  <span className="font-mono text-sm">{proc.cpu.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CollapsiblePanel>
                );
              }
              return null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
