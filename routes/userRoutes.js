const express = require('express');
const {
  getDoctors,
  getPatients,
  createPatientRecord,
  getPatientRecords,
  uploadDocument,
  getDashboardStats,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/doctors', protect, getDoctors);
router.get('/patients', protect, authorize('doctor', 'admin'), getPatients);
router.post('/records', protect, authorize('doctor'), createPatientRecord);
router.get('/records', protect, getPatientRecords);
router.get('/records/:patientId', protect, authorize('doctor', 'admin'), getPatientRecords);
router.post('/records/:recordId/upload', protect, authorize('doctor'), uploadDocument);
router.get('/stats', protect, authorize('admin'), getDashboardStats);

module.exports = router;
