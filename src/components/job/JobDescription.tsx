import { Fragment } from "react";

/**
 * Renders a job description that was stored as plain text with line breaks.
 *
 * Descriptions come in as one string — "About the Role… Key Responsibilities…
 * - item - item" — and used to be dropped into a single <p>, which collapsed
 * every newline and turned a structured posting into one dense paragraph.
 *
 * This is a deliberately tiny, dependency-free formatter rather than a
 * markdown library: it only ever emits text nodes inside <p>/<ul>/<h3>, so
 * there is no HTML to sanitise and nothing an employer can inject.
 *
 * Rules:
 *   • blank line            → paragraph break
 *   • "- ", "• ", "* ", "1." → list item
 *   • short line ending ":" or "#"-prefixed → sub-heading
 *   • anything else         → paragraph (single newlines kept as <br>)
 */
type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "h"; text: string };

const BULLET = /^\s*(?:[-•*▪●◦]|\d{1,2}[.)])\s+/;
const HEADING_MAX = 60;

export function parseDescription(text: string): Block[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push({ kind: "p", lines: para });
    para = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ kind: "ul", items: list });
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      flushList();
      continue;
    }
    if (BULLET.test(line)) {
      flushPara();
      list.push(line.replace(BULLET, ""));
      continue;
    }
    const heading = line.replace(/^#+\s*/, "");
    const looksLikeHeading =
      (line.startsWith("#") || (line.endsWith(":") && !line.includes(". "))) && heading.length <= HEADING_MAX;
    if (looksLikeHeading) {
      flushPara();
      flushList();
      blocks.push({ kind: "h", text: heading.replace(/:$/, "") });
      continue;
    }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

export default function JobDescription({ text, className = "" }: { text: string; className?: string }) {
  const blocks = parseDescription(text);
  if (!blocks.length) return null;

  return (
    <div className={`space-y-3 text-sm leading-relaxed text-muted-foreground ${className}`}>
      {blocks.map((block, i) => {
        if (block.kind === "h") {
          return (
            <h3 key={i} className="pt-2 text-sm font-semibold text-foreground first:pt-0">
              {block.text}
            </h3>
          );
        }
        if (block.kind === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 marker:text-primary/70">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
