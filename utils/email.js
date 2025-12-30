/**
 * MovieBuzz - Real Email OTP System
 * 
 * Sends real OTP emails to users using Gmail SMTP (FREE)
 * 
 * Setup Required:
 * 1. Go to your Gmail account settings
 * 2. Enable 2-Step Verification
 * 3. Create an App Password (Google Account → Security → App Passwords)
 * 4. Set EMAIL_USER and EMAIL_PASS on Render
 */

const nodemailer = require('nodemailer');

// Create Gmail transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,  // Your Gmail address
      pass: process.env.EMAIL_PASS   // Gmail App Password (16 characters)
    }
  });
};

// Beautiful HTML email template
const createEmailTemplate = (otp, username) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f1a; font-family: 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f1a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 480px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%); border-radius: 24px; border: 2px solid #e50914; overflow: hidden; box-shadow: 0 25px 80px rgba(229, 9, 20, 0.4);">
              
              <!-- Header -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 40px 30px; text-align: center;">
                    <div style="font-size: 56px; margin-bottom: 12px;">🎬</div>
                    <h1 style="margin: 0; color: white; font-size: 36px; font-weight: 800; text-shadow: 3px 3px 6px rgba(0,0,0,0.4);">MovieBuzz</h1>
                    <p style="margin: 10px 0 0; color: rgba(255,255,255,0.95); font-size: 13px; letter-spacing: 4px; text-transform: uppercase;">Your Movie Gallery</p>
                  </td>
                </tr>
              </table>
              
              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 45px 35px;">
                    <h2 style="color: #ffffff; margin: 0 0 20px; font-size: 26px; font-weight: 600;">
                      ✉️ Email Verification
                    </h2>
                    <p style="color: #b8b8b8; margin: 0 0 35px; font-size: 16px; line-height: 1.8;">
                      Hi <strong style="color: #e50914;">${username || 'there'}</strong>,<br><br>
                      Welcome to MovieBuzz! Use the code below to verify your email address and complete your registration.
                    </p>
                    
                    <!-- OTP Box -->
                    <div style="background: linear-gradient(145deg, #e50914 0%, #ff2d2d 50%, #b20710 100%); border-radius: 20px; padding: 35px 25px; text-align: center; margin: 30px 0; box-shadow: 0 15px 40px rgba(229, 9, 20, 0.5);">
                      <p style="color: rgba(255,255,255,0.9); margin: 0 0 15px; font-size: 12px; text-transform: uppercase; letter-spacing: 4px; font-weight: 600;">Your Verification Code</p>
                      <div style="background: rgba(0,0,0,0.25); border-radius: 12px; padding: 20px 30px; display: inline-block;">
                        <h1 style="color: white; margin: 0; font-size: 52px; letter-spacing: 14px; font-family: 'Courier New', monospace; font-weight: 800; text-shadow: 3px 3px 6px rgba(0,0,0,0.4);">${otp}</h1>
                      </div>
                    </div>
                    
                    <!-- Warning -->
                    <div style="background: rgba(229, 9, 20, 0.12); border-left: 5px solid #e50914; padding: 18px 22px; border-radius: 0 12px 12px 0; margin: 30px 0;">
                      <p style="color: #e8e8e8; margin: 0; font-size: 14px; line-height: 1.6;">
                        ⏱️ This code will expire in <strong style="color: #e50914;">10 minutes</strong>
                      </p>
                    </div>
                    
                    <p style="color: #777; margin: 0; font-size: 13px; line-height: 1.7;">
                      If you didn't create an account on MovieBuzz, please ignore this email. Your email address won't be used.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #0a0a12; padding: 28px 35px; text-align: center; border-top: 1px solid #2a2a3e;">
                    <p style="color: #555; margin: 0 0 8px; font-size: 12px;">
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

// Send OTP Email to user's email address
const sendOtpEmail = async (email, otp, username) => {
  // Check if Gmail credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('⚠️  EMAIL NOT CONFIGURED - Showing OTP on screen');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('To send real emails, set these environment variables:');
    console.log('  EMAIL_USER = your-gmail@gmail.com');
    console.log('  EMAIL_PASS = your-16-char-app-password');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 OTP: ${otp}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    return { 
      success: true, 
      demo: true, 
      otp: otp,
      message: 'Email not configured - OTP displayed on screen'
    };
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'MovieBuzz',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🎬 MovieBuzz - Your Verification Code',
      html: createEmailTemplate(otp, username)
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log(`📧 To: ${email}`);
    console.log(`👤 User: ${username || 'N/A'}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    return { 
      success: true, 
      demo: false,
      message: 'OTP sent to email successfully'
    };
  } catch (error) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ EMAIL SEND FAILED');
    console.log(`Error: ${error.message}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Falling back to demo mode...');
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 OTP: ${otp}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    // Fallback to demo mode if email fails
    return { 
      success: true, 
      demo: true, 
      otp: otp,
      error: error.message 
    };
  }
};

module.exports = { sendOtpEmail };
