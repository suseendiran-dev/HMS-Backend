const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

// Log email configuration for debugging
console.log('Email Configuration:', {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS ? '****' : 'not set' // Hide actual password
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  // Validate required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS environment variables.');
  }

  try {
    // Test the connection before sending
    console.log('Testing email connection...');
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) {
          console.error('Email verification failed:', error);
          reject(error);
        } else {
          console.log('Email server is ready to send messages');
          resolve(success);
        }
      });
    });

    const mailOptions = {
      from: `Healthcare System <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    };

    console.log('Attempting to send email to:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email service error:', {
      error: error.message,
      code: error.code,
      command: error.command,
      user: process.env.EMAIL_USER,
      service: 'gmail'
    });
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const appointmentConfirmationEmail = (patientName, doctorName, date, time) => {
  return `
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
          <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Appointment Confirmed</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; margin-bottom: 16px;">Dear ${patientName},</p>
          <p style="margin-bottom: 16px;">Your appointment has been confirmed with the following details:</p>
          
          <div style="background: #f8fafc; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 0; font-weight: 600; margin-bottom: 8px;">Appointment Details:</p>
            <ul style="margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 4px;"><strong>Doctor:</strong> Dr. ${doctorName}</li>
              <li style="margin-bottom: 4px;"><strong>Date:</strong> ${date}</li>
              <li style="margin-bottom: 0;"><strong>Time:</strong> ${time}</li>
            </ul>
          </div>
          
          <p style="margin-bottom: 16px;">Please arrive 10 minutes early for your appointment.</p>
          <p>Thank you for choosing our healthcare service.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Healthcare Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = { sendEmail, appointmentConfirmationEmail };
