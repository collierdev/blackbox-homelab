import { Router, Request, Response } from 'express';
import {
  getAllServices,
  controlDockerContainer,
  controlSystemdService,
  getDockerContainers,
  setServiceNotes,
  setServiceIcon,
  getServiceIcon
} from '../utils/docker';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const ICONS_DIR = '/tmp/service-icons';

interface ServiceActionParams {
  id: string;
  action: string;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const services = await getAllServices();
    res.json(services);
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({ error: 'Failed to get services' });
  }
});

router.post('/:id/:action', async (req: Request<ServiceActionParams>, res: Response) => {
  const { id, action } = req.params;
  const { type } = req.body;

  if (!['start', 'stop', 'restart'].includes(action)) {
    res.status(400).json({ error: 'Invalid action. Use start, stop, or restart.' });
    return;
  }

  try {
    if (type === 'docker') {
      const containers = await getDockerContainers();
      const container = containers.find(c => c.id === id || c.name.toLowerCase() === id.toLowerCase());

      if (!container) {
        res.status(404).json({ error: 'Container not found' });
        return;
      }

      await controlDockerContainer(container.id, action as 'start' | 'stop' | 'restart');
    } else if (type === 'systemd') {
      await controlSystemdService(id, action as 'start' | 'stop' | 'restart');
    } else {
      res.status(400).json({ error: 'Invalid service type. Use docker or systemd.' });
      return;
    }

    res.json({ success: true, message: `Service ${action} successful` });
  } catch (error) {
    console.error(`Error performing ${action} on service ${id}:`, error);
    res.status(500).json({ error: `Failed to ${action} service` });
  }
});

// Update service notes
router.post('/:name/notes', async (req: Request<{ name: string }>, res: Response) => {
  const { name } = req.params;
  const { notes } = req.body;

  try {
    setServiceNotes(name, notes || '');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving notes:', error);
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

// Upload custom icon
router.post('/:name/icon', async (req: Request<{ name: string }>, res: Response) => {
  const { name } = req.params;
  const { icon } = req.body; // Base64 encoded image

  try {
    if (!fs.existsSync(ICONS_DIR)) {
      fs.mkdirSync(ICONS_DIR, { recursive: true });
    }

    if (!icon) {
      // Clear custom icon
      setServiceIcon(name, '');
      res.json({ success: true });
      return;
    }

    // Extract base64 data and file extension
    const matches = icon.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    if (!matches) {
      res.status(400).json({ error: 'Invalid image format' });
      return;
    }

    const ext = matches[1] === 'svg+xml' ? 'svg' : matches[1];
    const data = matches[2];
    const filename = `${name.toLowerCase()}.${ext}`;
    const filepath = path.join(ICONS_DIR, filename);

    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
    setServiceIcon(name, `/api/services/${name}/icon-file`);

    res.json({ success: true, iconPath: `/api/services/${name}/icon-file` });
  } catch (error) {
    console.error('Error saving icon:', error);
    res.status(500).json({ error: 'Failed to save icon' });
  }
});

// Get custom icon file
router.get('/:name/icon-file', async (req: Request<{ name: string }>, res: Response) => {
  const { name } = req.params;

  try {
    const files = fs.readdirSync(ICONS_DIR).filter(f => f.startsWith(name.toLowerCase() + '.'));
    if (files.length === 0) {
      res.status(404).json({ error: 'Icon not found' });
      return;
    }

    const filepath = path.join(ICONS_DIR, files[0]);
    const ext = path.extname(files[0]).slice(1);
    const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;

    res.setHeader('Content-Type', mimeType);
    res.sendFile(filepath);
  } catch (error) {
    res.status(404).json({ error: 'Icon not found' });
  }
});

export default router;
