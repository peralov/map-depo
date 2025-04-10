// backend/routes/depos.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Depo = require('../models/Depo');
const Report = require('../models/Report');
const Cleanup = require('../models/Cleanup');
const User = require('../models/User');

// Get all depos
router.get('/', async (req, res) => {
  try {
    const depos = await Depo.find().populate('createdBy', 'username');
    res.json(depos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get depo by ID
router.get('/:id', async (req, res) => {
  try {
    const depo = await Depo.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate({
        path: 'reports',
        select: 'details status createdAt',
        populate: { path: 'reporter', select: 'username' }
      })
      .populate({
        path: 'cleanups',
        select: 'date status details',
        populate: { path: 'organizer', select: 'username' }
      });
    
    if (!depo) {
      return res.status(404).json({ msg: 'Depo not found' });
    }
    
    res.json(depo);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Depo not found' });
    }
    res.status(500).send('Server Error');
  }
});

// Create a depo
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, latitude, longitude, status, type, size } = req.body;
    
    const newDepo = new Depo({
      name,
      description,
      latitude,
      longitude,
      status: status || 'medium',
      type: type || 'garbage',
      size: size || 'medium',
      createdBy: req.user.id
    });
    
    const depo = await newDepo.save();
    res.json(depo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a depo
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, status, type, size } = req.body;
    
    // Build depo object
    const depoFields = {};
    if (name) depoFields.name = name;
    if (description) depoFields.description = description;
    if (status) depoFields.status = status;
    if (type) depoFields.type = type;
    if (size) depoFields.size = size;
    
    let depo = await Depo.findById(req.params.id);
    
    if (!depo) {
      return res.status(404).json({ msg: 'Depo not found' });
    }
    
    // Check user has permission
    if (depo.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    depo = await Depo.findByIdAndUpdate(
      req.params.id,
      { $set: depoFields },
      { new: true }
    );
    
    res.json(depo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a depo
router.delete('/:id', auth, async (req, res) => {
  try {
    const depo = await Depo.findById(req.params.id);
    
    if (!depo) {
      return res.status(404).json({ msg: 'Depo not found' });
    }
    
    // Check user has permission (only creator or admin)
    if (depo.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    await Depo.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Depo removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Report a depo issue
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { details, images } = req.body;
    
    const depo = await Depo.findById(req.params.id);
    if (!depo) {
      return res.status(404).json({ msg: 'Depo not found' });
    }
    
    const newReport = new Report({
      depo: req.params.id,
      reporter: req.user.id,
      details,
      images: images || []
    });
    
    const report = await newReport.save();
    
    // Add report to depo
    depo.reports.push(report._id);
    await depo.save();
    
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Schedule a cleanup
router.post('/:id/cleanup', auth, async (req, res) => {
  try {
    const { date, details } = req.body;
    
    const depo = await Depo.findById(req.params.id);
    if (!depo) {
      return res.status(404).json({ msg: 'Depo not found' });
    }
    
    const newCleanup = new Cleanup({
      depo: req.params.id,
      organizer: req.user.id,
      participants: [req.user.id], // Organizer is first participant
      date,
      details
    });
    
    const cleanup = await newCleanup.save();
    
    // Add cleanup to depo
    depo.cleanups.push(cleanup._id);
    await depo.save();
    
    res.json(cleanup);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Vouch for a depo report
router.post('/:id/vouch', auth, async (req, res) => {
  try {
    const depo = await Depo.findById(req.params.id);
    if (!depo) {
      return res.status(404).json({ msg: 'Depo not found' });
    }
    
    // Check if user already vouched
    if (depo.vouches.includes(req.user.id)) {
      return res.status(400).json({ msg: 'User already vouched for this depo' });
    }
    
    // Add user to vouches array
    depo.vouches.push(req.user.id);
    depo.vouchCount = depo.vouches.length;
    await depo.save();
    
    res.json({ vouchCount: depo.vouchCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all reports for a depo
router.get('/:id/reports', async (req, res) => {
  try {
    const reports = await Report.find({ depo: req.params.id })
      .populate('reporter', 'username')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all cleanups for a depo
router.get('/:id/cleanups', async (req, res) => {
  try {
    const cleanups = await Cleanup.find({ depo: req.params.id })
      .populate('organizer', 'username')
      .populate('participants', 'username')
      .sort({ date: 1 });
    
    res.json(cleanups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;