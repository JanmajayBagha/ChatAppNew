const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"] 
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6 // basic validation
  },
  contacts: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  blocked: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  online: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', UserSchema);