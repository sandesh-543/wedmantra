const express = require('express');
const router = express.Router();
const CacheMonitor = require('../utils/cacheMonitor');
// const authMiddleware = require('../middlewares/authMiddleware');

// router.use(authMiddleware); // Uncomment when auth is ready

// Get cache statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await CacheMonitor.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

// Get cache hit ratio
router.get('/hit-ratio', async (req, res) => {
  try {
    const hitRatio = await CacheMonitor.getHitRatio();
    res.json(hitRatio);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache hit ratio' });
  }
});

// Get memory usage
router.get('/memory', async (req, res) => {
  try {
    const memory = await CacheMonitor.getMemoryUsage();
    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get memory usage' });
  }
});

// Clear all cache (admin only)
router.delete('/clear', async (req, res) => {
  try {
    const cleared = await CacheMonitor.clearAll();
    if (cleared) {
      res.json({ message: 'All cache cleared successfully' });
    } else {
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

module.exports = router; 