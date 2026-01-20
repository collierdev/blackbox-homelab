import { Router } from 'express';
import {
  CAMERAS,
  GO2RTC_URL,
  getMSEStreamUrl,
  getWebRTCUrl,
  getWebRTCPageUrl,
  getStreamPageUrl,
  getHLSUrl,
  getMJPEGUrl,
  getSnapshotUrl
} from '../config/go2rtc';

const router = Router();

// Get all configured cameras with their stream URLs
router.get('/cameras', async (_req, res) => {
  try {
    // Check which cameras are actually available in go2rtc
    const response = await fetch(`${GO2RTC_URL}/api/streams`);
    const streams = await response.json() as Record<string, unknown>;

    const cameras = CAMERAS.map(camera => {
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
            webrtcPage: getWebRTCPageUrl(camera.streamHD),
            streamPage: getStreamPageUrl(camera.streamHD),
            // Direct API endpoints
            mse: getMSEStreamUrl(camera.streamHD),
            webrtc: getWebRTCUrl(camera.streamHD),
            hls: getHLSUrl(camera.streamHD),
            mjpeg: getMJPEGUrl(camera.streamHD),
            snapshot: getSnapshotUrl(camera.streamHD)
          },
          sd: {
            name: camera.streamSD,
            available: sdAvailable,
            // Iframe-friendly pages (preferred)
            webrtcPage: getWebRTCPageUrl(camera.streamSD),
            streamPage: getStreamPageUrl(camera.streamSD),
            // Direct API endpoints
            mse: getMSEStreamUrl(camera.streamSD),
            webrtc: getWebRTCUrl(camera.streamSD),
            hls: getHLSUrl(camera.streamSD),
            mjpeg: getMJPEGUrl(camera.streamSD),
            snapshot: getSnapshotUrl(camera.streamSD)
          }
        }
      };
    });

    res.json(cameras);
  } catch (error) {
    console.error('Error getting cameras:', error);
    res.status(500).json({ error: 'Failed to get cameras' });
  }
});

// Get single camera info
router.get('/cameras/:id', async (req, res) => {
  try {
    const camera = CAMERAS.find(c => c.id === req.params.id);
    if (!camera) {
      res.status(404).json({ error: 'Camera not found' });
      return;
    }

    // Check stream availability
    const response = await fetch(`${GO2RTC_URL}/api/streams`);
    const streams = await response.json() as Record<string, unknown>;

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
          webrtcPage: getWebRTCPageUrl(camera.streamHD),
          streamPage: getStreamPageUrl(camera.streamHD),
          mse: getMSEStreamUrl(camera.streamHD),
          webrtc: getWebRTCUrl(camera.streamHD),
          hls: getHLSUrl(camera.streamHD),
          mjpeg: getMJPEGUrl(camera.streamHD),
          snapshot: getSnapshotUrl(camera.streamHD)
        },
        sd: {
          name: camera.streamSD,
          available: sdAvailable,
          webrtcPage: getWebRTCPageUrl(camera.streamSD),
          streamPage: getStreamPageUrl(camera.streamSD),
          mse: getMSEStreamUrl(camera.streamSD),
          webrtc: getWebRTCUrl(camera.streamSD),
          hls: getHLSUrl(camera.streamSD),
          mjpeg: getMJPEGUrl(camera.streamSD),
          snapshot: getSnapshotUrl(camera.streamSD)
        }
      }
    });
  } catch (error) {
    console.error('Error getting camera:', error);
    res.status(500).json({ error: 'Failed to get camera' });
  }
});

// Check go2rtc health/status
router.get('/status', async (_req, res) => {
  try {
    const response = await fetch(`${GO2RTC_URL}/api`);
    if (response.ok) {
      res.json({ connected: true, url: GO2RTC_URL });
    } else {
      res.json({ connected: false, error: `HTTP ${response.status}` });
    }
  } catch (error) {
    res.json({ connected: false, error: String(error) });
  }
});

// Proxy snapshot to avoid CORS issues
router.get('/snapshot/:streamName', async (req, res) => {
  try {
    const streamName = req.params.streamName;
    const response = await fetch(getSnapshotUrl(streamName));

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
    console.error('Error proxying snapshot:', error);
    res.status(500).json({ error: 'Failed to proxy snapshot' });
  }
});

export default router;
