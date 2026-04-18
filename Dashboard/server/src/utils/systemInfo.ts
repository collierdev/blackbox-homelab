import si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    speed: number;
    temperature: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usedPercent: number;
  };
  network: {
    interfaces: NetworkInterface[];
    services: NetworkService[];
  };
  processes: ProcessMemory[];
  uptime: number;
  hostname: string;
  platform: string;
}

export interface NetworkInterface {
  name: string;
  ip4: string;
  ip6: string;
  mac: string;
  type: string;
  speed: number | null;
}

export interface NetworkService {
  name: string;
  url: string;
  ip: string;
  port: number;
}

export interface ProcessMemory {
  name: string;
  pid: number;
  memory: number;
  memoryPercent: number;
  cpu: number;
}

// Network services with their URLs and ports
const NETWORK_SERVICES: NetworkService[] = [
  { name: 'Pi Dashboard', url: 'http://blackbox/', ip: '192.168.50.39', port: 80 },
  { name: 'Home Assistant', url: 'http://ha.blackbox', ip: '192.168.50.39', port: 8123 },
  { name: 'Jellyfin', url: 'http://jellyfin.blackbox', ip: '192.168.50.39', port: 8096 },
  { name: 'n8n', url: 'http://n8n.blackbox', ip: '192.168.50.39', port: 5678 },
  { name: 'Portainer', url: 'http://blackbox/portainer', ip: '192.168.50.39', port: 9443 },
  { name: 'Plex', url: 'http://plex.blackbox', ip: '192.168.50.39', port: 32400 },
  { name: 'Ollama', url: 'http://localhost:11434', ip: '192.168.50.39', port: 11434 },
  { name: 'Samba (SMB)', url: '\\\\blackbox', ip: '192.168.50.39', port: 445 },
  { name: 'Tailscale', url: '', ip: 'See tailscale0', port: 41641 },
];

// Get host processes using nsenter to access host's process namespace
async function getHostProcesses(): Promise<ProcessMemory[]> {
  try {
    // Use nsenter to run ps on the host and get process info
    // Format: PID, %MEM, %CPU, RSS (in KB), COMMAND
    const { stdout } = await execAsync(
      `nsenter -t 1 -m -u -i -n -p -- ps aux --sort=-%mem | head -20`
    );

    const lines = stdout.trim().split('\n').slice(1); // Skip header
    const processes: ProcessMemory[] = [];

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 11) {
        const pid = parseInt(parts[1], 10);
        const cpu = parseFloat(parts[2]) || 0;
        const memPercent = parseFloat(parts[3]) || 0;
        const rss = parseInt(parts[5], 10) * 1024 || 0; // Convert KB to bytes
        const name = parts.slice(10).join(' ').split('/').pop()?.split(' ')[0] || parts[10];

        processes.push({
          name: name.substring(0, 30), // Truncate long names
          pid,
          memory: rss,
          memoryPercent: Math.round(memPercent * 100) / 100,
          cpu: Math.round(cpu * 100) / 100
        });
      }
    }

    return processes;
  } catch (error) {
    console.error('Error getting host processes:', error);
    return [];
  }
}

// Get host network interfaces using nsenter
async function getHostNetworkInterfaces(): Promise<NetworkInterface[]> {
  try {
    const { stdout } = await execAsync(
      `nsenter -t 1 -m -u -i -n -p -- ip -4 -o addr show | grep -v "127.0.0.1"`
    );

    const interfaces: NetworkInterface[] = [];
    const lines = stdout.trim().split('\n');

    for (const line of lines) {
      const match = line.match(/^\d+:\s+(\S+)\s+inet\s+(\d+\.\d+\.\d+\.\d+)/);
      if (match) {
        interfaces.push({
          name: match[1],
          ip4: match[2],
          ip6: '',
          mac: '',
          type: match[1].startsWith('wl') ? 'wireless' : 'wired',
          speed: null
        });
      }
    }

    return interfaces;
  } catch (error) {
    console.error('Error getting host network interfaces:', error);
    return [];
  }
}

// Get host system info using nsenter
async function getHostSystemInfo(): Promise<{ hostname: string; platform: string; uptime: number }> {
  try {
    const [hostnameResult, platformResult, uptimeResult] = await Promise.all([
      execAsync(`nsenter -t 1 -m -u -i -n -p -- hostname`),
      execAsync(`nsenter -t 1 -m -u -i -n -p -- cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2`),
      execAsync(`nsenter -t 1 -m -u -i -n -p -- cat /proc/uptime | cut -d' ' -f1`)
    ]);

    return {
      hostname: hostnameResult.stdout.trim(),
      platform: platformResult.stdout.trim(),
      uptime: parseFloat(uptimeResult.stdout.trim()) || 0
    };
  } catch (error) {
    console.error('Error getting host system info:', error);
    return { hostname: 'unknown', platform: 'unknown', uptime: 0 };
  }
}

// Get host memory info using nsenter
async function getHostMemoryInfo(): Promise<{ total: number; used: number; free: number; usedPercent: number }> {
  try {
    const { stdout } = await execAsync(`nsenter -t 1 -m -u -i -n -p -- cat /proc/meminfo`);
    const lines = stdout.split('\n');

    let total = 0, free = 0, available = 0, buffers = 0, cached = 0;

    for (const line of lines) {
      const [key, value] = line.split(':').map(s => s.trim());
      const numValue = parseInt(value) * 1024; // Convert from KB to bytes

      if (key === 'MemTotal') total = numValue;
      else if (key === 'MemFree') free = numValue;
      else if (key === 'MemAvailable') available = numValue;
      else if (key === 'Buffers') buffers = numValue;
      else if (key === 'Cached') cached = numValue;
    }

    // Used = Total - Available (or Total - Free - Buffers - Cached if Available not present)
    const used = available > 0 ? total - available : total - free - buffers - cached;

    return {
      total,
      used,
      free: available > 0 ? available : free,
      usedPercent: Math.round((used / total) * 1000) / 10
    };
  } catch (error) {
    console.error('Error getting host memory info:', error);
    return { total: 0, used: 0, free: 0, usedPercent: 0 };
  }
}

// Get host disk info using nsenter
async function getHostDiskInfo(): Promise<{ total: number; used: number; free: number; usedPercent: number }> {
  try {
    const { stdout } = await execAsync(`nsenter -t 1 -m -u -i -n -p -- df -B1 / | tail -1`);
    const parts = stdout.trim().split(/\s+/);

    if (parts.length >= 5) {
      const total = parseInt(parts[1]) || 0;
      const used = parseInt(parts[2]) || 0;
      const free = parseInt(parts[3]) || 0;
      const usedPercent = parseInt(parts[4]) || 0;

      return { total, used, free, usedPercent };
    }

    return { total: 0, used: 0, free: 0, usedPercent: 0 };
  } catch (error) {
    console.error('Error getting host disk info:', error);
    return { total: 0, used: 0, free: 0, usedPercent: 0 };
  }
}

export async function getSystemStats(): Promise<SystemStats> {
  const [cpu, cpuTemp, currentLoad, hostProcesses, hostNetworkInterfaces, hostSystemInfo, hostMemory, hostDisk] = await Promise.all([
    si.cpu(),
    si.cpuTemperature(),
    si.currentLoad(),
    getHostProcesses(),
    getHostNetworkInterfaces(),
    getHostSystemInfo(),
    getHostMemoryInfo(),
    getHostDiskInfo()
  ]);

  return {
    cpu: {
      usage: Math.round(currentLoad.currentLoad * 10) / 10,
      cores: cpu.cores,
      speed: cpu.speed,
      temperature: cpuTemp.main || 0
    },
    memory: hostMemory,
    disk: hostDisk,
    network: {
      interfaces: hostNetworkInterfaces,
      services: NETWORK_SERVICES
    },
    processes: hostProcesses,
    uptime: hostSystemInfo.uptime,
    hostname: hostSystemInfo.hostname,
    platform: hostSystemInfo.platform
  };
}

export async function getCpuHistory(): Promise<number[]> {
  const load = await si.currentLoad();
  return load.cpus.map(c => Math.round(c.load * 10) / 10);
}
