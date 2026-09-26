/**
 * KeySync Cryptography Utilities
 * Uses standard Web Crypto API (PBKDF2, SHA-256, AES-256-GCM)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js environment (requires webcrypto)
    const { webcrypto } = require('crypto');
    module.exports = factory(webcrypto || globalThis.crypto);
  } else {
    // Browser environment
    root.KeySyncCrypto = factory(window.crypto);
  }
})(typeof self !== 'undefined' ? self : this, function (cryptoObj) {
  'use strict';

  const subtle = cryptoObj.subtle;

  // --- Helper Encoders ---

  function bytesToBase64(bytes) {
    const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function bytesToHex(bytes) {
    const uint8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return Array.from(uint8)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }

  // --- Cryptographic Functions ---

  /**
   * Generates a secure random 16-byte salt as a Base64 string.
   */
  function generateSalt() {
    const salt = new Uint8Array(16);
    cryptoObj.getRandomValues(salt);
    return bytesToBase64(salt);
  }

  /**
   * Hashes the user PIN using SHA-256 for quick validation / lockout checks.
   * @param {string} pin - 4-6 digit string
   * @returns {Promise<string>} Hex-encoded SHA-256 hash
   */
  async function hashPIN(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(String(pin));
    const hashBuffer = await subtle.digest('SHA-256', data);
    return bytesToHex(hashBuffer);
  }

  /**
   * Derives an AES-256-GCM encryption key from PIN and salt using PBKDF2 (100,000 iterations).
   * @param {string} pin - User's PIN
   * @param {string} saltBase64 - Base64-encoded 16-byte salt
   * @returns {Promise<CryptoKey>} Derived AES-256-GCM key
   */
  async function deriveKey(pin, saltBase64) {
    const encoder = new TextEncoder();
    const pinBuffer = encoder.encode(String(pin));
    const saltBuffer = base64ToBytes(saltBase64);

    const baseKey = await subtle.importKey(
      'raw',
      pinBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const aesKey = await subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );

    return aesKey;
  }

  /**
   * Encrypts plain vault data (e.g. array of accounts) using AES-256-GCM.
   * @param {CryptoKey} key - Derived AES-GCM CryptoKey
   * @param {any} plainData - JSON-serializable object/array
   * @returns {Promise<{ iv: string, ciphertext: string }>} Base64-encoded IV and ciphertext
   */
  async function encryptVault(key, plainData) {
    const iv = new Uint8Array(12);
    cryptoObj.getRandomValues(iv);

    const jsonString = JSON.stringify(plainData);
    const encodedData = new TextEncoder().encode(jsonString);

    const ciphertextBuffer = await subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encodedData
    );

    return {
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer))
    };
  }

  /**
   * Decrypts vault data using AES-256-GCM.
   * @param {CryptoKey} key - Derived AES-GCM CryptoKey
   * @param {{ iv: string, ciphertext: string }} encryptedVault
   * @returns {Promise<any>} Parsed JSON object/array
   */
  async function decryptVault(key, encryptedVault) {
    if (!encryptedVault || !encryptedVault.iv || !encryptedVault.ciphertext) {
      throw new Error('Invalid encrypted vault payload');
    }

    const iv = base64ToBytes(encryptedVault.iv);
    const ciphertext = base64ToBytes(encryptedVault.ciphertext);

    const decryptedBuffer = await subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );

    const jsonString = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(jsonString);
  }

  /**
   * Exports an AES-GCM CryptoKey to a Base64 string for RAM-only session storage.
   */
  async function exportRawKey(key) {
    const rawBuffer = await subtle.exportKey('raw', key);
    return bytesToBase64(new Uint8Array(rawBuffer));
  }

  /**
   * Imports a Base64-encoded raw AES key back into a CryptoKey.
   */
  async function importRawKey(rawBase64) {
    const rawBytes = base64ToBytes(rawBase64);
    return await subtle.importKey(
      'raw',
      rawBytes,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  return {
    generateSalt,
    hashPIN,
    deriveKey,
    encryptVault,
    decryptVault,
    exportRawKey,
    importRawKey,
    bytesToBase64,
    base64ToBytes,
    bytesToHex,
    hexToBytes
  };
});
