import { Fragment } from 'react';
import SectionHeader from '../SectionHeader.jsx';

const STEPS = [
  {
    num: '01',
    title: 'Understand',
    text: 'Understand the business problem, users, existing workflows, and desired outcomes before deciding on a solution.',
  },
  {
    num: '02',
    title: 'Design',
    text: 'Plan the features, system architecture, data flow, and user experience around the actual requirements.',
  },
  {
    num: '03',
    title: 'Develop',
    text: 'Build in manageable stages, prioritizing functional correctness, code quality, and efficient implementation.',
  },
  {
    num: '04',
    title: 'Test & Refine',
    text: 'Validate functionality, handle edge cases, and identify performance or usability issues before release.',
  },
  {
    num: '05',
    title: 'Improve',
    text: 'Evaluate feedback, address issues, and make improvements as requirements and usage evolve.',
  },
];

/**
 * How We Work � white section. Desktop: horizontal 5-column flow with purple
 * ">" chevrons between columns, number over a thin grey line with a short
 * purple segment. Mobile: vertical timeline with a thin purple line, dots
 * and "PHASE 0X" labels.
 */
export default function HowWeWork() {
  return (
    <section className="section section--light" id="how-we-work">
      <div className="container">
        <SectionHeader eyebrow="Our Process" title="How We Work" />
        <div className="steps">
          {STEPS.map((s, i) => (
            <Fragment key={s.num}>
              <div className="step reveal">
                <span className="step__num">{s.num}</span>
                <span className="step__phase">Phase {s.num}</span>
                <span className="step__rule" aria-hidden="true">
                  <i />
                </span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
              {i < STEPS.length - 1 && (
                <span className="step__chevron" aria-hidden="true">
                  &gt;
                </span>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
