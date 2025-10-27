const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, specialization, department, experience, dateOfBirth, gender, address } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields: name, email, password, and phone' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Validate doctor-specific fields
    if (role === 'doctor' && (!specialization || !department)) {
      return res.status(400).json({ 
        success: false,
        message: 'Specialization and department are required for doctors' 
      });
    }

    // Create user data
    const userData = {
      name,
      email,
      password,
      phone,
      role: role || 'patient',
    };

    // Add doctor-specific fields
    if (role === 'doctor') {
      userData.specialization = specialization;
      userData.department = department;
      userData.isApproved = false; // Doctors need approval
      if (experience) userData.experience = experience;
    }

    // Add optional fields
    if (dateOfBirth) userData.dateOfBirth = dateOfBirth;
    if (gender) userData.gender = gender;
    if (address) userData.address = address;

    const user = await User.create(userData);

    // Send different emails based on role
    if (role === 'doctor') {
      // Email for doctor - pending approval
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 0; }
              .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #ffffff; border: 1px solid #e5e7eb; border-top: none; }
              .warning-box { background: #f8fafc; border-left: 4px solid #e5e7eb; padding: 12px 16px; margin: 16px 0; }
              .footer { text-align: center; padding: 16px; font-size: 12px; color: #6b7280; background: #f8fafc; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Registration Received</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px; margin-bottom: 16px;">Dear Dr. <strong>${name}</strong>,</p>
                <p style="margin-bottom: 16px;">Thank you for registering with our Healthcare Management System.</p>
                
                <div class="warning-box">
                  <p style="margin: 0; font-weight: 600; color: #374151;">Pending Admin Approval</p>
                  <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 14px;">Your account is currently under review by our administrative team. You will receive an email notification once your account has been approved.</p>
                </div>

                <p style="font-weight: 600; margin-bottom: 8px;">Registration Details:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 4px;"><strong>Name:</strong> Dr. ${name}</li>
                  <li style="margin-bottom: 4px;"><strong>Email:</strong> ${email}</li>
                  <li style="margin-bottom: 4px;"><strong>Specialization:</strong> ${specialization}</li>
                  <li style="margin-bottom: 0;"><strong>Department:</strong> ${department}</li>
                </ul>
                
                <p style="margin-top: 16px;">Please wait for admin approval before attempting to log in.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Healthcare Management System. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        await sendEmail(email, 'Registration Received - Pending Approval', emailHtml);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail registration if email fails
      }

      return res.status(201).json({
        success: true,
        message: 'Registration successful! Your account is pending admin approval. You will receive an email once approved.',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isApproved: user.isApproved,
        },
      });
    } else {
      // Email for patient (auto-approved)
      try {
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
                <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Welcome to Healthcare System</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px; margin-bottom: 16px;">Dear <strong>${name}</strong>,</p>
                <p style="margin-bottom: 16px;">Your account has been created successfully! You can now log in and access our services.</p>
                <p style="font-weight: 600; margin-bottom: 8px;">Account Details:</p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 4px;"><strong>Email:</strong> ${email}</li>
                  <li style="margin-bottom: 0;"><strong>Role:</strong> ${role || 'Patient'}</li>
                </ul>
                <p style="margin-top: 16px;">You can now book appointments, view medical records, and communicate with our healthcare professionals.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Healthcare Management System. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        await sendEmail(email, 'Welcome to Healthcare System', emailHtml);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail registration if email fails
      }

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          token,
        },
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if doctor is approved
    if (user.role === 'doctor' && !user.isApproved) {
      return res.status(403).json({ 
        success: false,
        message: 'Your account is pending admin approval. You will receive an email once your account is approved.' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        success: false,
        message: 'Your account has been deactivated. Please contact support.' 
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        specialization: user.specialization,
        department: user.department,
        isApproved: user.isApproved,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Login failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch profile' 
    });
  }
};

module.exports = { register, login, getProfile };
