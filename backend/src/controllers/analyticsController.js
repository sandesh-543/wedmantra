const analyticsService = require('../services/analyticsService');

async function getSummary(req, res, next) {
  try {
    const { from, to } = req.query;
    const data = await analyticsService.getSummary({
      role: req.user.role,
      userId: req.user.id,
      from,
      to,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getTopProducts(req, res, next) {
  try {
    const { from, to, limit } = req.query;
    const data = await analyticsService.getTopProducts({
      role: req.user.role,
      userId: req.user.id,
      from,
      to,
      limit: limit ? parseInt(limit, 10) : 5,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getProductViews(req, res, next) {
  try {
    const { from, to } = req.query;
    const data = await analyticsService.getProductViews({
      role: req.user.role,
      userId: req.user.id,
      from,
      to,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getTopProducts,
  getProductViews,
}; 