import { Router } from 'express';
import {
  createFixture,
  getAllFixtures,
  getFixtureById,
  getFixturesByRoom,
  updateFixture,
  deleteFixture,
  addLightToFixture,
  removeLightFromFixture,
  reorderFixtures
} from '../models/fixture';
import {
  setMultipleLightsBrightness,
  setMultipleLightsColor,
  setMultipleLightsHSColor,
  setMultipleLightsColorTemp,
  toggleMultipleLights,
  turnOnMultipleLights,
  turnOffMultipleLights,
  setLightEffect
} from '../utils/homeassistant';

const router = Router();

// Get all fixtures
router.get('/', async (_req, res) => {
  try {
    const fixtures = await getAllFixtures();
    res.json(fixtures);
  } catch (error) {
    console.error('Error getting fixtures:', error);
    res.status(500).json({ error: 'Failed to get fixtures' });
  }
});

// Get fixtures by room
router.get('/room/:room', async (req, res) => {
  try {
    const room = req.params.room;
    const fixtures = await getFixturesByRoom(room);
    res.json(fixtures);
  } catch (error) {
    console.error('Error getting fixtures by room:', error);
    res.status(500).json({ error: 'Failed to get fixtures' });
  }
});

// Get single fixture
router.get('/:id', async (req, res) => {
  try {
    const fixture = await getFixtureById(req.params.id);
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }
    res.json(fixture);
  } catch (error) {
    console.error('Error getting fixture:', error);
    res.status(500).json({ error: 'Failed to get fixture' });
  }
});

// Create fixture
router.post('/', async (req, res) => {
  try {
    const { name, lightIds, icon, room } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    if (!lightIds || !Array.isArray(lightIds) || lightIds.length === 0) {
      res.status(400).json({ error: 'lightIds must be a non-empty array' });
      return;
    }

    const fixture = await createFixture({ name, lightIds, icon, room });
    res.status(201).json(fixture);
  } catch (error) {
    console.error('Error creating fixture:', error);
    res.status(500).json({ error: 'Failed to create fixture' });
  }
});

// Update fixture
router.put('/:id', async (req, res) => {
  try {
    const { name, lightIds, icon, room, order } = req.body;
    const fixture = await updateFixture(req.params.id, { name, lightIds, icon, room, order });

    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }
    res.json(fixture);
  } catch (error) {
    console.error('Error updating fixture:', error);
    res.status(500).json({ error: 'Failed to update fixture' });
  }
});

// Delete fixture
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteFixture(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting fixture:', error);
    res.status(500).json({ error: 'Failed to delete fixture' });
  }
});

// Add light to fixture
router.post('/:id/lights', async (req, res) => {
  try {
    const { lightId } = req.body;
    if (!lightId || typeof lightId !== 'string') {
      res.status(400).json({ error: 'lightId is required' });
      return;
    }

    const fixture = await addLightToFixture(req.params.id, lightId);
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }
    res.json(fixture);
  } catch (error) {
    console.error('Error adding light to fixture:', error);
    res.status(500).json({ error: 'Failed to add light' });
  }
});

// Remove light from fixture
router.delete('/:id/lights/:lightId', async (req, res) => {
  try {
    const fixture = await removeLightFromFixture(req.params.id, req.params.lightId);
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }
    res.json(fixture);
  } catch (error) {
    console.error('Error removing light from fixture:', error);
    res.status(500).json({ error: 'Failed to remove light' });
  }
});

// Reorder fixtures
router.post('/reorder', async (req, res) => {
  try {
    const { orders } = req.body;
    if (!orders || !Array.isArray(orders)) {
      res.status(400).json({ error: 'orders must be an array' });
      return;
    }
    await reorderFixtures(orders);
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering fixtures:', error);
    res.status(500).json({ error: 'Failed to reorder fixtures' });
  }
});

// === Fixture Control Routes ===

// Toggle all lights in fixture
router.post('/:id/toggle', async (req, res) => {
  try {
    const fixture = await getFixtureById(req.params.id);
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }

    const result = await toggleMultipleLights(fixture.lightIds);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error toggling fixture:', error);
    res.status(500).json({ error: 'Failed to toggle fixture' });
  }
});

// Turn on all lights in fixture
router.post('/:id/turn_on', async (req, res) => {
  try {
    const fixture = await getFixtureById(req.params.id);
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }

    const result = await turnOnMultipleLights(fixture.lightIds);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error turning on fixture:', error);
    res.status(500).json({ error: 'Failed to turn on fixture' });
  }
});

// Turn off all lights in fixture
router.post('/:id/turn_off', async (req, res) => {
  try {
    const fixture = await getFixtureById(req.params.id);
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }

    const result = await turnOffMultipleLights(fixture.lightIds);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error turning off fixture:', error);
    res.status(500).json({ error: 'Failed to turn off fixture' });
  }
});

// Set brightness for all lights in fixture
router.post('/:id/brightness', async (req, res) => {
  try {
    const { brightness } = req.body;
    if (typeof brightness !== 'number' || brightness < 0 || brightness > 255) {
      res.status(400).json({ error: 'Brightness must be a number between 0 and 255' });
      return;
    }

    const fixture = await getFixtureById(req.params.id);
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }

    const result = await setMultipleLightsBrightness(fixture.lightIds, brightness);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting fixture brightness:', error);
    res.status(500).json({ error: 'Failed to set brightness' });
  }
});

// Set RGB color for all lights in fixture
router.post('/:id/color', async (req, res) => {
  try {
    const { rgb_color } = req.body;
    if (!Array.isArray(rgb_color) || rgb_color.length !== 3) {
      res.status(400).json({ error: 'rgb_color must be an array of 3 numbers [r, g, b]' });
      return;
    }

    const fixture = await getFixtureById(req.params.id);
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }

    const result = await setMultipleLightsColor(fixture.lightIds, rgb_color as [number, number, number]);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting fixture color:', error);
    res.status(500).json({ error: 'Failed to set color' });
  }
});

// Set HS color for all lights in fixture
router.post('/:id/hs_color', async (req, res) => {
  try {
    const { hs_color } = req.body;
    if (!Array.isArray(hs_color) || hs_color.length !== 2) {
      res.status(400).json({ error: 'hs_color must be an array of 2 numbers [hue, saturation]' });
      return;
    }

    const fixture = await getFixtureById(req.params.id);
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }

    const result = await setMultipleLightsHSColor(fixture.lightIds, hs_color as [number, number]);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting fixture HS color:', error);
    res.status(500).json({ error: 'Failed to set HS color' });
  }
});

// Set color temperature for all lights in fixture
router.post('/:id/color_temp', async (req, res) => {
  try {
    const { kelvin } = req.body;
    if (typeof kelvin !== 'number' || kelvin < 1000 || kelvin > 10000) {
      res.status(400).json({ error: 'kelvin must be a number between 1000 and 10000' });
      return;
    }

    const fixture = await getFixtureById(req.params.id);
    if (!fixture) {
      res.status(404).json({ error: 'Fixture not found' });
      return;
    }

    const result = await setMultipleLightsColorTemp(fixture.lightIds, kelvin);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error setting fixture color temp:', error);
    res.status(500).json({ error: 'Failed to set color temperature' });
  }
});

export default router;
