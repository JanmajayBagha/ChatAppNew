const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (await User.findOne({ email })) return res.status(400).json({ msg: 'Email exists' });
    const hashed = await bcrypt.hash(password, 10);
    const u = new User({ name, email, password: hashed });
    await u.save();
    const token = jwt.sign({ id: u._id, name: u.name }, JWT_SECRET);
    res.json({ token, user: { id: u._id, name: u.name, email: u.email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const u = await User.findOne({ email });
    if (!u) return res.status(400).json({ msg: 'Invalid creds' });
    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(400).json({ msg: 'Invalid creds' });
    const token = jwt.sign({ id: u._id, name: u.name }, JWT_SECRET);
    res.json({ token, user: { id: u._id, name: u.name, email: u.email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// list users (no auth for starter)
router.get('/users', async (req, res) => {
  const all = await User.find().select('-password');
  res.json(all);
});

module.exports = router;
