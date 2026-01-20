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
export declare function getSystemStats(): Promise<SystemStats>;
export declare function getCpuHistory(): Promise<number[]>;
//# sourceMappingURL=systemInfo.d.ts.map