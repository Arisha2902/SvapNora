import Button from '../Button.jsx';

/**
 * Full-width purple CTA banner. Centered white headline, supporting text and
 * a white button with black text (full width on mobile).
 */
export default function CTABanner() {
  return (
    <section className="cta">
      <div className="container cta__inner reveal">
        <p className="eyebrow cta__eyebrow">Take Action</p>
        <h2 className="cta__title">Have a Problem Worth Solving?</h2>
        <p className="cta__text">
          Tell us what is slowing your business down, what you want to automate, or what you
          want to build. Let&rsquo;s explore a practical technology solution together.
        </p>
        <Button href="#contact" variant="white">
          Discuss Your Project
        </Button>
      </div>
    </section>
  );
}
