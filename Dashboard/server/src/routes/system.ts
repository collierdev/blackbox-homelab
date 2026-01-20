import { Router } from 'express';
import { getSystemStats, getCpuHistory } from '../utils/systemInfo';

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    const stats = await getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({ error: 'Failed to get system stats' });
  }
});

router.get('/cpu-history', async (req, res) => {
  try {
    const history = await getCpuHistory();
    res.json(history);
  } catch (error) {
    console.error('Error getting CPU history:', error);
    res.status(500).json({ error: 'Failed to get CPU history' });
  }
});

export default router;
