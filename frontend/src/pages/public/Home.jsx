import Hero from '../../components/sections/Hero.jsx';
import Services from '../../components/sections/Services.jsx';
import WhyUs from '../../components/sections/WhyUs.jsx';
import HowWeWork from '../../components/sections/HowWeWork.jsx';
import WhoWeServe from '../../components/sections/WhoWeServe.jsx';
import CTABanner from '../../components/sections/CTABanner.jsx';
import Contact from '../../components/sections/Contact.jsx';

/**
 * SvapNora homepage — single responsive page.
 * Section rhythm: hero carousel (black) → services (white) → why us (black)
 * → how we work (white) → who we serve (light grey) → CTA (purple)
 * → contact (white) → footer (near-black).
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <WhyUs />
      <HowWeWork />
      <WhoWeServe />
      <CTABanner />
      <Contact />
    </>
  );
}
