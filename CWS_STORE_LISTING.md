# Chrome Web Store Upload Guide — KeySync

Step-by-step instructions to submit **KeySync** to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## Before You Start

Make sure you have:
- A **Google Account** (used to sign into the Developer Dashboard)
- A **one-time $5 developer registration fee** paid at [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
- The **extension zip** (see Step 1 below)
- All store assets from `store_assets/keysync - assets/`

---

## Step 1 — Package the Extension

Create a `.zip` archive containing **only** the extension source files:

```
manifest.json
popup.html
popup.css
popup.js
crypto.js
totp.js
qr.js
brands.js
icons/
lib/
```

> **Do not include** `store_assets/`, `docs/`, `.git/`, or any markdown files.

**On Windows (PowerShell):**
```powershell
Compress-Archive -Path manifest.json,popup.html,popup.css,popup.js,crypto.js,totp.js,qr.js,brands.js,icons,lib -DestinationPath keysync-v1.0.0.zip
```

Alternatively, use `keysync-chrome-extension.zip` which is already prepared in the repo root.

---

## Step 2 — Open the Developer Dashboard

1. Go to [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole).
2. Sign in with your Google account.
3. Click **New Item** in the top-right corner.

---

## Step 3 — Upload the Extension Zip

1. Click **Choose file** and select `keysync-v1.0.0.zip`.
2. Wait for the upload and package validation to complete.
3. The dashboard will auto-detect the extension name and version from `manifest.json`.

---

## Step 4 — Fill in Store Listing Details

Navigate to the **Store listing** tab and fill in:

| Field | Value |
| :--- | :--- |
| **Extension Name** | `KeySync: TOTP 2FA Authenticator` |
| **Summary** (max 132 chars) | `Fast, local-only 2FA authenticator with PIN encryption, bulk Google Authenticator QR import, and zero cloud tracking.` |
| **Category** | Productivity |
| **Language** | English |

**Detailed Description** — paste the following into the description box:

```
KeySync is a local-only 2FA authenticator for Chrome. It generates your TOTP codes on your own device, so you stop reaching for your phone every time you log in.

Works with any service that supports authenticator-app 2FA.

FEATURES

- On-device encryption. Your secret keys are encrypted locally with AES-256-GCM, using keys derived via PBKDF2 (100,000 iterations, SHA-256). Nothing is stored in plain text.

- Import from Google Authenticator. Drop in your export QR screenshot or paste the migration link. Multi-part exports and account selection are supported.

- Backup and restore. Export a JSON backup of your vault anytime, or restore from one. The backup file is unencrypted, so keep it somewhere safe.

- Auto-lock. Lock after 5, 15, or 30 minutes, or on browser close. Active keys stay in memory only and are never written to disk.

- One-click copy. Click any account to copy its current 6-digit code to your clipboard.

- Fast search. Filter by service name or email as you type.

- Adaptive UI. Clean, minimal, and follows your system light or dark mode.

PRIVACY

- No account or login.
- No cloud, no tracking, no analytics.
- Offline-first. Your keys never leave your device.
```

---

## Step 5 — Upload Store Assets

Go to the **Store listing** → **Graphic assets** section and upload:

| Asset | File | Required Size |
| :--- | :--- | :--- |
| Extension icon | `icons/icon-128.png` | 128×128 px |
| Small promo tile | `store_assets/keysync - assets/promo-small-440x280.png` | 440×280 px |
| Marquee promo tile | `store_assets/keysync - assets/promo-marquee-1400x560.png` | 1400×560 px |
| Screenshot 1 | `store_assets/keysync - assets/screenshot-1.png` | 1280×800 px |
| Screenshot 2 | `store_assets/keysync - assets/screenshot-2.png` | 1280×800 px |
| Screenshot 3 | `store_assets/keysync - assets/screenshot-3.png` | 1280×800 px |
| Screenshot 4 | `store_assets/keysync - assets/screenshot-4.png` | 1280×800 px |
| Screenshot 5 | `store_assets/keysync - assets/screenshot-5.png` | 1280×800 px |

> You need **at least 1 screenshot**. Upload all 5 for best store visibility.

---

## Step 6 — Set the Privacy Policy URL

In the **Store listing** → **Privacy practices** section:

- **Privacy Policy URL:** `https://keysync.vercel.app/privacy`  
  *(or your GitHub Pages URL: `https://alisufiankhan.github.io/KeySync/privacy.html`)*

---

## Step 7 — Justify Permissions

Navigate to the **Privacy practices** tab. For each permission requested in `manifest.json`, provide a justification:

**`storage`**
> "Required to store the user's AES-256-GCM encrypted 2FA credentials locally (`chrome.storage.local`) and to maintain a temporary in-memory session key in RAM (`chrome.storage.session`) during the configurable auto-lock window."

**Content Security Policy (`img-src`)**
> "KeySync loads high-resolution domain favicons from Google's public favicon service (`t1.gstatic.com`) to display brand icons for custom domains. All assets are cached locally after the first fetch."

**Single Purpose Description:**
> "KeySync is a client-side Time-Based One-Time Password (TOTP) authenticator that securely encrypts and generates two-factor authentication security codes locally on the user's computer."

---

## Step 8 — Submit for Review

1. Click **Save draft** to review everything one last time.
2. Click **Submit for review**.
3. Review typically takes **1–3 business days** for new submissions.
4. You will receive an email when the extension is approved or if changes are requested.

---

## After Approval

- Your extension will be live at:  
  `https://chromewebstore.google.com/detail/keysync/<extension-id>`
- Update the store listing URL on your landing page (`index.html`) and in this repo's README.
- For future updates: increment the `version` field in `manifest.json`, re-zip, and upload via the dashboard → **Package** tab → **Upload new package**.

---

## Quick Reference

| Resource | Link |
| :--- | :--- |
| Developer Dashboard | [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole) |
| CWS Policies | [developer.chrome.com/docs/webstore/program-policies](https://developer.chrome.com/docs/webstore/program-policies) |
| Extension FAQ | [developer.chrome.com/docs/webstore/faq](https://developer.chrome.com/docs/webstore/faq) |
| Privacy Policy | `privacy.html` in this repo |
