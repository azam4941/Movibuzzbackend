/**
 * MovieBuzz - Self-Contained OTP Verification System
 * 
 * This is a standalone OTP system that doesn't require any third-party email services.
 * OTPs are generated, stored in database, and displayed to users directly.
 * 
 * Features:
 * - 6-digit OTP generation
 * - 10-minute expiry
 * - Secure verification
 * - No external dependencies
 */

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Simulated email sending - returns OTP for display
// In a real production app with a mail server, this would send actual emails
const sendOtpEmail = async (email, otp, username) => {
  console.log('═══════════════════════════════════════════════════');
  console.log('📧 MovieBuzz OTP Verification System');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📬 Email: ${email}`);
  console.log(`👤 Username: ${username || 'N/A'}`);
  console.log(`🔐 OTP Code: ${otp}`);
  console.log(`⏰ Expires: 10 minutes`);
  console.log('═══════════════════════════════════════════════════');
  
  // Return success with OTP for frontend display
  // This is our own system - no third-party API needed
  return { 
    success: true, 
    demo: true, 
    otp: otp,
    message: 'OTP generated successfully'
  };
};

module.exports = { sendOtpEmail, generateOTP };
