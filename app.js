/**
 * KeySync Landing Page Interactive Logic
 * Features: Live TOTP ticker demo, Screenshot Tabs, FAQ Accordion, Copy Toast
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Screenshot Tab Switcher
  const tabButtons = document.querySelectorAll('.feature-tab-btn');
  const tabPanels = document.querySelectorAll('.feature-tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      // Update button states
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update panel visibility
      tabPanels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });

  // 2. FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        // Close others
        faqItems.forEach(other => {
          if (other !== item) other.classList.remove('open');
        });
        // Toggle current
        if (isOpen) {
          item.classList.remove('open');
        } else {
          item.classList.add('open');
        }
      });
    }
  });

  // 3. Live TOTP Demo Bar & Simulation
  const timerBar = document.getElementById('demo-timer-bar');
  const timerSecs = document.getElementById('demo-timer-sec');
  const codeStripe = document.getElementById('demo-stripe-code');

  if (timerBar && timerSecs) {
    const compStripe = document.getElementById('comparison-stripe-code');

    function updateTicker() {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      const progressPercent = (remaining / 30) * 100;

      timerBar.style.width = `${progressPercent}%`;
      timerSecs.textContent = `${remaining}s`;

      if (remaining === 30) {
        // Generate new random code demo
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        const formatted = `${randomCode.slice(0, 3)} ${randomCode.slice(3)}`;
        if (codeStripe) codeStripe.textContent = formatted;
        if (compStripe) {
          compStripe.textContent = formatted;
          const parentTrigger = compStripe.closest('.demo-copy-trigger');
          if (parentTrigger) parentTrigger.setAttribute('data-code', formatted);
        }
      }
    }

    updateTicker();
    setInterval(updateTicker, 500);
  }

  // 4. Interactive One-Click Copy Demo
  const copyDemoBtns = document.querySelectorAll('.demo-copy-trigger');
  const demoToast = document.getElementById('demo-toast');

  copyDemoBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = btn.getAttribute('data-code') || '601 065';
      
      // Copy to clipboard if allowed
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code.replace(/\s+/g, '')).catch(() => {});
      }

      // Show toast
      if (demoToast) {
        demoToast.classList.add('show');
        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(() => {
          demoToast.classList.remove('show');
        }, 1800);
      }
    });
  });

  // 5. Mobile Navigation Drawer Toggle
  const mobileToggle = document.getElementById('mobileMenuToggle') || document.getElementById('mobile-menu-toggle');
  const mobileDrawer = document.getElementById('mobileNavDrawer') || document.getElementById('mobile-nav-drawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link, .mobile-nav-item, .mobile-drawer-cta, .mobile-btn-full');

  if (mobileToggle && mobileDrawer) {
    const toggleMenu = (open) => {
      const shouldOpen = open !== undefined ? open : !mobileDrawer.classList.contains('open');
      mobileDrawer.classList.toggle('open', shouldOpen);
      mobileToggle.classList.toggle('open', shouldOpen);
      mobileToggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
      document.body.classList.toggle('menu-locked', shouldOpen);
    };

    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close on link click
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        toggleMenu(false);
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (mobileDrawer.classList.contains('open') && !mobileDrawer.contains(e.target) && !mobileToggle.contains(e.target)) {
        toggleMenu(false);
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) {
        toggleMenu(false);
      }
    });
  }

  // 6. Mobile Comparison Matrix Competitor Switcher
  const competitorBtns = document.querySelectorAll('.matrix-switch-btn');
  const competitorDisplays = document.querySelectorAll('.competitor-name-display');
  const competitorVals = document.querySelectorAll('.competitor-val');

  const competitorNames = {
    google: 'Google Auth',
    authy: 'Twilio Authy',
    cloud: 'Cloud Vaults'
  };

  competitorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const compKey = btn.getAttribute('data-competitor');
      
      // Update buttons
      competitorBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update name display
      competitorDisplays.forEach(el => {
        el.textContent = competitorNames[compKey] || compKey;
      });

      // Update verdict values
      competitorVals.forEach(valEl => {
        const valText = valEl.getAttribute(`data-${compKey}`) || '';
        const textSpan = valEl.querySelector('.val-text');
        if (textSpan) {
          textSpan.textContent = valText;
        }

        // Adjust loss vs neutral verdict style
        if (valText.toLowerCase().includes('native') || valText.toLowerCase().includes('free')) {
          valEl.className = 'matrix-brand-verdict verdict-neutral competitor-val';
          const icon = valEl.querySelector('svg');
          if (icon) icon.style.display = 'none';
        } else {
          valEl.className = 'matrix-brand-verdict verdict-loss competitor-val';
          const icon = valEl.querySelector('svg');
          if (icon) icon.style.display = 'inline-block';
        }
      });
    });
  });

  // 7. Dynamic Year
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});

