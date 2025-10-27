const mongoose = require('mongoose');

const patientRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  diagnosis: {
    type: String,
    required: true,
  },
  prescription: {
    type: String,
  },
  testResults: {
    type: String,
  },
  documents: [{
    filename: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  }],
  visitDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PatientRecord', patientRecordSchema);
