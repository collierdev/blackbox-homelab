export declare function getServiceNotes(serviceName: string): string | undefined;
export declare function setServiceNotes(serviceName: string, notes: string): void;
export declare function getServiceIcon(serviceName: string): string | undefined;
export declare function setServiceIcon(serviceName: string, iconPath: string): void;
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
export declare function getDockerContainers(): Promise<ServiceInfo[]>;
export declare function getSystemdServices(): Promise<ServiceInfo[]>;
export declare function getAllServices(): Promise<ServiceInfo[]>;
export declare function controlDockerContainer(containerId: string, action: 'start' | 'stop' | 'restart'): Promise<void>;
export declare function controlSystemdService(serviceName: string, action: 'start' | 'stop' | 'restart'): Promise<void>;
//# sourceMappingURL=docker.d.ts.map