const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
module.exports = function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) { res.status(401).json({ msg: 'Token invalid' }); }
};
