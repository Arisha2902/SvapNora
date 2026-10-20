import SectionHeader from '../SectionHeader.jsx';
import FeatureCard from '../FeatureCard.jsx';

const dslCode = [
  '// Define DSL specification',
  'class Pipeline {',
  '  stream: ledger: TxRecord;',
  '  await Verified;',
  '}',
].join('\n');

const FEATURES = [
  {
    num: '01',
    title: 'Built With Intent',
    text: 'We begin with the problem, not just the technology. Every solution should have a clear purpose, defined requirements, and practical value for its intended users.',
  },
  {
    num: '02',
    title: 'Our Own Programming Language',
    text: 'We work on our own programming language as part of our engineering approach. This reflects our interest in understanding software at a deeper level and developing our own tools rather than depending exclusively on existing abstractions.',
    special: true,
    tag: 'Signature Initiative',
    tagShort: 'Signature',
    code: dslCode,
  },
  {
    num: '03',
    title: 'Performance-Conscious Development',
    text: 'We pay attention to code efficiency, architecture, resource usage, and testing. Our goal is to minimize unnecessary overhead and deliver responsive software under realistic operating conditions.',
  },
  {
    num: '04',
    title: 'Designed for Maintainability',
    text: 'Software should not become impossible to improve after its first release. We aim for clear structure, manageable complexity, and a development approach that supports future changes.',
  },
  // {
  //   num: '05',
  //   title: 'Automation That Solves Real Problems',
  //   text: 'Automation is valuable when it removes friction from everyday work. We focus on workflows where technology can reduce repetitive effort, improve consistency, and help teams concentrate on higher-value activities.',
  // },
  {
    num: '05',
    title: 'A Long-Term Perspective',
    text: 'We see software as an evolving asset rather than a one-time deliverable. Our approach emphasizes practical foundations, thoughtful improvements, and solutions that can adapt to changing business requirements.',
  },
];

/**
 * Why Us � black section, 3x2 grid of dark grey cards with purple numbers.
 * Card 02 is the special "Signature Initiative" card.
 */
export default function WhyUs() {
  return (
    <section className="section section--dark section--dots" id="why-us">
      <div className="container">
        <SectionHeader
          eyebrow="Why Us"
          title={
            <>
              Engineering <span className="accent">Beyond the Ordinary</span>
            </>
          }
        />
        <div className="why-grid">
          {FEATURES.map((f) => (
            <FeatureCard key={f.num} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
