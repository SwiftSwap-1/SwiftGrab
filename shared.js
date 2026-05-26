/* ============================================================
   SwiftGrab — Shared JavaScript Utilities
   ============================================================ */

// ── Theme Toggle ──────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem('sg-theme') || 'dark';
  if (saved === 'light') document.body.classList.add('light');
})();

function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('sg-theme', isLight ? 'light' : 'dark');
  const btns = document.querySelectorAll('.theme-btn');
  btns.forEach(b => b.textContent = isLight ? '☀️' : '🌙');
}

document.addEventListener('DOMContentLoaded', () => {
  const isLight = document.body.classList.contains('light');
  const btns = document.querySelectorAll('.theme-btn');
  btns.forEach(b => b.textContent = isLight ? '☀️' : '🌙');
});

// ── Toast Notifications ───────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut .3s ease forwards';
    setTimeout(() => toast.remove(), 320);
  }, duration);
}

// ── FAQ Accordion ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.classList.contains('open');
      // close all
      document.querySelectorAll('.faq-q').forEach(b => {
        b.classList.remove('open');
        if (b.nextElementSibling) b.nextElementSibling.classList.remove('open');
      });
      if (!isOpen) {
        btn.classList.add('open');
        answer.classList.add('open');
      }
    });
  });

  // Mobile nav
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
    });
  }

  // Active nav link
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    if (a.getAttribute('href') === current) a.classList.add('active');
  });

  // Animate on scroll
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.style.opacity = 1; });
  }, { threshold: 0.1 });
  document.querySelectorAll('.anim-up').forEach(el => obs.observe(el));
});

// ── Ad Modal Helper ───────────────────────────────────────
function showAdModal(opts = {}) {
  return new Promise(resolve => {
    const overlay = document.getElementById('ad-modal');
    if (!overlay) { resolve(); return; }
    overlay.classList.add('open');

    const timerEl = document.getElementById('ad-timer');
    const closeBtn = document.getElementById('ad-close-btn');
    let secs = opts.seconds || 3;

    if (timerEl) timerEl.textContent = `Close in ${secs}s`;
    if (closeBtn) { closeBtn.disabled = true; closeBtn.style.opacity = '.5'; }

    const interval = setInterval(() => {
      secs--;
      if (timerEl) timerEl.textContent = secs > 0 ? `Close in ${secs}s` : 'Ready';
      if (secs <= 0) {
        clearInterval(interval);
        if (closeBtn) { closeBtn.disabled = false; closeBtn.style.opacity = '1'; }
      }
    }, 1000);

    function dismiss() {
      overlay.classList.remove('open');
      clearInterval(interval);
      resolve();
    }
    if (closeBtn) closeBtn.onclick = dismiss;
    overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); }, { once: true });
  });
}

// ── Copy to clipboard ─────────────────────────────────────
async function copyToClipboard(text, msg = 'Copied!') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(msg, 'success');
  } catch {
    showToast('Could not copy — please copy manually.', 'error');
  }
}

// ── Extract YouTube Video ID ──────────────────────────────
function extractYouTubeId(url) {
  const patterns = [
    /(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ── Validate YouTube URL ──────────────────────────────────
function isValidYouTubeUrl(url) {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}
