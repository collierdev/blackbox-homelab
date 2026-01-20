export interface HAEntityState {
    entity_id: string;
    state: string;
    attributes: Record<string, unknown>;
    last_changed: string;
    last_updated: string;
}
export interface HAServiceCall {
    domain: string;
    service: string;
    service_data?: Record<string, unknown>;
    target?: {
        entity_id: string | string[];
    };
}
export declare function checkConnection(): Promise<{
    connected: boolean;
    error?: string;
}>;
export declare function getAllStates(): Promise<HAEntityState[]>;
export declare function getEntitiesByDomain(domain: string): Promise<HAEntityState[]>;
export declare function getEntityState(entityId: string): Promise<HAEntityState>;
export declare function callService(domain: string, service: string, entityId?: string, serviceData?: Record<string, unknown>): Promise<HAEntityState[]>;
export declare function toggleEntity(entityId: string): Promise<HAEntityState[]>;
export declare function turnOn(entityId: string, data?: Record<string, unknown>): Promise<HAEntityState[]>;
export declare function turnOff(entityId: string): Promise<HAEntityState[]>;
export declare function setLightBrightness(entityId: string, brightness: number): Promise<HAEntityState[]>;
export declare function setLightColor(entityId: string, rgbColor: [number, number, number]): Promise<HAEntityState[]>;
export declare function setClimateTemperature(entityId: string, temperature: number): Promise<HAEntityState[]>;
export declare function setClimateHvacMode(entityId: string, hvacMode: string): Promise<HAEntityState[]>;
export declare function mediaPlayPause(entityId: string): Promise<HAEntityState[]>;
export declare function mediaPlay(entityId: string): Promise<HAEntityState[]>;
export declare function mediaPause(entityId: string): Promise<HAEntityState[]>;
export declare function mediaStop(entityId: string): Promise<HAEntityState[]>;
export declare function mediaNext(entityId: string): Promise<HAEntityState[]>;
export declare function mediaPrevious(entityId: string): Promise<HAEntityState[]>;
export declare function setMediaVolume(entityId: string, volumeLevel: number): Promise<HAEntityState[]>;
export declare function setMediaSource(entityId: string, source: string): Promise<HAEntityState[]>;
export declare function getGroupedEntities(): Promise<{
    lights: HAEntityState[];
    switches: HAEntityState[];
    climate: HAEntityState[];
    media_players: HAEntityState[];
    cameras: HAEntityState[];
}>;
//# sourceMappingURL=homeassistant.d.ts.map