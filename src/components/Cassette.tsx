import { useId, type CSSProperties } from "react";
import { TAPE_ART, counterText, ledFor, reelRadii, stripeFill } from "../lib/cassetteArt";
import { formatShort } from "../lib/dates";
import type { ProjectStatus } from "../lib/status";
import type { Project } from "../types";

interface CassetteProps {
  project: Project;
  status: ProjectStatus;
  done: number;
  total: number;
}

function Hub({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g className="reel-hub">
      <circle cx={cx} cy={cy} r={11.5} style={{ fill: TAPE_ART.hub }} />
      <circle cx={cx} cy={cy} r={7} style={{ fill: TAPE_ART.hubHole }} />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <rect
          key={angle}
          x={cx - 1.5}
          y={cy - 11}
          width={3}
          height={5.5}
          style={{ fill: TAPE_ART.hub }}
          transform={`rotate(${angle} ${cx} ${cy})`}
        />
      ))}
    </g>
  );
}

/** A project drawn as a cassette: the reels show progress, the LED shows status, the counter is % done. */
export default function Cassette({ project, status, done, total }: CassetteProps) {
  const uid = useId().replace(/:/g, "");
  const progress = total === 0 ? 0 : done / total;
  const percent = Math.round(progress * 100);
  const { left, right } = reelRadii(progress);
  const led = ledFor(status.kind);
  const style = { "--project-color": project.color } as CSSProperties;
  const label = `${project.name}: ${done} of ${total} checklist items done. ${status.label}.`;
  const gloss = TAPE_ART.gloss;

  return (
    <svg className="cassette" data-status={status.kind} viewBox="0 0 420 272" role="img" aria-label={label} style={style}>
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: `color-mix(in srgb, var(--project-color) 80%, ${gloss})` }} />
          <stop offset="1" style={{ stopColor: `color-mix(in srgb, var(--project-color) 78%, ${TAPE_ART.shadow})` }} />
        </linearGradient>
        <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: gloss, stopOpacity: 0.5 }} />
          <stop offset="0.4" style={{ stopColor: gloss, stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="416" height="268" rx="18" fill={`url(#${uid}-body)`} style={{ stroke: TAPE_ART.shadow, strokeOpacity: 0.35 }} strokeWidth="1.5" />
      <rect x="2" y="2" width="416" height="268" rx="18" fill={`url(#${uid}-shine)`} />

      {/* paper label */}
      <rect x="26" y="20" width="368" height="128" rx="8" style={{ fill: TAPE_ART.paper, stroke: TAPE_ART.shadow, strokeOpacity: 0.18 }} />
      <path d="M26 50V28a8 8 0 0 1 8-8h352a8 8 0 0 1 8 8v22z" style={{ fill: stripeFill(project.color) }} />
      <circle cx="50" cy="35" r="11" style={{ fill: TAPE_ART.paper }} />
      <text x="50" y="40" textAnchor="middle" className="cassette-side">A</text>
      <text x="72" y="41" className="cassette-due" style={{ fill: TAPE_ART.stripeText }}>
        {`DUE ${formatShort(project.deadline).toUpperCase()}`}
      </text>
      <text x="380" y="41" textAnchor="end" className="cassette-due" style={{ fill: TAPE_ART.stripeText }}>
        C-60
      </text>
      <text x="380" y="141" textAnchor="end" className="cassette-sticker" style={{ fill: TAPE_ART.paperInk }}>
        STEREO · NOISE REDUCTION
      </text>
      <foreignObject x="38" y="56" width="344" height="76">
        <div className="cassette-title" style={{ color: TAPE_ART.paperInk }}>
          {project.name}
        </div>
      </foreignObject>

      {/* tape window with two reels */}
      <rect x="92" y="156" width="236" height="66" rx="33" style={{ fill: TAPE_ART.window, stroke: TAPE_ART.gloss, strokeOpacity: 0.25 }} />
      <circle cx="150" cy="189" r={left} style={{ fill: TAPE_ART.tape }} />
      <circle cx="270" cy="189" r={right} style={{ fill: TAPE_ART.tape }} />
      <path d={`M 148 ${189 + left} L 272 ${189 + right}`} style={{ stroke: TAPE_ART.tape }} strokeWidth="2.4" fill="none" />
      <Hub cx={150} cy={189} />
      <Hub cx={270} cy={189} />

      {/* counter (percent done) and status LED, both in skin colours */}
      <rect x="338" y="166" width="58" height="34" rx="5" style={{ fill: "var(--lcd-bg)", stroke: TAPE_ART.gloss, strokeOpacity: 0.3 }} />
      <text x="367" y="193" textAnchor="middle" className="cassette-counter" style={{ fill: "var(--lcd-text)" }}>
        {counterText(percent)}
      </text>
      <rect x="16" y="158" width="60" height="52" rx="10" style={{ fill: TAPE_ART.window }} />
      <circle cx="46" cy="178" r="11" style={{ fill: led.color, opacity: 0.3 }} />
      <circle cx="46" cy="178" r="6.5" style={{ fill: led.color }} />
      <text x="46" y="203" textAnchor="middle" className="cassette-led" style={{ fill: TAPE_ART.stripeText }}>
        {led.label}
      </text>

      {/* bottom trapezoid, screws */}
      <path d="M78 272 L104 238 H316 L342 272 Z" style={{ fill: TAPE_ART.shadow, opacity: 0.28 }} />
      <circle cx="132" cy="256" r="5.5" style={{ fill: TAPE_ART.hubHole }} />
      <circle cx="288" cy="256" r="5.5" style={{ fill: TAPE_ART.hubHole }} />
      <rect x="196" y="250" width="28" height="9" rx="4.5" style={{ fill: TAPE_ART.hubHole }} />
      {[[18, 18], [402, 18], [18, 254], [402, 254]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="6" style={{ fill: TAPE_ART.hub, stroke: TAPE_ART.shadow, strokeOpacity: 0.4 }} />
          <line x1={(x ?? 0) - 4} y1={y} x2={(x ?? 0) + 4} y2={y} style={{ stroke: TAPE_ART.shadow, strokeOpacity: 0.45 }} strokeWidth="1.6" transform={`rotate(35 ${x} ${y})`} />
        </g>
      ))}
    </svg>
  );
}
