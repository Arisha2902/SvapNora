/* ==========================================================================
   SvapNora — Shared Project Registry & Icon Set
   Single source of truth for the products.html cards. Each entry's
   `image` points at a website screenshot in public/products/ (0X.png);
   `url` makes the whole card link out to the live site.
   ========================================================================== */
(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     Inline SVG icon set (stroke icons inherit currentColor).
     ---------------------------------------------------------------------- */
  var STROKE = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

  var ICONS = {
    fork: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><circle cx="6" cy="5" r="2.2"/><circle cx="6" cy="19" r="2.2"/><circle cx="18" cy="9" r="2.2"/><path d="M6 7.2v9.6M18 11.2c0 4-4 4.8-8.6 5.4"/></svg>',
    terminal: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
    bag: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    swap: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>',
    radar: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 12 19 5"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><path d="M4 19a9 9 0 1 1 16 0"/><path d="M12 14l4-4"/><circle cx="12" cy="14" r="1.6"/></svg>',
    network: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5 6 16.8M12 7.5l6 9.3M7.5 19h9"/></svg>',
    lock: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    pin: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    building: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/></svg>',
    home: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    grid: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    shield: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V8h4v1.5A6 6 0 0 1 16 8z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.15c0 .3.21.67.8.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>',
    x: '<svg viewBox="0 0 24 24" ' + STROKE + ' aria-hidden="true"><path d="M4 4l16 16"/><path d="M20 4 4 20"/></svg>'
  };

  window.SVAPNORA_ICON = function (name, size) {
    var svg = ICONS[name] || ICONS.terminal;
    return size ? svg.replace('<svg ', '<svg width="' + size + '" height="' + size + '" ') : svg;
  };

  /* ----------------------------------------------------------------------
     Filter tabs (shared by products.html)
     ---------------------------------------------------------------------- */
  window.SVAPNORA_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'crm', label: 'CRM' },
    { key: 'custom', label: 'Custom Software' },
    { key: 'web', label: 'Web Applications' },
    { key: 'integrations', label: 'Integrations' }
  ];

  /* ----------------------------------------------------------------------
     PROJECT REGISTRY — every title, image and text below is a PLACEHOLDER.
     visual.icon  -> key of the icon set above
     visual.tag   -> status tag shown on the visual (green = verified/online)
     mobile.*     -> the simplified mobile card variant
     ---------------------------------------------------------------------- */
  window.SVAPNORA_PROJECTS = [
    {
      id: '01',
      image: 'products/01.png',
      filter: 'web',
      category: 'Web Applications',
      title: 'ShipCarting — Saltlane Shipping Showcase',
      desc: 'Scroll-driven shipping story that flies from open ocean through port and terminal yard to a booking finale — video scenes, accent themes and live tags per section.',
      tags: ['Scroll Story', 'Video Scenes', 'Netlify'],
      status: 'LIVE',
      url: 'https://shipcarting.netlify.app/',
      visual: {
        label: 'SALTLANE // TIDE',
        tag: 'ONLINE',
        tagType: 'green',
        icon: 'pin',
        caption: '16:10 OCEAN-TO-DOORSTEP SCROLL STORY',
        footLeft: 'SECTIONS: SEA/PORT/YARD',
        footRight: 'CTA: BOOK A SAILING'
      },
      mobile: {
        cat: 'WEB APPLICATION',
        tag: 'LIVE',
        title: 'SALTLANE SHIPPING SHOWCASE',
        desc: 'Cinematic scroll journey across oceans, ports and terminal yards with per-section video, accent themes and a booking finale.'
      }
    },
    {
      id: '02',
      image: 'products/02.png',
      filter: 'web',
      category: 'Web Applications',
      title: 'INCWORX Intelligence Group',
      desc: 'Corporate platform for a market-intelligence and shipping group — intelligence, datamatics, tectonics and digitronics verticals with chartering desks, project portfolios and global office coverage.',
      tags: ['Corporate Site', 'Market Intelligence', 'Shipping'],
      status: 'LIVE',
      url: 'https://cargoship.vercel.app/',
      visual: {
        label: 'INCWORX // GROUP',
        tag: 'ONLINE',
        tagType: 'green',
        icon: 'network',
        caption: '16:10 INTELLIGENCE-THAT-MOVES-MARKETS',
        footLeft: 'VERTICALS: 4',
        footRight: 'OFFICES: GLOBAL'
      },
      mobile: {
        cat: 'WEB APPLICATION',
        tag: 'LIVE',
        title: 'INCWORX INTELLIGENCE GROUP',
        desc: 'Market intelligence, chartering and infrastructure platform spanning intelligence, datamatics, tectonics and digitronics verticals.'
      }
    },
    {
      id: '03',
      image: 'products/03.png',
      filter: 'web',
      category: 'Web Applications',
      title: 'Sudhamla — Handcrafted Foods',
      desc: 'Brand and commerce site for handcrafted pickles, chutneys and amla products from Prayagraj — product storytelling, sourcing notes and direct ordering.',
      tags: ['E-commerce', 'Brand Site', 'Prayagraj'],
      status: 'LIVE',
      url: 'https://sudhamla.com/',
      visual: {
        label: 'SUDHAMLA // FOODS',
        tag: 'ONLINE',
        tagType: 'green',
        icon: 'bag',
        caption: '16:10 PICKLES • CHUTNEYS • AMLA',
        footLeft: 'ORIGIN: PRAYAGRAJ',
        footRight: 'MODE: D2C'
      },
      mobile: {
        cat: 'WEB APPLICATION',
        tag: 'LIVE',
        title: 'SUDHAMLA HANDCRAFTED FOODS',
        desc: 'Handcrafted pickle, chutney and amla brand from Prayagraj with product storytelling and direct ordering.'
      }
    },
    {
      id: '04',
      image: 'products/04.png',
      filter: 'web',
      category: 'Web Applications',
      title: 'Raj Mandir Palace — Heritage Hotel',
      desc: 'Luxury heritage hotel site in Deoghar near Baba Baidyanath Dham — suites, sattvic dining, demo reservations, seasonal offers and concierge journeys.',
      tags: ['Hospitality', 'Booking Flow', 'Vercel'],
      status: 'LIVE',
      url: 'https://resturant-cum-hotel.vercel.app/',
      visual: {
        label: 'PALACE // DEOGHAR',
        tag: 'ONLINE',
        tagType: 'green',
        icon: 'building',
        caption: '16:10 HERITAGE SUITES & DINING',
        footLeft: 'STAY + DINING + EVENTS',
        footRight: 'DEOGHAR, JHARKHAND'
      },
      mobile: {
        cat: 'WEB APPLICATION',
        tag: 'LIVE',
        title: 'RAJ MANDIR PALACE HOTEL',
        desc: 'Heritage hotel near Baba Baidyanath Dham with suites, sattvic dining, demo booking flows and seasonal offers.'
      }
    },
    {
      id: '05',
      image: 'products/05.png',
      filter: 'web',
      category: 'Web Applications',
      title: 'MR Driving School UK',
      desc: 'Professional driving academy site with theory LMS — course catalogue, progress tracking and learner onboarding for a UK school.',
      tags: ['LMS', 'EdTech', 'Netlify'],
      status: 'LIVE',
      url: 'https://mrdrivingschooluk.netlify.app/',
      visual: {
        label: 'DRIVING // LMS',
        tag: 'ONLINE',
        tagType: 'green',
        icon: 'gauge',
        caption: '16:10 ACADEMY + THEORY LMS',
        footLeft: 'MODE: PRACTICE+THEORY',
        footRight: 'REGION: UNITED KINGDOM'
      },
      mobile: {
        cat: 'WEB APPLICATION',
        tag: 'LIVE',
        title: 'MR DRIVING SCHOOL UK',
        desc: 'Driving academy site with theory LMS, course catalogue, progress tracking and learner onboarding.'
      }
    },
    {
      id: '06',
      image: 'products/06.png',
      filter: 'web',
      category: 'Web Applications',
      title: 'The Priyanka Wellness',
      desc: 'Wellness and nutrition web app — “Eat Right. Feel Alive.” with meal guidance, habit tracking and healthy-living content.',
      tags: ['Wellness App', 'Nutrition', 'Vercel'],
      status: 'LIVE',
      url: 'https://wellness-web-app-two.vercel.app/',
      visual: {
        label: 'WELLNESS // VITALS',
        tag: 'ONLINE',
        tagType: 'green',
        icon: 'radar',
        caption: '16:10 EAT RIGHT. FEEL ALIVE.',
        footLeft: 'PLAN: NUTRITION',
        footRight: 'LIVE: WELLNESS TRACKING'
      },
      mobile: {
        cat: 'WEB APPLICATION',
        tag: 'LIVE',
        title: 'THE PRIYANKA WELLNESS',
        desc: 'Nutrition and wellness web app with meal guidance, habit tracking and healthy-living content.'
      }
    },
    {
      id: '07',
      image: 'products/07.png',
      filter: 'web',
      category: 'Web Applications',
      title: 'Construction Builder Solution',
      desc: 'Construction Builder Solution — project showcase site.',
      tags: ['Construction', 'Showcase'],
      status: 'LIVE',
      url: 'https://constructionbuildersolution.com/',
      visual: {
        label: 'BUILDER // SOLUTION',
        tag: 'ONLINE',
        tagType: 'green',
        icon: 'building',
        caption: '16:10 CONSTRUCTION SHOWCASE',
        footLeft: 'SECTOR: CONSTRUCTION',
        footRight: 'MODE: SHOWCASE'
      },
      mobile: {
        cat: 'WEB APPLICATION',
        tag: 'LIVE',
        title: 'CONSTRUCTION BUILDER SOLUTION',
        desc: 'Construction Builder Solution — project showcase site.'
      }
    }
  ];
})();
