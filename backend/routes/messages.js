const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');

// Get conversation between current user and another
router.get('/:userId', auth, async (req, res) => {
  const me = req.user.id;
  const other = req.params.userId;
  const msgs = await Message.find({
    $or: [ { sender: me, recipient: other }, { sender: other, recipient: me } ]
  }).sort('createdAt');
  res.json(msgs);
});

module.exports = router;
