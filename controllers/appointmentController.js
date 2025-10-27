const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendSMS } = require('../utils/twilioService');
const { sendEmail, appointmentConfirmationEmail } = require('../utils/emailService');

// Create appointment
const createAppointment = async (req, res) => {
  try {
    const { doctor, appointmentDate, appointmentTime, department, reason } = req.body;

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor,
      appointmentDate,
      appointmentTime,
      department,
      reason,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone');

    // Send SMS notification
    const smsMessage = `Appointment request received. Date: ${appointmentDate}, Time: ${appointmentTime}. Awaiting doctor confirmation.`;
    await sendSMS(populatedAppointment.patient.phone, smsMessage);

    // Send email notification
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 0; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
          .footer { text-align: center; padding: 16px; font-size: 12px; color: #6b7280; background: #f8fafc; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Appointment Request Submitted</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 16px;">Dear ${populatedAppointment.patient.name},</p>
            <p style="margin-bottom: 16px;">Your appointment request has been submitted successfully.</p>
            
            <div style="background: #f8fafc; padding: 16px; border-radius: 4px; margin: 16px 0;">
              <p style="margin: 0; font-weight: 600; margin-bottom: 8px;">Appointment Details:</p>
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 4px;"><strong>Doctor:</strong> Dr. ${populatedAppointment.doctor.name}</li>
                <li style="margin-bottom: 4px;"><strong>Department:</strong> ${department}</li>
                <li style="margin-bottom: 4px;"><strong>Date:</strong> ${appointmentDate}</li>
                <li style="margin-bottom: 0;"><strong>Time:</strong> ${appointmentTime}</li>
              </ul>
            </div>
            
            <p>You will receive a confirmation email once the doctor approves your appointment request.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Healthcare Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    await sendEmail(populatedAppointment.patient.email, 'Appointment Request Submitted', emailHtml);

    res.status(201).json(populatedAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get appointments
const getAppointments = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone specialization')
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;

    await appointment.save();

    // Send notifications based on status
    if (status === 'confirmed') {
      try {
        const smsMessage = `Your appointment with Dr. ${appointment.doctor.name} on ${appointment.appointmentDate} at ${appointment.appointmentTime} is CONFIRMED.`;
        
        // Check if patient phone number exists
        if (!appointment.patient.phone) {
          console.error('Patient phone number is missing for appointment:', appointment._id);
        } else {
          const result = await sendSMS(appointment.patient.phone, smsMessage);
          if (result && result.status === 'queued') {
            console.log('Confirmation SMS queued successfully. Message SID:', result.sid);
            console.log('Sent to formatted number:', result.to);
          } else {
            console.error('SMS sending might have failed:', result);
          }
        }

        const emailHtml = appointmentConfirmationEmail(
          appointment.patient.name,
          appointment.doctor.name,
          appointment.appointmentDate,
          appointment.appointmentTime
        );
        await sendEmail(appointment.patient.email, 'Appointment Confirmed', emailHtml);
      } catch (notificationError) {
        console.error('Error sending appointment confirmation notifications:', notificationError);
        // Continue execution even if notification fails
      }
    } else if (status === 'cancelled') {
      const smsMessage = `Your appointment with Dr. ${appointment.doctor.name} has been cancelled. Please contact us for rescheduling.`;
      await sendSMS(appointment.patient.phone, smsMessage);

      const emailHtml = `
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
              <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Appointment Cancelled</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 16px;">Dear ${appointment.patient.name},</p>
              <p style="margin-bottom: 16px;">We regret to inform you that your appointment has been cancelled.</p>
              
              <div style="background: #f8fafc; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p style="margin: 0; font-weight: 600; margin-bottom: 8px;">Cancelled Appointment Details:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 4px;"><strong>Doctor:</strong> Dr. ${appointment.doctor.name}</li>
                  <li style="margin-bottom: 4px;"><strong>Date:</strong> ${appointment.appointmentDate}</li>
                  <li style="margin-bottom: 0;"><strong>Time:</strong> ${appointment.appointmentTime}</li>
                </ul>
              </div>
              
              <p>Please contact us to reschedule your appointment at your earliest convenience.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Healthcare Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      await sendEmail(appointment.patient.email, 'Appointment Cancelled', emailHtml);
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all appointments (Admin only)
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone specialization')
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  getAllAppointments,
};
