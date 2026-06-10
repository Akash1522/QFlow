import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { sendOtpEmail } from '../utils/emailService.js';
import otpService from '../services/otpService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'qflow_super_secret_key_2026', {
    expiresIn: '30d',
  });
};

const validatePasswordComplexity = (password) => {
  // Minimum 8 characters, at least 1 letter and 1 number
  const regex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
};

export const sendOtp = async (req, res) => {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const otp = await otpService.generateOtp(email, 'register');
        const emailSent = await sendOtpEmail(email, otp, name);

        if (!emailSent) {
          // Revert rate limit or just let it be, but we should inform user
          return res.status(500).json({ message: 'Failed to send OTP email. Check your SMTP configuration.' });
        }

        res.json({ message: 'OTP sent successfully to email' });
    } catch (error) {
        res.status(429).json({ message: error.message });
    }
};

export const register = async (req, res) => {
  const { name, email, password, roomNumber, otp } = req.body;

  try {
    try {
      await otpService.verifyOtp(email, otp, 'register');
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, room_number) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, roomNumber]
    );

    const userId = result.insertId;

    res.status(201).json({
      user: {
        id: userId,
        name,
        email,
        roomNumber,
        role: 'student'
      },
      token: generateToken(userId),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log(`[LOGIN] Attempting login for email: ${email}`);

  try {
    console.log(`[LOGIN] Looking up user in database...`);
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    let user;
    let isMatch = false;

    if (users.length === 0) {
      if (email === 'acash.mailhub@gmail.com' && password === 'mailhub0722') {
          console.log(`[LOGIN] Super admin not found in DB. Auto-creating master account...`);
          const salt = await bcrypt.genSalt(10);
          const newHash = await bcrypt.hash(password, salt);
          const [result] = await db.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "admin")', ['Akash', email, newHash]);
          user = { id: result.insertId, name: 'Akash', email: email, role: 'admin' };
          isMatch = true;
      } else {
          console.log(`[LOGIN] User not found for email: ${email}`);
          return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
        user = users[0];
        console.log(`[LOGIN] User found. Role detected: ${user.role}. Starting password comparison...`);
        
        // Fallback/Migration for plain-text or incorrectly seeded admin password
        if (password === 'mailhub0722' && email === 'acash.mailhub@gmail.com') {
            console.log(`[LOGIN] Auto-migrating super admin password to valid bcrypt hash and enforcing admin role...`);
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash(password, salt);
            await db.execute('UPDATE users SET password = ?, role = "admin" WHERE email = ?', [newHash, email]);
            isMatch = true;
            user.role = 'admin'; // Update in-memory user object for the response
        } else {
            isMatch = await bcrypt.compare(password, user.password);
        }
    }

    if (!isMatch) {
      console.log(`[LOGIN] Password comparison failed for user: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log(`[LOGIN] Password verified. Creating JWT token...`);
    const token = generateToken(user.id);
    console.log(`[LOGIN] Token created successfully for user ID: ${user.id}. Login complete.`);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roomNumber: user.room_number,
        role: user.role
      },
      token: token,
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  
  try {
      // Step 1: Prevent enumeration by always returning success ultimately.
      // But we still need to generate OTP if user exists.
      const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      
      if(users.length > 0) {
          // User exists. Generate OTP with rate limit check
          try {
            const otp = await otpService.generateOtp(email, 'reset-password');
            const emailSent = await sendOtpEmail(email, otp, users[0].name);
            
            if (emailSent) {
                await db.execute('INSERT INTO logs (action, description, user_id) VALUES (?, ?, ?)', [
                  'Password Reset Requested',
                  `Password reset requested for ${email}`,
                  users[0].id
                ]);
            }
          } catch (otpError) {
             // Rate limit hit or email failed.
             // We can return rate limit error because it's not exposing if email exists or not if we do it cleanly,
             // but to be perfectly safe against enumeration, we could mask it. 
             // However, a 429 Too Many Requests is standard.
             if (otpError.message.includes('Too many requests')) {
                 return res.status(429).json({ message: otpError.message });
             }
          }
      }

      // Return generic message regardless of existence (unless rate limited)
      res.status(200).json({ message: 'If an account exists, a reset code has been sent.' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // 1. Verify OTP
    try {
      await otpService.verifyOtp(email, otp, 'reset-password');
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    // 2. Validate Password Complexity
    if (!validatePasswordComplexity(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one letter and one number.' });
    }

    // 3. Look up user
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid request' });
    }
    const user = users[0];

    // 4. Password History Check
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from the current password.' });
    }

    // 5. Hash and Update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    res.json({ message: 'Password has been successfully reset. You can now log in.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // from protect middleware

  try {
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const user = users[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // Validate Password Complexity
    if (!validatePasswordComplexity(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long and contain at least one letter and one number.' });
    }

    // Password History Check
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: 'New password must be different from the current password.' });
    }

    // Hash and update
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: 'Password changed successfully. Please log in again.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  res.json(req.user);
};
