/* ============================================================
   SwiftGrab — PWA Logic
   Handles: SW registration, install prompt, standalone UI,
            bottom nav, splash screen, app-mode transitions
   © 2026 SwiftGrab
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. Register Service Worker ─────────────────────────── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[PWA] SW registered, scope:', reg.scope))
        .catch(err => console.warn('[PWA] SW registration failed:', err));
    });
  }

  /* ── 2. Detect Standalone (PWA) Mode ────────────────────── */
  const isPWA = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');

  /* ── 3. Install Button Logic ─────────────────────────────
     RULE:
     - If already installed (isPWA) → ALWAYS hide button
     - If NOT installed + beforeinstallprompt fired → show button
     - iOS Safari (no beforeinstallprompt) → show iOS hint banner
  ────────────────────────────────────────────────────────── */
  let deferredPrompt = null;

  function getInstallBtn() {
    return document.getElementById('pwa-install-btn');
  }

  function showInstallButton() {
    if (isPWA()) return; // Never show if already installed
    const btn = getInstallBtn();
    if (btn) {
      btn.style.display = 'inline-flex';
      btn.classList.add('pwa-btn-visible');
    }
  }

  function hideInstallButton() {
    const btn = getInstallBtn();
    if (btn) {
      btn.style.display = 'none';
      btn.classList.remove('pwa-btn-visible');
    }
  }

  // Listen for Chrome/Android install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  // After user installs — hide button immediately
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallButton();
    hideIOSBanner();
    showToastIfAvailable('✅ SwiftGrab installed! Open it from your home screen.', 'success');
  });

  // Expose for inline onclick on button
  window.triggerPWAInstall = async function () {
    if (!deferredPrompt) {
      showToastIfAvailable('ℹ️ Already installed or not supported on this browser.', 'info');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredPrompt = null;
      hideInstallButton();
    }
  };

  /* ── 4. iOS Install Hint Banner ──────────────────────────
     iOS Safari never fires beforeinstallprompt.
     Show a manual hint banner for iOS Safari users only.
  ────────────────────────────────────────────────────────── */
  function injectIOSBanner() {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (!isIOS || !isSafari || isPWA()) return;

    // Don't show if user dismissed it this session
    if (sessionStorage.getItem('ios-banner-dismissed')) return;

    const banner = document.createElement('div');
    banner.id = 'ios-install-banner';
    banner.style.cssText = `
      position: fixed; bottom: 16px; left: 16px; right: 16px; z-index: 9998;
      background: #1a2240; border: 1.5px solid #00d4ff; border-radius: 14px;
      padding: 14px 16px; display: flex; align-items: center; gap: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,.5); animation: fadeUp .4s ease;
    `;
    banner.innerHTML = `
      <span style="font-size:1.6rem;flex-shrink:0;">📲</span>
      <div style="flex:1;font-size:.85rem;color:#e0e8ff;line-height:1.5;">
        <strong style="color:#00d4ff;">Install SwiftGrab</strong><br>
        Tap <strong>Share</strong> <span style="font-size:1rem;">⎙</span> then <strong>"Add to Home Screen"</strong>
      </div>
      <button id="ios-banner-close" style="background:none;border:none;color:#8899bb;font-size:1.3rem;cursor:pointer;padding:4px;flex-shrink:0;">✕</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('ios-banner-close').addEventListener('click', hideIOSBanner);
  }

  function hideIOSBanner() {
    const banner = document.getElementById('ios-install-banner');
    if (banner) banner.remove();
    sessionStorage.setItem('ios-banner-dismissed', '1');
  }

  /* ── 5. Splash Screen ───────────────────────────────────── */
  function injectSplash() {
    if (!isPWA()) return;
    const splash = document.createElement('div');
    splash.id = 'sg-splash';
    splash.innerHTML = `
      <div class="sg-splash-inner">
        <div class="sg-splash-icon">⚡</div>
        <div class="sg-splash-name">Swift<span>Grab</span></div>
        <div class="sg-splash-loader">
          <div class="sg-splash-bar"></div>
        </div>
      </div>
    `;
    document.body.prepend(splash);
    setTimeout(() => splash.classList.add('sg-splash-fade'), 1200);
    setTimeout(() => splash.remove(), 1700);
  }

  /* ── 6. Bottom Navigation (PWA only) ────────────────────── */
  function injectBottomNav() {
    if (!isPWA()) return;

    const currentPage = location.pathname.split('/').pop() || 'index.html';
    const pages = [
      { href: 'index.html',    icon: '🏠', label: 'Home' },
      { href: 'youtube.html',  icon: '▶️', label: 'YouTube' },
      { href: 'compress.html', icon: '🗜️', label: 'Compress' },
      { href: 'passport.html', icon: '📷', label: 'Passport' },
    ];

    const nav = document.createElement('nav');
    nav.id = 'pwa-bottom-nav';
    nav.setAttribute('aria-label', 'App navigation');
    nav.innerHTML = pages.map(p => `
      <a href="${p.href}" class="pwa-nav-item ${currentPage === p.href ? 'active' : ''}" aria-label="${p.label}">
        <span class="pwa-nav-icon">${p.icon}</span>
        <span class="pwa-nav-label">${p.label}</span>
      </a>
    `).join('');

    document.body.appendChild(nav);
    document.body.style.paddingBottom = 'calc(68px + env(safe-area-inset-bottom))';
  }

  /* ── 7. Standalone UI — hide website chrome ─────────────── */
  function applyStandaloneUI() {
    if (!isPWA()) return;

    document.body.classList.add('pwa-mode');

    const currentPage = location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'index.html' || currentPage === '') {
      let faqFound = false;
      document.querySelectorAll('section').forEach(s => {
        if (s.id === 'faq') faqFound = true;
        if (faqFound) s.style.display = 'none';
      });

      document.querySelectorAll('section').forEach(s => {
        const label = s.querySelector('.section-label');
        if (label) {
          const txt = label.textContent.trim();
          if (txt.includes('Testimonial') || txt.includes('💬')) {
            s.style.display = 'none';
          }
        }
      });

      const footer = document.querySelector('.site-footer');
      if (footer) footer.style.display = 'none';

      const heroStats = document.querySelector('.hero-stats');
      if (heroStats) heroStats.style.display = 'none';
    }

    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) siteHeader.classList.add('pwa-header');

    const navLinks = document.querySelector('.nav-links');
    if (navLinks) navLinks.style.display = 'none';

    const navActionBtn = document.querySelector('.nav-actions .btn');
    if (navActionBtn) navActionBtn.style.display = 'none';
  }

  /* ── 8. Disable bounce/overscroll ──────────────────────── */
  function disableBounce() {
    if (!isPWA()) return;
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
  }

  /* ── 9. Page transition effect ──────────────────────────── */
  function initPageTransitions() {
    if (!isPWA()) return;

    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.25s ease';
    window.addEventListener('load', () => {
      requestAnimationFrame(() => { document.body.style.opacity = '1'; });
    });

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
      e.preventDefault();
      document.body.style.opacity = '0';
      setTimeout(() => { window.location.href = href; }, 220);
    });
  }

  /* ── Helper ─────────────────────────────────────────────── */
  function showToastIfAvailable(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type);
  }

  /* ── Init ───────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // If already in PWA mode — hide install button immediately, no iOS banner
    if (isPWA()) {
      hideInstallButton();
      injectSplash();
      applyStandaloneUI();
      injectBottomNav();
      disableBounce();
      initPageTransitions();
      return;
    }

    // Not in PWA mode — show iOS banner if applicable, button shown on beforeinstallprompt
    injectIOSBanner();
    // Note: install button stays hidden until beforeinstallprompt fires (Chrome/Android)
    // For iOS, the banner handles it
  }

})();
