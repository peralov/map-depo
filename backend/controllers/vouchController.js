// backend/controllers/vouchController.js
const {
  getVouchesForDepo,
  addVouch,
  removeVouch
} = require('../models/vouch');
const { getDepoById } = require('../models/depo');

// Get vouches for a depo
const getDepoVouches = async (req, res) => {
  try {
    const depoId = req.params.id;
    const vouches = await getVouchesForDepo(depoId);
    res.json(vouches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a vouch to a depo
const createVouch = async (req, res) => {
  try {
    const depoId = req.params.id;
    
    // Check if depo exists
    const depo = await getDepoById(depoId);
    if (!depo) {
      return res.status(404).json({ error: 'Waste site not found' });
    }
    
    const vouch = await addVouch(depoId, req.user.id);
    res.status(201).json(vouch);
  } catch (error) {
    if (error.message === 'User has already vouched for this site') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

// Remove a vouch from a depo
const deleteVouch = async (req, res) => {
  try {
    const depoId = req.params.id;
    
    // Check if depo exists
    const depo = await getDepoById(depoId);
    if (!depo) {
      return res.status(404).json({ error: 'Waste site not found' });
    }
    
    await removeVouch(depoId, req.user.id);
    res.json({ message: 'Vouch removed successfully' });
  } catch (error) {
    if (error.message === 'User has not vouched for this site') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = {
  getDepoVouches,
  createVouch,
  deleteVouch
};
