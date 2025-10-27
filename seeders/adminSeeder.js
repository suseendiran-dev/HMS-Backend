const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const adminUsers = [
  {
    name: 'Admin User',
    email: 'admin@healthcare.com',
    password: 'Admin@123',
    phone: '+1234567890',
    role: 'admin',
    isActive: true,
    isApproved: true, // Admin is auto-approved
  },
  {
    name: 'John Doe',
    email: 'patient@healthcare.com',
    password: 'Patient',
    phone: '+1234567894',
    role: 'patient',
    dateOfBirth: new Date('1990-05-15'),
    gender: 'Male',
    address: '123 Main Street, New York, NY 10001',
    isActive: true,
    isApproved: true, // Patients are auto-approved
  },
];

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected...');

    for (const userData of adminUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      const user = await User.create(userData);
      console.log(`✓ Created ${user.role}: ${user.name} (${user.email})`);
    }

    console.log('\n=== Seeding completed successfully ===');
    console.log('\nDefault Login Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Admin:');
    console.log('  Email: admin@healthcare.com');
    console.log('  Password: Admin@123');
    console.log('\nPatient:');
    console.log('  Email: patient@healthcare.com');
    console.log('  Password: Patient');
    console.log('\nNote: All users are pre-approved for testing.');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedAdmins();
