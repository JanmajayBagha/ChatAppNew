const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/Otp');
const jwt = require('jsonwebtoken');

// generate JWT
const generateToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

// POST /auth/request-otp
router.post('/request-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ msg: "Phone number required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await OTP.create({ phone, code, expiresAt });
  console.log(`OTP for ${phone}: ${code}`); // Replace with SMS service in production

  res.json({ msg: "OTP sent" });
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { phone, code, name } = req.body;
  if (!phone || !code) return res.status(400).json({ msg: "Phone and code required" });

  const otp = await OTP.findOne({ phone, code });
  if (!otp || otp.expiresAt < new Date()) return res.status(400).json({ msg: "Invalid or expired OTP" });

  let user = await User.findOne({ phone });
  if (!user) {
    if (!name) return res.status(400).json({ msg: "Name required for registration" });
    user = await User.create({ phone, name });
  }

  await OTP.deleteMany({ phone });
  const token = generateToken(user);

  res.json({ user, token });
});

// GET /auth/users
router.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

module.exports = router;
