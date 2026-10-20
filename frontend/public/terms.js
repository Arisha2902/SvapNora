/* ==========================================================================
   SvapNora — Terms & Conditions Page Scripts (vanilla JS, no dependencies)
   1. Inline SVG injection for [data-icon] placeholders
   2. Theme toggle (dark default, persisted)
   3. Full-screen mobile menu
   4. Scroll-reveal animations
   5. Table-of-contents scroll-spy (desktop)
   6. Mobile TOC dropdown + accordions + expand-all
   7. Back-to-top button (mobile)
   8. Print / Save-as-PDF button
   9. Smooth in-page scrolling
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. Replace <span data-icon="name"> with the shared inline SVG
     (icon set lives in projects-data.js)
     ------------------------------------------------------------------------ */
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    el.innerHTML = window.SVAPNORA_ICON(el.getAttribute('data-icon'));
  });

  /* ------------------------------------------------------------------------
     2. Theme toggle — dark default, persisted to localStorage
     ------------------------------------------------------------------------ */
  var root = document.documentElement;
  var THEME_KEY = 'SvapNora-theme';

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
     5. Table-of-contents scroll-spy (desktop) — highlights the entry whose
     section is currently crossing the upper-middle band of the viewport.
     ------------------------------------------------------------------------ */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.t-toc__nav a'));

  if (tocLinks.length && 'IntersectionObserver' in window) {
    var linkBySection = {};
    tocLinks.forEach(function (link) {
      linkBySection[link.getAttribute('href').slice(1)] = link;
    });

    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkBySection[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          tocLinks.forEach(function (l) { l.classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });

    Object.keys(linkBySection).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spyObserver.observe(section);
    });
  }

  /* ------------------------------------------------------------------------
     6. Mobile TOC dropdown + accordions + expand-all
     ------------------------------------------------------------------------ */
  var tocToggle = document.getElementById('tocToggle');
  var tocNav = document.getElementById('tocNav');

  if (tocToggle && tocNav) {
    tocToggle.addEventListener('click', function () {
      var open = tocNav.classList.toggle('is-open');
      tocToggle.setAttribute('aria-expanded', String(open));
    });

    // Close the dropdown after tapping a link (mobile)
    tocNav.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.innerWidth < 1024) {
        tocNav.classList.remove('is-open');
        tocToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var sections = Array.prototype.slice.call(document.querySelectorAll('.tsec'));
  var expandAllBtn = document.getElementById('expandAll');

  function setAll(open) {
    sections.forEach(function (s) {
      s.classList.toggle('is-open', open);
      var chev = s.querySelector('.tsec__chev');
      if (chev) chev.setAttribute('aria-expanded', String(open));
    });
    if (expandAllBtn) expandAllBtn.textContent = open ? 'COLLAPSE ALL' : 'EXPAND ALL';
  }

  // Accordion behaviour (active via CSS media query; JS toggles the class)
  sections.forEach(function (s) {
    var head = s.querySelector('.tsec__head');
    var chev = s.querySelector('.tsec__chev');
    if (!head) return;
    head.addEventListener('click', function () {
      // Only behave as an accordion on mobile widths
      if (window.innerWidth >= 1024) return;
      var open = s.classList.toggle('is-open');
      if (chev) chev.setAttribute('aria-expanded', String(open));
    });
  });

  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', function () {
      var anyClosed = sections.some(function (s) { return !s.classList.contains('is-open'); });
      setAll(anyClosed);
    });
  }

  /* ------------------------------------------------------------------------
     7. Back-to-top (mobile) — appears after scrolling past the hero
     ------------------------------------------------------------------------ */
  var backToTop = document.getElementById('backToTop');

  if (backToTop) {
    var toggleBackTop = function () {
      backToTop.classList.toggle('is-visible', window.scrollY > 480);
    };
    window.addEventListener('scroll', toggleBackTop, { passive: true });
    toggleBackTop();

    backToTop.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------------------
     8. Print / Save as PDF
     ------------------------------------------------------------------------ */
  var printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }

  /* ------------------------------------------------------------------------
     9. Smooth scroll for in-page anchors
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
