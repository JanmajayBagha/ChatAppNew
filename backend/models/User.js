const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/Otp');
const jwt = require('jsonwebtoken');

// generate JWT
const generateToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

// --- Existing OTP routes --- (request-otp, verify-otp)

// GET all users
router.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// POST /auth/add-contact
router.post('/add-contact', async (req, res) => {
  const { meId, userId } = req.body;
  if (!meId || !userId) return res.status(400).json({ msg: "Invalid data" });

  const me = await User.findById(meId);
  if (!me.contacts.includes(userId)) {
    me.contacts.push(userId);
    await me.save();
  }
  res.json({ msg: "Contact added" });
});

// POST /auth/block-unblock
router.post('/block-unblock', async (req, res) => {
  const { meId, userId, block } = req.body;
  if (!meId || !userId) return res.status(400).json({ msg: "Invalid data" });

  const me = await User.findById(meId);
  if (block) {
    if (!me.blocked.includes(userId)) me.blocked.push(userId);
    // Optionally remove from contacts if blocked
    me.contacts = me.contacts.filter(c => c.toString() !== userId);
  } else {
    me.blocked = me.blocked.filter(c => c.toString() !== userId);
  }
  await me.save();
  res.json({ msg: block ? "User blocked" : "User unblocked" });
});

// POST /auth/delete-contact
router.post('/delete-contact', async (req, res) => {
  const { meId, userId } = req.body;
  if (!meId || !userId) return res.status(400).json({ msg: "Invalid data" });

  const me = await User.findById(meId);
  me.contacts = me.contacts.filter(c => c.toString() !== userId);
  await me.save();
  res.json({ msg: "Contact deleted" });
});

module.exports = router;
