// backend/models/Cleanup.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CleanupSchema = new Schema({
  depo: {
    type: Schema.Types.ObjectId,
    ref: 'Depo',
    required: true
  },
  organizer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  date: {
    type: Date,
    required: true
  },
  details: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  beforeImages: [{
    type: String // URLs to images
  }],
  afterImages: [{
    type: String // URLs to images
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

CleanupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cleanup', CleanupSchema);