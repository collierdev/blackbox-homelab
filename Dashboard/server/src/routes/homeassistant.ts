import { Router } from 'express';
import {
  checkConnection,
  getAllStates,
  getEntitiesByDomain,
  getEntityState,
  getGroupedEntities,
  toggleEntity,
  turnOn,
  turnOff,
  setLightBrightness,
  setLightColor,
  setLightHSColor,
  setLightColorTemp,
  setLightEffect,
  setClimateTemperature,
  setClimateHvacMode,
  mediaPlayPause,
  mediaPlay,
  mediaPause,
  mediaStop,
  mediaNext,
  mediaPrevious,
  setMediaVolume,
  setMediaSource,
  callService
} from '../utils/homeassistant';
import { getHAConfig } from '../config/homeassistant';

const router = Router();

// Check Home Assistant connection status
router.get('/status', async (_req, res) => {
  try {
    const status = await checkConnection();
    res.json(status);
  } catch (error) {
    console.error('Error checking HA status:', error);
    res.status(500).json({ connected: false, error: String(error) });
  }
});

// Get all entities (optionally filtered by domain)
router.get('/entities', async (req, res) => {
  try {
    const domain = req.query.domain as string | undefined;

    if (domain) {
      const entities = await getEntitiesByDomain(domain);
      res.json(entities);
    } else {
      const entities = await getAllStates();
      res.json(entities);
    }
  } catch (error) {
    console.error('Error getting entities:', error);
    res.status(500).json({ error: 'Failed to get entities' });
  }
});

// Get entities grouped by type (for dashboard)
router.get('/devices', async (_req, res) => {
  try {
    const grouped = await getGroupedEntities();
    res.json(grouped);
  } catch (error) {
    console.error('Error getting grouped entities:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// Get single entity state
router.get('/entities/:entityId', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const entity = await getEntityState(entityId);
    res.json(entity);
  } catch (error) {
    console.error('Error getting entity:', error);
    res.status(500).json({ error: 'Failed to get entity' });
  }
});

// Toggle entity (lights, switches, etc.)
router.post('/entities/:entityId/toggle', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const result = await toggleEntity(entityId);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error toggling entity:', error);
    res.status(500).json({ error: 'Failed to toggle entity' });
  }
});

// Turn on entity
router.post('/entities/:entityId/turn_on', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const result = await turnOn(entityId, req.body);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error turning on entity:', error);
    res.status(500).json({ error: 'Failed to turn on entity' });
  }
});

// Turn off entity
router.post('/entities/:entityId/turn_off', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const result = await turnOff(entityId);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error turning off entity:', error);
    res.status(500).json({ error: 'Failed to turn off entity' });
  }
});

// === Light-specific routes ===

// Get all lights
router.get('/lights', async (_req, res) => {
  try {
    const lights = await getEntitiesByDomain('light');
    res.json(lights);
  } catch (error) {
    console.error('Error getting lights:', error);
    res.status(500).json({ error: 'Failed to get lights' });
  }
});

// Set light brightness
router.post('/lights/:entityId/brightness', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const { brightness } = req.body;
    if (typeof brightness !== 'number' || brightness < 0 || brightness > 255) {
      res.status(400).json({ error: 'Brightness must be a number between 0 and 255' });
      return;
    }
    const result = await setLightBrightness(entityId, brightness);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting brightness:', error);
    res.status(500).json({ error: 'Failed to set brightness' });
  }
});

// Set light color (RGB)
router.post('/lights/:entityId/color', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const { rgb_color } = req.body;
    if (!Array.isArray(rgb_color) || rgb_color.length !== 3) {
      res.status(400).json({ error: 'rgb_color must be an array of 3 numbers [r, g, b]' });
      return;
    }
    const result = await setLightColor(entityId, rgb_color as [number, number, number]);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting color:', error);
    res.status(500).json({ error: 'Failed to set color' });
  }
});

// Set light HS color (Hue/Saturation)
router.post('/lights/:entityId/hs_color', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const { hs_color } = req.body;
    if (!Array.isArray(hs_color) || hs_color.length !== 2) {
      res.status(400).json({ error: 'hs_color must be an array of 2 numbers [hue, saturation]' });
      return;
    }
    // Validate ranges: hue 0-360, saturation 0-100
    const [hue, saturation] = hs_color;
    if (hue < 0 || hue > 360 || saturation < 0 || saturation > 100) {
      res.status(400).json({ error: 'hue must be 0-360, saturation must be 0-100' });
      return;
    }
    const result = await setLightHSColor(entityId, hs_color as [number, number]);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting HS color:', error);
    res.status(500).json({ error: 'Failed to set HS color' });
  }
});

// Set light color temperature (Kelvin)
router.post('/lights/:entityId/color_temp', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const { kelvin } = req.body;
    if (typeof kelvin !== 'number' || kelvin < 1000 || kelvin > 10000) {
      res.status(400).json({ error: 'kelvin must be a number between 1000 and 10000' });
      return;
    }
    const result = await setLightColorTemp(entityId, kelvin);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting color temperature:', error);
    res.status(500).json({ error: 'Failed to set color temperature' });
  }
});

// Set light effect
router.post('/lights/:entityId/effect', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const { effect } = req.body;
    if (typeof effect !== 'string') {
      res.status(400).json({ error: 'effect must be a string' });
      return;
    }
    const result = await setLightEffect(entityId, effect);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting effect:', error);
    res.status(500).json({ error: 'Failed to set effect' });
  }
});

// === Climate-specific routes ===

// Get all climate devices
router.get('/climate', async (_req, res) => {
  try {
    const climate = await getEntitiesByDomain('climate');
    res.json(climate);
  } catch (error) {
    console.error('Error getting climate devices:', error);
    res.status(500).json({ error: 'Failed to get climate devices' });
  }
});

// Set climate temperature
router.post('/climate/:entityId/temperature', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const { temperature } = req.body;
    if (typeof temperature !== 'number') {
      res.status(400).json({ error: 'Temperature must be a number' });
      return;
    }
    const result = await setClimateTemperature(entityId, temperature);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting temperature:', error);
    res.status(500).json({ error: 'Failed to set temperature' });
  }
});

// Set HVAC mode
router.post('/climate/:entityId/hvac_mode', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const { hvac_mode } = req.body;
    if (typeof hvac_mode !== 'string') {
      res.status(400).json({ error: 'hvac_mode must be a string' });
      return;
    }
    const result = await setClimateHvacMode(entityId, hvac_mode);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting HVAC mode:', error);
    res.status(500).json({ error: 'Failed to set HVAC mode' });
  }
});

// === Media player routes ===

// Get all media players
router.get('/media_player', async (_req, res) => {
  try {
    const players = await getEntitiesByDomain('media_player');
    res.json(players);
  } catch (error) {
    console.error('Error getting media players:', error);
    res.status(500).json({ error: 'Failed to get media players' });
  }
});

// Media player actions
router.post('/media_player/:entityId/:action', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const action = req.params.action as string;
    let result;

    switch (action) {
      case 'play_pause':
        result = await mediaPlayPause(entityId);
        break;
      case 'play':
        result = await mediaPlay(entityId);
        break;
      case 'pause':
        result = await mediaPause(entityId);
        break;
      case 'stop':
        result = await mediaStop(entityId);
        break;
      case 'next':
        result = await mediaNext(entityId);
        break;
      case 'previous':
        result = await mediaPrevious(entityId);
        break;
      default:
        res.status(400).json({ error: `Unknown action: ${action}` });
        return;
    }

    res.json({ success: true, result });
  } catch (error) {
    console.error('Error controlling media player:', error);
    res.status(500).json({ error: 'Failed to control media player' });
  }
});

// Set media player volume
router.post('/media_player/:entityId/volume', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const { volume_level } = req.body;
    if (typeof volume_level !== 'number' || volume_level < 0 || volume_level > 1) {
      res.status(400).json({ error: 'volume_level must be a number between 0 and 1' });
      return;
    }
    const result = await setMediaVolume(entityId, volume_level);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting volume:', error);
    res.status(500).json({ error: 'Failed to set volume' });
  }
});

// Set media player source
router.post('/media_player/:entityId/source', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const { source } = req.body;
    if (typeof source !== 'string') {
      res.status(400).json({ error: 'source must be a string' });
      return;
    }
    const result = await setMediaSource(entityId, source);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting source:', error);
    res.status(500).json({ error: 'Failed to set source' });
  }
});

// === Switch routes ===

// Get all switches
router.get('/switch', async (_req, res) => {
  try {
    const switches = await getEntitiesByDomain('switch');
    res.json(switches);
  } catch (error) {
    console.error('Error getting switches:', error);
    res.status(500).json({ error: 'Failed to get switches' });
  }
});

// === Generic service call ===

router.post('/services/:domain/:service', async (req, res) => {
  try {
    const domain = req.params.domain as string;
    const service = req.params.service as string;
    const { entity_id, ...serviceData } = req.body;

    const result = await callService(domain, service, entity_id, serviceData);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error calling service:', error);
    res.status(500).json({ error: 'Failed to call service' });
  }
});

// === Camera routes ===

// Get all cameras
router.get('/camera', async (_req, res) => {
  try {
    const cameras = await getEntitiesByDomain('camera');
    res.json(cameras);
  } catch (error) {
    console.error('Error getting cameras:', error);
    res.status(500).json({ error: 'Failed to get cameras' });
  }
});

// Proxy camera snapshot image (avoids CORS issues)
router.get('/camera/:entityId/snapshot', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const config = getHAConfig();

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
  } catch (error) {
    console.error('Error proxying camera snapshot:', error);
    res.status(500).json({ error: 'Failed to proxy snapshot' });
  }
});

// Proxy MJPEG stream
router.get('/camera/:entityId/stream', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const config = getHAConfig();

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
          if (done) break;
          res.write(value);
        }
      } catch {
        // Client disconnected or stream ended
      } finally {
        reader.releaseLock();
        res.end();
      }
    };

    // Handle client disconnect
    req.on('close', () => {
      reader.releaseLock();
    });

    pump();
  } catch (error) {
    console.error('Error proxying camera stream:', error);
    res.status(500).json({ error: 'Failed to proxy stream' });
  }
});

// Trigger camera snapshot refresh
router.post('/camera/:entityId/snapshot', async (req, res) => {
  try {
    const entityId = req.params.entityId as string;
    const result = await callService('camera', 'snapshot', entityId);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error triggering snapshot:', error);
    res.status(500).json({ error: 'Failed to trigger snapshot' });
  }
});

export default router;
