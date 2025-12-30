const nodemailer = require('nodemailer');

// Create transporter using Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Gmail App Password
    }
  });
};

// Send OTP Email
const sendOtpEmail = async (email, otp, username) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('📧 Email not configured. OTP for demo:', otp);
      return { success: true, demo: true, otp };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'MovieBuzz',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🎬 MovieBuzz - Email Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #1a1a2e; font-family: Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a2e; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #16213e 0%, #1a1a2e 100%); border-radius: 16px; border: 1px solid #e50914; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(90deg, #e50914 0%, #b20710 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: white; font-size: 28px;">🎬 MovieBuzz</h1>
                      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your Movie Gallery Platform</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: white; margin: 0 0 20px; font-size: 22px;">Email Verification</h2>
                      <p style="color: #a0a0a0; margin: 0 0 30px; font-size: 16px; line-height: 1.6;">
                        Hi <strong style="color: white;">${username || 'there'}</strong>,<br><br>
                        Welcome to MovieBuzz! Use the verification code below to complete your registration:
                      </p>
                      
                      <!-- OTP Box -->
                      <div style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                        <p style="color: rgba(255,255,255,0.8); margin: 0 0 10px; font-size: 14px;">Your Verification Code</p>
                        <h1 style="color: white; margin: 0; font-size: 42px; letter-spacing: 8px; font-family: monospace;">${otp}</h1>
                      </div>
                      
                      <p style="color: #a0a0a0; margin: 0; font-size: 14px; line-height: 1.6;">
                        ⏰ This code expires in <strong style="color: #e50914;">10 minutes</strong>.<br><br>
                        If you didn't request this code, please ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0f0f1a; padding: 20px 30px; text-align: center; border-top: 1px solid #333;">
                      <p style="color: #666; margin: 0; font-size: 12px;">
                        © ${new Date().getFullYear()} MovieBuzz. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent to ${email}`);
    return { success: true, demo: false };
  } catch (error) {
    console.error('Email send error:', error);
    // Return OTP for demo mode if email fails
    return { success: true, demo: true, otp, error: error.message };
  }
};

module.exports = { sendOtpEmail };

