/* ==========================================================================
   KINETIC � Services Page Scripts (vanilla JS, no dependencies)
   1. Theme toggle (dark default, persisted)
   2. Full-screen mobile menu
   3. Scroll-reveal animations
   4. Anchor-bar scroll-spy
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. Theme toggle � dark is the default, persisted to localStorage.
     Switches the `data-theme` attribute on <html>, which drives CSS variables.
     ------------------------------------------------------------------------ */
  var root = document.documentElement;
  var THEME_KEY = 'kinetic-theme';

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  var storedTheme = getStoredTheme();
  if (storedTheme === 'dark' || storedTheme === 'light') {
    root.dataset.theme = storedTheme;
  }

  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    var sun = themeToggle.querySelector('.ic-sun');
    var moon = themeToggle.querySelector('.ic-moon');

    function syncThemeIcon() {
      var isDark = root.dataset.theme !== 'light';
      if (sun) sun.style.display = isDark ? '' : 'none';
      if (moon) moon.style.display = isDark ? 'none' : '';
      themeToggle.setAttribute(
        'aria-label',
        isDark ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }

    themeToggle.addEventListener('click', function () {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(THEME_KEY, root.dataset.theme);
      } catch (e) {
        /* storage unavailable � theme still applies for the session */
      }
      syncThemeIcon();
    });

    syncThemeIcon();
  }

  /* ------------------------------------------------------------------------
     2. Full-screen mobile menu (handled by products.js)
     ------------------------------------------------------------------------ */

  /* ------------------------------------------------------------------------
     3. Scroll-reveal � fade-up via IntersectionObserver, `.reveal` elements.
     ------------------------------------------------------------------------ */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 3, 2) * 70) + 'ms';
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ------------------------------------------------------------------------
     4. Anchor-bar scroll-spy � highlights the mono label matching the
     detail section currently in view.
     ------------------------------------------------------------------------ */
  var anchorLinks = Array.prototype.slice.call(document.querySelectorAll('.anchorbar__link'));

  if (anchorLinks.length && 'IntersectionObserver' in window) {
    var linkBySection = {};
    anchorLinks.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      linkBySection[id] = link;
    });

    var spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = linkBySection[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            anchorLinks.forEach(function (l) { l.classList.remove('is-active'); });
            link.classList.add('is-active');
          }
        });
      },
      // Highlight when a section crosses the upper-middle band of the viewport
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );

    Object.keys(linkBySection).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spyObserver.observe(section);
    });
  }

  /* ------------------------------------------------------------------------
     5. Smooth scroll for in-page anchors � CSS `scroll-behavior: smooth`
     plus `scroll-margin-top` (in CSS) handles offsets. This JS fallback
     covers browsers without smooth scrolling.
     ------------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length <= 1) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      });
    });
  });
})();
