const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT id, email, name FROM admin_users WHERE id = $1',
      [payload.id]
    );
    if (!result.rows.length) {
      return res.status(401).json({ message: 'Admin user not found' });
    }
    req.admin = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { authenticateAdmin };
