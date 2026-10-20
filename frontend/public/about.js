/* ==========================================================================
   SvapNora — About Us Page Scripts (vanilla JS, no dependencies)
   1. Inline SVG injection for [data-icon] placeholders
   2. Theme toggle (dark default, persisted)
   3. Full-screen mobile menu
   4. Scroll-reveal animations
   5. Team grid rendering (placeholder data — replace with real people)
   6. Smooth in-page scrolling
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
     3. Full-screen mobile menu (handled by products.js)
     ------------------------------------------------------------------------ */

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
     5. TEAM GRID — every name, role, bio and photo below is a PLACEHOLDER.
     Replace the array with real team members when ready.
     ------------------------------------------------------------------------ */
  var teamRow = document.getElementById('teamRow');

  var TEAM = [
    { initials: 'AK', name: '[Full Name]', role: '[Role — e.g. Founder & CEO]', bio: '[Placeholder bio: one line about the person and their work.]' },
    { initials: 'AS', name: '[Full Name]', role: '[Role — e.g. Head of Engineering]', bio: '[Placeholder bio: one line about the person and their work.]' },
    { initials: 'RS', name: '[Full Name]', role: '[Role — e.g. Lead Software Engineer]', bio: '[Placeholder bio: one line about the person and their work.]' },
    { initials: 'PM', name: '[Full Name]', role: '[Role — e.g. CRM  Lead]', bio: '[Placeholder bio: one line about the person and their work.]' },
  ];

  if (teamRow) {
    teamRow.innerHTML = TEAM.map(function (m) {
      return '' +
        '<article class="team-card" aria-label="Team member: ' + m.name + '">' +
          '<div class="team-card__photo" aria-hidden="true"><span>' + m.initials + '</span></div>' +
          '<h3 class="team-card__name">' + m.name + '</h3>' +
          '<p class="team-card__role">' + m.role + '</p>' +
          '<p class="team-card__bio">' + m.bio + '</p>' +
          '<div class="team-card__socials">' +
            '<a href="#" aria-label="LinkedIn of ' + m.name + '"><span data-icon="linkedin"></span></a>' +
            '<a href="#" aria-label="GitHub of ' + m.name + '"><span data-icon="github"></span></a>' +
          '</div>' +
        '</article>';
    }).join('');
  }

  /* ------------------------------------------------------------------------
     6. Smooth scroll for in-page anchors
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
