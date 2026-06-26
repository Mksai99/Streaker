// Self-contained OTP service with Fast2SMS integration
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_LENGTH = 6;

class OTPService {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendSMS(phone, otp) {
    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  FAST2SMS_API_KEY not set — OTP will only be printed to console.');
      return false;
    }

    // Extract just the 10-digit number (Fast2SMS expects Indian numbers without +91)
    const number = phone.replace(/\D/g, '').slice(-10);

    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: number,
        }),
      });

      const data = await response.json();

      if (data.return === true) {
        console.log(`✅ SMS sent successfully to ${number}`);
        return true;
      } else {
        console.error('❌ Fast2SMS error:', data.message || data);
        return false;
      }
    } catch (error) {
      console.error('❌ SMS sending failed:', error.message);
      return false;
    }
  }

  async sendOTP(phone) {
    // Normalize phone
    let formatted = phone.replace(/\D/g, '');
    if (!formatted.startsWith('91') && formatted.length >= 10) {
      formatted = '91' + formatted;
    }
    formatted = '+' + formatted;

    const otp = this.generateOTP();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    otpStore.set(formatted, { otp, expiresAt, attempts: 0 });

    // Always log to console (for development)
    console.log(`\n📱 ===== OTP for ${formatted}: ${otp} ===== 📱\n`);

    // Try to send via SMS
    const smsSent = await this.sendSMS(formatted, otp);

    // Auto-cleanup after expiry
    setTimeout(() => {
      if (otpStore.has(formatted)) {
        const entry = otpStore.get(formatted);
        if (entry.expiresAt <= Date.now()) {
          otpStore.delete(formatted);
        }
      }
    }, OTP_EXPIRY_MS + 1000);

    return { phone: formatted, expiresIn: OTP_EXPIRY_MS / 1000, smsSent, otp };
  }

  verifyOTP(phone, otp) {
    let formatted = phone.replace(/\D/g, '');
    if (!formatted.startsWith('91') && formatted.length >= 10) {
      formatted = '91' + formatted;
    }
    formatted = '+' + formatted;

    const entry = otpStore.get(formatted);

    if (!entry) {
      return { valid: false, error: 'OTP not found. Please request a new one.' };
    }

    if (entry.expiresAt < Date.now()) {
      otpStore.delete(formatted);
      return { valid: false, error: 'OTP has expired. Please request a new one.' };
    }

    if (entry.attempts >= 5) {
      otpStore.delete(formatted);
      return { valid: false, error: 'Too many attempts. Please request a new OTP.' };
    }

    entry.attempts++;

    if (entry.otp !== otp) {
      return { valid: false, error: 'Invalid OTP. Please try again.' };
    }

    // OTP verified — remove it
    otpStore.delete(formatted);
    return { valid: true, phone: formatted };
  }
}

export default new OTPService();
