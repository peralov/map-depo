// backend/controllers/depoController.js
const { 
  getAllDepos, 
  getDepoById, 
  createDepo, 
  updateDepo 
} = require('../models/depo');

// Get all depos
const getDepos = async (req, res) => {
  try {
    const depos = await getAllDepos();
    res.json(depos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get depo by ID
const getDepo = async (req, res) => {
  try {
    const id = req.params.id;
    const depo = await getDepoById(id);
    
    if (!depo) {
      return res.status(404).json({ error: 'Depo not found' });
    }
    
    res.json(depo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new depo
const addDepo = async (req, res) => {
  try {
    const { name, description, latitude, longitude, size } = req.body;
    
    if (!name || !latitude || !longitude) {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required' });
    }
    
    const depo = await createDepo(name, description, latitude, longitude, size, req.user.id);
    res.status(201).json(depo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a depo
const editDepo = async (req, res) => {
  try {
    const depoId = req.params.id;
    const { name, description, status, type, size } = req.body;
    
    // Get the depo to check ownership
    const depo = await getDepoById(depoId);
    
    if (!depo) {
      return res.status(404).json({ error: 'Depo not found' });
    }
    
    // Check if user is the creator
    if (depo.reported_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this depo' });
    }
    
    // Prepare updates object
    const updates = {};
    
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    
    if (status) {
      // Validate status
      if (!['clean', 'low', 'medium', 'high'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      updates.status = status;
    }
    
    if (type) {
      // Validate type
      if (!['garbage', 'debris', 'landfill', 'electronic', 'hazardous', 'construction', 'organic', 'plastic', 'other'].includes(type)) {
        return res.status(400).json({ error: 'Invalid type value' });
      }
      updates.type = type;
    }
    
    if (size) {
      // Validate size
      if (!['small', 'medium', 'large'].includes(size)) {
        return res.status(400).json({ error: 'Invalid size value' });
      }
      updates.size = size;
    }
    
    // Update the depo
    const updatedDepo = await updateDepo(depoId, updates);
    res.json(updatedDepo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDepos,
  getDepo,
  addDepo,
  editDepo
};
