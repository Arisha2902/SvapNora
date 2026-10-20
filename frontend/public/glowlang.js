/* ==========================================================================
   SVAPNORA — GlowLang Placeholder Page Scripts (vanilla JS, no dependencies)
   Shared chrome behaviour only: icons, theme toggle, mobile menu,
   scroll-reveal, smooth scroll. Page content is intentionally empty.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. Inline SVG injection for [data-icon] placeholders
     ------------------------------------------------------------------------ */
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    el.innerHTML = window.SVAPNORA_ICON(el.getAttribute('data-icon'));
  });

  /* ------------------------------------------------------------------------
     2. Theme toggle — dark default, persisted to localStorage
     ------------------------------------------------------------------------ */
  var root = document.documentElement;
  var THEME_KEY = 'svapnora-theme';

  try {
    var stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') root.dataset.theme = stored;
  } catch (e) { /* storage unavailable */ }

  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    var sun = themeToggle.querySelector('.ic-sun');
    var moon = themeToggle.querySelector('.ic-moon');

    function syncThemeIcon() {
      var isDark = root.dataset.theme !== 'light';
      if (sun) sun.style.display = isDark ? '' : 'none';
      if (moon) moon.style.display = isDark ? 'none' : '';
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    themeToggle.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(THEME_KEY, root.dataset.theme); } catch (e) { /* ignore */ }
      syncThemeIcon();
    });

    syncThemeIcon();
  }

  /* ------------------------------------------------------------------------
     3. Full-screen mobile menu
     ------------------------------------------------------------------------ */
  var burger = document.getElementById('navBurger');
  var menu = document.getElementById('mobileMenu');

  if (burger && menu) {
    var iconOpen = burger.querySelector('.ic-open');
    var iconClose = burger.querySelector('.ic-close');

    function setMenu(open) {
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      if (iconOpen) iconOpen.style.display = open ? 'none' : '';
      if (iconClose) iconClose.style.display = open ? '' : 'none';
      document.body.style.overflow = open ? 'hidden' : '';
    }

    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && menu.classList.contains('is-open')) setMenu(false);
    });
  }

  /* ------------------------------------------------------------------------
     4. Scroll-reveal — fade-up via IntersectionObserver
     ------------------------------------------------------------------------ */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = '';
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 70) + 'ms';
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ------------------------------------------------------------------------
     5. Smooth scroll for in-page anchors
     ------------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length <= 1) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
    });
  });
})();
