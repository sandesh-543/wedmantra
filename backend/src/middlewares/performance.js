const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Log slow requests
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log requests taking more than 500ms
    if (duration > 500) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Log mobile API performance
    if (req.path.startsWith('/api/mobile/')) {
      console.info(`Mobile API: ${req.path} - ${duration}ms`);
    }
  });
  
  next();
};

// Add response time header
const addResponseTime = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.set('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

module.exports = {
  performanceMonitor,
  addResponseTime
};