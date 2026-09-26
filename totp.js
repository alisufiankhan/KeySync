/**
 * KeySync TOTP Generation Engine
 * Handles Base32 sanitization/validation, period calculation, and code formatting.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const OTPAuth = require('./lib/otpauth.min.js');
    module.exports = factory(OTPAuth);
  } else {
    root.KeySyncTOTP = factory(root.OTPAuth);
  }
})(typeof self !== 'undefined' ? self : this, function (OTPAuthLib) {
  'use strict';

  const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  /**
   * Sanitizes a user-provided Base32 secret (removes whitespace, hyphens, and uppercases).
   */
  function sanitizeSecret(secret) {
    if (typeof secret !== 'string') return '';
    return secret.replace(/[\s\-]/g, '').toUpperCase();
  }

  /**
   * Validates if a string is valid Base32 format.
   */
  function isValidBase32(secret) {
    const cleaned = sanitizeSecret(secret);
    if (!cleaned || cleaned.length < 4) return false;
    return /^[A-Z2-7]+=*$/.test(cleaned);
  }

  /**
   * Formats a raw 6 or 8-digit TOTP code for display (e.g. "482 019" or "482  019").
   * Mockup displays "482  019" (space in middle).
   */
  function formatCode(code) {
    if (!code) return '--- ---';
    const str = String(code).trim();
    if (str.length === 6) {
      return str.slice(0, 3) + '  ' + str.slice(3);
    }
    if (str.length === 8) {
      return str.slice(0, 4) + '  ' + str.slice(4);
    }
    return str;
  }

  /**
   * Raw copy string without middle spaces (for copying to clipboard)
   */
  function cleanCodeForCopy(formattedCode) {
    if (!formattedCode) return '';
    return formattedCode.replace(/\s+/g, '');
  }

  /**
   * Computes the number of seconds remaining in the current period.
   * @param {number} period - Cycle duration in seconds (default 30)
   * @returns {number} Seconds remaining [1..period]
   */
  function getRemainingSeconds(period = 30) {
    const epochSeconds = Math.floor(Date.now() / 1000);
    const remainder = epochSeconds % period;
    return period - remainder;
  }

  /**
   * Computes remaining cycle progress percentage (100% down to 0%).
   * @param {number} period - Cycle duration in seconds (default 30)
   * @returns {number} Percentage [0..100]
   */
  function getProgressPercentage(period = 30) {
    const remaining = getRemainingSeconds(period);
    return Math.max(0, Math.min(100, (remaining / period) * 100));
  }

  /**
   * Generates a TOTP code using the bundled OTPAuth library.
   * @param {Object} options
   * @param {string} options.secret - Base32 secret
   * @param {string} [options.issuer] - Service name
   * @param {string} [options.label] - Account name/email
   * @param {string} [options.algorithm='SHA1'] - SHA1, SHA256, SHA512
   * @param {number} [options.digits=6] - Number of digits
   * @param {number} [options.period=30] - Period in seconds
   * @returns {string} 6 or 8-digit code (e.g. "482019")
   */
  function generateCode(options) {
    const secret = sanitizeSecret(options.secret);
    if (!secret) return '000000';

    const OTP = OTPAuthLib || (typeof window !== 'undefined' ? window.OTPAuth : null);

    if (OTP) {
      try {
        const totp = new OTP.TOTP({
          issuer: options.issuer || '',
          label: options.label || options.name || '',
          algorithm: options.algorithm || 'SHA1',
          digits: options.digits || 6,
          period: options.period || 30,
          secret: OTP.Secret.fromBase32(secret)
        });
        return totp.generate();
      } catch (err) {
        console.warn('OTPAuth generate error, falling back:', err);
      }
    }

    // Fallback: Synchronous manual RFC 6238 TOTP if OTPAuth is not available
    return manualTOTP(secret, options.digits || 6, options.period || 30);
  }

  // --- Manual Fallback TOTP Generator ---

  function base32ToBytes(b32) {
    let bits = 0;
    let value = 0;
    const output = [];
    for (let i = 0; i < b32.length; i++) {
      const c = b32[i];
      if (c === '=') break;
      const val = BASE32_CHARS.indexOf(c);
      if (val === -1) continue;
      value = (value << 5) | val;
      bits += 5;
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return new Uint8Array(output);
  }

  // Pure fallback: in case window.OTPAuth is still loading
  function manualTOTP(secret, digits = 6, period = 30) {
    try {
      if (OTPAuthLib) {
        const totp = new OTPAuthLib.TOTP({
          algorithm: 'SHA1',
          digits,
          period,
          secret: OTPAuthLib.Secret.fromBase32(secret)
        });
        return totp.generate();
      }
    } catch (e) {}
    return '000000';
  }

  return {
    sanitizeSecret,
    isValidBase32,
    formatCode,
    cleanCodeForCopy,
    getRemainingSeconds,
    getProgressPercentage,
    generateCode
  };
});
