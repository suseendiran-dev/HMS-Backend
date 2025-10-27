const express = require('express');
const {
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  getAllDoctors,
  getStats,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/stats', protect, authorize('admin'), getStats);
router.get('/doctors/pending', protect, authorize('admin'), getPendingDoctors);
router.get('/doctors', protect, authorize('admin'), getAllDoctors);
router.put('/doctors/:doctorId/approve', protect, authorize('admin'), approveDoctor);
router.put('/doctors/:doctorId/reject', protect, authorize('admin'), rejectDoctor);

module.exports = router;
