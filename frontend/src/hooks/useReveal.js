import { useEffect } from 'react';

/**
 * Scroll-reveal: observes every `.reveal` element and adds `.is-visible`
 * when it enters the viewport (fade-up via CSS).
 *
 * Routed pages mount their content after this hook runs (lazy chunks, data
 * fetches), so a MutationObserver keeps picking up newly added `.reveal`
 * nodes instead of leaving them stuck at opacity 0.
 */
export function useReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      const revealAll = () => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
      revealAll();
      return undefined;
    }

    let stagger = 0;
    const seen = new WeakSet();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Clear any stagger delay once revealed so hovers stay instant
            entry.target.style.transitionDelay = '';
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    const observe = (el) => {
      if (!(el instanceof Element) || !el.classList.contains('reveal') || seen.has(el)) return;
      seen.add(el);
      // Small stagger within groups of four
      el.style.transitionDelay = `${Math.min(stagger % 4, 3) * 70}ms`;
      stagger += 1;
      io.observe(el);
    };

    const scan = (root) => {
      if (!root) return;
      observe(root);
      if (root.querySelectorAll) root.querySelectorAll('.reveal').forEach(observe);
    };

    scan(document.body);

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => scan(node));
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);
}
