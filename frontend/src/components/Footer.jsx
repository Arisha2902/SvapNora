import { Link } from 'react-router-dom';

import { IconGitHub, IconInstagram, IconLinkedIn, IconX } from './icons.jsx';

function FooterCol({ heading, links }) {
  return (
    <div className="footer__col">
      <h4>{heading}</h4>
      <ul>
        {links.map((l) => (
          <li key={l.label}>
            {l.to ? <Link to={l.to}>{l.label}</Link> : <a href={l.href}>{l.label}</a>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Footer — near-black. Brand block + tagline + socials on the left,
 * link columns on the right (four flat columns on desktop; two labelled
 * clusters "Capabilities" / "Organization" on mobile) and a bottom bar.
 * All links turn purple on hover.
 */
export default function Footer() {
  return (
    <footer className="footer footer--dots">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Link to="/" className="footer__logo" aria-label="SvapNora — home">
              <img
                src="/logo-mark.png"
                alt=""
                className="footer__logo-mark"
                width="40"
                height="40"
              />
              <span className="footer__logo-text">vapNora</span>
            </Link>
            <p className="footer__tag">
              Building Smarter Businesses Through Technology. Sovereign enterprise solutions,
              mission-critical transformation, and frontier intelligence integration.
            </p>
            <div className="footer__socials">
              <a href="#" aria-label="LinkedIn">
                <IconLinkedIn />
              </a>
              <a href="#" aria-label="X">
                <IconX />
              </a>
              <a href="#" aria-label="GitHub">
                <IconGitHub />
              </a>
              <a href="#" aria-label="Instagram">
                <IconInstagram />
              </a>
            </div>
          </div>

          

          <div className="footer__cols">
            

            <FooterCol
              heading="Explore"
              links={[
                { label: 'Why Us', to: '/#why-us' },
                { label: 'How We Work', to: '/#how-we-work' },
                { label: 'Who We Serve', to: '/#who-we-serve' },
                { label: 'GlowLang', to: '/glowlang' },
              ]}
            />

            <FooterCol
              heading="Quick Links"
              links={[
                { label: 'Services', to: '/services' },
                { label: 'Products', to: '/products' },
                { label: 'About Us', to: '/about' },
                { label: 'Contact Us', to: '/contact' },
              ]}
            />

            <div className="footer__col">
              <h4>Contact</h4>
              <ul>
                <li>
                  <a href="mailto:hello@yourcompany.com">hello@yourcompany.com</a>
                </li>
                <li>Mon–Fri, 9:30 AM – 6:30 PM IST</li>
              </ul>
            </div>
          </div>
        </div>
        {/* </div> */}

        <p className="footer__location">Prayagraj · Uttar Pradesh · India</p>

        <div className="footer__bottom">
          <p>© 2026 Technology Company. All rights reserved. Prayagraj, India.</p>
          <nav aria-label="Legal">
            <Link to="/privacy">Privacy Statement</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/contact">Global Compliance</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
