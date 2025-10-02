import nodemailer from 'nodemailer';
import { decrypt } from '../utils/encryption.js';

// Create transporter function
const createTransporter = () => {
  // Debug: Check decrypted password
  const decryptedPass = decrypt(process.env.EMAIL_PASS);
  console.log('🔧 Email Debug:', {
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS_ENCRYPTED: process.env.EMAIL_PASS ? 'Set' : 'Missing',
    EMAIL_PASS_DECRYPTED: decryptedPass ? 'Decrypted Successfully' : 'Decryption Failed'
  });

  if (process.env.TESTING_MODE === 'true') {
    return {
      sendMail: (options) => {
        console.log('📧 Email would be sent (TESTING MODE):');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('✅ Email sent successfully (simulated)');
        return Promise.resolve({ messageId: 'test-' + Date.now() });
      }
    };
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: decryptedPass
    }
  });
};

// Send verification email
export const sendVerificationEmail = async (email, token, name) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.BACKEND_URL}/api/auth/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome ${name}!</h2>
        <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
        
        <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Verify Email Address
        </a>
        
        <p>If you didn't create this account, please ignore this email.</p>
        <p>This verification link will expire in 24 hours.</p>
        
        <p>Best regards,<br>Your App Team</p>
      </div>
    `
  };

   try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully');
  } catch (err) {
    console.error('❌ Nodemailer sendMail error:', err); // <-- Yahan full error print hoga
    throw err;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, token, name) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        
        <a href="${resetUrl}" style="background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        
        <p><strong>Important:</strong></p>
        <ul>
          <li>This link will expire in 15 minutes</li>
          <li>This link can only be used once</li>
          <li>If you didn't request this, please ignore this email</li>
        </ul>
        
        <p>For security reasons, please do not share this link with anyone.</p>
        
        <p>Best regards,<br>Your App Team</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send welcome email after first login
export const sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🎉 Welcome to LikeMind Connect!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px;">
        <h1 style="text-align: center; margin-bottom: 30px;">🎉 Welcome ${name}!</h1>
        
        <div style="background: white; color: #333; padding: 30px; border-radius: 10px; margin: 20px 0;">
          <h2 style="color: #4F46E5; text-align: center;">You're all set! 🚀</h2>
          
          <p>Congratulations on joining <strong>LikeMind Connect</strong> - where meaningful connections happen!</p>
          
          <h3 style="color: #4F46E5; margin-top: 30px;">🌟 What you can do now:</h3>
          <ul style="line-height: 1.8;">
            <li><strong>🎯 Set up your profile</strong> - Add your hobbies and interests</li>
            <li><strong>🔍 Find connections</strong> - Discover people with similar interests</li>
            <li><strong>💬 Start chatting</strong> - Connect with your matches instantly</li>
            <li><strong>🎨 Share your passions</strong> - Upload photos and videos</li>
            <li><strong>🔔 Get notifications</strong> - Never miss a new connection</li>
          </ul>
          
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4F46E5;">
            <h4 style="color: #4F46E5; margin-top: 0;">💡 Pro Tip:</h4>
            <p style="margin-bottom: 0;">Complete your profile with detailed hobbies to get better matches. The more specific you are, the better connections you'll find!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              🚀 Start Exploring
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="margin: 0;">Happy connecting! 🎉</p>
          <p style="margin: 5px 0 0 0;"><strong>The LikeMind Connect Team</strong></p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};
