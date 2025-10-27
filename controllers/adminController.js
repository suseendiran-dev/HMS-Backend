const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { sendEmail } = require('../utils/emailService');

// Get pending doctors
const getPendingDoctors = async (req, res) => {
  try {
    const pendingDoctors = await User.find({ 
      role: 'doctor', 
      isApproved: false 
    }).select('-password');

    res.json({
      success: true,
      count: pendingDoctors.length,
      data: pendingDoctors,
    });
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch pending doctors' 
    });
  }
};

// Approve doctor
const approveDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        message: 'Doctor not found' 
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({ 
        success: false,
        message: 'User is not a doctor' 
      });
    }

    if (doctor.isApproved) {
      return res.status(400).json({ 
        success: false,
        message: 'Doctor is already approved' 
      });
    }

    // First save the doctor's approved status
    doctor.isApproved = true;
    doctor.approvedBy = req.user._id;
    doctor.approvedAt = new Date();
    await doctor.save();

    console.log('Doctor approved successfully, sending email notification...');
      
    // Prepare and send approval email
    const approvalEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 0; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
          .success-box { background: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 16px 0; }
          .button { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin-top: 16px; font-weight: 600; }
          .footer { text-align: center; padding: 16px; font-size: 12px; color: #6b7280; background: #f8fafc; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Account Approved</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 16px;">Dear Dr. <strong>${doctor.name}</strong>,</p>
            
            <div class="success-box">
              <p style="margin: 0; font-weight: 600; color: #065f46;">Congratulations!</p>
              <p style="margin: 8px 0 0 0; color: #374151; font-size: 14px;">Your doctor account has been approved by our administrative team. You can now login and start using the Healthcare Management System.</p>
            </div>

            <p style="font-weight: 600; margin-bottom: 8px;">Your Account Details:</p>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 4px;"><strong>Name:</strong> Dr. ${doctor.name}</li>
              <li style="margin-bottom: 4px;"><strong>Email:</strong> ${doctor.email}</li>
              <li style="margin-bottom: 4px;"><strong>Specialization:</strong> ${doctor.specialization}</li>
              <li style="margin-bottom: 4px;"><strong>Department:</strong> ${doctor.department}</li>
              <li style="margin-bottom: 0;"><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</li>
            </ul>
            
            <p style="margin-top: 16px; font-weight: 600; margin-bottom: 8px;">What's Next?</p>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 4px;">Log in to your account using your registered email and password</li>
              <li style="margin-bottom: 4px;">Complete your profile with additional information</li>
              <li style="margin-bottom: 4px;">Start managing patient appointments</li>
              <li style="margin-bottom: 0;">Access patient medical records</li>
            </ul>

            <div style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Login to Dashboard</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Healthcare Management System. All rights reserved.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail(
        doctor.email, 
        'Account Approved - Welcome to Healthcare System', 
        approvalEmailHtml
      );

      res.json({
        success: true,
        message: 'Doctor approved successfully and notification email sent',
        data: doctor,
      });
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      
      // Still return success since the doctor was approved, but indicate email failure
      res.json({
        success: true,
        message: 'Doctor approved successfully but failed to send email notification',
        data: doctor,
        emailError: emailError.message
      });
    }
  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to approve doctor',
      error: error.message
    });
  }
};

// Reject doctor
const rejectDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { reason } = req.body;

    const doctor = await User.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        message: 'Doctor not found' 
      });
    }

    if (doctor.role !== 'doctor') {
      return res.status(400).json({ 
        success: false,
        message: 'User is not a doctor' 
      });
    }

    doctor.rejectionReason = reason || 'Your application did not meet our requirements';
    await doctor.save();

    // Optionally delete the user or just mark as rejected
    await User.findByIdAndDelete(doctorId);

    // Send rejection email
    const rejectionEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 0; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
          .footer { text-align: center; padding: 16px; font-size: 12px; color: #6b7280; background: #f8fafc; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Application Update</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 16px;">Dear Dr. <strong>${doctor.name}</strong>,</p>
            <p style="margin-bottom: 16px;">Thank you for your interest in joining our Healthcare Management System.</p>
            <p style="margin-bottom: 16px;">After careful review, we regret to inform you that we are unable to approve your application at this time.</p>
            <p style="font-weight: 600; margin-bottom: 8px;">Reason:</p>
            <p style="background: #f8fafc; padding: 12px; border-left: 4px solid #dc2626; margin: 0;">${reason || 'Your application did not meet our current requirements.'}</p>
            <p style="margin-top: 16px;">If you have any questions or would like to discuss this decision, please contact our administrative team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Healthcare Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      doctor.email, 
      'Application Status Update', 
      rejectionEmailHtml
    );

    res.json({
      success: true,
      message: 'Doctor application rejected and notification sent',
    });
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reject doctor' 
    });
  }
};

// Get all doctors (approved and pending)
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('-password')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch doctors' 
    });
  }
};

// Get admin dashboard statistics
const getStats = async (req, res) => {
  try {
    // Use Promise.all for parallel execution and better performance
    const [
      totalPatients,
      totalDoctors,
      pendingDoctors,
      totalAppointments,
      pendingAppointments
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor', isApproved: true }),
      User.countDocuments({ 
        role: 'doctor', 
        $or: [
          { isApproved: false },
          { isApproved: { $exists: false } }
        ] 
      }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' })
    ]);

    // Log the results for debugging
    console.log('Stats results:', {
      totalPatients,
      totalDoctors,
      pendingDoctors,
      totalAppointments,
      pendingAppointments
    });

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

module.exports = {
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  getAllDoctors,
  getStats,
};
