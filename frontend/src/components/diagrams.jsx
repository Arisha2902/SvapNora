/**
 * Inline SVG node diagrams for the hero terminal cards.
 * All geometry is viewBox-scaled so diagrams stay crisp at any width.
 */

/** Diamond node diagram � glowing core + 4 labelled satellites (slide 1). */
export function DiamondDiagram() {
  return (
    <svg
      className="diagram"
      viewBox="0 0 240 180"
      role="img"
      aria-label="Core dispatch node linked to Architecture, Throughput, Automata and Persistence"
    >
      {/* connecting edges */}
      <line className="edge" x1="120" y1="88" x2="120" y2="34" />
      <line className="edge" x1="120" y1="88" x2="46" y2="88" />
      <line className="edge" x1="120" y1="88" x2="194" y2="88" />
      <line className="edge" x1="120" y1="88" x2="120" y2="142" />
      {/* glowing centre node */}
      <circle className="node-core" cx="120" cy="88" r="7" />
      {/* satellite nodes */}
      <rect className="node" x="115" y="26" width="10" height="10" />
      <text className="label" x="120" y="18" textAnchor="middle">
        ARCHITECTURE
      </text>
      <rect className="node" x="41" y="83" width="10" height="10" />
      <text className="label" x="34" y="87" textAnchor="end">
        THROUGHPUT
      </text>
      <rect className="node" x="189" y="83" width="10" height="10" />
      <text className="label" x="206" y="87" textAnchor="start">
        AUTOMATA
      </text>
      <rect className="node" x="115" y="137" width="10" height="10" />
      <text className="label" x="120" y="162" textAnchor="middle">
        PERSISTENCE
      </text>
    </svg>
  );
}

/** Cluster mesh � glowing CORE-0 + 4 outer nodes, BACKUP hollow (slide 2). */
export function ClusterDiagram() {
  return (
    <svg
      className="diagram"
      viewBox="0 0 240 170"
      role="img"
      aria-label="Cluster mesh with core node CORE-0 linked to NODE A, NODE B, REPLICA and BACKUP"
    >
      {/* edges */}
      <line className="edge" x1="120" y1="85" x2="54" y2="42" />
      <line className="edge" x1="120" y1="85" x2="186" y2="42" />
      <line className="edge" x1="120" y1="85" x2="54" y2="128" />
      <line className="edge" x1="120" y1="85" x2="186" y2="128" />
      {/* glowing centre */}
      <circle className="node-core" cx="120" cy="85" r="8" />
      <text className="label" x="120" y="108" textAnchor="middle">
        CORE-0
      </text>
      {/* outer nodes */}
      <circle className="node" cx="50" cy="38" r="6" />
      <text className="label" x="50" y="26" textAnchor="middle">
        NODE A
      </text>
      <circle className="node" cx="190" cy="38" r="6" />
      <text className="label" x="190" y="26" textAnchor="middle">
        NODE B
      </text>
      <circle className="node" cx="50" cy="132" r="6" />
      <text className="label" x="50" y="156" textAnchor="middle">
        REPLICA
      </text>
      <circle className="node node--hollow" cx="190" cy="132" r="6" />
      <text className="label" x="190" y="156" textAnchor="middle">
        BACKUP
      </text>
    </svg>
  );
}

/** Flow diagram � TRIGGERING CRM -> EVENTS & ETL -> ERP SYNC, webhook below (slide 3). */
// export function FlowDiagram() {
//   return (
//     <svg
//       className="diagram"
//       viewBox="0 0 240 120"
//       role="img"
//       aria-label="Automation flow: triggering CRM feeds events and ETL, then ERP sync, with webhook dispatch beneath"
//     >
//       <defs>
//         <marker
//           id="flow-arrow"
//           viewBox="0 0 8 8"
//           refX="7"
//           refY="4"
//           markerWidth="7"
//           markerHeight="7"
//           orient="auto-start-reverse"
//         >
//           <path d="M0 0L8 4L0 8z" fill="#A100FF" />
//         </marker>
//       </defs>
//       {/* connector lines */}
//       <line className="edge" x1="74" y1="28" x2="82" y2="28" markerEnd="url(#flow-arrow)" />
//       <line className="edge" x1="156" y1="28" x2="164" y2="28" markerEnd="url(#flow-arrow)" />
//       <line className="edge" x1="120" y1="40" x2="120" y2="70" markerEnd="url(#flow-arrow)" />
//       {/* nodes */}
//       <rect className="flow-box" x="2" y="16" width="72" height="24" />
//       <text className="flow-label" x="38" y="31" textAnchor="middle">
//         TRIGGERING CRM
//       </text>
//       <rect className="flow-box flow-box--hot" x="84" y="16" width="72" height="24" />
//       <text className="flow-label flow-label--hot" x="120" y="31" textAnchor="middle">
//         EVENTS &amp; ETL
//       </text>
//       <rect className="flow-box" x="166" y="16" width="72" height="24" />
//       <text className="flow-label" x="202" y="31" textAnchor="middle">
//         ERP SYNC
//       </text>
//       <rect className="flow-box" x="84" y="72" width="72" height="24" />
//       <text className="flow-label" x="120" y="87" textAnchor="middle">
//         WEBHOOK DISPATCH
//       </text>
//     </svg>
//   );
// }

/** Purple heartbeat / pulse line used in the mobile slide-1 visual. */
export function PulseLine() {
  return (
    <svg className="pulse" viewBox="0 0 200 32" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="0,16 52,16 60,16 66,5 74,27 81,16 118,16 126,16 132,9 139,23 146,16 200,16" />
    </svg>
  );
}
