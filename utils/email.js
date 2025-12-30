const nodemailer = require('nodemailer');

/**
 * Email OTP Service for MovieBuzz
 * 
 * Supports multiple free email providers:
 * 1. Brevo (Sendinblue) - 300 free emails/day (RECOMMENDED)
 * 2. Gmail - requires App Password
 * 
 * Environment Variables:
 * - EMAIL_PROVIDER: 'brevo' or 'gmail' (default: 'brevo')
 * - EMAIL_USER: Your email address
 * - EMAIL_PASS: SMTP key (Brevo) or App Password (Gmail)
 */

// Create transporter based on provider
const createTransporter = () => {
  const provider = (process.env.EMAIL_PROVIDER || 'brevo').toLowerCase();
  
  if (provider === 'gmail') {
    // Gmail configuration
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  // Brevo (Sendinblue) - FREE 300 emails/day
  return nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Brevo SMTP Key
    }
  });
};

// Generate beautiful HTML email template
const generateEmailTemplate = (otp, username) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a2e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px;" cellpadding="0" cellspacing="0">
          <!-- Card -->
          <tr>
            <td style="background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%); border-radius: 20px; border: 2px solid #e50914; overflow: hidden; box-shadow: 0 20px 60px rgba(229, 9, 20, 0.3);">
              
              <!-- Header -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 35px; text-align: center;">
                    <div style="font-size: 50px; margin-bottom: 10px;">🎬</div>
                    <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">MovieBuzz</h1>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; letter-spacing: 2px;">YOUR MOVIE GALLERY</p>
                  </td>
                </tr>
              </table>
              
              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 40px 35px;">
                    <h2 style="color: white; margin: 0 0 15px; font-size: 24px;">
                      ✉️ Email Verification
                    </h2>
                    <p style="color: #b0b0b0; margin: 0 0 30px; font-size: 16px; line-height: 1.7;">
                      Hi <strong style="color: #e50914;">${username || 'there'}</strong>,<br><br>
                      Welcome to MovieBuzz! Enter the code below to verify your email and start exploring movies.
                    </p>
                    
                    <!-- OTP Box -->
                    <div style="background: linear-gradient(135deg, #e50914 0%, #ff4757 100%); border-radius: 16px; padding: 30px; text-align: center; margin: 25px 0; box-shadow: 0 10px 30px rgba(229, 9, 20, 0.4);">
                      <p style="color: rgba(255,255,255,0.85); margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 3px;">Verification Code</p>
                      <h1 style="color: white; margin: 0; font-size: 48px; letter-spacing: 12px; font-family: 'Courier New', monospace; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${otp}</h1>
                    </div>
                    
                    <div style="background: rgba(229, 9, 20, 0.1); border-left: 4px solid #e50914; padding: 15px 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
                      <p style="color: #e0e0e0; margin: 0; font-size: 14px;">
                        ⏱️ This code expires in <strong style="color: #e50914;">10 minutes</strong>
                      </p>
                    </div>
                    
                    <p style="color: #888; margin: 0; font-size: 13px; line-height: 1.6;">
                      If you didn't create an account on MovieBuzz, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #0d0d1a; padding: 25px 35px; text-align: center; border-top: 1px solid #2a2a4a;">
                    <p style="color: #555; margin: 0 0 10px; font-size: 12px;">
                      © ${new Date().getFullYear()} MovieBuzz. All rights reserved.
                    </p>
                    <p style="color: #444; margin: 0; font-size: 11px;">
                      This is an automated message. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Send OTP Email
const sendOtpEmail = async (email, otp, username) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email not configured - Demo Mode');
      console.log(`   Email: ${email}`);
      console.log(`   OTP: ${otp}`);
      return { success: true, demo: true, otp };
    }

    const transporter = createTransporter();
    const provider = process.env.EMAIL_PROVIDER || 'brevo';

    const mailOptions = {
      from: {
        name: 'MovieBuzz',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🎬 MovieBuzz - Your Verification Code',
      html: generateEmailTemplate(otp, username)
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP sent via ${provider} to ${email}`);
    return { success: true, demo: false };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    // Fallback to demo mode if email fails
    console.log(`📧 Fallback to demo mode - OTP: ${otp}`);
    return { success: true, demo: true, otp, error: error.message };
  }
};

module.exports = { sendOtpEmail };
