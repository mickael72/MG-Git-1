import * as React from "react";

/**
 * A minimal, dependency-free Markdown renderer for AI summary content.
 *
 * Supports: h2/h3 headings, unordered/ordered lists, paragraphs, and inline
 * **bold**, _italic_ and `code`. All text is rendered via React (escaped by
 * default), so it is safe against HTML injection.
 */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Tokenise on **bold**, _italic_ / *italic*, and `code`.
  const pattern = /(\*\*[^*]+\*\*|_[^_]+_|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(pattern).filter(Boolean);

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-muted px-1 py-0.5 text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (
      (part.startsWith("_") && part.endsWith("_")) ||
      (part.startsWith("*") && part.endsWith("*"))
    ) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  function flushList() {
    if (!list) return;
    const items = list.items.map((item, i) => (
      <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={`ol-${key++}`}>{items}</ol>
      ) : (
        <ul key={`ul-${key++}`}>{items}</ul>
      ),
    );
    list = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim() === "") {
      flushList();
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.*)$/.exec(line.trim());
    const unorderedMatch = /^[-*]\s+(.*)$/.exec(line.trim());

    if (orderedMatch) {
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(orderedMatch[1]!);
      continue;
    }
    if (unorderedMatch) {
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(unorderedMatch[1]!);
      continue;
    }

    flushList();

    if (line.startsWith("### ")) {
      blocks.push(<h3 key={`h3-${key++}`}>{renderInline(line.slice(4), `h3-${key}`)}</h3>);
    } else if (line.startsWith("## ")) {
      blocks.push(<h2 key={`h2-${key++}`}>{renderInline(line.slice(3), `h2-${key}`)}</h2>);
    } else if (line.startsWith("# ")) {
      blocks.push(<h2 key={`h1-${key++}`}>{renderInline(line.slice(2), `h1-${key}`)}</h2>);
    } else {
      blocks.push(<p key={`p-${key++}`}>{renderInline(line, `p-${key}`)}</p>);
    }
  }

  flushList();

  return <div className="prose-summary">{blocks}</div>;
}
