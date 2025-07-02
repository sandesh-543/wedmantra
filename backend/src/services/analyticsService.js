const db = require('../config/db');

// Get sales/orders summary
async function getSummary({ role, userId, from, to }) {
  let where = '';
  const params = [];
  let idx = 1;
  if (from) {
    where += ` AND o.created_at >= $${idx++}`;
    params.push(from);
  }
  if (to) {
    where += ` AND o.created_at <= $${idx++}`;
    params.push(to);
  }
  let join = '';
  if (role === 'admin') {
    join = 'JOIN order_items oi ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id';
    where += ` AND p.created_by = $${idx++}`;
    params.push(userId);
  }
  const result = await db.query(
    `SELECT COUNT(DISTINCT o.id) AS order_count, COALESCE(SUM(o.total_amount),0) AS total_sales
     FROM orders o
     ${join}
     WHERE 1=1 ${where}`,
    params
  );
  // Product count
  let productCount = 0;
  if (role === 'admin') {
    const pc = await db.query('SELECT COUNT(*) FROM products WHERE created_by = $1', [userId]);
    productCount = parseInt(pc.rows[0].count, 10);
  } else {
    const pc = await db.query('SELECT COUNT(*) FROM products', []);
    productCount = parseInt(pc.rows[0].count, 10);
  }
  return { ...result.rows[0], product_count: productCount };
}

// Get top-selling products
async function getTopProducts({ role, userId, limit = 5, from, to }) {
  let where = '';
  const params = [];
  let idx = 1;
  if (from) {
    where += ` AND o.created_at >= $${idx++}`;
    params.push(from);
  }
  if (to) {
    where += ` AND o.created_at <= $${idx++}`;
    params.push(to);
  }
  if (role === 'admin') {
    where += ` AND p.created_by = $${idx++}`;
    params.push(userId);
  }
  const result = await db.query(
    `SELECT p.id, p.name, SUM(oi.quantity) AS total_sold
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     JOIN orders o ON oi.order_id = o.id
     WHERE 1=1 ${where}
     GROUP BY p.id, p.name
     ORDER BY total_sold DESC
     LIMIT $${idx}`,
    [...params, limit]
  );
  return result.rows;
}

// Get product view stats
async function getProductViews({ role, userId, from, to }) {
  let where = '';
  const params = [];
  let idx = 1;
  if (from) {
    where += ` AND pv.created_at >= $${idx++}`;
    params.push(from);
  }
  if (to) {
    where += ` AND pv.created_at <= $${idx++}`;
    params.push(to);
  }
  if (role === 'admin') {
    where += ` AND p.created_by = $${idx++}`;
    params.push(userId);
  }
  const result = await db.query(
    `SELECT p.id, p.name, COUNT(pv.id) AS view_count
     FROM product_views pv
     JOIN products p ON pv.product_id = p.id
     WHERE 1=1 ${where}
     GROUP BY p.id, p.name
     ORDER BY view_count DESC`,
    params
  );
  return result.rows;
}

module.exports = {
  getSummary,
  getTopProducts,
  getProductViews,
}; 