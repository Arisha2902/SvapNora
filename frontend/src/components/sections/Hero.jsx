import { useEffect, useRef, useState } from 'react';
import bannerPlanet from '../../assets/Violet Planetary Ringscape.png';
import bannerWave from '../../assets/Neon Orbital Wave in Deep Space.png';
import bannerRings from '../../assets/Neon Orbital Rings in Deep Space.png';
import thumbCrystal from '../../assets/Neon Violet Crystalline Techscape.png';
import Button from '../Button.jsx';
import TerminalCard from '../TerminalCard.jsx';
import { ClusterDiagram, DiamondDiagram, PulseLine } from '../diagrams.jsx';
import { IconChevronLeft, IconChevronRight } from '../icons.jsx';

const SLIDES = [
  {
    key: 'built-for-whats-next',
    bg: bannerPlanet,
    kicker: 'AUTOMATION / AI / ENTERPRISE SYSTEMS',
    titleA: 'BUILT FOR',
    titleB: 'NEXT',
    titlePre: "WHAT'S ",
    linkLabel: 'Explore SvapNora',
    linkHref: '#services',
    sideNotes: ['IDEAS INTO AUTOMATION', 'PEOPLE PROCESSES POSSIBILITIES', 'SCALABLE SECURE READY'],
    card: { label: 'SERVICES', heading: 'Transform Operations', thumb: thumbCrystal },
  },
  {
    key: 'enterprise-scale',
    bg: bannerWave,
    kicker: 'ENTERPRISE CAPABILITIES / PRAYAGRAJ',
    titleA: 'ENGINEERED',
    titleB: 'SCALE',
    titlePre: 'FOR ',
    linkLabel: 'View Engineering Case Studies',
    linkHref: '#services',
    sideNotes: ['MISSION CRITICAL SYSTEMS', 'HIGH THROUGHPUT INFRA', '99.99% UPTIME READY'],
    card: { label: 'PRODUCTS', heading: 'Automate with Intelligence', thumb: bannerRings },
  },
  {
    key: 'automated-flow',
    bg: bannerRings,
    kicker: 'INTELLIGENT WORKFLOWS / AUTOMATION',
    titleA: 'MANUAL TO',
    titleB: 'FLOW',
    titlePre: 'AUTOMATED ',
    linkLabel: 'Explore Automation Workflows',
    linkHref: '#contact',
    sideNotes: ['LEGACY TOOLS CONNECTED', 'DATA CENTRALIZED TELEMETRY', 'SELF-HEALING WORKFLOWS LIVE'],
    card: { label: 'INSIGHTS', heading: 'Ideas for a Smarter Tomorrow', thumb: bannerWave },
  },
];
const AUTOPLAY_MS = 7000;

export default function Hero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const count = SLIDES.length;

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = setInterval(() => setActive((a) => (a + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  const goTo = (i) => setActive(((i % count) + count) % count);
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') goTo(active - 1);
    if (e.key === 'ArrowRight') goTo(active + 1);
  };
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) goTo(active + (dx < 0 ? 1 : -1));
    touchStartX.current = null;
  };
  const slide = SLIDES[active];

  return (
    <section
      className="hero-banner"
      aria-roledescription="carousel"
      aria-label="Featured capabilities"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="hero-banner__bgs" aria-hidden="true">
        {SLIDES.map((s, i) => (
          <div
            key={s.key}
            className={`hero-banner__bg${i === active ? ' is-active' : ''}`}
            style={{ backgroundImage: `url(${s.bg})` }}
          />
        ))}
        <div className="hero-banner__scrim" />
      </div>

      <div className="container hero-banner__inner">
        <div className="hero-banner__slides" role="group" aria-label={`Slide ${active + 1} of ${count}`}>
          <p className="hero-banner__kicker">
            <span className="hero-banner__rule" aria-hidden="true" />
            {slide.kicker}
          </p>
          <h1 className="hero-banner__title" key={slide.key}>
            {slide.titleA}
            <br />
            {slide.titlePre}
            <span className="hero-banner__next">{slide.titleB}</span>
            <span className="hero-banner__chev" aria-hidden="true"> &gt;</span>
          </h1>
          <a className="hero-banner__explore" href={slide.linkHref}>
            <span>{slide.linkLabel}</span>
            <span aria-hidden="true"> &rarr;</span>
          </a>
          <div className="hero-banner__meta">
            <div className="hero-banner__bars" aria-hidden="true">
              {SLIDES.map((s, i) => (
                <i key={s.key} className={i === active ? 'is-active' : undefined} />
              ))}
            </div>
            <p className="hero-banner__count">0{active + 1} / 0{count}</p>
          </div>
        </div>
        <div className="hero-banner__notes" aria-hidden="true">
          {slide.sideNotes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </div>
        <div className="hero-banner__arrows">
          <button type="button" className="hero-banner__arrow" onClick={() => goTo(active - 1)} aria-label="Previous slide">
            <IconChevronLeft />
          </button>
          <button type="button" className="hero-banner__arrow hero-banner__arrow--next" onClick={() => goTo(active + 1)} aria-label="Next slide">
            <IconChevronRight />
          </button>
        </div>
      </div>

      <div className="container hero-banner__cards">
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}: ${s.card.heading}`}
            className={`hero-card${i === active ? ' is-active' : ''}`}
          >
            <span className="hero-card__top">
              <span className="hero-card__num">0{i + 1}</span>
              <span className="hero-card__label">{s.card.label}</span>
            </span>
            <span className="hero-card__heading">{s.card.heading}</span>
            <span className="hero-card__arrow" aria-hidden="true">&rarr;</span>
            <span className="hero-card__thumb" aria-hidden="true" style={{ backgroundImage: `url(${s.card.thumb})` }} />
          </button>
        ))}
      </div>
    </section>
  );
}

