import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';
import { createWelcomeChat } from '../services/firstLoginService.js';

// Generate JWT token
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Email validation
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasCapital = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    valid: minLength && hasCapital && hasSpecial,
    errors: {
      minLength: !minLength ? 'Password must be at least 8 characters' : null,
      hasCapital: !hasCapital ? 'Password must contain at least 1 capital letter' : null,
      hasSpecial: !hasSpecial ? 'Password must contain at least 1 special character' : null
    }
  };
};

// 🔥 SIGNUP
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Email validation
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Lowercase email
    const trimmedEmail = email.toLowerCase().trim();

    // Optional: Gmail domain check
    if (!trimmedEmail.endsWith('@gmail.com')) {
      return res.status(400).json({ message: 'Only Gmail accounts are allowed' });
    }

    // Password validation
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        message: 'Password requirements not met',
        errors: passwordCheck.errors
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user (auto-verify in testing mode)
    // FIX: Save password as `password`, not `passwordHash`, to match schema!
    const user = new User({
      name,
      email: trimmedEmail,
      password: passwordHash,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      isVerified: process.env.TESTING_MODE === 'true' // Auto-verify in testing mode
    });

    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(trimmedEmail, verificationToken, name);
      console.log('✅ Verification email sent successfully to:', trimmedEmail);
    } catch (emailError) {
      console.log('❌ Email failed:', emailError.message);
      // In testing mode, continue without email
      if (process.env.TESTING_MODE !== 'true') {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Email sending failed' });
      }
    }

    const message = process.env.TESTING_MODE === 'true'
      ? 'Account created and verified! You can now login.'
      : 'Account created! Please check your email to verify your account.';

    res.status(201).json({
      message,
      email: trimmedEmail,
      autoVerified: process.env.TESTING_MODE === 'true'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔥 EMAIL VERIFICATION
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    console.log('📧 Verification request received for token:', token);

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('❌ Invalid or expired token');
      const errorUrl = `${process.env.FRONTEND_URL}/verify-email?status=error&message=Invalid or expired verification token`;
      return res.send(`
        <html>
          <head>
            <title>Email Verification</title>
            <meta http-equiv="refresh" content="0; url=${errorUrl}">
          </head>
          <body>
            <h2>❌ Verification Failed</h2>
            <p>Invalid or expired token. Redirecting...</p>
            <p>If not redirected, <a href="${errorUrl}">click here</a></p>
          </body>
        </html>
      `);
    }

    console.log('✅ User found, verifying email for:', user.email);
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();
    console.log('✅ User verified successfully, redirecting to frontend');

    // Redirect to frontend with success status
    const successUrl = `${process.env.FRONTEND_URL}/verify-email?status=success&message=Email verified successfully`;
    res.redirect(successUrl);

  } catch (error) {
    console.error('❌ Verification error:', error);
    const errorUrl = `${process.env.FRONTEND_URL}/verify-email?status=error&message=Server error occurred`;
    res.send(`
      <html>
        <head>
          <title>Email Verification</title>
          <meta http-equiv="refresh" content="0; url=${errorUrl}">
        </head>
        <body>
          <h2>❌ Server Error</h2>
          <p>An error occurred. Redirecting...</p>
          <p>If not redirected, <a href="${errorUrl}">click here</a></p>
        </body>
      </html>
    `);
  }
};

// 🔥 LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Find user
    const user = await User.findOne({ email: trimmedEmail });
    // Defensive: check for user/password existence!
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if this is first login
    const isFirstLogin = user.isFirstLogin;

    // Create welcome chat for first-time users
    if (isFirstLogin) {
      try {
        await createWelcomeChat(user._id, user.name);
        // Send welcome email
        await sendWelcomeEmail(user.email, user.name);
      } catch (error) {
        console.error('Failed to create welcome chat or send welcome email:', error);
      }
    }

    // Update last login timestamp and set first login to false
    user.lastLogin = new Date();
    user.isFirstLogin = false;
    await user.save();

    // Generate secure JWT token
    const token = generateToken(user._id, user.email);

    // Set secure HTTP-only cookie for additional security
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    };

    res.cookie('authToken', token, cookieOptions);

    // Successful login response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        profile_picture: user.profile_picture,
        lastLogin: user.lastLogin
      },
      isFirstLogin,
      redirectTo: '/dashboard'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔥 LOGOUT
export const logout = async (req, res) => {
  try {
    // Clear the HTTP-only cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔥 FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: trimmedEmail });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        message: 'If an account exists, a password reset link has been sent'
      });
    }

    // Generate secure single-use token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Clear any existing reset tokens
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Send reset email
    try {
      await sendPasswordResetEmail(trimmedEmail, resetToken, user.name);
    } catch (emailError) {
      console.error('Password reset email failed:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      if (process.env.TESTING_MODE !== 'true') {
        return res.status(500).json({ message: 'Email sending failed' });
      }
    }

    res.status(200).json({
      message: 'If an account exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔥 RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Validate password
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        message: 'Password requirements not met',
        errors: passwordCheck.errors
      });
    }

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and clear reset token (single-use)
    user.password = passwordHash; // FIX: Save as password, not passwordHash!
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔥 GET USER PROFILE
export const getMe = async (req, res) => {
  try {
    // FIX: Do NOT select passwordHash, select -password for security
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
