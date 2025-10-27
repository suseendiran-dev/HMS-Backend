const express = require('express');
const {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  getAllAppointments,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const router = express.Router();

router.post('/', protect, authorize('patient'), createAppointment);
router.get('/', protect, getAppointments);
router.get('/all', protect, authorize('admin'), getAllAppointments);
router.put('/:id/status', protect, authorize('doctor', 'admin'), updateAppointmentStatus);

module.exports = router;
