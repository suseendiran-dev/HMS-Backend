const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Function to format phone number to E.164 format
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, remove it (common in India)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // If doesn't start with country code, add +91 for India
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  
  // Add + prefix if not present
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

const sendSMS = async (to, message) => {
  try {
    // Format the phone number to E.164
    const formattedPhone = formatPhoneNumber(to);
    
    // Additional validation
    if (!formattedPhone.startsWith('+91')) {
      throw new Error('Invalid Indian phone number format');
    }
    
    console.log(`Original phone number: ${to}`);
    console.log(`Formatted phone number: ${formattedPhone}`);
    console.log(`Using Twilio phone number: ${process.env.TWILIO_PHONE_NUMBER}`);
    
    // Validate Twilio configuration
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio configuration is incomplete');
    }
    
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });
    
    if (result.errorCode) {
      throw new Error(`Twilio Error: ${result.errorCode} - ${result.errorMessage}`);
    }
    
    console.log(`SMS sent successfully: ${result.sid}`);
    console.log(`Message status: ${result.status}`);
    console.log(`Destination number: ${result.to}`);
    console.log(`Message direction: ${result.direction}`);
    console.log(`Price: ${result.price} ${result.priceUnit}`);
    
    // Check message status
    if (result.status === 'failed') {
      throw new Error(`Message failed with status: ${result.status}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Don't throw error - just log it (SMS is optional)
    // This prevents the entire operation from failing if SMS fails
    return null;
  }
};

module.exports = { sendSMS };
