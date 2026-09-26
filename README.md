<p align="center">
  <img src="assets/promo-marquee.png" alt="KeySync Header Banner" width="100%" style="border-radius: 12px;">
</p>

# KeySync

<p align="center">
  <strong>Fast, Local-First 2FA Authenticator for Google Chrome</strong><br>
  Instant 1-click token copy, client-side AES-256-GCM vault encryption, and bulk Google Authenticator QR migration.
</p>

<p align="center">
  <a href="https://x.com/aliscodes"><img src="https://img.shields.io/badge/Author-Ali%20Sufian%20(@aliscodes)-0F172A?style=for-the-badge&logo=x&logoColor=white" alt="Author"></a>
  <img src="https://img.shields.io/badge/Manifest-V3-10B981?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Encryption-AES--256--GCM-2563EB?style=for-the-badge" alt="AES-256-GCM">
  <img src="https://img.shields.io/badge/Telemetry-0%25%20Zero-F59E0B?style=for-the-badge" alt="Zero Telemetry">
  <img src="https://img.shields.io/badge/License-MIT-6366F1?style=for-the-badge" alt="MIT License">
</p>

<p align="center">
  <a href="#the-problem-keysync-solves">Why KeySync</a> •
  <a href="#visual-tour">Visual Tour</a> •
  <a href="#security-architecture">Security Architecture</a> •
  <a href="#feature-comparison">Comparison</a> •
  <a href="#quickstart-installing-keysync-locally">Quickstart</a> •
  <a href="#author--creator">Author</a>
</p>

---

## The Problem KeySync Solves

Two-factor authenticators were designed for smartphones in 2011. Modern engineers and developers repeatedly context-switch all day long: grabbing a phone, passing biometric locks, waiting for a 30-second countdown, and manually typing 6 digits.

**KeySync eliminates this friction entirely.** It pins directly into your Chrome browser toolbar. One click copies your valid 6-digit TOTP code straight to your clipboard with instant toast confirmation.

- **Zero Cloud Dependence:** No remote databases, servers, or cloud sync.
- **Zero Telemetry:** 0 analytics, 0 tracking cookies, and 0 user accounts.
- **Hardware Cryptography:** Hardware-accelerated WebCrypto primitives running natively on your CPU.
- **Volatile RAM Sessions:** Unlocked vault keys live strictly in in-memory storage (`chrome.storage.session`) and auto-lock on idle.

---

## Visual Tour

<p align="center">
  <img src="assets/sc-main.png" alt="KeySync Main Extension Popup" width="460" style="border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.15);">
  <br>
  <em>Clean glassmorphic dark interface with real-time countdown progress rings and 1-click token copy.</em>
</p>

### Feature Highlights

<table>
  <tr>
    <td width="50%">
      <img src="assets/promo-1.png" alt="Desktop 2FA in 1 Click" style="border-radius: 8px;">
      <h4 align="center">⚡ 1-Click Desktop Toolbar</h4>
      <p align="center">Access your codes in 1 click or via global hotkey without reaching for a mobile device.</p>
    </td>
    <td width="50%">
      <img src="assets/promo-2.png" alt="Hardware AES-256 Vault" style="border-radius: 8px;">
      <h4 align="center">🔒 AES-256-GCM Vault</h4>
      <p align="center">Protected by a 4-digit Master PIN derived via 100,000 PBKDF2 SHA-256 iterations.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="assets/promo-3.png" alt="Google Authenticator QR Drop" style="border-radius: 8px;">
      <h4 align="center">📲 Bulk QR Migration</h4>
      <p align="center">Drag and drop a Google Authenticator export QR screenshot to parse all accounts in seconds.</p>
    </td>
    <td width="50%">
      <img src="assets/promo-4.png" alt="Zero Telemetry Architecture" style="border-radius: 8px;">
      <h4 align="center">🛡️ 100% Offline &amp; Private</h4>
      <p align="center">Zero telemetry, zero analytics, zero external network calls, and complete data sovereignty.</p>
    </td>
  </tr>
</table>

### Core Workflows

<p align="center">
  <img src="assets/sc-bulk-import.png" width="31%" alt="Bulk QR Import" style="border-radius: 8px; margin: 4px;">
  <img src="assets/sc-add-account.png" width="31%" alt="Add Account" style="border-radius: 8px; margin: 4px;">
  <img src="assets/sc-settings.png" width="31%" alt="Settings &amp; Vault Security" style="border-radius: 8px; margin: 4px;">
</p>
<p align="center">
  <em>From left to right: Google Auth batch QR drop, manual account creation with auto brand detection, and vault lock security settings.</em>
</p>

---

## Security Architecture

KeySync follows a strict **Zero-Knowledge, local-only** cryptographic architecture:

```mermaid
flowchart TD
    PIN[4-Digit Master PIN] --> KDF[PBKDF2 SHA-256 \n 100,000 Rounds \n + 16-Byte Random Salt]
    KDF --> KEY[256-Bit Symmetric AES Key]
    
    KEY --> RAM[(In-Memory RAM \n chrome.storage.session \n Cleared on Lock or Exit)]
    
    VAULT[Plaintext Accounts & Seeds] --> ENC[AES-256-GCM Encrypt \n + Unique 12-Byte IV]
    KEY --> ENC
    ENC --> STORAGE[(Encrypted Blob \n chrome.storage.local)]
    
    STORAGE --> DEC[AES-256-GCM Decrypt]
    KEY --> DEC
    DEC --> TOTP[RFC 6238 TOTP Engine]
    TOTP --> TOKEN[Live 6-Digit Code]
```

1. **Key Derivation (PBKDF2):**
   - The user configures a 4-digit Master PIN.
   - The PIN is stretched using PBKDF2 with SHA-256, 100,000 rounds, and a cryptographically random 16-byte salt (`crypto.getRandomValues`).
2. **Authenticated Symmetric Cipher (AES-256-GCM):**
   - Account secrets, issuer names, and account labels are encrypted as an authenticated payload.
   - A fresh 12-byte initialization vector (IV) is cryptographically generated on every single write operation.
3. **Volatile RAM Storage:**
   - The derived encryption key is cached only in volatile RAM via Chrome Manifest V3's `chrome.storage.session` API.
   - Keys are immediately zeroed out upon locking, closing the browser, or after a configurable idle timer (default: 15 minutes).
4. **Offline Migration Decoder:**
   - Decodes Google Authenticator `otpauth-migration://` QR codes client-side using a pure JavaScript Protocol Buffer parser. Secret seeds never leave your computer.

---

## Feature Comparison

| Capability | KeySync | Google Authenticator | Twilio Authy | Cloud Vaults |
| :--- | :--- | :--- | :--- | :--- |
| **Toolbar Access** | **1-Click Native Toolbar** | Mobile app only | Desktop deprecated | Via extension |
| **Storage Security** | **Device AES-256-GCM** | Google Cloud sync | Twilio Cloud sync | Remote database |
| **Google Auth Import** | **1-Click batch QR drop** | Not applicable | Manual secret entry | Manual secret entry |
| **Account Required** | **Zero (100% Anonymous)** | Google Account mandatory | SMS phone required | Master login & email |
| **Pricing & License** | **Free & Open Source (MIT)** | Free (Proprietary) | Free (Proprietary) | $36 to $60 / year |
| **Data Portability** | **Unrestricted JSON export** | QR screen only | Vendor locked in | Varies by provider |

---

## Quickstart: Installing KeySync Locally

You can load and test KeySync immediately in Google Chrome:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/alisufiankhan/KeySync.git
   ```
2. **Open Extensions in Chrome:**
   - Navigate to `chrome://extensions/` in your Chrome browser.
3. **Enable Developer Mode:**
   - Toggle the **Developer mode** switch in the top-right corner.
4. **Load Unpacked:**
   - Click **Load unpacked** and select the cloned `KeySync` root folder.
5. **Pin to Toolbar:**
   - Click the puzzle icon in Chrome and pin **KeySync** for 1-click access!

---

## Deploying the Landing Page to Vercel

The root of this repository contains the standalone, high-performance landing page ([`index.html`](index.html), [`style.css`](style.css), [`app.js`](app.js), and [`privacy.html`](privacy.html)):

1. Import this repository in [Vercel](https://vercel.com/new).
2. Leave root directory as `./` (default).
3. Framework preset: **Other** (Static HTML).
4. Click **Deploy**. Vercel will host your landing page instantly with edge CDN caching and clean URLs configured via [`vercel.json`](vercel.json).

---

## Author & Creator

<table style="border: none;">
  <tr>
    <td width="100" valign="middle" align="center">
      <img src="assets/ali-sufian.jpg" width="84" height="84" alt="Ali Sufian" style="border-radius: 50%; border: 2px solid #E2E8F0;">
    </td>
    <td valign="middle">
      <strong>Ali Sufian</strong><br>
      Software Engineer building high-performance, local-first developer tools and zero-knowledge privacy utilities.<br>
      <a href="https://x.com/aliscodes">Follow @aliscodes on X</a> • <a href="https://github.com/alisufiankhan">@alisufiankhan on GitHub</a>
    </td>
  </tr>
</table>

---

## License

This project is licensed under the **MIT License**. See [PRIVACY.md](PRIVACY.md) and [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for complete details.
