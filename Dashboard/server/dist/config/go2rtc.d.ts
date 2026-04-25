export interface CameraConfig {
    id: string;
    name: string;
    ip: string;
    streamHD: string;
    streamSD: string;
}
export declare const CAMERAS: CameraConfig[];
export declare const GO2RTC_URL: string;
export declare const GO2RTC_PROXY_PREFIX = "/go2rtc";
export declare function getWebRTCPageUrl(streamName: string): string;
export declare function getStreamPageUrl(streamName: string): string;
export declare function getMSEStreamUrl(streamName: string): string;
export declare function getWebRTCUrl(streamName: string): string;
export declare function getHLSUrl(streamName: string): string;
export declare function getMJPEGUrl(streamName: string): string;
export declare function getSnapshotUrl(streamName: string): string;
//# sourceMappingURL=go2rtc.d.ts.map