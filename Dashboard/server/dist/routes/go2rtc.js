"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const go2rtc_1 = require("../config/go2rtc");
const router = (0, express_1.Router)();
// Get all configured cameras with their stream URLs
router.get('/cameras', async (_req, res) => {
    try {
        // Check which cameras are actually available in go2rtc
        const response = await fetch(`${go2rtc_1.GO2RTC_URL}/api/streams`);
        const streams = await response.json();
        const cameras = go2rtc_1.CAMERAS.map(camera => {
            const hdAvailable = camera.streamHD in streams;
            const sdAvailable = camera.streamSD in streams;
            return {
                id: camera.id,
                name: camera.name,
                ip: camera.ip,
                available: hdAvailable || sdAvailable,
                streams: {
                    hd: {
                        name: camera.streamHD,
                        available: hdAvailable,
                        // Iframe-friendly pages (preferred)
                        webrtcPage: (0, go2rtc_1.getWebRTCPageUrl)(camera.streamHD),
                        streamPage: (0, go2rtc_1.getStreamPageUrl)(camera.streamHD),
                        // Direct API endpoints
                        mse: (0, go2rtc_1.getMSEStreamUrl)(camera.streamHD),
                        webrtc: (0, go2rtc_1.getWebRTCUrl)(camera.streamHD),
                        hls: (0, go2rtc_1.getHLSUrl)(camera.streamHD),
                        mjpeg: (0, go2rtc_1.getMJPEGUrl)(camera.streamHD),
                        snapshot: (0, go2rtc_1.getSnapshotUrl)(camera.streamHD)
                    },
                    sd: {
                        name: camera.streamSD,
                        available: sdAvailable,
                        // Iframe-friendly pages (preferred)
                        webrtcPage: (0, go2rtc_1.getWebRTCPageUrl)(camera.streamSD),
                        streamPage: (0, go2rtc_1.getStreamPageUrl)(camera.streamSD),
                        // Direct API endpoints
                        mse: (0, go2rtc_1.getMSEStreamUrl)(camera.streamSD),
                        webrtc: (0, go2rtc_1.getWebRTCUrl)(camera.streamSD),
                        hls: (0, go2rtc_1.getHLSUrl)(camera.streamSD),
                        mjpeg: (0, go2rtc_1.getMJPEGUrl)(camera.streamSD),
                        snapshot: (0, go2rtc_1.getSnapshotUrl)(camera.streamSD)
                    }
                }
            };
        });
        res.json(cameras);
    }
    catch (error) {
        console.error('Error getting cameras:', error);
        res.status(500).json({ error: 'Failed to get cameras' });
    }
});
// Get single camera info
router.get('/cameras/:id', async (req, res) => {
    try {
        const camera = go2rtc_1.CAMERAS.find(c => c.id === req.params.id);
        if (!camera) {
            res.status(404).json({ error: 'Camera not found' });
            return;
        }
        // Check stream availability
        const response = await fetch(`${go2rtc_1.GO2RTC_URL}/api/streams`);
        const streams = await response.json();
        const hdAvailable = camera.streamHD in streams;
        const sdAvailable = camera.streamSD in streams;
        res.json({
            id: camera.id,
            name: camera.name,
            ip: camera.ip,
            available: hdAvailable || sdAvailable,
            streams: {
                hd: {
                    name: camera.streamHD,
                    available: hdAvailable,
                    webrtcPage: (0, go2rtc_1.getWebRTCPageUrl)(camera.streamHD),
                    streamPage: (0, go2rtc_1.getStreamPageUrl)(camera.streamHD),
                    mse: (0, go2rtc_1.getMSEStreamUrl)(camera.streamHD),
                    webrtc: (0, go2rtc_1.getWebRTCUrl)(camera.streamHD),
                    hls: (0, go2rtc_1.getHLSUrl)(camera.streamHD),
                    mjpeg: (0, go2rtc_1.getMJPEGUrl)(camera.streamHD),
                    snapshot: (0, go2rtc_1.getSnapshotUrl)(camera.streamHD)
                },
                sd: {
                    name: camera.streamSD,
                    available: sdAvailable,
                    webrtcPage: (0, go2rtc_1.getWebRTCPageUrl)(camera.streamSD),
                    streamPage: (0, go2rtc_1.getStreamPageUrl)(camera.streamSD),
                    mse: (0, go2rtc_1.getMSEStreamUrl)(camera.streamSD),
                    webrtc: (0, go2rtc_1.getWebRTCUrl)(camera.streamSD),
                    hls: (0, go2rtc_1.getHLSUrl)(camera.streamSD),
                    mjpeg: (0, go2rtc_1.getMJPEGUrl)(camera.streamSD),
                    snapshot: (0, go2rtc_1.getSnapshotUrl)(camera.streamSD)
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting camera:', error);
        res.status(500).json({ error: 'Failed to get camera' });
    }
});
// Check go2rtc health/status
router.get('/status', async (_req, res) => {
    try {
        const response = await fetch(`${go2rtc_1.GO2RTC_URL}/api`);
        if (response.ok) {
            res.json({ connected: true, url: go2rtc_1.GO2RTC_URL });
        }
        else {
            res.json({ connected: false, error: `HTTP ${response.status}` });
        }
    }
    catch (error) {
        res.json({ connected: false, error: String(error) });
    }
});
// Proxy snapshot to avoid CORS issues (uses internal URL, not proxy prefix)
router.get('/snapshot/:streamName', async (req, res) => {
    try {
        const streamName = req.params.streamName;
        const response = await fetch(`${go2rtc_1.GO2RTC_URL}/api/frame.jpeg?src=${streamName}`);
        if (!response.ok) {
            res.status(response.status).json({ error: 'Failed to get snapshot' });
            return;
        }
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    }
    catch (error) {
        console.error('Error proxying snapshot:', error);
        res.status(500).json({ error: 'Failed to proxy snapshot' });
    }
});
exports.default = router;
//# sourceMappingURL=go2rtc.js.map