const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET messages between two users
router.get('/:userId', async (req, res) => {
  const me = req.query.me; // sender id
  const messages = await Message.find({
    $or: [
      { sender: me, recipient: req.params.userId },
      { sender: req.params.userId, recipient: me }
    ]
  }).sort({ createdAt: 1 });
  res.json(messages);
});

// POST message
router.post('/', async (req, res) => {
  const { sender, recipient, text, file, fileType } = req.body;
  const message = await Message.create({ sender, recipient, text, file, fileType });
  res.json(message);
});

// POST /upload
router.post('/upload', upload.single('file'), (req, res) => {
  const fileUrl = `http://localhost:8000/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

module.exports = router;
