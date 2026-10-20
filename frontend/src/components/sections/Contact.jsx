import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SectionHeader from '../SectionHeader.jsx';
import Button from '../Button.jsx';
import Alert from '../ui/Alert.jsx';
import { createInquiry } from '../../services/inquiryService.js';
import { IconCheck, IconMail, IconPhone, IconPin } from '../icons.jsx';

/* Field validation rules – error message shown when the test fails */
const VALIDATORS = {
  name: [
    (v) => v.trim().length >= 2,
    'Please enter your full name.',
  ],
  email: [
    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    'Please enter a valid business email address.',
  ],
  message: [
    (v) => v.trim().length >= 10,
    'Please tell us a little more about your project (min. 10 characters).',
  ],
};

const REQUIRED_FIELDS = ['name', 'email', 'message'];
const MESSAGE_MAX = 5000;

const SERVICE_OPTIONS = [
  'Business Process',
  'CRM Solutions',
  'Custom Software',
  'Performance Engineering',
  'Web & App Development',
  'Systems Integration',
  'Not sure yet',
];

const WINDOW_OPTIONS = ['Immediate / Urgent', '1-3 Months', 'Enterprise Quarter', 'Discovery Phase'];

const EMPTY = { name: '', email: '', phone: '', message: '' };

function FieldError({ id, message }) {
  return (
    <p className="field__error" id={id} role="alert">
      {message}
    </p>
  );
}

/**
 * Contact – white section with two columns: direct-inquiry info on the left
 * and a validated form on the right.
 *
 * Form flow: validate → focus the first broken field → POST → success panel
 * (fields hide until the visitor asks to send another message).
 */
export default function Contact({ isPage = false }) {
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState(EMPTY);
  const [interest, setInterest] = useState('');
  const [delivery, setDelivery] = useState('');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [sentTo, setSentTo] = useState('');

  // Lets /services?service=... preselect the interest line
  const serviceInterest = searchParams.get('service') || '';

  useEffect(() => {
    if (serviceInterest) setInterest(serviceInterest);
  }, [serviceInterest]);

  // A hand-edited URL may carry a service name that is not in the list - keep it.
  const options =
    serviceInterest && !SERVICE_OPTIONS.includes(serviceInterest)
      ? [serviceInterest, ...SERVICE_OPTIONS]
      : SERVICE_OPTIONS;

  const setField = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    // Live-clear an existing error as the user types
    setErrors((err) => {
      if (!err[name]) return err;
      const next = { ...err };
      delete next[name];
      return next;
    });
    setSubmitted(false);
  };

  const validateField = (name) => {
    if (!VALIDATORS[name]) return true;
    const [test, msg] = VALIDATORS[name];
    const ok = test(values[name]);
    setErrors((err) => {
      const next = { ...err };
      if (ok) delete next[name];
      else next[name] = msg;
      return next;
    });
    return ok;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const results = REQUIRED_FIELDS.map(validateField);
    if (!results.every(Boolean)) {
      // Keyboard users land on the field that actually needs them
      const firstBroken = REQUIRED_FIELDS.find((f) => !results[REQUIRED_FIELDS.indexOf(f)]);
      document.getElementById(`contact-${firstBroken}`)?.focus();
      return;
    }

    setSending(true);
    try {
      await createInquiry({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() ? `+91 ${values.phone.trim()}` : '',
        message: values.message.trim(),
        type: 'contact',
        serviceInterest: interest,
        deliveryWindow: delivery,
        website: honeypot, // must stay empty for humans
      });
      setSentTo(values.email.trim());
      setSubmitted(true);
      setValues(EMPTY);
      setErrors({});
      setInterest('');
      setDelivery('');
      setHoneypot('');
      // Move focus to the confirmation so screen readers announce it
      window.requestAnimationFrame(() => document.getElementById('contact-done')?.focus());
    } catch (err) {
      setServerError(err?.message || 'We could not send that just now. Please try again.');
      setSubmitted(false);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setSubmitted(false);
    setServerError('');
    setDelivery('');
    window.requestAnimationFrame(() => document.getElementById('contact-name')?.focus());
  };

  const typed = values.message.length;

  return (
    <section className={`section section--dark ${isPage ? 'contact-page' : ''}`} id="contact">
      <div className="container">
        <SectionHeader
          eyebrow="Get in Touch"
          title="Start the Conversation"
          intro="Tell us what is slowing you down — a practicing engineer replies within one business day."
        />

        <div className="contact-grid">
          {/* Left – direct inquiries */}
          <div className="contact-info reveal">
            <h3>Direct Inquiries</h3>
            <p>
              We schedule direct technical consultations without sales pressure. Reach out to
              our engineering leaders in Prayagraj.
            </p>

            <ul className="contact-list">
              <li className="contact-item">
                <span className="icon-tile" aria-hidden="true">
                  <IconMail size={18} />
                </span>
                <div className="contact-item__content">
                  <span className="contact-item__label">Email</span>
                  <a href="mailto:hello@yourcompany.com" className="contact-item__value">
                    hello@yourcompany.com
                  </a>
                </div>
              </li>
              <li className="contact-item">
                <span className="icon-tile" aria-hidden="true">
                  <IconPhone size={18} />
                </span>
                <div className="contact-item__content">
                  <span className="contact-item__label">Direct Line</span>
                  <a href="tel:+910000000000" className="contact-item__value">
                    +91 XXXXX XXXXX
                  </a>
                  <span className="contact-item__meta">
                    Mon&ndash;Fri, 9:30 AM &ndash; 6:30 PM IST
                  </span>
                </div>
              </li>
              <li className="contact-item">
                <span className="icon-tile" aria-hidden="true">
                  <IconPin size={18} />
                </span>
                <div className="contact-item__content">
                  <span className="contact-item__label">Regional Office</span>
                  <p className="contact-item__value">
                    Prayagraj Office, Civil Lines / Tech Hub, Prayagraj, Uttar Pradesh 211001,
                    India
                  </p>
                </div>
              </li>
            </ul>

            <div className="contact-note">
              <strong>TECHNICAL INTEGRITY:</strong> All intake inquiries are reviewed directly by
              practicing system architects and software engineers.
            </div>
          </div>

          {/* Right – validated form */}
          <form className="form form--contact reveal" onSubmit={onSubmit} noValidate>
            <header className="form__head">
              <p className="eyebrow">
                <span className="eyebrow__bullet" aria-hidden="true" />
                Project brief // intake protocol
              </p>
              <h3>
                Tell us what you are <span className="form__accent">building
                </span>
              </h3>
            </header>

            {serverError && (
              <Alert tone="error" onClose={() => setServerError('')}>
                {serverError}
              </Alert>
            )}

            {submitted ? (
              <div className="form-done" role="status">
                <span className="form-done__icon" aria-hidden="true">
                  <IconCheck size={22} />
                </span>
                <h4>Inquiry received</h4>
                <p>
                  An engineer from our Prayagraj team will respond to{' '}
                  <strong>{sentTo}</strong> within one business day. Want to add another detail
                  in the meantime? Just send another message.
                </p>
                <Button type="button" variant="ghost" onClick={reset}>
                  Send another message
                </Button>
              </div>
            ) : (
              <>
                {/* Honeypot - hidden from humans, tempting to bots */}
                <div className="hp-field" aria-hidden="true">
                  <label htmlFor="contact-website">Website</label>
                  <input
                    id="contact-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="contact-interest">What do you need help with?</label>
                  <select
                    id="contact-interest"
                    name="interest"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                  >
                    <option value="">Select an area (optional)</option>
                    {options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={errors.name ? 'field has-error' : 'field'}>
                  <label htmlFor="contact-name">
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Priya Sharma"
                    value={values.name}
                    onChange={setField('name')}
                    onBlur={() => validateField('name')}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'contact-name-error' : undefined}
                  />
                  <FieldError id="contact-name-error" message={errors.name} />
                </div>

                <div className="form__row">
                  <div className={errors.email ? 'field has-error' : 'field'}>
                    <label htmlFor="contact-email">
                      Business Email <span className="req">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={values.email}
                      onChange={setField('email')}
                      onBlur={() => validateField('email')}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'contact-email-error' : undefined}
                    />
                    <FieldError id="contact-email-error" message={errors.email} />
                  </div>

                  <div className="field">
                    <label htmlFor="contact-phone">
                      Phone Number <span className="opt">(optional)</span>
                    </label>
                    <div className="field-split">
                      <span className="field-split__prefix" aria-hidden="true">+91</span>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel-national"
                        placeholder="98765 43218"
                        value={values.phone}
                        onChange={setField('phone')}
                      />
                    </div>
                  </div>
                </div>

                <div className="field">
                  <span className="field__legend" id="contact-delivery-label">
                    Estimated delivery window <span className="opt">(optional)</span>
                  </span>
                  <div className="chips" role="group" aria-labelledby="contact-delivery-label">
                    {WINDOW_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`chip${delivery === opt ? ' is-on' : ''}`}
                        aria-pressed={delivery === opt}
                        onClick={() => setDelivery((cur) => (cur === opt ? '' : opt))}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={errors.message ? 'field has-error' : 'field'}>
                  <div className="field__label-row">
                    <label htmlFor="contact-message">
                      What do you want to build? <span className="req">*</span>
                    </label>
                    <span
                      className={`form__count${typed > MESSAGE_MAX - 200 ? ' is-near' : ''}`}
                      id="contact-message-count"
                      aria-live="polite"
                    >
                      {typed} / {MESSAGE_MAX} characters
                    </span>
                  </div>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    maxLength={MESSAGE_MAX}
                    placeholder="Describe your current bottleneck, desired CRM workflows, or software development roadmap..."
                    value={values.message}
                    onChange={setField('message')}
                    onBlur={() => validateField('message')}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message
                        ? 'contact-message-error'
                        : typed
                          ? 'contact-message-count'
                          : undefined
                    }
                  />
                  <FieldError id="contact-message-error" message={errors.message} />
                </div>

                <div className="form__foot">
                  <Button type="submit" variant="primary" disabled={sending}>
                    {sending ? 'Sending…' : 'Submit Inquiry'}
                  </Button>
                  <p className="form__note">
                    No newsletters, no reselling your details. Read the{' '}
                    <a href="/privacy">privacy policy</a>.
                  </p>
                </div>

                {/* <div className="form__trust">
                  <span className="form__trust-item">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    256-bit encrypted intake
                  </span>
                  <span className="form__trust-item">
                    <span className="trust-dot" aria-hidden="true" />
                    Direct CTO architecture triage
                  </span>
                  <span className="form__trust-item">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    SLA: 24-hour response
                  </span>
                </div> */}
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
