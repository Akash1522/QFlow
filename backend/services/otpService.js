import db from '../config/db.js';
import bcrypt from 'bcryptjs';

class OtpService {
  constructor() {
    this.OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes (as per requirement)
    this.RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    this.MAX_REQUESTS_PER_WINDOW = 10;
    this.MAX_ATTEMPTS = 3;
    
    // In-memory rate limiting just to prevent spamming the DB
    this.rateLimits = new Map();
  }

  _getKey(email, context) {
    return `${context}:${email}`;
  }

  checkRateLimit(email, context) {
    const key = this._getKey(email, context);
    const now = Date.now();
    let limitData = this.rateLimits.get(key);

    if (!limitData || now > limitData.resetAt) {
      limitData = { count: 1, resetAt: now + this.RATE_LIMIT_WINDOW_MS };
      this.rateLimits.set(key, limitData);
      return true;
    }

    if (limitData.count >= this.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    limitData.count++;
    this.rateLimits.set(key, limitData);
    return true;
  }

  async logAction(action, description, email = null) {
      // Find user if they exist to link the log
      let userId = null;
      if (email) {
          const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
          if (users.length > 0) userId = users[0].id;
      }
      await db.execute('INSERT INTO logs (action, description, user_id) VALUES (?, ?, ?)', [action, description, userId]);
  }

  async generateOtp(email, context) {
    if (!this.checkRateLimit(email, context)) {
      throw new Error('Too many requests. Please try again later.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MS);

    await db.execute(`
        INSERT INTO otps (email, context, otp_hash, attempts, expires_at) 
        VALUES (?, ?, ?, 0, ?)
        ON DUPLICATE KEY UPDATE 
        otp_hash = VALUES(otp_hash), 
        attempts = 0, 
        expires_at = VALUES(expires_at),
        created_at = CURRENT_TIMESTAMP
    `, [email, context, otpHash, expiresAt]);

    await this.logAction('OTP Sent', `OTP generated for context: ${context}`, email);

    return otp;
  }

  async verifyOtp(email, otp, context) {
    const [rows] = await db.execute('SELECT * FROM otps WHERE email = ? AND context = ?', [email, context]);
    
    if (rows.length === 0) {
      await this.logAction('OTP Failed', `No OTP requested for context: ${context}`, email);
      throw new Error('No OTP requested for this action.');
    }

    const storedData = rows[0];

    if (new Date() > new Date(storedData.expires_at)) {
      await this.clearOtp(email, context);
      await this.logAction('OTP Failed', `OTP expired for context: ${context}`, email);
      throw new Error('OTP has expired.');
    }

    if (storedData.attempts >= this.MAX_ATTEMPTS) {
        await this.clearOtp(email, context);
        await this.logAction('OTP Failed', `Max verification attempts exceeded for context: ${context}`, email);
        throw new Error('Maximum verification attempts exceeded. Please request a new OTP.');
    }

    const isMatch = await bcrypt.compare(otp, storedData.otp_hash);

    if (!isMatch) {
      await db.execute('UPDATE otps SET attempts = attempts + 1 WHERE id = ?', [storedData.id]);
      await this.logAction('OTP Failed', `Invalid OTP entered for context: ${context}`, email);
      throw new Error('Invalid OTP.');
    }

    // Success! One-time use: clear the OTP immediately.
    await this.clearOtp(email, context);
    await this.logAction('OTP Verified', `OTP successfully verified for context: ${context}`, email);
    return true;
  }
  
  async clearOtp(email, context) {
      await db.execute('DELETE FROM otps WHERE email = ? AND context = ?', [email, context]);
  }
}

const otpService = new OtpService();
export default otpService;
