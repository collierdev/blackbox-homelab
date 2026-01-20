"use strict";
// go2rtc configuration
// go2rtc provides RTSP to WebRTC/MSE/HLS streaming for cameras
Object.defineProperty(exports, "__esModule", { value: true });
exports.GO2RTC_URL = exports.CAMERAS = void 0;
exports.getWebRTCPageUrl = getWebRTCPageUrl;
exports.getStreamPageUrl = getStreamPageUrl;
exports.getMSEStreamUrl = getMSEStreamUrl;
exports.getWebRTCUrl = getWebRTCUrl;
exports.getHLSUrl = getHLSUrl;
exports.getMJPEGUrl = getMJPEGUrl;
exports.getSnapshotUrl = getSnapshotUrl;
// Camera configurations - maps to go2rtc streams
exports.CAMERAS = [
    {
        id: 'camera1',
        name: 'Camera 1',
        ip: '192.168.50.242',
        streamHD: 'camera1_hd',
        streamSD: 'camera1_sd'
    },
    {
        id: 'camera2',
        name: 'Camera 2',
        ip: '192.168.50.246',
        streamHD: 'camera2_hd',
        streamSD: 'camera2_sd'
    },
    {
        id: 'camera3',
        name: 'Camera 3',
        ip: '192.168.50.227',
        streamHD: 'camera3_hd',
        streamSD: 'camera3_sd'
    },
    {
        id: 'camera4',
        name: 'Camera 4',
        ip: '192.168.50.73',
        streamHD: 'camera4_hd',
        streamSD: 'camera4_sd'
    },
    {
        id: 'camera5',
        name: 'Camera 3',
        ip: '192.168.50.114',
        streamHD: 'camera5_hd',
        streamSD: 'camera5_sd'
    }
];
// go2rtc server configuration
exports.GO2RTC_URL = process.env.GO2RTC_URL || 'http://192.168.50.39:1984';
// Stream URL builders - iframe-friendly pages (preferred)
function getWebRTCPageUrl(streamName) {
    return `${exports.GO2RTC_URL}/webrtc.html?src=${streamName}`;
}
function getStreamPageUrl(streamName) {
    return `${exports.GO2RTC_URL}/stream.html?src=${streamName}`;
}
// Stream URL builders - API endpoints
function getMSEStreamUrl(streamName) {
    return `${exports.GO2RTC_URL}/api/ws?src=${streamName}`;
}
function getWebRTCUrl(streamName) {
    return `${exports.GO2RTC_URL}/api/webrtc?src=${streamName}`;
}
function getHLSUrl(streamName) {
    return `${exports.GO2RTC_URL}/api/stream.m3u8?src=${streamName}`;
}
function getMJPEGUrl(streamName) {
    return `${exports.GO2RTC_URL}/api/stream.mjpeg?src=${streamName}`;
}
function getSnapshotUrl(streamName) {
    return `${exports.GO2RTC_URL}/api/frame.jpeg?src=${streamName}`;
}
//# sourceMappingURL=go2rtc.js.map