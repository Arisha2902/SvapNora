import { Helmet } from 'react-helmet-async';

const SECTIONS = [
  {
    title: 'Information we collect',
    body: [
      'When you submit a contact or briefing form we collect the name, email address, phone number and project description you provide. The form also includes a hidden honeypot field used only to filter automated submissions.',
      'Signed-in employees and clients additionally expose the profile details required to operate their portal, such as job title, department, company name and the records created inside the portal (tasks, tickets, invoices, announcements).',
      'Basic request information — timestamp, route, browser type and IP address — is processed for security, abuse prevention and the audit trail shown to administrators.',
    ],
  },
  {
    title: 'Cookies',
    body: [
      'Authentication uses httpOnly cookies scoped to a single portal (admin, employee or client). They cannot be read by scripts in the page, are never shared across portals, and expire when the session ends.',
      'We do not use advertising or cross-site tracking cookies. Theme preference is stored in your own browser storage only.',
    ],
  },
  {
    title: 'How we use it',
    body: [
      'To respond to enquiries, prepare proposals and deliver contracted work; to operate and secure the portals; and to meet legal and accounting obligations.',
      'We do not sell personal information and we do not use enquiry content for automated decision-making.',
    ],
  },
  {
    title: 'Sharing and retention',
    body: [
      'Data is accessible only to SvapNora personnel who need it to do their work, and to processors acting on our instructions (hosting, email delivery, payment providers).',
      'Enquiry records are retained while a conversation is live and for a reasonable period afterwards; invoice and contract records are kept as required by Indian law. You can ask for deletion of anything we are not legally required to keep.',
    ],
  },
  {
    title: 'Security',
    body: [
      'Transmission is encrypted over HTTPS. Passwords are stored only as salted hashes, sessions are short-lived and revocable, portal access is role-scoped, and administrative actions are recorded in an audit log.',
      'No system is perfectly secure. If we become aware of a breach affecting your data we will notify you and the relevant authorities as required.',
    ],
  },
  {
    title: 'Your rights',
    body: [
      'You may request access to, correction of, or deletion of your personal data, and you may object to or restrict certain processing. Write to us using the contact details below and we will respond within a reasonable period.',
    ],
  },
];

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Statement · SvapNora</title>
        <meta
          name="description"
          content="How SvapNora collects, uses, stores and protects personal data across this website and its portals."
        />
      </Helmet>

      <section className="section section--dark page-hero page-hero--compact">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow__bullet" aria-hidden="true" />
            Legal
          </p>
          <h1 className="page-hero__title">Privacy Statement</h1>
          <p className="page-hero__blurb">
            This statement explains what we collect on svapnora and inside the employee and client
            portals, why we collect it, and the choices you have.
          </p>
          <p className="legal-doc__updated">Last updated: 1 January 2026</p>
        </div>
      </section>

      <section className="section section--light">
        <div className="container">
          <div className="legal-doc">
            {SECTIONS.map((s) => (
              <article className="legal-doc__section reveal" key={s.title}>
                <h2>{s.title}</h2>
                {s.body.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </article>
            ))}

            <article className="legal-doc__section reveal">
              <h2>Contact</h2>
              <p>
                Questions about this statement or a data request can be sent to
                hello@yourcompany.com, or by post to SvapNora, Civil Lines / Tech Hub, Prayagraj,
                Uttar Pradesh 211001, India.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
