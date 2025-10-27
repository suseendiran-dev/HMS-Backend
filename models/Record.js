const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
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
  visitDate: {
    type: Date,
    default: Date.now,
  },
  diagnosis: {
    type: String,
    required: [true, 'Please provide a diagnosis'],
  },
  prescription: {
    type: String,
  },
  testResults: {
    type: String,
  },
  notes: {
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
}, {
  timestamps: true,
});

module.exports = mongoose.model('Record', recordSchema);
