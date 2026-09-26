# Chrome Web Store Submission Guide for KeySync

Ready-to-use metadata for the **Chrome Web Store Developer Dashboard** (https://chrome.google.com/webstore/devconsole).

---

## 1. Extension Details

- **Title:** KeySync: TOTP 2FA Authenticator
- **Short Description (max 132 chars):**  
  Fast, local-only 2FA authenticator with PIN encryption, bulk Google Authenticator QR import, and zero cloud tracking.
- **Category:** Productivity (or Security / Privacy Tools)
- **Language:** English
- **Developer:** Ali Sufian ([@aliscodes](https://x.com/aliscodes))
- **Privacy Policy URL:** `https://aliscodes.github.io/KeySync/privacy.html`

---

## 2. Detailed Description (Copy-paste into store description box)

```markdown
KeySync is a fast, ultra-secure, local-only 2-Factor Authentication (2FA) TOTP manager built directly for your browser.

Protect your accounts across GitHub, Google, AWS, Stripe, Binance, Discord, and thousands of services with zero cloud dependencies and absolute privacy.

⚡ KEY FEATURES

• 🔐 Military-Grade Local Encryption:
All 2FA secret keys are encrypted on your local computer using AES-256-GCM. Encryption keys are derived using PBKDF2 (100,000 iterations) with SHA-256 and a cryptographic random salt.

• 📷 Bulk Import from Google Authenticator:
Migrating from Google Authenticator? Upload or drag-and-drop your export QR code screenshot(s) or paste the export migration link. Supports multi-part batch exports with multi-account preview and selection.

• 💾 Complete Vault Backup & Restore:
Export an unencrypted JSON backup of your vault anytime from Settings, or restore accounts from backup files. Never get locked out of your credentials.

• ⏱️ In-Memory Session Auto-Lock:
Tired of entering your PIN every 5 seconds? Configure Auto-Lock (Immediately, 5m, 15m, 30m, or browser close). Active encryption keys live exclusively in volatile RAM (`chrome.storage.session`) and are never written to disk.

• 🎯 Smart Brand Logos & Favicons:
KeySync includes built-in crisp vector icons for major services (GitHub, Google, Stripe, Binance, Hostinger, AWS, etc.) and automatically fetches and caches high-resolution 128px favicons for custom domains.

• 📋 Instant One-Click Copy:
Click any code or account card to immediately copy your active 6-digit TOTP code to your clipboard with haptic feedback.

• 🔍 Fast Real-Time Account Search:
Instantly filter and find accounts by service name or email address as you type.

• 🌙 Adaptive Clean UI:
Engineered with a minimalist modern aesthetic that automatically adapts to your system's light or dark mode.

---

🛡️ ZERO-KNOWLEDGE PRIVACY POLICY

• No account registration or login required.
• No cloud storage, tracking, telemetry, or analytics.
• 100% offline-first. Your private keys never leave your device.
```

---

## 3. Single Purpose & Permissions Justification

When asked by the CWS Review team to justify permissions:

- **Single Purpose Description:**  
  "KeySync is a client-side Time-Based One-Time Password (TOTP) authenticator that securely encrypts and generates two-factor authentication security codes locally on the user's computer."

- **`storage` Permission Justification:**  
  "Required to store the user's AES-256-GCM encrypted 2FA credentials locally on the device (`chrome.storage.local`) and to maintain a temporary in-memory session key in RAM (`chrome.storage.session`) during the user's configurable auto-lock window."

- **Content Security Policy (`img-src`):**  
  "KeySync allows loading high-resolution domain favicons directly from Google's public favicon service (`t1.gstatic.com`) to display brand icons for custom domains, with all assets cached locally."

---

## 4. Packaging the Extension for Upload

To create your `.zip` archive for the Chrome Web Store:
1. Select the following files and folders:
   - `manifest.json`
   - `popup.html`
   - `popup.css`
   - `popup.js`
   - `crypto.js`
   - `totp.js`
   - `qr.js`
   - `brands.js`
   - `icons/`
   - `lib/`
2. Compress into a single zip file (e.g., `keysync-v1.0.0.zip`).
   *(Note: Do not include `store_assets/`, `.git/`, or markdown documentation in the zip file).*
3. Upload `keysync-v1.0.0.zip` to the Developer Dashboard.
4. Upload promotional tiles & screenshots from `store_assets/keysync - assets/` when prompted:
   - Icon: `icons/icon-128.png` (128x128)
   - Small promo tile: `promo-small-440x280.png` (440x280)
   - Marquee promo tile: `promo-marquee-1400x560.png` (1400x560)
   - Screenshots: `screenshot-1.png` through `screenshot-5.png` (1280x800)
