/* ==========================================================================
   SVAPNORA — Shared Navbar Behavior (single source of truth)
   Used by BOTH the static pages (via navbar.js) and the React home page
   (via Navbar.jsx). Handles: theme toggle (dark default, persisted) and
   the full-screen mobile menu. The markup itself lives in navbar.js /
   Navbar.jsx and is identical everywhere.
   ========================================================================== */
(function () {
  'use strict';

  var THEME_KEY = 'svapnora-theme';

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  /**
   * Wire up the navbar on the current page.
   * Safe to call more than once (guards against duplicate listeners).
   */
  function init() {
    var root = document.documentElement;

    // Restore the persisted theme (dark is the default)
    var stored = getStoredTheme();
    if (stored === 'dark' || stored === 'light') root.dataset.theme = stored;

    /* ---- Theme toggle ---- */
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn && !themeBtn.dataset.navBound) {
      var sun = themeBtn.querySelector('.ic-sun');
      var moon = themeBtn.querySelector('.ic-moon');

      function syncThemeIcon() {
        var isDark = root.dataset.theme !== 'light';
        if (sun) sun.style.display = isDark ? '' : 'none';
        if (moon) moon.style.display = isDark ? 'none' : '';
        themeBtn.setAttribute(
          'aria-label',
          isDark ? 'Switch to light theme' : 'Switch to dark theme'
        );
      }

      themeBtn.addEventListener('click', function () {
        root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
        try {
          localStorage.setItem(THEME_KEY, root.dataset.theme);
        } catch (e) {
          /* storage unavailable */
        }
        syncThemeIcon();
      });

      themeBtn.dataset.navBound = '1';
      syncThemeIcon();
    }

    /* ---- Full-screen mobile menu ---- */
    var burger = document.getElementById('navBurger');
    var menu = document.getElementById('mobileMenu');
    if (burger && menu && !burger.dataset.navBound) {
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

      burger.addEventListener('click', function () {
        setMenu(!menu.classList.contains('is-open'));
      });
      menu.addEventListener('click', function (e) {
        if (e.target.closest('a')) setMenu(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth >= 1024 && menu.classList.contains('is-open')) setMenu(false);
      });

      burger.dataset.navBound = '1';
    }
  }

  window.SVAPNORA_NAV = { init: init };
})();
