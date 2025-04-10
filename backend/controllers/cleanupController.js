// backend/controllers/cleanupController.js
const {
  getAllCleanups,
  getCleanupsForDepo,
  getCleanupById,
  createCleanup,
  updateCleanup,
  joinCleanup,
  leaveCleanup,
  getUpcomingCleanups
} = require('../models/cleanup');
const { getDepoById } = require('../models/depo');

// Get all cleanups
const getCleanups = async (req, res) => {
  try {
    const cleanups = await getAllCleanups();
    res.json(cleanups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get cleanups for a specific depo
const getDepoCleanups = async (req, res) => {
  try {
    const depoId = req.params.id;
    const cleanups = await getCleanupsForDepo(depoId);
    res.json(cleanups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a specific cleanup by ID
const getCleanup = async (req, res) => {
  try {
    const cleanupId = req.params.id;
    const cleanup = await getCleanupById(cleanupId);
    
    if (!cleanup) {
      return res.status(404).json({ error: 'Cleanup not found' });
    }
    
    res.json(cleanup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new cleanup
const addCleanup = async (req, res) => {
  try {
    const depoId = req.params.id;
    const { date, details } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Cleanup date is required' });
    }
    
    // Check if depo exists
    const depo = await getDepoById(depoId);
    if (!depo) {
      return res.status(404).json({ error: 'Depo not found' });
    }
    
    const cleanup = await createCleanup(depoId, req.user.id, date, details);
    res.status(201).json(cleanup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a cleanup
const editCleanup = async (req, res) => {
  try {
    const cleanupId = req.params.id;
    const { date, details, status } = req.body;
    
    // Check if cleanup exists
    const cleanup = await getCleanupById(cleanupId);
    if (!cleanup) {
      return res.status(404).json({ error: 'Cleanup not found' });
    }
    
    // Check if user is the organizer
    if (cleanup.organizer.id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this cleanup' });
    }
    
    // Prepare updates object
    const updates = {};
    
    if (date) updates.date = date;
    if (details !== undefined) updates.details = details;
    
    if (status) {
      // Validate status
      if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      updates.status = status;
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    const updatedCleanup = await updateCleanup(cleanupId, updates);
    res.json(updatedCleanup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Join a cleanup
const participateInCleanup = async (req, res) => {
  try {
    const cleanupId = req.params.id;
    
    // Check if cleanup exists
    const cleanup = await getCleanupById(cleanupId);
    if (!cleanup) {
      return res.status(404).json({ error: 'Cleanup not found' });
    }
    
    // Check if cleanup is scheduled (can't join completed/cancelled cleanups)
    if (cleanup.status !== 'scheduled') {
      return res.status(400).json({ error: 'Cannot join a cleanup that is not scheduled' });
    }
    
    const result = await joinCleanup(cleanupId, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Leave a cleanup
const withdrawFromCleanup = async (req, res) => {
  try {
    const cleanupId = req.params.id;
    
    // Check if cleanup exists
    const cleanup = await getCleanupById(cleanupId);
    if (!cleanup) {
      return res.status(404).json({ error: 'Cleanup not found' });
    }
    
    // Check if cleanup is scheduled (can't leave completed/cancelled cleanups)
    if (cleanup.status !== 'scheduled') {
      return res.status(400).json({ error: 'Cannot leave a cleanup that is not scheduled' });
    }
    
    // Check if user is the organizer (organizer can't leave)
    if (cleanup.organizer.id === req.user.id) {
      return res.status(400).json({ error: 'Organizer cannot leave the cleanup' });
    }
    
    await leaveCleanup(cleanupId, req.user.id);
    res.json({ message: 'Successfully left the cleanup' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get upcoming cleanups
const getNext = async (req, res) => {
  try {
    const cleanups = await getUpcomingCleanups();
    res.json(cleanups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCleanups,
  getDepoCleanups,
  getCleanup,
  addCleanup,
  editCleanup,
  participateInCleanup,
  withdrawFromCleanup,
  getNext
};
