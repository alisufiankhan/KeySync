/**
 * KeySync: Main Popup Controller
 * Manages UI state, auto-advancing PIN input, encryption lifecycle,
 * 30s TOTP timer loop, clipboard copying, search filtering, and QR imports.
 */

(function () {
  'use strict';

  // --- Storage Polyfill (Chrome Extension storage with localStorage fallback) ---
  const Storage = {
    get: function (keys) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(keys, resolve);
        } else {
          // Web testing fallback
          const result = {};
          const keyList = Array.isArray(keys) ? keys : [keys];
          keyList.forEach(k => {
            const val = localStorage.getItem(k);
            if (val !== null) {
              try {
                result[k] = JSON.parse(val);
              } catch (e) {
                result[k] = val;
              }
            }
          });
          resolve(result);
        }
      });
    },
    set: function (items) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set(items, resolve);
        } else {
          // Web testing fallback
          Object.keys(items).forEach(k => {
            localStorage.setItem(k, JSON.stringify(items[k]));
          });
          resolve();
        }
      });
    },
    remove: function (keys) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove(keys, resolve);
        } else {
          const keyList = Array.isArray(keys) ? keys : [keys];
          keyList.forEach(k => localStorage.removeItem(k));
          resolve();
        }
      });
    },
    clear: function () {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.clear(resolve);
        } else {
          localStorage.clear();
          resolve();
        }
      });
    }
  };

  // --- Session Storage Polyfill (RAM-only for browser session persistence across popup blur) ---
  const SessionStorage = {
    get: function (keys) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
          chrome.storage.session.get(keys, resolve);
        } else {
          const result = {};
          const keyList = Array.isArray(keys) ? keys : [keys];
          keyList.forEach(k => {
            const val = sessionStorage.getItem(k);
            if (val !== null) {
              try {
                result[k] = JSON.parse(val);
              } catch (e) {
                result[k] = val;
              }
            }
          });
          resolve(result);
        }
      });
    },
    set: function (items) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
          chrome.storage.session.set(items, resolve);
        } else {
          Object.keys(items).forEach(k => {
            sessionStorage.setItem(k, JSON.stringify(items[k]));
          });
          resolve();
        }
      });
    },
    remove: function (keys) {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
          chrome.storage.session.remove(keys, resolve);
        } else {
          const keyList = Array.isArray(keys) ? keys : [keys];
          keyList.forEach(k => sessionStorage.removeItem(k));
          resolve();
        }
      });
    },
    clear: function () {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.session) {
          chrome.storage.session.clear(resolve);
        } else {
          sessionStorage.clear();
          resolve();
        }
      });
    }
  };

  // --- Active RAM Session Helpers ---
  async function saveActiveSession(key) {
    if (!key) return;
    try {
      const data = await Storage.get('keysync_autolock_minutes');
      const minutes = (data && data.keysync_autolock_minutes !== undefined) ? parseInt(data.keysync_autolock_minutes, 10) : 15;
      if (minutes === 0) {
        // Immediate auto-lock on popup close: do not persist session key in RAM
        await SessionStorage.remove(['keysync_session_key', 'keysync_unlocked_until']);
        return;
      }
      const rawKeyB64 = await KeySyncCrypto.exportRawKey(key);
      const unlockedUntil = (minutes === -1) ? -1 : (Date.now() + minutes * 60 * 1000);
      await SessionStorage.set({
        keysync_session_key: rawKeyB64,
        keysync_unlocked_until: unlockedUntil
      });
    } catch (_) {}
  }

  async function clearActiveSession() {
    try {
      await SessionStorage.remove(['keysync_session_key', 'keysync_unlocked_until']);
    } catch (_) {}
  }

  // --- Session State (in-memory only, cleared on popup unload or session expiry) ---
  let derivedKey = null;
  let accounts = [];
  let codeInterval = null;
  let lockoutInterval = null;
  let tempMigrationAccounts = [];
  let targetEditAccountId = null;
  let previousScreen = 'lock';
  let currentResetTab = 'change';
  let detectedBatchMetadata = { batchSize: 1, parts: new Set() };
  let logoCache = {};

  // --- Local Logo Caching Helper ---
  function cacheLogoImage(img, domain) {
    if (!domain || logoCache[domain] || domain === 'localhost') return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 64;
      canvas.height = img.naturalHeight || 64;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      if (dataUrl && dataUrl.length > 50) {
        logoCache[domain] = dataUrl;
        Storage.get('keysync_logo_cache').then(res => {
          const cache = (res && res.keysync_logo_cache) ? res.keysync_logo_cache : {};
          cache[domain] = dataUrl;
          Storage.set({ keysync_logo_cache: cache });
        }).catch(() => {});
      }
    } catch (_) {
      // CORS or canvas restriction; image continues rendering directly
    }
  }

  // --- DOM Elements ---
  const screens = {
    setup: document.getElementById('screen-setup'),
    lock: document.getElementById('screen-lock'),
    main: document.getElementById('screen-main'),
    add: document.getElementById('screen-add'),
    qr: document.getElementById('screen-qr'),
    reset: document.getElementById('screen-reset'),
    settings: document.getElementById('screen-settings')
  };

  // Lock Screen elements
  const lockPinBoxes = document.getElementById('lock-pin-boxes');
  const lockPinInput = document.getElementById('lock-pin-input');
  const lockPinContainer = document.getElementById('lock-pin-container');
  const btnUnlock = document.getElementById('btn-unlock');
  const lockError = document.getElementById('lock-error');
  const lockoutTimer = document.getElementById('lockout-timer');
  const lockoutSeconds = document.getElementById('lockout-seconds');

  // Setup Screen elements
  const setupPinInput = document.getElementById('setup-pin-input');
  const setupConfirmInput = document.getElementById('setup-confirm-input');
  const setupPinBoxes = document.getElementById('setup-pin-boxes');
  const setupConfirmBoxes = document.getElementById('setup-confirm-boxes');
  const btnSetPin = document.getElementById('btn-set-pin');
  const setupError = document.getElementById('setup-error');

  // Main View elements
  const brandLockBtn = document.getElementById('brand-lock-btn');
  const btnOpenQr = document.getElementById('btn-open-qr');
  const btnOpenAdd = document.getElementById('btn-open-add');
  const btnOpenResetPin = document.getElementById('btn-open-reset-pin');
  const searchInput = document.getElementById('search-input');
  const timerBar = document.getElementById('timer-bar');
  const timerLabel = document.getElementById('timer-label');
  const accountsList = document.getElementById('accounts-list');
  const emptyState = document.getElementById('empty-state');
  const btnEmptyAdd = document.getElementById('btn-empty-add');
  const btnEmptyQr = document.getElementById('btn-empty-qr');

  // Add Screen elements
  const btnAddBack = document.getElementById('btn-add-back');
  const formAddAccount = document.getElementById('form-add-account');
  const manualIssuer = document.getElementById('manual-issuer');
  const manualName = document.getElementById('manual-name');
  const manualSecret = document.getElementById('manual-secret');
  const addError = document.getElementById('add-error');

  // Bulk Import Screen elements
  const btnQrBack = document.getElementById('btn-qr-back');
  const qrViewTitle = document.getElementById('qr-view-title');
  const importTabs = document.getElementById('import-tabs');
  const tabBtnUpload = document.getElementById('tab-btn-upload');
  const tabBtnPaste = document.getElementById('tab-btn-paste');
  const tabContentUpload = document.getElementById('tab-content-upload');
  const tabContentPaste = document.getElementById('tab-content-paste');
  const qrDropZone = document.getElementById('qr-drop-zone');
  const qrFileInput = document.getElementById('qr-file-input');
  const pasteInput = document.getElementById('paste-input');
  const btnParsePaste = document.getElementById('btn-parse-paste');
  const importErrorBanner = document.getElementById('import-error-banner');
  const migrationView = document.getElementById('migration-view');
  const migrationCount = document.getElementById('migration-count');
  const migrationItemsList = document.getElementById('migration-items-list');
  const btnSelectAll = document.getElementById('btn-select-all');
  const btnDeselectAll = document.getElementById('btn-deselect-all');
  const btnImportSelected = document.getElementById('btn-import-selected');
  const migrationBatchNotice = document.getElementById('migration-batch-notice');
  const batchPartsBadge = document.getElementById('batch-parts-badge');
  const batchDescText = document.getElementById('batch-desc-text');
  const qrFileInputAppend = document.getElementById('qr-file-input-append');

  // Modals & Toast
  const editModal = document.getElementById('edit-modal');
  const deleteModal = document.getElementById('delete-modal');
  const formEditAccount = document.getElementById('form-edit-account');
  const editAccountId = document.getElementById('edit-account-id');
  const editIssuer = document.getElementById('edit-issuer');
  const editName = document.getElementById('edit-name');
  const btnCloseEdit = document.getElementById('btn-close-edit');
  const btnDeleteAccount = document.getElementById('btn-delete-account');
  const deleteAccountName = document.getElementById('delete-account-name');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  const toast = document.getElementById('toast');

  // Settings & Privacy elements
  const btnOpenSettings = document.getElementById('btn-open-settings') || document.getElementById('btn-open-reset-pin');
  const btnSettingsBack = document.getElementById('btn-settings-back');
  const settingAutolock = document.getElementById('setting-autolock');
  const btnSettingsChangePin = document.getElementById('btn-settings-change-pin');
  const btnExportVault = document.getElementById('btn-export-vault');
  const settingsImportFile = document.getElementById('settings-import-file');
  const btnOpenPrivacy = document.getElementById('btn-open-privacy');
  const privacyModal = document.getElementById('privacy-modal');
  const btnClosePrivacy = document.getElementById('btn-close-privacy');
  const btnDismissPrivacy = document.getElementById('btn-dismiss-privacy');

  // Reset Screen elements
  const btnLockResetPin = document.getElementById('btn-lock-reset-pin');
  const btnResetBack = document.getElementById('btn-reset-back');
  const tabBtnChangePin = document.getElementById('tab-btn-change-pin');
  const tabBtnForgotPin = document.getElementById('tab-btn-forgot-pin');
  const tabContentChangePin = document.getElementById('tab-content-change-pin');
  const tabContentForgotPin = document.getElementById('tab-content-forgot-pin');
  const formChangePin = document.getElementById('form-change-pin');
  const changeOldPin = document.getElementById('change-old-pin');
  const changeNewPin = document.getElementById('change-new-pin');
  const changeConfirmPin = document.getElementById('change-confirm-pin');
  const changePinError = document.getElementById('change-pin-error');
  const btnSubmitChangePin = document.getElementById('btn-submit-change-pin');
  const btnSwitchToForgot = document.getElementById('btn-switch-to-forgot');
  const btnOpenResetModal = document.getElementById('btn-open-reset-modal');
  const resetVaultModal = document.getElementById('reset-vault-modal');
  const btnCloseResetModal = document.getElementById('btn-close-reset-modal');
  const btnCancelReset = document.getElementById('btn-cancel-reset');
  const btnConfirmReset = document.getElementById('btn-confirm-reset');

  // --- Toast Notification Helper ---
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message || 'Copied!';
    toast.classList.add('show');
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 1500);
  }

  // --- Screen Navigation ---
  function showScreen(name) {
    Object.keys(screens).forEach(key => {
      if (key === name) {
        screens[key].classList.add('active');
      } else {
        screens[key].classList.remove('active');
      }
    });

    // Screen specific focus/actions
    if (name === 'lock') {
      setTimeout(() => lockPinInput.focus(), 50);
    } else if (name === 'setup') {
      setTimeout(() => setupPinInput.focus(), 50);
    } else if (name === 'main') {
      startTOTPTimerLoop();
      renderAccounts();
    } else if (name === 'reset') {
      switchResetTab(currentResetTab);
    }
  }

  // --- PIN Box Visual Manager ---
  function setupPinBoxSync(inputEl, boxesContainer) {
    const boxes = boxesContainer.querySelectorAll('.pin-box');

    function update() {
      const val = inputEl.value;
      const isFocused = (document.activeElement === inputEl);

      boxes.forEach((box, i) => {
        if (i < val.length) {
          box.textContent = '•';
          box.classList.add('filled');
          box.classList.remove('active');
        } else if (i === val.length && isFocused) {
          box.textContent = '_';
          box.classList.add('active');
          box.classList.remove('filled');
        } else {
          box.textContent = '';
          box.classList.remove('active', 'filled');
        }
      });
    }

    inputEl.addEventListener('input', () => {
      // Allow only numbers, max 4 digits
      inputEl.value = inputEl.value.replace(/\D/g, '').slice(0, 4);
      update();
    });

    inputEl.addEventListener('focus', update);
    inputEl.addEventListener('blur', () => {
      setTimeout(update, 20);
    });

    boxesContainer.addEventListener('click', () => {
      inputEl.focus();
    });

    update();
  }

  // --- Lockout Management ---
  async function checkLockout() {
    const data = await Storage.get(['keysync_lockout_until']);
    const lockoutUntil = data.keysync_lockout_until || 0;
    const now = Date.now();

    if (lockoutUntil > now) {
      const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
      triggerLockoutUI(remainingSeconds);
      return true;
    }
    return false;
  }

  function triggerLockoutUI(secondsRemaining) {
    lockoutTimer.style.display = 'block';
    lockoutSeconds.textContent = secondsRemaining;
    btnUnlock.disabled = true;
    lockPinInput.disabled = true;

    if (lockoutInterval) clearInterval(lockoutInterval);

    let sec = secondsRemaining;
    lockoutInterval = setInterval(async () => {
      sec--;
      if (sec <= 0) {
        clearInterval(lockoutInterval);
        lockoutTimer.style.display = 'none';
        btnUnlock.disabled = false;
        lockPinInput.disabled = false;
        await Storage.set({ keysync_failed_attempts: 0, keysync_lockout_until: 0 });
        lockPinInput.focus();
      } else {
        lockoutSeconds.textContent = sec;
      }
    }, 1000);
  }

  // --- Initial Launch Handler ---
  async function init() {
    setupPinBoxSync(lockPinInput, lockPinBoxes);
    setupPinBoxSync(setupPinInput, setupPinBoxes);
    setupPinBoxSync(setupConfirmInput, setupConfirmBoxes);

    // Preload logo cache from storage for instant offline rendering
    try {
      const storedCache = await Storage.get('keysync_logo_cache');
      if (storedCache && storedCache.keysync_logo_cache) {
        logoCache = storedCache.keysync_logo_cache;
      }
    } catch (_) {}

    // Load auto-lock setting into select
    try {
      const autoLockData = await Storage.get('keysync_autolock_minutes');
      const val = (autoLockData && autoLockData.keysync_autolock_minutes !== undefined) ? autoLockData.keysync_autolock_minutes : 15;
      if (settingAutolock) settingAutolock.value = String(val);
    } catch (_) {}

    const stored = await Storage.get(['keysync_pin_hash', 'keysync_salt', 'keysync_vault']);

    if (!stored.keysync_pin_hash) {
      // First-time setup
      showScreen('setup');
      return;
    }

    // Check for active in-memory session (RAM persistence across popup blur)
    try {
      const session = await SessionStorage.get(['keysync_session_key', 'keysync_unlocked_until']);
      if (session && session.keysync_session_key && session.keysync_unlocked_until !== undefined) {
        const isStillValid = (session.keysync_unlocked_until === -1) || (Date.now() < session.keysync_unlocked_until);
        if (isStillValid && stored.keysync_vault) {
          derivedKey = await KeySyncCrypto.importRawKey(session.keysync_session_key);
          accounts = await KeySyncCrypto.decryptVault(derivedKey, stored.keysync_vault);
          showScreen('main');
          return;
        } else {
          await clearActiveSession();
        }
      }
    } catch (_) {
      await clearActiveSession();
    }

    // Show lock screen
    showScreen('lock');
    await checkLockout();
  }

  // --- Setup Screen Submission & Smooth Shift ---
  // When 4th digit is entered in upper PIN, smoothly shift cursor to confirm PIN
  setupPinInput.addEventListener('input', () => {
    if (setupPinInput.value.length === 4) {
      setTimeout(() => {
        setupConfirmInput.focus();
      }, 50);
    }
  });

  setupPinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      setupConfirmInput.focus();
    }
  });

  // When in confirm PIN, typing 4 digits auto-validates/submits; backspace on empty shifts back to upper PIN
  setupConfirmInput.addEventListener('input', () => {
    if (setupConfirmInput.value.length === 4) {
      if (setupPinInput.value.length === 4) {
        if (setupConfirmInput.value === setupPinInput.value) {
          setupError.textContent = '';
          setTimeout(() => {
            handleSetPin();
          }, 150);
        } else {
          setupError.textContent = 'PINs do not match. Please re-enter.';
        }
      }
    } else {
      setupError.textContent = '';
    }
  });

  setupConfirmInput.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && setupConfirmInput.value.length === 0) {
      e.preventDefault();
      setupPinInput.focus();
      setupPinInput.value = setupPinInput.value.slice(0, -1);
      setupPinInput.dispatchEvent(new Event('input'));
    } else if (e.key === 'Enter') {
      handleSetPin();
    }
  });

  btnSetPin.addEventListener('click', handleSetPin);

  async function handleSetPin() {
    setupError.textContent = '';
    const pin = setupPinInput.value.trim();
    const confirm = setupConfirmInput.value.trim();

    if (pin.length !== 4) {
      setupError.textContent = 'PIN must be exactly 4 digits.';
      return;
    }

    if (pin !== confirm) {
      setupError.textContent = 'PINs do not match. Please re-enter.';
      setupConfirmInput.value = '';
      setupConfirmInput.dispatchEvent(new Event('input'));
      setupConfirmInput.focus();
      return;
    }

    btnSetPin.disabled = true;
    try {
      const pinHash = await KeySyncCrypto.hashPIN(pin);
      const salt = KeySyncCrypto.generateSalt();
      const key = await KeySyncCrypto.deriveKey(pin, salt);

      // Save initial empty vault
      accounts = [];
      const encryptedVault = await KeySyncCrypto.encryptVault(key, accounts);

      await Storage.set({
        keysync_pin_hash: pinHash,
        keysync_salt: salt,
        keysync_vault: encryptedVault,
        keysync_pin_length: pin.length,
        keysync_failed_attempts: 0,
        keysync_lockout_until: 0
      });

      derivedKey = key;
      await saveActiveSession(key);
      showToast('PIN set successfully!');
      showScreen('main');
    } catch (err) {
      setupError.textContent = 'Failed to setup PIN: ' + err.message;
    } finally {
      btnSetPin.disabled = false;
    }
  }

  // --- Unlock Flow ---
  btnUnlock.addEventListener('click', handleUnlock);
  lockPinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleUnlock();
  });

  // Auto-unlock smoothly when 4th digit is entered
  lockPinInput.addEventListener('input', () => {
    if (lockPinInput.value.length === 4) {
      setTimeout(() => {
        if (!btnUnlock.disabled && lockPinInput.value.length === 4) {
          handleUnlock();
        }
      }, 150);
    }
  });

  async function handleUnlock() {
    lockError.textContent = '';
    const isLockedOut = await checkLockout();
    if (isLockedOut) return;

    const pin = lockPinInput.value.trim();
    if (!pin) {
      lockError.textContent = 'Please enter your PIN.';
      return;
    }

    btnUnlock.disabled = true;
    try {
      const enteredHash = await KeySyncCrypto.hashPIN(pin);
      const stored = await Storage.get([
        'keysync_pin_hash',
        'keysync_salt',
        'keysync_vault',
        'keysync_failed_attempts'
      ]);

      if (enteredHash !== stored.keysync_pin_hash) {
        // Failed attempt
        const failedAttempts = (stored.keysync_failed_attempts || 0) + 1;
        if (failedAttempts >= 5) {
          const lockoutUntil = Date.now() + 30000;
          await Storage.set({
            keysync_failed_attempts: failedAttempts,
            keysync_lockout_until: lockoutUntil
          });
          triggerLockoutUI(30);
        } else {
          await Storage.set({ keysync_failed_attempts: failedAttempts });
          lockError.textContent = `Incorrect PIN (${failedAttempts}/5 attempts)`;
          lockPinInput.value = '';
          lockPinInput.dispatchEvent(new Event('input'));
          lockPinInput.focus();
        }
        btnUnlock.disabled = false;
        return;
      }

      // Success: Reset failed attempts
      await Storage.set({ keysync_failed_attempts: 0, keysync_lockout_until: 0 });

      // Derive encryption key into memory
      derivedKey = await KeySyncCrypto.deriveKey(pin, stored.keysync_salt);

      // Decrypt stored accounts
      if (stored.keysync_vault) {
        accounts = await KeySyncCrypto.decryptVault(derivedKey, stored.keysync_vault);
      } else {
        accounts = [];
      }

      await saveActiveSession(derivedKey);

      lockPinInput.value = '';
      lockPinInput.dispatchEvent(new Event('input'));
      showScreen('main');
    } catch (err) {
      lockError.textContent = 'Unlock error: ' + err.message;
    } finally {
      btnUnlock.disabled = false;
    }
  }

  // --- Manual Lock ---
  brandLockBtn.addEventListener('click', async () => {
    // Clear decrypted secrets from memory and RAM session storage
    derivedKey = null;
    accounts = [];
    if (codeInterval) clearInterval(codeInterval);
    await clearActiveSession();
    showScreen('lock');
    showToast('Locked');
  });

  // --- Save Vault to Chrome Storage ---
  async function persistAccounts() {
    if (!derivedKey) throw new Error('Cannot persist without derived encryption key in memory.');
    const encryptedVault = await KeySyncCrypto.encryptVault(derivedKey, accounts);
    await Storage.set({ keysync_vault: encryptedVault });
  }

  // --- Render Account Cards & Search ---
  const btnClearSearch = document.getElementById('btn-clear-search');

  function renderAccounts() {
    const query = searchInput.value.trim().toLowerCase();
    accountsList.innerHTML = '';

    const filtered = accounts.filter(acc => {
      const branding = (typeof KeySyncBrands !== 'undefined') ? KeySyncBrands.resolveAccountBranding(acc, logoCache) : { issuer: acc.issuer || 'Account', account: acc.name || '' };
      const issuer = (branding.issuer || '').toLowerCase();
      const name = (branding.account || acc.name || '').toLowerCase();
      return issuer.includes(query) || name.includes(query);
    });

    if (accounts.length === 0) {
      accountsList.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    emptyState.style.display = 'none';
    accountsList.style.display = 'block';

    if (filtered.length === 0) {
      accountsList.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: var(--text-muted); font-size: 13px;">
          No accounts matching "${escapeHtml(query)}"
        </div>`;
      return;
    }

    filtered.forEach(acc => {
      const card = document.createElement('div');
      card.className = 'account-card';
      card.setAttribute('data-id', acc.id);

      const codeRaw = KeySyncTOTP.generateCode(acc);
      const codeFormatted = KeySyncTOTP.formatCode(codeRaw);

      const branding = (typeof KeySyncBrands !== 'undefined') ? KeySyncBrands.resolveAccountBranding(acc, logoCache) : {
        issuer: acc.issuer || 'Account',
        account: acc.name || '',
        avatarHtml: `<div class="service-avatar monogram-avatar"><span class="monogram-text">${escapeHtml((acc.issuer || 'A').charAt(0).toUpperCase())}</span></div>`
      };

      card.innerHTML = `
        <div class="account-card-left">
          ${branding.avatarHtml}
          <div class="account-info">
            <div class="service-name">${escapeHtml(branding.issuer)}</div>
            ${branding.account ? `<div class="account-name" title="${escapeHtml(branding.account)}">${escapeHtml(branding.account)}</div>` : ''}
          </div>
        </div>
        <div class="account-card-right">
          <div class="code-box" title="Click to copy code">
            <span class="totp-code" id="code-${acc.id}">${codeFormatted}</span>
          </div>
          <div class="card-actions">
            <button type="button" class="btn-action-copy" title="Copy code" aria-label="Copy code">
              <svg class="icon-copy" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <svg class="icon-check" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <button type="button" class="btn-card-more" title="More options" aria-label="More options" data-id="${acc.id}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1.5"></circle>
                <circle cx="19" cy="12" r="1.5"></circle>
                <circle cx="5" cy="12" r="1.5"></circle>
              </svg>
            </button>
          </div>
        </div>
      `;

      // Handle image loading, error fallback, and local caching
      const logoImg = card.querySelector('.brand-logo-img');
      if (logoImg) {
        if (logoImg.classList.contains('loaded')) {
          const fallback = card.querySelector('.avatar-fallback');
          if (fallback) fallback.style.opacity = '0';
        } else {
          logoImg.addEventListener('load', () => {
            logoImg.classList.add('loaded');
            const fallback = card.querySelector('.avatar-fallback');
            if (fallback) fallback.style.opacity = '0';
            const domain = card.querySelector('.service-avatar')?.getAttribute('data-domain');
            if (domain && !logoCache[domain]) {
              cacheLogoImage(logoImg, domain);
            }
          });
          logoImg.addEventListener('error', () => {
            logoImg.style.display = 'none';
            const fallback = card.querySelector('.avatar-fallback');
            if (fallback) {
              fallback.style.display = 'flex';
              fallback.style.opacity = '1';
            }
          });
        }
      }

      const btnCopy = card.querySelector('.btn-action-copy');

      function triggerCopy() {
        const codeSpan = card.querySelector('.totp-code');
        const currentCode = KeySyncTOTP.cleanCodeForCopy(codeSpan ? codeSpan.textContent : '');
        copyToClipboard(currentCode);

        if (btnCopy) {
          btnCopy.classList.add('copied');
          btnCopy.setAttribute('title', 'Copied!');
          setTimeout(() => {
            btnCopy.classList.remove('copied');
            btnCopy.setAttribute('title', 'Copy code');
          }, 1500);
        }
      }

      // Copy on dedicated button click
      btnCopy.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerCopy();
      });

      // Copy on clicking code box or anywhere on card (except options button)
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-card-more') || e.target.closest('.btn-action-copy')) return;
        triggerCopy();
      });

      // Edit / delete trigger
      const moreBtn = card.querySelector('.btn-card-more');
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(acc);
      });

      accountsList.appendChild(card);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getIssuerHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 360;
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('Copied!');
    }
  }

  // --- Search Input Listener & Clear ---
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (btnClearSearch) {
        btnClearSearch.style.display = searchInput.value ? 'flex' : 'none';
      }
      renderAccounts();
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      btnClearSearch.style.display = 'none';
      searchInput.focus();
      renderAccounts();
    });
  }

  // --- 30s TOTP Timer Loop ---
  let lastTotpStep = -1;
  function startTOTPTimerLoop() {
    if (codeInterval) clearInterval(codeInterval);
    lastTotpStep = Math.floor(Date.now() / 1000 / 30);

    function updateTimer() {
      const remainingSec = KeySyncTOTP.getRemainingSeconds(30);
      const percentage = KeySyncTOTP.getProgressPercentage(30);

      timerBar.style.width = `${percentage}%`;
      timerLabel.textContent = `${remainingSec}s`;

      if (remainingSec <= 5) {
        timerBar.classList.add('warning');
      } else {
        timerBar.classList.remove('warning');
      }

      // Discrete 30s epoch step check to prevent timer drift skips
      const currentStep = Math.floor(Date.now() / 1000 / 30);
      if (currentStep !== lastTotpStep) {
        lastTotpStep = currentStep;
        // Animate code refresh
        accounts.forEach(acc => {
          const codeEl = document.getElementById(`code-${acc.id}`);
          if (codeEl) {
            codeEl.classList.add('refreshing');
            setTimeout(() => {
              codeEl.textContent = KeySyncTOTP.formatCode(KeySyncTOTP.generateCode(acc));
              codeEl.classList.remove('refreshing');
            }, 180);
          }
        });
      }
    }

    updateTimer();
    codeInterval = setInterval(updateTimer, 500);
  }

  // --- Add Account Manually ---
  btnOpenAdd.addEventListener('click', () => {
    manualIssuer.value = '';
    manualName.value = '';
    manualSecret.value = '';
    addError.textContent = '';
    showScreen('add');
    setTimeout(() => manualIssuer.focus(), 50);
  });

  btnEmptyAdd.addEventListener('click', () => {
    btnOpenAdd.click();
  });

  btnAddBack.addEventListener('click', () => {
    showScreen('main');
  });

  formAddAccount.addEventListener('submit', async (e) => {
    e.preventDefault();
    addError.textContent = '';

    const issuer = manualIssuer.value.trim();
    const name = manualName.value.trim();
    const rawSecret = manualSecret.value.trim();

    if (!KeySyncTOTP.isValidBase32(rawSecret)) {
      addError.textContent = 'Invalid secret key. Must be a valid Base32 string.';
      return;
    }

    const cleanSecret = KeySyncTOTP.sanitizeSecret(rawSecret);

    const newAccount = {
      id: (typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      issuer,
      name,
      secret: cleanSecret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      type: 'totp'
    };

    accounts.push(newAccount);
    try {
      await persistAccounts();
      showToast('Account added');
      showScreen('main');
    } catch (err) {
      addError.textContent = 'Failed to save account: ' + err.message;
    }
  });

  // --- QR Scanning & Google Auth Bulk Import ---
  let currentImportTab = 'upload';

  function showImportError(msg) {
    if (!importErrorBanner) return;
    if (msg) {
      importErrorBanner.innerHTML = msg;
      importErrorBanner.style.display = 'block';
    } else {
      hideImportError();
    }
  }

  function hideImportError() {
    if (importErrorBanner) {
      importErrorBanner.textContent = '';
      importErrorBanner.style.display = 'none';
    }
  }

  function switchImportTab(tabName) {
    currentImportTab = tabName;
    hideImportError();

    // Toggle active state on tab buttons
    [tabBtnUpload, tabBtnPaste].forEach(btn => {
      if (btn) {
        if (btn.getAttribute('data-tab') === tabName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    // Toggle content visibility
    if (tabContentUpload) tabContentUpload.style.display = (tabName === 'upload') ? 'flex' : 'none';
    if (tabContentPaste) tabContentPaste.style.display = (tabName === 'paste') ? 'flex' : 'none';
  }

  // Tab switch click handlers
  if (tabBtnUpload) tabBtnUpload.addEventListener('click', () => switchImportTab('upload'));
  if (tabBtnPaste) tabBtnPaste.addEventListener('click', () => switchImportTab('paste'));

  btnOpenQr.addEventListener('click', () => {
    openQRScanner('upload');
  });

  btnEmptyQr.addEventListener('click', () => {
    openQRScanner('upload');
  });

  btnQrBack.addEventListener('click', () => {
    if (migrationView && migrationView.style.display !== 'none') {
      // Go back to the import tabs view
      openQRScanner(currentImportTab);
    } else {
      showScreen('main');
    }
  });

  function openQRScanner(defaultTab = 'upload') {
    qrViewTitle.textContent = 'Bulk Import';
    detectedBatchMetadata = { batchSize: 1, parts: new Set() };
    if (importTabs) importTabs.style.display = 'flex';
    if (migrationView) migrationView.style.display = 'none';
    if (migrationBatchNotice) migrationBatchNotice.style.display = 'none';
    hideImportError();
    showScreen('qr');
    switchImportTab(defaultTab);
  }

  // --- JSON Vault Backup Parser ---
  async function parseJsonBackupFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          let rawAccounts = [];
          if (Array.isArray(parsed)) {
            rawAccounts = parsed;
          } else if (parsed && Array.isArray(parsed.accounts)) {
            rawAccounts = parsed.accounts;
          } else if (parsed && Array.isArray(parsed.items)) {
            // Bitwarden export compatibility
            rawAccounts = parsed.items.filter(i => i.login && i.login.totp).map(i => ({
              issuer: i.name || 'Account',
              name: (i.login && i.login.username) || '',
              secret: KeySyncTOTP.sanitizeSecret(i.login.totp),
              algorithm: 'SHA1',
              digits: 6,
              period: 30,
              type: 'totp'
            }));
          } else {
            throw new Error('Unrecognized JSON backup format.');
          }

          const valid = [];
          rawAccounts.forEach(item => {
            const rawSecret = item.secret || item.key;
            if (rawSecret && KeySyncTOTP.isValidBase32(rawSecret)) {
              valid.push({
                id: (typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                issuer: item.issuer || 'Account',
                name: item.name || item.account || '',
                secret: KeySyncTOTP.sanitizeSecret(rawSecret),
                algorithm: item.algorithm || 'SHA1',
                digits: item.digits || 6,
                period: item.period || 30,
                type: item.type || 'totp'
              });
            }
          });

          if (valid.length === 0) {
            throw new Error(`No valid 2FA TOTP accounts found in "${file.name}".`);
          }

          resolve(valid);
        } catch (err) {
          reject(new Error(`Failed to parse "${file.name}": ` + err.message));
        }
      };
      reader.onerror = () => reject(new Error(`Failed to read file "${file.name}".`));
      reader.readAsText(file);
    });
  }

  // --- Multi-File QR Image & JSON Backup Upload / Drag-and-Drop ---
  async function handleBatchImageFiles(fileList, appendToExisting = false) {
    if (!fileList || fileList.length === 0) return;
    hideImportError();

    const files = Array.from(fileList);
    const newAccounts = [];
    const errors = [];

    showToast(`Scanning ${files.length} file(s)...`);

    for (const file of files) {
      try {
        if (file.name.toLowerCase().endsWith('.json') || file.type === 'application/json') {
          const jsonAccounts = await parseJsonBackupFile(file);
          newAccounts.push(...jsonAccounts);
          continue;
        }

        const decodedResults = await KeySyncQR.scanImageFile(file);
        const resultsArray = Array.isArray(decodedResults) ? decodedResults : [decodedResults];

        for (const decodedText of resultsArray) {
          const parsed = KeySyncQR.parseBatchContent(decodedText);
          if (parsed) {
            if (parsed.type === 'migration' && Array.isArray(parsed.accounts)) {
              newAccounts.push(...parsed.accounts);
              if (parsed.batchSize && parsed.batchSize > 1) {
                detectedBatchMetadata.batchSize = Math.max(detectedBatchMetadata.batchSize, parsed.batchSize);
                detectedBatchMetadata.parts.add(parsed.batchIndex !== undefined ? parsed.batchIndex + 1 : 1);
              }
            } else if (parsed.type === 'single' && parsed.account) {
              newAccounts.push(parsed.account);
            }
          }
        }
      } catch (err) {
        errors.push(err.message);
      }
    }

    const combined = appendToExisting ? [...tempMigrationAccounts, ...newAccounts] : newAccounts;

    if (combined.length > 0) {
      // Deduplicate by secret + name + issuer
      const seen = new Set();
      const uniqueAccounts = [];
      combined.forEach(acc => {
        const key = `${acc.secret}_${acc.name || ''}_${acc.issuer || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueAccounts.push(acc);
        }
      });

      displayMigrationScreen(uniqueAccounts);
      showToast(`Found ${uniqueAccounts.length} account(s)!`);
    } else {
      showImportError(errors.length > 0 ? errors.join('<br>') : 'No valid 2FA QR code found in selected image(s).');
    }
  }

  if (qrFileInput) {
    qrFileInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        await handleBatchImageFiles(e.target.files);
      }
      qrFileInput.value = '';
    });
  }

  if (qrDropZone) {
    // Clicking anywhere in the blue dotted box opens file dialog
    qrDropZone.addEventListener('click', (e) => {
      if (qrFileInput) {
        qrFileInput.click();
      }
    });

    // Keyboard accessibility (Enter or Space)
    qrDropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (qrFileInput) {
          qrFileInput.click();
        }
      }
    });

    qrDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      qrDropZone.classList.add('dragover');
    });

    qrDropZone.addEventListener('dragleave', () => {
      qrDropZone.classList.remove('dragover');
    });

    qrDropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      qrDropZone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await handleBatchImageFiles(e.dataTransfer.files);
      }
    });
  }

  // --- Paste Link / Text Import ---
  if (btnParsePaste) {
    btnParsePaste.addEventListener('click', async () => {
      hideImportError();
      const text = pasteInput ? pasteInput.value.trim() : '';
      if (!text) {
        showImportError('Please paste an export link or TOTP URIs.');
        return;
      }

      try {
        const parsed = KeySyncQR.parseBatchContent(text);
        if (parsed) {
          if (parsed.type === 'migration' && Array.isArray(parsed.accounts) && parsed.accounts.length > 0) {
            if (parsed.batchSize && parsed.batchSize > 1) {
              detectedBatchMetadata.batchSize = Math.max(detectedBatchMetadata.batchSize, parsed.batchSize);
              detectedBatchMetadata.parts.add(parsed.batchIndex !== undefined ? parsed.batchIndex + 1 : 1);
            }
            if (pasteInput) pasteInput.value = '';
            displayMigrationScreen(parsed.accounts);
            showToast(`Found ${parsed.accounts.length} accounts!`);
          } else if (parsed.type === 'single' && parsed.account) {
            const acc = parsed.account;
            acc.id = (typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : 'id_' + Date.now();
            accounts.push(acc);
            await persistAccounts();
            if (pasteInput) pasteInput.value = '';
            showToast(`Added ${acc.issuer || 'account'}`);
            showScreen('main');
          } else if (parsed.type === 'raw') {
            if (KeySyncTOTP.isValidBase32(parsed.content)) {
              manualSecret.value = parsed.content;
              showScreen('add');
              showToast('Secret pasted into form');
            } else {
              showImportError('Unrecognized format. Please paste a valid otpauth-migration:// or otpauth:// link.');
            }
          }
        } else {
          showImportError('Could not find any valid accounts in pasted text.');
        }
      } catch (err) {
        showImportError('Error parsing pasted data: ' + err.message);
      }
    });
  }

  if (qrFileInputAppend) {
    qrFileInputAppend.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length > 0) {
        await handleBatchImageFiles(e.target.files, true);
      }
      qrFileInputAppend.value = '';
    });
  }

  // --- Multi-Account Migration Checklist View ---
  function displayMigrationScreen(importedList) {
    tempMigrationAccounts = importedList;
    qrViewTitle.textContent = 'Import Accounts';

    if (importTabs) importTabs.style.display = 'none';
    if (tabContentUpload) tabContentUpload.style.display = 'none';
    if (tabContentPaste) tabContentPaste.style.display = 'none';

    migrationView.style.display = 'flex';
    migrationCount.textContent = importedList.length;

    // Check if Google Authenticator multi-part batch is detected
    if (migrationBatchNotice) {
      if (detectedBatchMetadata.batchSize > 1) {
        migrationBatchNotice.style.display = 'flex';
        const partsCount = detectedBatchMetadata.parts.size;
        const total = detectedBatchMetadata.batchSize;
        const loadedParts = Array.from(detectedBatchMetadata.parts).sort().join(', ');

        if (partsCount < total) {
          batchPartsBadge.textContent = `Part ${loadedParts} of ${total}`;
          batchPartsBadge.style.backgroundColor = 'var(--accent-color)';
          batchDescText.innerHTML = `Google Authenticator split your export across <strong>${total} QR codes</strong>. You have imported <strong>Part ${loadedParts}</strong> (${importedList.length} accounts). Add the remaining QR code screenshot(s) to import all accounts together.`;
        } else {
          batchPartsBadge.textContent = `All ${total} Parts Loaded`;
          batchPartsBadge.style.backgroundColor = '#10B981';
          batchDescText.innerHTML = `All <strong>${total} Google Authenticator QR codes</strong> have been combined (${importedList.length} accounts found).`;
        }
      } else {
        migrationBatchNotice.style.display = 'none';
      }
    }

    migrationItemsList.innerHTML = '';
    importedList.forEach((acc, index) => {
      const branding = (typeof KeySyncBrands !== 'undefined') ? KeySyncBrands.resolveAccountBranding(acc) : { issuer: acc.issuer || acc.name || 'Account', account: acc.name || '' };
      const row = document.createElement('label');
      row.className = 'migration-row';
      row.innerHTML = `
        <input type="checkbox" class="migration-checkbox" data-index="${index}" checked>
        <div class="migration-item-info">
          <span class="migration-item-service">${escapeHtml(branding.issuer)}</span>
          <span class="migration-item-name">${escapeHtml(branding.account || '')}</span>
        </div>
      `;
      migrationItemsList.appendChild(row);
    });
  }

  btnSelectAll.addEventListener('click', () => {
    migrationItemsList.querySelectorAll('.migration-checkbox').forEach(cb => cb.checked = true);
  });

  btnDeselectAll.addEventListener('click', () => {
    migrationItemsList.querySelectorAll('.migration-checkbox').forEach(cb => cb.checked = false);
  });

  btnImportSelected.addEventListener('click', async () => {
    const checkboxes = migrationItemsList.querySelectorAll('.migration-checkbox:checked');
    if (checkboxes.length === 0) {
      showToast('No accounts selected');
      return;
    }

    let addedCount = 0;
    checkboxes.forEach(cb => {
      const idx = parseInt(cb.getAttribute('data-index'), 10);
      const acc = tempMigrationAccounts[idx];
      if (acc) {
        if (typeof KeySyncBrands !== 'undefined') {
          const b = KeySyncBrands.resolveAccountBranding(acc);
          if (b.issuer && (!acc.issuer || acc.issuer.toLowerCase() === 'account')) {
            acc.issuer = b.issuer;
          }
          if (b.account && (!acc.name || acc.name.toLowerCase() === 'account' || acc.name.includes(':'))) {
            acc.name = b.account;
          }
        }
        acc.id = (typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : 'id_' + Date.now() + '_' + addedCount;
        accounts.push(acc);
        addedCount++;
      }
    });

    await persistAccounts();
    showToast(`Imported ${addedCount} accounts!`);
    showScreen('main');
  });

  // --- Edit & Delete Account Modal Handlers ---
  function openEditModal(acc) {
    targetEditAccountId = acc.id;
    editAccountId.value = acc.id;
    editIssuer.value = acc.issuer || '';
    editName.value = acc.name || '';
    editModal.style.display = 'flex';
  }

  btnCloseEdit.addEventListener('click', () => {
    editModal.style.display = 'none';
  });

  formEditAccount.addEventListener('submit', async (e) => {
    e.preventDefault();
    const acc = accounts.find(a => a.id === targetEditAccountId);
    if (acc) {
      acc.issuer = editIssuer.value.trim();
      acc.name = editName.value.trim();
      await persistAccounts();
      renderAccounts();
      showToast('Account updated');
    }
    editModal.style.display = 'none';
  });

  btnDeleteAccount.addEventListener('click', () => {
    const acc = accounts.find(a => a.id === targetEditAccountId);
    if (!acc) return;
    deleteAccountName.textContent = acc.issuer ? `${acc.issuer} (${acc.name || ''})` : 'this account';
    editModal.style.display = 'none';
    deleteModal.style.display = 'flex';
  });

  btnCancelDelete.addEventListener('click', () => {
    deleteModal.style.display = 'none';
  });

  btnConfirmDelete.addEventListener('click', async () => {
    accounts = accounts.filter(a => a.id !== targetEditAccountId);
    await persistAccounts();
    deleteModal.style.display = 'none';
    renderAccounts();
    showToast('Account deleted');
  });

  // --- Reset & Change PIN Management ---
  function switchResetTab(tabName) {
    currentResetTab = tabName;
    if (changePinError) changePinError.textContent = '';
    resetPinVisibility();

    [tabBtnChangePin, tabBtnForgotPin].forEach(btn => {
      if (btn) {
        if (btn.getAttribute('data-tab') === tabName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    if (tabContentChangePin) tabContentChangePin.style.display = (tabName === 'change') ? 'flex' : 'none';
    if (tabContentForgotPin) tabContentForgotPin.style.display = (tabName === 'forgot') ? 'flex' : 'none';

    if (tabName === 'change' && changeOldPin) {
      setTimeout(() => changeOldPin.focus(), 50);
    }
  }

  // --- PIN Visibility Toggle (Show / Hide) ---
  const EYE_ICON_SVG = '<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  const EYE_OFF_ICON_SVG = '<svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

  function resetPinVisibility() {
    document.querySelectorAll('.btn-toggle-pin-visibility').forEach(btn => {
      const targetId = btn.getAttribute('data-target');
      const targetInput = targetId ? document.getElementById(targetId) : null;
      if (targetInput) {
        targetInput.type = 'password';
      }
      btn.innerHTML = EYE_ICON_SVG;
      btn.setAttribute('title', 'Show PIN');
      btn.setAttribute('aria-label', 'Show PIN');
      btn.classList.remove('active');
    });
  }

  document.querySelectorAll('.btn-toggle-pin-visibility').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const targetInput = targetId ? document.getElementById(targetId) : null;
      if (!targetInput) return;

      const isCurrentlyPassword = targetInput.type === 'password';
      targetInput.type = isCurrentlyPassword ? 'text' : 'password';
      btn.innerHTML = isCurrentlyPassword ? EYE_OFF_ICON_SVG : EYE_ICON_SVG;
      btn.setAttribute('title', isCurrentlyPassword ? 'Hide PIN' : 'Show PIN');
      btn.setAttribute('aria-label', isCurrentlyPassword ? 'Hide PIN' : 'Show PIN');
      btn.classList.toggle('active', isCurrentlyPassword);

      targetInput.focus();
      try {
        const len = targetInput.value.length;
        targetInput.setSelectionRange(len, len);
      } catch (_) {}
    });
  });

  // Numeric only (strictly 4 digits) for change PIN inputs and smooth cursor flow
  [changeOldPin, changeNewPin, changeConfirmPin].forEach(input => {
    if (input) {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '').slice(0, 4);
      });
    }
  });

  if (changeOldPin) {
    changeOldPin.addEventListener('input', () => {
      if (changeOldPin.value.length === 4) {
        changeNewPin.focus();
      }
    });
  }

  if (changeNewPin) {
    changeNewPin.addEventListener('input', () => {
      if (changeNewPin.value.length === 4) {
        changeConfirmPin.focus();
      }
    });
    changeNewPin.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && changeNewPin.value.length === 0) {
        e.preventDefault();
        changeOldPin.focus();
      }
    });
  }

  if (changeConfirmPin) {
    changeConfirmPin.addEventListener('input', () => {
      if (changeConfirmPin.value.length === 4 && changeOldPin.value.length === 4 && changeNewPin.value === changeConfirmPin.value) {
        setTimeout(() => {
          handleUpdatePin();
        }, 150);
      }
    });
    changeConfirmPin.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && changeConfirmPin.value.length === 0) {
        e.preventDefault();
        changeNewPin.focus();
      }
    });
  }

  // Form submission: Change PIN
  if (formChangePin) {
    formChangePin.addEventListener('submit', handleUpdatePin);
  }

  async function handleUpdatePin(e) {
    if (e) e.preventDefault();
    if (changePinError) changePinError.textContent = '';

    const oldPin = changeOldPin.value.trim();
    const newPin = changeNewPin.value.trim();
    const confirmPin = changeConfirmPin.value.trim();

    if (oldPin.length !== 4) {
      changePinError.textContent = 'Current PIN must be 4 digits.';
      changeOldPin.focus();
      return;
    }

    if (newPin.length !== 4) {
      changePinError.textContent = 'New PIN must be exactly 4 digits.';
      changeNewPin.focus();
      return;
    }

    if (newPin !== confirmPin) {
      changePinError.textContent = 'New PINs do not match.';
      changeConfirmPin.focus();
      return;
    }

    btnSubmitChangePin.disabled = true;
    try {
      const stored = await Storage.get([
        'keysync_pin_hash',
        'keysync_salt',
        'keysync_vault'
      ]);

      const enteredOldHash = await KeySyncCrypto.hashPIN(oldPin);
      if (enteredOldHash !== stored.keysync_pin_hash) {
        changePinError.textContent = 'Current PIN is incorrect.';
        changeOldPin.value = '';
        changeOldPin.focus();
        btnSubmitChangePin.disabled = false;
        return;
      }

      // Decrypt current accounts if needed
      let currentAccounts = accounts;
      if (!derivedKey || currentAccounts.length === 0) {
        if (stored.keysync_vault) {
          const oldKey = await KeySyncCrypto.deriveKey(oldPin, stored.keysync_salt);
          currentAccounts = await KeySyncCrypto.decryptVault(oldKey, stored.keysync_vault);
        } else {
          currentAccounts = [];
        }
      }

      // Generate new salt, derive new key, hash new PIN, and re-encrypt
      const newSalt = KeySyncCrypto.generateSalt();
      const newKey = await KeySyncCrypto.deriveKey(newPin, newSalt);
      const newHash = await KeySyncCrypto.hashPIN(newPin);
      const newEncryptedVault = await KeySyncCrypto.encryptVault(newKey, currentAccounts);

      // Save updated security parameters
      await Storage.set({
        keysync_pin_hash: newHash,
        keysync_salt: newSalt,
        keysync_vault: newEncryptedVault,
        keysync_pin_length: newPin.length,
        keysync_failed_attempts: 0,
        keysync_lockout_until: 0
      });

      // Update in-memory state
      derivedKey = newKey;
      accounts = currentAccounts;
      await saveActiveSession(newKey);

      // Clear inputs
      changeOldPin.value = '';
      changeNewPin.value = '';
      changeConfirmPin.value = '';
      resetPinVisibility();

      showToast('PIN updated successfully!');
      showScreen('main');
    } catch (err) {
      changePinError.textContent = 'Failed to update PIN: ' + err.message;
    } finally {
      btnSubmitChangePin.disabled = false;
    }
  }

  // Factory Reset (Forgot PIN) Handlers
  if (btnOpenResetModal) {
    btnOpenResetModal.addEventListener('click', () => {
      resetVaultModal.style.display = 'flex';
    });
  }

  if (btnCloseResetModal) {
    btnCloseResetModal.addEventListener('click', () => {
      resetVaultModal.style.display = 'none';
    });
  }

  if (btnCancelReset) {
    btnCancelReset.addEventListener('click', () => {
      resetVaultModal.style.display = 'none';
    });
  }

  if (resetVaultModal) {
    resetVaultModal.addEventListener('click', (e) => {
      if (e.target === resetVaultModal) {
        resetVaultModal.style.display = 'none';
      }
    });
  }

  if (btnConfirmReset) {
    btnConfirmReset.addEventListener('click', handleConfirmResetKeySync);
  }

  async function handleConfirmResetKeySync() {
    btnConfirmReset.disabled = true;
    try {
      await Storage.remove([
        'keysync_pin_hash',
        'keysync_salt',
        'keysync_vault',
        'keysync_pin_length',
        'keysync_failed_attempts',
        'keysync_lockout_until'
      ]);
      await clearActiveSession();

      // Reset memory state
      derivedKey = null;
      accounts = [];
      if (codeInterval) clearInterval(codeInterval);
      if (lockoutInterval) clearInterval(lockoutInterval);

      // Reset all inputs & timers
      lockPinInput.value = '';
      lockPinInput.dispatchEvent(new Event('input'));
      lockPinInput.disabled = false;
      btnUnlock.disabled = false;
      lockoutTimer.style.display = 'none';
      lockError.textContent = '';

      setupPinInput.value = '';
      setupPinInput.dispatchEvent(new Event('input'));
      setupConfirmInput.value = '';
      setupConfirmInput.dispatchEvent(new Event('input'));
      setupError.textContent = '';

      changeOldPin.value = '';
      changeNewPin.value = '';
      changeConfirmPin.value = '';
      changePinError.textContent = '';
      resetPinVisibility();

      resetVaultModal.style.display = 'none';
      showToast('KeySync has been reset');
      showScreen('setup');
    } catch (err) {
      showToast('Reset failed: ' + err.message);
    } finally {
      btnConfirmReset.disabled = false;
    }
  }

  // --- Export Vault to JSON Backup ---
  function handleExportVault() {
    if (!accounts || accounts.length === 0) {
      showToast('No accounts in vault to export');
      return;
    }

    try {
      const cleanAccounts = accounts.map(acc => ({
        issuer: acc.issuer || '',
        name: acc.name || '',
        secret: acc.secret,
        algorithm: acc.algorithm || 'SHA1',
        digits: acc.digits || 6,
        period: acc.period || 30,
        type: acc.type || 'totp'
      }));

      const exportData = {
        app: 'KeySync',
        version: 1,
        exportedAt: new Date().toISOString(),
        totalAccounts: cleanAccounts.length,
        accounts: cleanAccounts
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `keysync-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      showToast('Vault backup downloaded!');
    } catch (err) {
      showToast('Export failed: ' + err.message);
    }
  }

  // --- Settings & Privacy Event Listeners ---
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener('click', () => {
      previousScreen = 'main';
      showScreen('settings');
    });
  }

  if (btnSettingsBack) {
    btnSettingsBack.addEventListener('click', () => {
      showScreen('main');
    });
  }

  if (btnSettingsChangePin) {
    btnSettingsChangePin.addEventListener('click', () => {
      previousScreen = 'settings';
      switchResetTab('change');
      showScreen('reset');
    });
  }

  if (settingAutolock) {
    settingAutolock.addEventListener('change', async () => {
      const minutes = parseInt(settingAutolock.value, 10);
      await Storage.set({ keysync_autolock_minutes: minutes });
      if (minutes === 0) {
        await clearActiveSession();
      } else if (derivedKey) {
        await saveActiveSession(derivedKey);
      }
      showToast('Auto-lock setting updated');
    });
  }

  if (btnExportVault) {
    btnExportVault.addEventListener('click', handleExportVault);
  }

  if (settingsImportFile) {
    settingsImportFile.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const imported = await parseJsonBackupFile(file);
        showScreen('qr');
        displayMigrationScreen(imported);
        showToast(`Found ${imported.length} accounts in backup!`);
      } catch (err) {
        showToast(err.message);
      }
      settingsImportFile.value = '';
    });
  }

  if (btnOpenPrivacy) {
    btnOpenPrivacy.addEventListener('click', () => {
      if (privacyModal) privacyModal.style.display = 'flex';
    });
  }

  if (btnClosePrivacy) {
    btnClosePrivacy.addEventListener('click', () => {
      if (privacyModal) privacyModal.style.display = 'none';
    });
  }

  if (btnDismissPrivacy) {
    btnDismissPrivacy.addEventListener('click', () => {
      if (privacyModal) privacyModal.style.display = 'none';
    });
  }

  if (privacyModal) {
    privacyModal.addEventListener('click', (e) => {
      if (e.target === privacyModal) privacyModal.style.display = 'none';
    });
  }

  // Navigation Event Listeners
  if (btnLockResetPin) {
    btnLockResetPin.addEventListener('click', () => {
      previousScreen = 'lock';
      switchResetTab('change');
      showScreen('reset');
    });
  }

  if (btnOpenResetPin && btnOpenResetPin !== btnOpenSettings) {
    btnOpenResetPin.addEventListener('click', () => {
      previousScreen = 'main';
      switchResetTab('change');
      showScreen('reset');
    });
  }

  if (btnResetBack) {
    btnResetBack.addEventListener('click', () => {
      resetPinVisibility();
      showScreen(previousScreen);
    });
  }

  if (btnSwitchToForgot) {
    btnSwitchToForgot.addEventListener('click', () => {
      switchResetTab('forgot');
    });
  }

  if (tabBtnChangePin) {
    tabBtnChangePin.addEventListener('click', () => {
      switchResetTab('change');
    });
  }

  if (tabBtnForgotPin) {
    tabBtnForgotPin.addEventListener('click', () => {
      switchResetTab('forgot');
    });
  }

  // Handle external links safely in Chrome extension popup
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[target="_blank"]');
    if (link && link.href) {
      e.preventDefault();
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: link.href });
      } else {
        window.open(link.href, '_blank', 'noopener,noreferrer');
      }
    }
  });

  // Start app
  init();
})();
