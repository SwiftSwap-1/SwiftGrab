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

  /* ── 3. Install Prompt Handling ─────────────────────────── */
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallButton();
    showToastIfAvailable('✅ SwiftGrab installed! Open it from your home screen.', 'success');
  });

  function showInstallButton() {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) {
      btn.style.display = 'inline-flex';
      btn.classList.add('pwa-btn-visible');
    }
  }

  function hideInstallButton() {
    const btn = document.getElementById('pwa-install-btn');
    if (btn) {
      btn.classList.add('pwa-btn-hiding');
      setTimeout(() => { btn.style.display = 'none'; }, 400);
    }
  }

  // Expose for inline onclick
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

  /* ── 4. Splash Screen ───────────────────────────────────── */
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

  /* ── 5. Bottom Navigation (PWA only) ────────────────────── */
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

    // Add bottom padding to body so content doesn't hide behind nav
    document.body.style.paddingBottom = 'calc(68px + env(safe-area-inset-bottom))';
  }

  /* ── 6. Standalone UI — hide website chrome ─────────────── */
  function applyStandaloneUI() {
    if (!isPWA()) return;

    document.body.classList.add('pwa-mode');

    // Hide header on inner pages (nav replaced by bottom bar)
    // Keep header on index for branding but simplify it
    const currentPage = location.pathname.split('/').pop() || 'index.html';

    if (currentPage === 'index.html' || currentPage === '') {
      // On home page: hide FAQ → footer (website-like sections)
      const sectionsToHide = ['#faq'];
      const allSections = document.querySelectorAll('section');

      // Find FAQ section index and hide everything from it onwards
      let faqFound = false;
      allSections.forEach(s => {
        if (s.id === 'faq') faqFound = true;
        if (faqFound) s.style.display = 'none';
      });

      // Also hide testimonials & CTA (pure marketing)
      allSections.forEach(s => {
        const label = s.querySelector('.section-label');
        if (label) {
          const txt = label.textContent.trim();
          if (txt.includes('Testimonial') || txt.includes('💬')) {
            s.style.display = 'none';
          }
        }
      });

      // Hide footer
      const footer = document.querySelector('.site-footer');
      if (footer) footer.style.display = 'none';

      // Hide the hero CTA bottom-stats (too website-like)
      const heroStats = document.querySelector('.hero-stats');
      if (heroStats) heroStats.style.display = 'none';
    }

    // On all pages: simplify header
    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
      siteHeader.classList.add('pwa-header');
    }

    // Hide nav-links (replaced by bottom nav)
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) navLinks.style.display = 'none';

    // Hide nav action CTA button (redundant in app mode)
    const navActionBtn = document.querySelector('.nav-actions .btn');
    if (navActionBtn) navActionBtn.style.display = 'none';
  }

  /* ── 7. Disable bounce/overscroll ──────────────────────── */
  function disableBounce() {
    if (!isPWA()) return;
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
  }

  /* ── 8. Page transition effect ──────────────────────────── */
  function initPageTransitions() {
    if (!isPWA()) return;

    // Fade-in on load
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.25s ease';
    window.addEventListener('load', () => {
      requestAnimationFrame(() => { document.body.style.opacity = '1'; });
    });

    // Intercept same-origin links for smooth transition
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

  /* ── Helper: show toast without hard dependency ─────────── */
  function showToastIfAvailable(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type);
  }

  /* ── Init on DOM ready ───────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    injectSplash();
    applyStandaloneUI();
    injectBottomNav();
    disableBounce();
    initPageTransitions();

    // If already in PWA, hide install button immediately
    if (isPWA()) hideInstallButton();
  }

})();
