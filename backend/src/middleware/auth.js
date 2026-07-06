const jwt = require('jsonwebtoken');
const Developer = require('../models/Developer');
const { getJwtSecret } = require('../config/jwt');

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid authorization header' });
    }

    const token = header.split(' ')[1];
    const payload = jwt.verify(token, getJwtSecret());
    const developer = await Developer.findById(payload.id).select('-password');
    if (!developer) return res.status(401).json({ message: 'Invalid token - user not found' });

    req.user = { id: developer._id, email: developer.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
};

module.exports = authMiddleware;
