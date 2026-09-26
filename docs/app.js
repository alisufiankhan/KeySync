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

  // 5. Dynamic Year
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});
