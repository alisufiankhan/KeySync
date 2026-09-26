/**
 * KeySync QR Code & Google Authenticator Migration Scanner
 * Handles webcam scanning with jsQR and custom protobuf decoding for otpauth-migration://
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const jsQR = require('./lib/jsqr.min.js');
    module.exports = factory(jsQR);
  } else {
    root.KeySyncQR = factory(root.jsQR);
  }
})(typeof self !== 'undefined' ? self : this, function (jsQRLib) {
  'use strict';

  const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  /**
   * Encodes a Uint8Array into an RFC 4648 Base32 string.
   */
  function uint8ArrayToBase32(buffer) {
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;
      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }
    return output;
  }

  /**
   * Decodes a base64 string safely into a Uint8Array.
   */
  function base64ToBytes(base64) {
    // Handle URL-safe base64
    let clean = base64.replace(/-/g, '+').replace(/_/g, '/');
    while (clean.length % 4 !== 0) {
      clean += '=';
    }
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Lightweight pure-JS Protobuf parser specifically for Google Authenticator MigrationPayload.
   * Schema:
   * message MigrationPayload {
   *   repeated OtpParameters otp_parameters = 1;
   *   int32 version = 2;
   *   int32 batch_size = 3;
   *   int32 batch_index = 4;
   *   int32 batch_id = 5;
   * }
   * message OtpParameters {
   *   bytes secret = 1;
   *   string name = 2;
   *   string issuer = 3;
   *   int32 algorithm = 4; // 1=SHA1, 2=SHA256, 3=SHA512
   *   int32 digits = 5;    // 1=6, 2=8
   *   int32 type = 6;      // 1=HOTP, 2=TOTP
   *   int64 counter = 7;
   * }
   */
  function parseMigrationProtobuf(bytes) {
    let pos = 0;

    function readVarint() {
      let result = 0n;
      let shift = 0n;
      while (pos < bytes.length) {
        const b = BigInt(bytes[pos++]);
        result |= (b & 0x7fn) << shift;
        if ((b & 0x80n) === 0n) break;
        shift += 7n;
        if (shift > 63n) break;
      }
      return Number(result);
    }

    const accounts = [];
    let version = 1;
    let batchSize = 1;
    let batchIndex = 0;
    let batchId = 0;

    while (pos < bytes.length) {
      const tag = readVarint();
      const fieldNum = tag >> 3;
      const wireType = tag & 0x7;

      if (fieldNum === 1 && wireType === 2) {
        // OtpParameters message
        const len = readVarint();
        const end = pos + len;
        const param = {
          secret: '',
          name: '',
          issuer: '',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          type: 'totp'
        };

        while (pos < end) {
          const subTag = readVarint();
          const subNum = subTag >> 3;
          const subType = subTag & 0x7;

          if (subType === 2) {
            // Length-delimited (bytes or string)
            const sLen = readVarint();
            const chunk = bytes.subarray(pos, pos + sLen);
            pos += sLen;

            if (subNum === 1) {
              // Raw secret bytes
              param.secret = uint8ArrayToBase32(chunk);
            } else if (subNum === 2) {
              // Name (e.g. "Google:ali@gmail.com" or "ali@gmail.com")
              param.name = new TextDecoder().decode(chunk);
            } else if (subNum === 3) {
              // Issuer (e.g. "Google")
              param.issuer = new TextDecoder().decode(chunk);
            }
          } else if (subType === 0) {
            // Varint enum / int
            const val = readVarint();
            if (subNum === 4) {
              if (val === 2) param.algorithm = 'SHA256';
              else if (val === 3) param.algorithm = 'SHA512';
              else param.algorithm = 'SHA1';
            } else if (subNum === 5) {
              param.digits = val === 2 ? 8 : 6;
            } else if (subNum === 6) {
              param.type = val === 1 ? 'hotp' : 'totp';
            }
          } else if (subType === 5) {
            pos += 4;
          } else if (subType === 1) {
            pos += 8;
          } else {
            // Unknown wire type, cannot proceed safely in this submessage
            break;
          }
        }

        // Always guarantee pos is at end of this OtpParameters
        pos = end;

        // Clean up name & issuer
        if (!param.issuer && param.name && param.name.includes(':')) {
          const parts = param.name.split(':');
          param.issuer = parts[0].trim();
          param.name = parts.slice(1).join(':').trim();
        } else if (param.issuer && param.name && param.name.startsWith(param.issuer + ':')) {
          param.name = param.name.substring(param.issuer.length + 1).trim();
        }

        if (param.secret) {
          accounts.push(param);
        }
      } else if (fieldNum === 2 && wireType === 0) {
        version = readVarint();
      } else if (fieldNum === 3 && wireType === 0) {
        batchSize = readVarint();
      } else if (fieldNum === 4 && wireType === 0) {
        batchIndex = readVarint();
      } else if (fieldNum === 5 && wireType === 0) {
        batchId = readVarint();
      } else if (wireType === 0) {
        readVarint();
      } else if (wireType === 2) {
        const len = readVarint();
        pos += len;
      } else if (wireType === 5) {
        pos += 4;
      } else if (wireType === 1) {
        pos += 8;
      } else {
        break;
      }
    }

    // Attach batch metadata to array
    accounts.version = version;
    accounts.batchSize = batchSize;
    accounts.batchIndex = batchIndex;
    accounts.batchId = batchId;

    return accounts;
  }

  /**
   * Decodes an otpauth-migration:// URI.
   */
  function parseMigrationURI(uriString) {
    try {
      const url = new URL(uriString);
      const dataParam = url.searchParams.get('data');
      if (!dataParam) {
        throw new Error('No data parameter found in migration URI');
      }
      const rawBytes = base64ToBytes(dataParam);
      const accounts = parseMigrationProtobuf(rawBytes);
      return {
        type: 'migration',
        accounts,
        batchSize: accounts.batchSize || 1,
        batchIndex: accounts.batchIndex !== undefined ? accounts.batchIndex : 0,
        batchId: accounts.batchId || 0
      };
    } catch (err) {
      throw new Error('Failed to parse Google Authenticator migration data: ' + err.message);
    }
  }

  /**
   * Parses standard otpauth://totp/ URI.
   */
  function parseStandardOTPURI(uriString) {
    try {
      const url = new URL(uriString);
      if (url.protocol !== 'otpauth:') {
        throw new Error('Invalid protocol, expected otpauth:');
      }

      // Path format: //totp/Issuer:account or //totp/account
      let path = decodeURIComponent(url.pathname.replace(/^\/\//, '').replace(/^\//, ''));
      // In case host is 'totp', pathname is label
      let label = path;
      if (url.host === 'totp' || url.host === 'hotp') {
        label = decodeURIComponent(url.pathname.replace(/^\//, ''));
      }

      let issuer = url.searchParams.get('issuer') || '';
      let name = label;

      if (label.includes(':')) {
        const parts = label.split(':');
        if (!issuer) issuer = parts[0].trim();
        name = parts.slice(1).join(':').trim();
      }

      const secret = url.searchParams.get('secret') || '';
      const algorithm = (url.searchParams.get('algorithm') || 'SHA1').toUpperCase();
      const digits = parseInt(url.searchParams.get('digits') || '6', 10);
      const period = parseInt(url.searchParams.get('period') || '30', 10);

      return {
        type: 'single',
        account: {
          issuer: issuer || 'Service',
          name: name || '',
          secret,
          algorithm,
          digits,
          period
        }
      };
    } catch (err) {
      throw new Error('Invalid otpauth URI: ' + err.message);
    }
  }

  /**
   * Analyzes raw decoded string from a QR code.
   */
  function parseQRContent(content) {
    if (typeof content !== 'string') return null;
    const trimmed = content.trim();

    if (trimmed.startsWith('otpauth-migration://')) {
      return parseMigrationURI(trimmed);
    }

    if (trimmed.startsWith('otpauth://')) {
      return parseStandardOTPURI(trimmed);
    }

    // Direct secret paste or unrecognized
    return {
      type: 'raw',
      content: trimmed
    };
  }

  /**
   * Parses bulk pasted content (multiple migration URIs, otpauth:// links, or JSON).
   */
  function parseBatchContent(content) {
    if (typeof content !== 'string') return null;
    const trimmed = content.trim();
    if (!trimmed) return null;

    // Check if it's a single migration URI
    if (trimmed.startsWith('otpauth-migration://') && !trimmed.includes('\n')) {
      return parseMigrationURI(trimmed);
    }

    // Check if it's a single standard otpauth URI
    if (trimmed.startsWith('otpauth://') && !trimmed.includes('\n')) {
      return parseStandardOTPURI(trimmed);
    }

    // Check if JSON array or backup format
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsedJson = JSON.parse(trimmed);
        const list = Array.isArray(parsedJson) ? parsedJson : (parsedJson.accounts || parsedJson.items || [parsedJson]);
        const extracted = [];
        list.forEach(item => {
          const secret = item.secret || (item.totp && item.totp.secret) || '';
          if (secret) {
            extracted.push({
              issuer: item.issuer || item.service || 'Service',
              name: item.name || item.label || item.username || '',
              secret: String(secret).replace(/[\s\-]/g, '').toUpperCase(),
              algorithm: (item.algorithm || 'SHA1').toUpperCase(),
              digits: parseInt(item.digits || '6', 10),
              period: parseInt(item.period || '30', 10),
              type: item.type || 'totp'
            });
          }
        });
        if (extracted.length > 0) {
          return { type: 'migration', accounts: extracted };
        }
      } catch (e) {}
    }

    // Multi-line parsing (multiple migration URIs, otpauth:// URIs, etc.)
    const lines = trimmed.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    const accounts = [];
    let detectedBatchSize = 1;
    let detectedBatchIndex = 0;

    for (const line of lines) {
      if (line.startsWith('otpauth-migration://')) {
        try {
          const res = parseMigrationURI(line);
          if (res && Array.isArray(res.accounts)) {
            accounts.push(...res.accounts);
            if (res.batchSize && res.batchSize > 1) {
              detectedBatchSize = Math.max(detectedBatchSize, res.batchSize);
              detectedBatchIndex = res.batchIndex !== undefined ? res.batchIndex : detectedBatchIndex;
            }
          }
        } catch (e) {}
      } else if (line.startsWith('otpauth://')) {
        try {
          const res = parseStandardOTPURI(line);
          if (res && res.account) {
            accounts.push(res.account);
          }
        } catch (e) {}
      }
    }

    if (accounts.length > 1) {
      return { type: 'migration', accounts, batchSize: detectedBatchSize, batchIndex: detectedBatchIndex };
    } else if (accounts.length === 1) {
      return { type: 'single', account: accounts[0] };
    }

    // Fallback: standard parseQRContent
    return parseQRContent(trimmed);
  }

  // --- Camera Scanner Stubs (Retained for API compatibility without mediaDevices triggers) ---
  function stopCamera(videoElement) {
    if (videoElement) videoElement.srcObject = null;
  }

  async function startCamera(videoElement, onScanCallback, onErrorCallback) {
    if (typeof onErrorCallback === 'function') {
      onErrorCallback(new Error('Webcam scanning is not required. Please use Image Upload or Paste Link.'));
    }
  }

  /**
   * Decodes ALL QR codes from an image File or Blob with multi-QR detection,
   * eraser masking, multi-resolution scaling, and sub-region quadrants.
   */
  async function scanImageFile(file) {
    const QR = jsQRLib || (typeof window !== 'undefined' ? window.jsQR : null);
    if (!QR) throw new Error('QR scanner library is not loaded');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const foundCodes = new Set();

          function scanCanvas(canvas, ctx) {
            let iterations = 0;
            const maxIterations = 8; // Scan up to 8 QR codes in a single image

            while (iterations < maxIterations) {
              iterations++;
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = QR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth'
              });

              if (code && code.data) {
                foundCodes.add(code.data);

                // Erase the found QR code by painting over its location polygon
                if (code.location) {
                  ctx.fillStyle = '#FFFFFF';
                  ctx.beginPath();
                  ctx.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
                  ctx.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
                  ctx.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
                  ctx.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
                  ctx.closePath();
                  ctx.fill();

                  // Expand erasure slightly with a bounding box margin
                  const xs = [code.location.topLeftCorner.x, code.location.topRightCorner.x, code.location.bottomRightCorner.x, code.location.bottomLeftCorner.x];
                  const ys = [code.location.topLeftCorner.y, code.location.topRightCorner.y, code.location.bottomRightCorner.y, code.location.bottomLeftCorner.y];
                  const minX = Math.max(0, Math.min(...xs) - 12);
                  const maxX = Math.min(canvas.width, Math.max(...xs) + 12);
                  const minY = Math.max(0, Math.min(...ys) - 12);
                  const maxY = Math.min(canvas.height, Math.max(...ys) + 12);
                  ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
                } else {
                  break;
                }
              } else {
                break;
              }
            }
          }

          function tryResolution(width, height) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            scanCanvas(canvas, ctx);
          }

          // 1. Scan at native resolution
          tryResolution(img.width, img.height);

          // 2. Scan with downscaling for high-res photos/screenshots
          if (img.width > 1200 || img.height > 1200) {
            const scale = Math.min(1200 / img.width, 1200 / img.height);
            tryResolution(Math.round(img.width * scale), Math.round(img.height * scale));
          }

          if (img.width > 750 || img.height > 750) {
            const scale = Math.min(750 / img.width, 750 / img.height);
            tryResolution(Math.round(img.width * scale), Math.round(img.height * scale));
          }

          // 3. Sub-region scan: If image is wide or tall, split and scan halves
          // E.g. side-by-side export screenshots or multi-page export photos
          const isWide = img.width >= 1.25 * img.height;
          const isTall = img.height >= 1.25 * img.width;

          if (isWide || isTall) {
            const halfW = isWide ? Math.round(img.width / 2) : img.width;
            const halfH = isWide ? img.height : Math.round(img.height / 2);

            // Sub-region 1
            const c1 = document.createElement('canvas');
            c1.width = halfW; c1.height = halfH;
            const ctx1 = c1.getContext('2d');
            ctx1.drawImage(img, 0, 0, halfW, halfH, 0, 0, halfW, halfH);
            scanCanvas(c1, ctx1);

            // Sub-region 2
            const c2 = document.createElement('canvas');
            c2.width = halfW; c2.height = halfH;
            const ctx2 = c2.getContext('2d');
            const srcX = isWide ? halfW : 0;
            const srcY = isWide ? 0 : halfH;
            ctx2.drawImage(img, srcX, srcY, halfW, halfH, 0, 0, halfW, halfH);
            scanCanvas(c2, ctx2);
          }

          const results = Array.from(foundCodes);
          if (results.length > 0) {
            resolve(results);
          } else {
            reject(new Error(`No QR code detected in "${file.name}". Try a clearer image.`));
          }
        };
        img.onerror = () => reject(new Error(`Failed to load image "${file.name}".`));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error(`Failed to read file "${file.name}".`));
      reader.readAsDataURL(file);
    });
  }

  return {
    uint8ArrayToBase32,
    base64ToBytes,
    parseMigrationProtobuf,
    parseMigrationURI,
    parseStandardOTPURI,
    parseQRContent,
    parseBatchContent,
    startCamera,
    stopCamera,
    scanImageFile
  };
});
