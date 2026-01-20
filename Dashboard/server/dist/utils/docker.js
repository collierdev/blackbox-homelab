"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceNotes = getServiceNotes;
exports.setServiceNotes = setServiceNotes;
exports.getServiceIcon = getServiceIcon;
exports.setServiceIcon = setServiceIcon;
exports.getDockerContainers = getDockerContainers;
exports.getSystemdServices = getSystemdServices;
exports.getAllServices = getAllServices;
exports.controlDockerContainer = controlDockerContainer;
exports.controlSystemdService = controlSystemdService;
const dockerode_1 = __importDefault(require("dockerode"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const docker = new dockerode_1.default({ socketPath: '/var/run/docker.sock' });
// Data persistence for notes and custom icons
const DATA_FILE = '/tmp/service-data.json';
function loadServiceData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }
    }
    catch (e) {
        console.error('Error loading service data:', e);
    }
    return { notes: {}, customIcons: {} };
}
function saveServiceData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    }
    catch (e) {
        console.error('Error saving service data:', e);
    }
}
function getServiceNotes(serviceName) {
    const data = loadServiceData();
    return data.notes[serviceName.toLowerCase()];
}
function setServiceNotes(serviceName, notes) {
    const data = loadServiceData();
    data.notes[serviceName.toLowerCase()] = notes;
    saveServiceData(data);
}
function getServiceIcon(serviceName) {
    const data = loadServiceData();
    return data.customIcons[serviceName.toLowerCase()];
}
function setServiceIcon(serviceName, iconPath) {
    const data = loadServiceData();
    data.customIcons[serviceName.toLowerCase()] = iconPath;
    saveServiceData(data);
}
async function getContainerStats(containerId) {
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
    }
    catch (e) {
        return null;
    }
}
const SERVICES_CONFIG = {
    jellyfin: { type: 'docker', url: 'http://192.168.50.39:8096', port: 8096 },
    n8n: { type: 'docker', url: 'http://192.168.50.39:5678', port: 5678 },
    portainer: { type: 'docker', url: 'https://192.168.50.39:9443', port: 9443 },
    homeassistant: { type: 'docker', url: 'http://192.168.50.39:8123', port: 8123 },
    go2rtc: { type: 'docker', url: 'http://192.168.50.39:1984', port: 1984 },
    plex: { type: 'systemd', url: 'http://192.168.50.39:32400/web', port: 32400 },
    ollama: { type: 'systemd', url: 'http://localhost:11434', port: 11434 },
    tailscaled: { type: 'systemd' },
    samba: { type: 'systemd', port: 445 }
};
async function getDockerContainers() {
    try {
        const containers = await docker.listContainers({ all: true });
        const serviceData = loadServiceData();
        const results = await Promise.all(containers.map(async (container) => {
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
                type: 'docker',
                status: (isRunning ? 'running' : 'stopped'),
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
    }
    catch (error) {
        console.error('Error getting Docker containers:', error);
        return [];
    }
}
async function getSystemdServices() {
    const systemdServices = ['plexmediaserver', 'ollama', 'tailscaled', 'smbd'];
    const services = [];
    const serviceData = loadServiceData();
    for (const serviceName of systemdServices) {
        try {
            // Use nsenter to run systemctl in the host's namespace (PID 1)
            const { stdout } = await execAsync(`nsenter -t 1 -m -u -i -n -p -- systemctl is-active ${serviceName} 2>/dev/null || echo "inactive"`);
            const isActive = stdout.trim() === 'active';
            const displayName = serviceName === 'plexmediaserver' ? 'plex' : serviceName === 'smbd' ? 'samba' : serviceName;
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
        }
        catch {
            const displayName = serviceName === 'plexmediaserver' ? 'plex' : serviceName === 'smbd' ? 'samba' : serviceName;
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
async function getAllServices() {
    const [dockerServices, systemdServices] = await Promise.all([
        getDockerContainers(),
        getSystemdServices()
    ]);
    return [...dockerServices, ...systemdServices];
}
async function controlDockerContainer(containerId, action) {
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
async function controlSystemdService(serviceName, action) {
    const serviceMap = {
        plex: 'plexmediaserver',
        ollama: 'ollama',
        tailscaled: 'tailscaled',
        samba: 'smbd'
    };
    const actualService = serviceMap[serviceName] || serviceName;
    // Use nsenter to run systemctl in the host's namespace (PID 1)
    await execAsync(`nsenter -t 1 -m -u -i -n -p -- systemctl ${action} ${actualService}`);
}
//# sourceMappingURL=docker.js.map