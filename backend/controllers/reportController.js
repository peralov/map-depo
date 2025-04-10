// backend/controllers/reportController.js
const {
  getAllReports,
  getReportsForDepo,
  getReportsByUser,
  addReport,
  getReportById,
  updateReportStatus,
  deleteReport
} = require('../models/report');
const { getDepoById } = require('../models/depo');

// Get all reports (admin only)
const getReports = async (req, res) => {
  try {
    // Check if user is admin (middleware should handle this, but double check)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin permission required.' });
    }
    
    const reports = await getAllReports();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reports for a specific depo
const getDepoReports = async (req, res) => {
  try {
    const depoId = req.params.id;
    const reports = await getReportsForDepo(depoId);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get reports submitted by the current user
const getUserReports = async (req, res) => {
  try {
    const reports = await getReportsByUser(req.user.id);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new report
const submitReport = async (req, res) => {
  try {
    const depoId = req.params.id;
    const { details } = req.body;
    
    if (!details) {
      return res.status(400).json({ error: 'Report details are required' });
    }
    
    // Check if depo exists
    const depo = await getDepoById(depoId);
    if (!depo) {
      return res.status(404).json({ error: 'Depo not found' });
    }
    
    const report = await addReport(depoId, req.user.id, details);
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update report status (admin only)
const changeReportStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin permission required.' });
    }
    
    const reportId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const updatedReport = await updateReportStatus(reportId, status);
    res.json(updatedReport);
  } catch (error) {
    if (error.message === 'Invalid status value') {
      return res.status(400).json({ error: error.message });
    } else if (error.message === 'Report not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete a report
const removeReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    
    // Check if report exists and user has permission
    const report = await getReportById(reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Check if user is the reporter or an admin
    if (report.reporter_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this report' });
    }
    
    await deleteReport(reportId);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getReports,
  getDepoReports,
  getUserReports,
  submitReport,
  changeReportStatus,
  removeReport
};
