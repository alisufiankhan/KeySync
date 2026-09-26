# Privacy Policy for KeySync

**Effective Date:** September 26, 2026  
**Last Updated:** September 26, 2026  

KeySync is committed to protecting your privacy and digital security. This Privacy Policy describes how KeySync handles your information.

---

### 1. Zero Data Collection & Zero Tracking
KeySync is an offline-first, client-side browser extension. **We do not collect, transmit, store, sell, or share any personal data, usage telemetry, analytics, IP addresses, or 2FA credentials.**

### 2. Client-Side Local Encryption
- All Time-Based One-Time Password (TOTP) secret keys, account identifiers, and service names are stored strictly on your local computer inside your browser's sandboxed storage (`chrome.storage.local`).
- Your vault data is encrypted using standard **AES-256-GCM** encryption.
- Encryption keys are derived locally using **PBKDF2 with SHA-256 and 100,000 iterations** combined with a cryptographically secure random salt generated on your device.
- We operate on a **Zero-Knowledge model**: neither the developers of KeySync nor any third party have access to your Master PIN or unencrypted secret keys.

### 3. In-Memory Session Persistence
KeySync features an optional in-memory session persistence system (`chrome.storage.session`). The derived encryption key is kept only in volatile RAM for a configurable duration (default 15 minutes) so you do not need to re-enter your PIN every time the popup closes. This session key is never written to disk and is immediately discarded when the timer expires, when you manually click Lock, or when the browser closes.

### 4. Network Communications & Favicon Icons
KeySync operates 100% offline with one single, optional network interaction:
- When you add an account with a custom domain, KeySync optionally retrieves high-resolution website favicons from Google's public favicon service (`https://t1.gstatic.com/faviconV2`).
- No account details, secrets, or user tokens are sent with these image requests.
- Retrieved favicon images are cached locally within your browser's private local storage to minimize redundant network queries.

### 5. Third-Party Services
KeySync does not integrate any third-party analytics (no Google Analytics, no Mixpanel, no Sentry), advertisement networks, or external cloud synchronization servers.

### 6. Data Retention and Deletion
You maintain complete ownership of your data at all times:
- You can export a JSON backup of your vault directly from the Settings menu.
- You can permanently delete individual accounts or perform a complete factory reset from the application at any time, immediately purging all stored credentials and encryption keys from your device.

---

### Contact & Developer
KeySync is developed by **Ali Sufian** ([@aliscodes](https://x.com/aliscodes)). If you have any questions or concerns regarding this Privacy Policy or security architecture, please reach out via X or open an issue in the repository.
