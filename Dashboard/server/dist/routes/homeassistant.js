"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const homeassistant_1 = require("../utils/homeassistant");
const homeassistant_2 = require("../config/homeassistant");
const router = (0, express_1.Router)();
// Check Home Assistant connection status
router.get('/status', async (_req, res) => {
    try {
        const status = await (0, homeassistant_1.checkConnection)();
        res.json(status);
    }
    catch (error) {
        console.error('Error checking HA status:', error);
        res.status(500).json({ connected: false, error: String(error) });
    }
});
// Get all entities (optionally filtered by domain)
router.get('/entities', async (req, res) => {
    try {
        const domain = req.query.domain;
        if (domain) {
            const entities = await (0, homeassistant_1.getEntitiesByDomain)(domain);
            res.json(entities);
        }
        else {
            const entities = await (0, homeassistant_1.getAllStates)();
            res.json(entities);
        }
    }
    catch (error) {
        console.error('Error getting entities:', error);
        res.status(500).json({ error: 'Failed to get entities' });
    }
});
// Get entities grouped by type (for dashboard)
router.get('/devices', async (_req, res) => {
    try {
        const grouped = await (0, homeassistant_1.getGroupedEntities)();
        res.json(grouped);
    }
    catch (error) {
        console.error('Error getting grouped entities:', error);
        res.status(500).json({ error: 'Failed to get devices' });
    }
});
// Get single entity state
router.get('/entities/:entityId', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const entity = await (0, homeassistant_1.getEntityState)(entityId);
        res.json(entity);
    }
    catch (error) {
        console.error('Error getting entity:', error);
        res.status(500).json({ error: 'Failed to get entity' });
    }
});
// Toggle entity (lights, switches, etc.)
router.post('/entities/:entityId/toggle', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const result = await (0, homeassistant_1.toggleEntity)(entityId);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error toggling entity:', error);
        res.status(500).json({ error: 'Failed to toggle entity' });
    }
});
// Turn on entity
router.post('/entities/:entityId/turn_on', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const result = await (0, homeassistant_1.turnOn)(entityId, req.body);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error turning on entity:', error);
        res.status(500).json({ error: 'Failed to turn on entity' });
    }
});
// Turn off entity
router.post('/entities/:entityId/turn_off', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const result = await (0, homeassistant_1.turnOff)(entityId);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error turning off entity:', error);
        res.status(500).json({ error: 'Failed to turn off entity' });
    }
});
// === Light-specific routes ===
// Get all lights
router.get('/lights', async (_req, res) => {
    try {
        const lights = await (0, homeassistant_1.getEntitiesByDomain)('light');
        res.json(lights);
    }
    catch (error) {
        console.error('Error getting lights:', error);
        res.status(500).json({ error: 'Failed to get lights' });
    }
});
// Set light brightness
router.post('/lights/:entityId/brightness', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const { brightness } = req.body;
        if (typeof brightness !== 'number' || brightness < 0 || brightness > 255) {
            res.status(400).json({ error: 'Brightness must be a number between 0 and 255' });
            return;
        }
        const result = await (0, homeassistant_1.setLightBrightness)(entityId, brightness);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error setting brightness:', error);
        res.status(500).json({ error: 'Failed to set brightness' });
    }
});
// Set light color
router.post('/lights/:entityId/color', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const { rgb_color } = req.body;
        if (!Array.isArray(rgb_color) || rgb_color.length !== 3) {
            res.status(400).json({ error: 'rgb_color must be an array of 3 numbers [r, g, b]' });
            return;
        }
        const result = await (0, homeassistant_1.setLightColor)(entityId, rgb_color);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error setting color:', error);
        res.status(500).json({ error: 'Failed to set color' });
    }
});
// === Climate-specific routes ===
// Get all climate devices
router.get('/climate', async (_req, res) => {
    try {
        const climate = await (0, homeassistant_1.getEntitiesByDomain)('climate');
        res.json(climate);
    }
    catch (error) {
        console.error('Error getting climate devices:', error);
        res.status(500).json({ error: 'Failed to get climate devices' });
    }
});
// Set climate temperature
router.post('/climate/:entityId/temperature', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const { temperature } = req.body;
        if (typeof temperature !== 'number') {
            res.status(400).json({ error: 'Temperature must be a number' });
            return;
        }
        const result = await (0, homeassistant_1.setClimateTemperature)(entityId, temperature);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error setting temperature:', error);
        res.status(500).json({ error: 'Failed to set temperature' });
    }
});
// Set HVAC mode
router.post('/climate/:entityId/hvac_mode', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const { hvac_mode } = req.body;
        if (typeof hvac_mode !== 'string') {
            res.status(400).json({ error: 'hvac_mode must be a string' });
            return;
        }
        const result = await (0, homeassistant_1.setClimateHvacMode)(entityId, hvac_mode);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error setting HVAC mode:', error);
        res.status(500).json({ error: 'Failed to set HVAC mode' });
    }
});
// === Media player routes ===
// Get all media players
router.get('/media_player', async (_req, res) => {
    try {
        const players = await (0, homeassistant_1.getEntitiesByDomain)('media_player');
        res.json(players);
    }
    catch (error) {
        console.error('Error getting media players:', error);
        res.status(500).json({ error: 'Failed to get media players' });
    }
});
// Media player actions
router.post('/media_player/:entityId/:action', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const action = req.params.action;
        let result;
        switch (action) {
            case 'play_pause':
                result = await (0, homeassistant_1.mediaPlayPause)(entityId);
                break;
            case 'play':
                result = await (0, homeassistant_1.mediaPlay)(entityId);
                break;
            case 'pause':
                result = await (0, homeassistant_1.mediaPause)(entityId);
                break;
            case 'stop':
                result = await (0, homeassistant_1.mediaStop)(entityId);
                break;
            case 'next':
                result = await (0, homeassistant_1.mediaNext)(entityId);
                break;
            case 'previous':
                result = await (0, homeassistant_1.mediaPrevious)(entityId);
                break;
            default:
                res.status(400).json({ error: `Unknown action: ${action}` });
                return;
        }
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error controlling media player:', error);
        res.status(500).json({ error: 'Failed to control media player' });
    }
});
// Set media player volume
router.post('/media_player/:entityId/volume', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const { volume_level } = req.body;
        if (typeof volume_level !== 'number' || volume_level < 0 || volume_level > 1) {
            res.status(400).json({ error: 'volume_level must be a number between 0 and 1' });
            return;
        }
        const result = await (0, homeassistant_1.setMediaVolume)(entityId, volume_level);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error setting volume:', error);
        res.status(500).json({ error: 'Failed to set volume' });
    }
});
// Set media player source
router.post('/media_player/:entityId/source', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const { source } = req.body;
        if (typeof source !== 'string') {
            res.status(400).json({ error: 'source must be a string' });
            return;
        }
        const result = await (0, homeassistant_1.setMediaSource)(entityId, source);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error setting source:', error);
        res.status(500).json({ error: 'Failed to set source' });
    }
});
// === Switch routes ===
// Get all switches
router.get('/switch', async (_req, res) => {
    try {
        const switches = await (0, homeassistant_1.getEntitiesByDomain)('switch');
        res.json(switches);
    }
    catch (error) {
        console.error('Error getting switches:', error);
        res.status(500).json({ error: 'Failed to get switches' });
    }
});
// === Generic service call ===
router.post('/services/:domain/:service', async (req, res) => {
    try {
        const domain = req.params.domain;
        const service = req.params.service;
        const { entity_id, ...serviceData } = req.body;
        const result = await (0, homeassistant_1.callService)(domain, service, entity_id, serviceData);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error calling service:', error);
        res.status(500).json({ error: 'Failed to call service' });
    }
});
// === Camera routes ===
// Get all cameras
router.get('/camera', async (_req, res) => {
    try {
        const cameras = await (0, homeassistant_1.getEntitiesByDomain)('camera');
        res.json(cameras);
    }
    catch (error) {
        console.error('Error getting cameras:', error);
        res.status(500).json({ error: 'Failed to get cameras' });
    }
});
// Proxy camera snapshot image (avoids CORS issues)
router.get('/camera/:entityId/snapshot', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const config = (0, homeassistant_2.getHAConfig)();
        const response = await fetch(`${config.url}/api/camera_proxy/${entityId}`, {
            headers: {
                'Authorization': `Bearer ${config.token}`
            }
        });
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
        console.error('Error proxying camera snapshot:', error);
        res.status(500).json({ error: 'Failed to proxy snapshot' });
    }
});
// Proxy MJPEG stream
router.get('/camera/:entityId/stream', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const config = (0, homeassistant_2.getHAConfig)();
        const response = await fetch(`${config.url}/api/camera_proxy_stream/${entityId}`, {
            headers: {
                'Authorization': `Bearer ${config.token}`
            }
        });
        if (!response.ok) {
            res.status(response.status).json({ error: 'Failed to get stream' });
            return;
        }
        // Set headers for MJPEG stream
        res.setHeader('Content-Type', 'multipart/x-mixed-replace;boundary=--jpgboundary');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Pipe the stream directly to the response
        const reader = response.body?.getReader();
        if (!reader) {
            res.status(500).json({ error: 'No stream available' });
            return;
        }
        const pump = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    res.write(value);
                }
            }
            catch {
                // Client disconnected or stream ended
            }
            finally {
                reader.releaseLock();
                res.end();
            }
        };
        // Handle client disconnect
        req.on('close', () => {
            reader.releaseLock();
        });
        pump();
    }
    catch (error) {
        console.error('Error proxying camera stream:', error);
        res.status(500).json({ error: 'Failed to proxy stream' });
    }
});
// Trigger camera snapshot refresh
router.post('/camera/:entityId/snapshot', async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const result = await (0, homeassistant_1.callService)('camera', 'snapshot', entityId);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error triggering snapshot:', error);
        res.status(500).json({ error: 'Failed to trigger snapshot' });
    }
});
exports.default = router;
//# sourceMappingURL=homeassistant.js.map