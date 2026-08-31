import type { StationArticleSection } from "./station-articles";

/**
 * The public `/places/[slug]` article body is edited by the admin as one
 * plain-text field: paragraphs separated by a blank line, and an optional
 * `## Heading` line starting a new subsection. This keeps the admin form
 * to a single textarea instead of a nested repeater UI, while still
 * producing the same heading/paragraph structure the page renders.
 */
export function parseArticleBody(body: string): StationArticleSection[] {
  const blocks = body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const sections: StationArticleSection[] = [];
  let current: StationArticleSection | null = null;

  for (const block of blocks) {
    const headingMatch = block.match(/^##\s+(.+)/);
    if (headingMatch) {
      current = { heading: headingMatch[1].trim(), paragraphs: [] };
      sections.push(current);
      const rest = block.slice(headingMatch[0].length).trim();
      if (rest) current.paragraphs.push(rest);
    } else if (current) {
      current.paragraphs.push(block);
    } else {
      current = { paragraphs: [block] };
      sections.push(current);
    }
  }

  return sections;
}

/** Inverse of `parseArticleBody` — used only to seed the admin form's default value from the built-in fallback content. */
export function sectionsToArticleBody(sections: StationArticleSection[]): string {
  return sections
    .map((section) => {
      const lines: string[] = [];
      if (section.heading) lines.push(`## ${section.heading}`);
      lines.push(...section.paragraphs);
      return lines.join("\n\n");
    })
    .join("\n\n");
}
