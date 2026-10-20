import SectionHeader from '../SectionHeader.jsx';
import ServiceCard from '../ServiceCard.jsx';
import { IconBolt, IconCode, IconGauge, IconGlobe, IconShare, IconUsers } from '../icons.jsx';

const SERVICES = [
  // {
  //   icon: IconBolt,
  //   title: 'Business Process Auto',
  //   text: 'Reduce repetitive manual work by connecting business processes and automating routine tasks. We help identify workflows that can be streamlined to improve consistency and save time.',
  //   link: 'Explore Workflow Automation',
  // },
  {
    icon: IconUsers,
    title: 'CRM Development',
    text: 'Organize customer information, manage leads, track sales pipelines, and streamline follow-ups through CRM solutions tailored to business requirements. Our approach focuses on making customer management more structured and actionable.',
    link: 'View CRM Capabilities',
  },
  {
    icon: IconCode,
    title: 'Custom Software Development',
    text: 'We develop software around specific business workflows, functional requirements, and operational challenges. From internal tools to web-based business applications, our focus is on practical functionality and maintainable engineering.',
    link: 'Discover Custom Engineering',
  },
  {
    icon: IconGauge,
    title: 'Performance-Focused Software Engineering',
    text: 'We prioritize efficient code, thoughtful architecture, appropriate data handling, and testing to develop software that responds reliably under its intended workload.',
    link: 'Learn More',
  },
  {
    icon: IconGlobe,
    title: 'Website & Web Application Development',
    text: 'Build a professional online presence or a functional web application designed around your audience, business goals, and required features.',
    link: 'View Web Architecture',
  },
  {
    icon: IconShare,
    title: 'System Integration & Digital Solutions',
    text: 'Connect compatible tools, services, and data flows to reduce fragmented workflows and create a more connected digital working environment.',
    link: 'Explore Integrations',
  },
];

/**
 * Services � white section, 3x2 grid of light grey cards (single column
 * with black icon tiles on mobile).
 */
export default function Services() {
  return (
    <section className="section section--light" id="services">
      <div className="container">
        <SectionHeader eyebrow="What We Do" title="Our Services" />
        <div className="services-grid">
          {SERVICES.map((s) => (
            <ServiceCard key={s.title} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
