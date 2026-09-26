# KeySync

<p align="center">
  <img src="assets/icon-128.png" width="96" height="96" alt="KeySync Logo">
</p>

<p align="center">
  <strong>Fast, Local-First 2FA Authenticator for Google Chrome</strong><br>
  Built with hardware-accelerated WebCrypto primitives, AES-256-GCM vault encryption, and instant 1-click token copy.
</p>

<p align="center">
  <a href="https://x.com/aliscodes"><img src="https://img.shields.io/badge/Created%20by-Ali%20Sufian%20(@aliscodes)-2563EB?style=flat-square" alt="Creator"></a>
  <img src="https://img.shields.io/badge/Manifest-V3-10B981?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Security-AES--256--GCM-6366F1?style=flat-square" alt="AES-256-GCM">
  <img src="https://img.shields.io/badge/Telemetry-Zero%20Trackers-F59E0B?style=flat-square" alt="Zero Telemetry">
  <img src="https://img.shields.io/badge/License-MIT-0EA5E9?style=flat-square" alt="MIT License">
</p>

---

## Overview

**KeySync** brings two-factor authentication (TOTP) directly to your desktop browser toolbar, eliminating the friction of reaching for a mobile phone.

All account secrets, service names, and tokens are encrypted locally on your machine using authenticated **AES-256-GCM** derived via **PBKDF2** (100,000 iterations of SHA-256) from your 4-digit Master PIN.

- **Zero Cloud Sync:** No external databases, servers, or cloud dependencies.
- **Zero Telemetry:** 0 analytics, 0 tracking cookies, and 0 ads.
- **Hardware Cryptography:** Uses W3C standard `crypto.subtle` WebCrypto API.
- **In-Memory RAM Session:** Decrypted keys live strictly in volatile memory via `chrome.storage.session` and auto-lock on configurable idle timers.
- **Bulk Migration:** Drag and drop Google Authenticator QR export screenshots to parse `otpauth-migration://` tokens entirely client-side.

---

## Project Structure

```text
KeySync/
├── manifest.json              # Chrome Extension Manifest V3
├── popup.html                 # Extension UI
├── popup.css                  # Extension styling (glassmorphism dark UI)
├── popup.js                   # Application logic & vault state machine
├── crypto.js                  # WebCrypto AES-256-GCM & PBKDF2 engine
├── totp.js                    # RFC 6238 TOTP generator
├── qr.js                      # QR code scanner & Google Auth protobuf decoder
├── brands.js                  # Vector icons & domain brand matcher
├── icons/                     # Chrome extension icons (16, 32, 48, 128)
├── lib/                       # Bundled client libraries (otpauth, jsQR)
│
├── index.html                 # Vercel Landing Page
├── style.css                  # Landing page responsive styles
├── app.js                     # Landing page interactive TOTP simulation
├── privacy.html               # Comprehensive zero-knowledge Privacy Policy
├── assets/                    # Public landing page visuals & screenshots
├── vercel.json                # Vercel routing configuration
└── CWS_STORE_LISTING.md       # Chrome Web Store metadata & description
```

---

## Installing KeySync Locally (Developer Mode)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/alisufiankhan/KeySync.git
   ```
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click **Load unpacked**.
5. Select the `KeySync` root directory.
6. Pin KeySync to your Chrome toolbar for 1-click access!

---

## Deploying Landing Page to Vercel

This repository is ready for automatic deployment to Vercel:

1. Import this repository in [Vercel](https://vercel.com/new).
2. Leave root directory as `./` (default).
3. Framework preset: **Other** (Static).
4. Click **Deploy**. Vercel will instantly host your landing page with clean URLs and fast global CDN caching.

---

## Author & Attribution

- **Developer:** Ali Sufian
- **X (Twitter):** [@aliscodes](https://x.com/aliscodes)
- **GitHub:** [@alisufiankhan](https://github.com/alisufiankhan)

---

## License

This project is licensed under the MIT License. See [PRIVACY.md](PRIVACY.md) and [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for details.
