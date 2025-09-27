const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true }, // use phone instead of email
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // added contacts
  blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // blocked users
  online: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
