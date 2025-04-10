// backend/models/Depo.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DepoSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // New fields
  status: {
    type: String,
    enum: ['clean', 'low', 'medium', 'high'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['garbage', 'debris', 'landfill', 'electronic', 'hazardous', 'construction', 'organic', 'plastic', 'other'],
    default: 'garbage'
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  // Track actions
  reports: [{
    type: Schema.Types.ObjectId,
    ref: 'Report'
  }],
  cleanups: [{
    type: Schema.Types.ObjectId,
    ref: 'Cleanup'
  }],
  vouches: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  vouchCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the timestamp when document is updated
DepoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Depo', DepoSchema);