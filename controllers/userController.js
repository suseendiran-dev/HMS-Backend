const User = require('../models/User');
const Record = require('../models/Record');
const Appointment = require('../models/Appointment');

// Get dashboard statistics (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor', isApproved: true });
    const pendingDoctors = await User.countDocuments({ role: 'doctor', isApproved: false });
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        pendingDoctors,
        totalAppointments,
        pendingAppointments,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all doctors by department
const getDoctors = async (req, res) => {
  try {
    const { department } = req.query;
    const query = { role: 'doctor', isApproved: true }; // Only approved doctors
    
    if (department) {
      query.department = department;
    }

    const doctors = await User.find(query).select('-password');
    
    res.json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch doctors',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all patients (for doctors)
const getPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('-password');
    
    res.json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch patients',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get patient records
const getPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    let query = {};
    
    // If user is patient, only show their records
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (patientId) {
      // Doctor or admin viewing specific patient records
      query.patient = patientId;
    }

    const records = await Record.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization department')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create medical record (doctor only)
const createPatientRecord = async (req, res) => {
  try {
    const { patient, diagnosis, prescription, testResults, notes } = req.body;

    // Validate required fields
    if (!patient || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and diagnosis are required',
      });
    }

    // Check if patient exists
    const patientExists = await User.findById(patient);
    if (!patientExists || patientExists.role !== 'patient') {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const record = await Record.create({
      patient,
      doctor: req.user._id,
      diagnosis,
      prescription,
      testResults,
      notes,
      visitDate: new Date(),
    });

    const populatedRecord = await Record.findById(record._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization department');

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: populatedRecord,
    });
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Upload document to record
const uploadDocument = async (req, res) => {
  try {
    const { recordId } = req.params;

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Please upload a file' 
      });
    }

    const record = await Record.findById(recordId);

    if (!record) {
      return res.status(404).json({ 
        success: false,
        message: 'Record not found' 
      });
    }

    // Check if the doctor owns this record
    if (record.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this record',
      });
    }

    // Add document to record
    record.documents.push({
      filename: req.file.originalname,
      path: req.file.path,
      uploadDate: new Date(),
    });

    await record.save();

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: record,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload document',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getDashboardStats,
  getDoctors,
  getPatients,
  getPatientRecords,
  createPatientRecord,
  uploadDocument,
};
