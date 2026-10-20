/* ==========================================================================
   SvapNora — Products & Portfolio Page Scripts (vanilla JS, no dependencies)
   1. Inline SVG injection for [data-icon] placeholders
   2. Theme toggle (dark default, persisted)
   3. Full-screen mobile menu
   4. Scroll-reveal animations
   5. Project filtering (tabs + chips) with live count and fade
   6. Smooth in-page scrolling
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     1. Replace every <span data-icon="name"> with the shared inline SVG
     (icon set lives in projects-data.js)
     ------------------------------------------------------------------------ */
  if (typeof window.SVAPNORA_ICON === 'function') {
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      try {
        el.innerHTML = window.SVAPNORA_ICON(el.getAttribute('data-icon'));
      } catch (e) { /* ignore per-icon errors */ }
    });
  }

  /* ------------------------------------------------------------------------
     2. Theme toggle — dark is the default, persisted to localStorage.
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
     5. Project filtering — desktop tabs + mobile chips, one data source.
     Filtering fades the grid, re-renders the matching cards, and updates
     the live count ("ALL (06)").
     ------------------------------------------------------------------------ */
  var grid = document.getElementById('projectGrid');
  var tabsWrap = document.getElementById('filterTabs');
  var chipsWrap = document.getElementById('filterChips');
  var PROJECTS = window.SVAPNORA_PROJECTS || [];
  var FILTERS = window.SVAPNORA_FILTERS || [];
  var currentFilter = 'all';

  // Pages that include this script without a grid stop here
  // (mobile menu logic above already ran, so we're safe to return)
  if (!grid) return;

  /* --- Card renderers: desktop visual card + mobile text card --- */
  function statusTagClass(tag) {
    return /ONLINE|VERIFIED|CONNECTED|ACTIVE|PASSING|HIGH|DEPEND/i.test(tag) ? 'ok' : '';
  }

  function renderDesktopCard(p, liftClass) {
    var v = p.visual;
    var open = p.url
      ? '<a class="pcard ' + liftClass + '" href="' + p.url + '" target="_blank" rel="noopener" aria-label="Visit ' + p.title + '">'
      : '<article class="pcard ' + liftClass + '" aria-label="Project: ' + p.title + '">';
    var close = p.url ? '</a>' : '</article>';
    var center = p.image
      ? '<img class="pcard__vimg" src="' + p.image + '" alt="' + p.title + ' website screenshot" loading="lazy">'
      : '<span class="pcard__vicon" aria-hidden="true">' + window.SVAPNORA_ICON(v.icon) + '</span>' +
        '<p class="pcard__vcaption">[ ' + v.caption + ' ]</p>';
    var footLink = p.url
      ? '<span class="pcard__link">View Live<span class="arrow" aria-hidden="true">&gt;</span></span>'
      : '';
    return '' +
      open +
        '<div class="pcard__visual">' +
          '<span class="pcard__vlabel">' + v.label + '</span>' +
          '<span class="pcard__vtag ' + statusTagClass(v.tag) + '">' + v.tag + '</span>' +
          '<div class="pcard__vcenter">' + center + '</div>' +
          '<span class="pcard__hover-arrow" aria-hidden="true">&rsaquo;</span>' +
        '</div>' +
        '<div class="pcard__body">' +
          '<p class="pcard__cat">' + p.category.toUpperCase() + '</p>' +
          '<h3 class="pcard__title">' + p.title + '</h3>' +
          '<p class="pcard__desc">' + p.desc + '</p>' +
          '<ul class="pcard__tags">' + p.tags.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
          '<div class="pcard__foot">' +
            '<span class="pcard__status">STATUS: ' + p.status + '</span>' +
            footLink +
          '</div>' +
        '</div>' +
      close;
  }

  function renderMobileCard(p) {
    var m = p.mobile;
    var open = p.url
      ? '<a class="pcard-m" href="' + p.url + '" target="_blank" rel="noopener" aria-label="Visit ' + p.title + '">'
      : '<article class="pcard-m" aria-label="Project: ' + m.title + '">';
    var close = p.url ? '</a>' : '</article>';
    var footLink = p.url
      ? '<span class="pcard-m__link">' +
          '<span>Visit Live Site</span><span class="arrow" aria-hidden="true">&gt;</span>' +
        '</span>'
      : '';
    return '' +
      open +
        '<div class="pcard-m__top">' +
          '<span class="pcard-m__id">PROJECT ' + p.id + ' // ' + m.cat + '</span>' +
          '<span class="pcard-m__tag">' + m.tag + '</span>' +
        '</div>' +
        '<h3 class="pcard-m__title">' + m.title + '</h3>' +
        '<p class="pcard-m__desc">' + m.desc + '</p>' +
        '<ul class="pcard__tags">' + p.tags.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
        footLink +
      close;
  }

  function renderGrid() {
    var visible = currentFilter === 'all'
      ? PROJECTS
      : PROJECTS.filter(function (p) { return p.filter === currentFilter; });

    grid.innerHTML = visible.map(function (p, i) {
      var lift = ['pcard-lift-h', 'pcard-lift-v', 'pcard-lift-d'][i % 3];
      return renderDesktopCard(p, lift) + renderMobileCard(p);
    }).join('');

    // Keep reveal animations working on freshly rendered cards
    grid.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }

  function updateCounts() {
    FILTERS.forEach(function (f) {
      var count = f.key === 'all'
        ? PROJECTS.length
        : PROJECTS.filter(function (p) { return p.filter === f.key; }).length;
      var label = f.label + ' (' + (count < 10 ? '0' : '') + count + ')';
      var tab = tabsWrap && tabsWrap.querySelector('[data-filter="' + f.key + '"]');
      var chip = chipsWrap && chipsWrap.querySelector('[data-filter="' + f.key + '"]');
      if (tab) tab.textContent = label;
      if (chip) chip.textContent = f.key === 'all' ? label + ' ●' : label;
    });
  }

  function setFilter(key) {
    if (key === currentFilter) return;
    currentFilter = key;

    // Fade out, swap content, fade back in
    grid.classList.add('is-fading');
    window.setTimeout(function () {
      renderGrid();
      grid.classList.remove('is-fading');
    }, 200);

    // Sync active states on both UIs
    if (tabsWrap) {
      tabsWrap.querySelectorAll('.ftab').forEach(function (t) {
        var active = t.getAttribute('data-filter') === key;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
    }
    if (chipsWrap) {
      chipsWrap.querySelectorAll('.chip').forEach(function (c) {
        c.classList.toggle('is-active', c.getAttribute('data-filter') === key);
      });
    }
  }

  /* --- Build the filter UIs from the shared filter list --- */
  if (tabsWrap) {
    tabsWrap.innerHTML = FILTERS.map(function (f) {
      return '<button type="button" class="ftab" role="tab" data-filter="' + f.key + '" aria-selected="false">' + f.label + '</button>';
    }).join('');
    tabsWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.ftab');
      if (btn) setFilter(btn.getAttribute('data-filter'));
    });
  }

  if (chipsWrap) {
    chipsWrap.innerHTML = FILTERS.map(function (f) {
      return '<button type="button" class="chip" role="tab" data-filter="' + f.key + '" aria-selected="false">' + f.label + '</button>';
    }).join('');
    chipsWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (btn) setFilter(btn.getAttribute('data-filter'));
    });
  }

  updateCounts();
  renderGrid();
  if (tabsWrap) tabsWrap.querySelector('[data-filter="all"]').classList.add('is-active');
  if (chipsWrap) chipsWrap.querySelector('[data-filter="all"]').classList.add('is-active');

  /* ------------------------------------------------------------------------
     6. Smooth scroll for in-page anchors (CSS handles reduced motion)
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
