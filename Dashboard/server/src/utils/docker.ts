import Docker from 'dockerode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Data persistence for notes and custom icons
const DATA_FILE = '/tmp/service-data.json';

interface ServiceData {
  notes: Record<string, string>;
  customIcons: Record<string, string>;
}

function loadServiceData(): ServiceData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading service data:', e);
  }
  return { notes: {}, customIcons: {} };
}

function saveServiceData(data: ServiceData): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error saving service data:', e);
  }
}

export function getServiceNotes(serviceName: string): string | undefined {
  const data = loadServiceData();
  return data.notes[serviceName.toLowerCase()];
}

export function setServiceNotes(serviceName: string, notes: string): void {
  const data = loadServiceData();
  data.notes[serviceName.toLowerCase()] = notes;
  saveServiceData(data);
}

export function getServiceIcon(serviceName: string): string | undefined {
  const data = loadServiceData();
  return data.customIcons[serviceName.toLowerCase()];
}

export function setServiceIcon(serviceName: string, iconPath: string): void {
  const data = loadServiceData();
  data.customIcons[serviceName.toLowerCase()] = iconPath;
  saveServiceData(data);
}

async function getContainerStats(containerId: string): Promise<{ memoryUsage: number; memoryLimit: number; memoryPercent: number; cpuPercent: number } | null> {
  try {
    const container = docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });

    const memoryUsage = stats.memory_stats.usage || 0;
    const memoryLimit = stats.memory_stats.limit || 1;
    const memoryPercent = (memoryUsage / memoryLimit) * 100;

    // Calculate CPU percentage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - (stats.precpu_stats.cpu_usage?.total_usage || 0);
    const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats.system_cpu_usage || 0);
    const cpuCount = stats.cpu_stats.online_cpus || 1;
    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * cpuCount * 100 : 0;

    return { memoryUsage, memoryLimit, memoryPercent, cpuPercent };
  } catch (e) {
    return null;
  }
}

export interface ServiceInfo {
  id: string;
  name: string;
  type: 'docker' | 'systemd';
  status: 'running' | 'stopped' | 'error' | 'unknown';
  url?: string;
  port?: number;
  image?: string;
  uptime?: string;
  memoryUsage?: number;
  memoryLimit?: number;
  memoryPercent?: number;
  cpuPercent?: number;
  notes?: string;
  customIcon?: string;
}

const SERVICES_CONFIG: Record<string, { type: 'docker' | 'systemd'; url?: string; port?: number }> = {
  // Media & automation
  jellyfin:            { type: 'docker',  url: 'http://jellyfin.blackbox',   port: 8096 },
  n8n:                 { type: 'docker',  url: 'http://n8n.blackbox',        port: 5678 },
  portainer:           { type: 'docker',  url: 'http://blackbox/portainer',  port: 9443 },
  homeassistant:       { type: 'docker',  url: 'http://ha.blackbox',         port: 8123 },
  go2rtc:              { type: 'docker',  url: 'http://go2rtc.blackbox',     port: 1984 },
  plex:                { type: 'systemd', url: 'http://plex.blackbox',       port: 32400 },
  // AI stack
  'pi-agent':          { type: 'systemd', url: 'http://agent.blackbox',      port: 8001 },
  ollama:              { type: 'systemd', url: 'http://localhost:11434',      port: 11434 },
  // Databases
  'pi-dashboard-neo4j':{ type: 'docker',  url: 'http://blackbox:7474',       port: 7474 },
  neo4j:               { type: 'docker',  url: 'http://blackbox:7474',       port: 7474 },
  couchdb:             { type: 'docker',  url: 'https://vault.blackbox',     port: 5984 },
  // Networking / system
  tailscaled:          { type: 'systemd' },
  samba:               { type: 'systemd', port: 445 },
  nginx:               { type: 'systemd', port: 80 },
};

export async function getDockerContainers(): Promise<ServiceInfo[]> {
  try {
    const containers = await docker.listContainers({ all: true });
    const serviceData = loadServiceData();

    const results = await Promise.all(containers.map(async container => {
      const name = container.Names[0]?.replace(/^\//, '') || 'unknown';
      const config = SERVICES_CONFIG[name.toLowerCase()];
      const isRunning = container.State === 'running';

      let stats = null;
      if (isRunning) {
        stats = await getContainerStats(container.Id);
      }

      return {
        id: container.Id.substring(0, 12),
        name,
        type: 'docker' as const,
        status: (isRunning ? 'running' : 'stopped') as 'running' | 'stopped',
        image: container.Image,
        url: config?.url,
        port: config?.port,
        uptime: container.Status,
        memoryUsage: stats?.memoryUsage,
        memoryLimit: stats?.memoryLimit,
        memoryPercent: stats?.memoryPercent,
        cpuPercent: stats?.cpuPercent,
        notes: serviceData.notes[name.toLowerCase()],
        customIcon: serviceData.customIcons[name.toLowerCase()]
      };
    }));

    return results;
  } catch (error) {
    console.error('Error getting Docker containers:', error);
    return [];
  }
}

export async function getSystemdServices(): Promise<ServiceInfo[]> {
  const systemdServices = ['plexmediaserver', 'ollama', 'pi-agent', 'tailscaled', 'smbd', 'nginx'];
  const services: ServiceInfo[] = [];
  const serviceData = loadServiceData();

  for (const serviceName of systemdServices) {
    try {
      // Use nsenter to run systemctl in the host's namespace (PID 1)
      const { stdout } = await execAsync(`nsenter -t 1 -m -u -i -n -p -- systemctl is-active ${serviceName} 2>/dev/null || echo "inactive"`);
      const isActive = stdout.trim() === 'active';
      const displayName = serviceName === 'plexmediaserver' ? 'plex' : serviceName === 'smbd' ? 'samba' : serviceName === 'pi-agent' ? 'pi-agent' : serviceName;
      const config = SERVICES_CONFIG[displayName];

      services.push({
        id: serviceName,
        name: displayName,
        type: 'systemd',
        status: isActive ? 'running' : 'stopped',
        url: config?.url,
        port: config?.port,
        notes: serviceData.notes[displayName.toLowerCase()],
        customIcon: serviceData.customIcons[displayName.toLowerCase()]
      });
    } catch {
      const displayName = serviceName === 'plexmediaserver' ? 'plex' : serviceName === 'smbd' ? 'samba' : serviceName === 'pi-agent' ? 'pi-agent' : serviceName;
      services.push({
        id: serviceName,
        name: displayName,
        type: 'systemd',
        status: 'unknown',
        notes: serviceData.notes[displayName.toLowerCase()],
        customIcon: serviceData.customIcons[displayName.toLowerCase()]
      });
    }
  }

  return services;
}

export async function getAllServices(): Promise<ServiceInfo[]> {
  const [dockerServices, systemdServices] = await Promise.all([
    getDockerContainers(),
    getSystemdServices()
  ]);

  return [...dockerServices, ...systemdServices];
}

export async function controlDockerContainer(containerId: string, action: 'start' | 'stop' | 'restart'): Promise<void> {
  const container = docker.getContainer(containerId);

  switch (action) {
    case 'start':
      await container.start();
      break;
    case 'stop':
      await container.stop();
      break;
    case 'restart':
      await container.restart();
      break;
  }
}

export async function controlSystemdService(serviceName: string, action: 'start' | 'stop' | 'restart'): Promise<void> {
  const serviceMap: Record<string, string> = {
    plex: 'plexmediaserver',
    ollama: 'ollama',
    tailscaled: 'tailscaled',
    samba: 'smbd'
  };

  const actualService = serviceMap[serviceName] || serviceName;
  // Use nsenter to run systemctl in the host's namespace (PID 1)
  await execAsync(`nsenter -t 1 -m -u -i -n -p -- systemctl ${action} ${actualService}`);
}
