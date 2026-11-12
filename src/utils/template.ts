import { ProjectAsset } from '../types';

export const INITIAL_MARKDOWN = `---
title: "Example Design Document: The Markdown Dialect"
subtitle: "A worked example showing every block the design-document tool understands."
name: "A Great Student"
student_number: s1234567
date: 2026-11-11 09:00:00
report_number: 1
abstract: "This is a live example. Edit the Markdown on the left and the document regenerates on the right. The frontmatter block carries the metadata (title, subtitle, your name and student number, the date, and this abstract); the body uses a small, fixed set of top-level headings. Everything you see here, the sticky header, the contents sidebar, the typed blocks, comes from one engine, so what you preview is exactly what gets saved."
---

# Prompt

Design a small tool that turns a Markdown file into a styled design document, and show every kind of block it supports in one example so a reader can copy the shapes they need.

# Content

## 1. Frontmatter and structure

![A manga panel about loving Markdown](images/markdown-love-manga_261102.png)

The file opens with a YAML frontmatter block between \`---\` fences. It carries \`title\`, \`subtitle\`, \`name\`, \`student_number\`, \`date\`, \`report_number\` and \`abstract\`. The abstract is rendered as the first section of the document and listed in the contents sidebar. Below the frontmatter, top-level \`#\` headings name the fixed sections: \`Content\` (required), and the optional \`Prompt\` and \`Lesson\`.

Inside \`Content\`, a \`## N. Name\` heading opens a numbered section, and typed \`###\` blocks add structure. Inline formatting is familiar: **bold**, *italic*, and \`inline code\` all work.

### Phase: Typed blocks

A \`### Phase:\` block is rendered as a titled panel, good for one stage of a design process: research, sketching, prototyping, evaluation. There are matching \`### Slide:\` blocks for callouts.

### Slide: Design goals

- Readable on a phone and on paper
- No installation and no network
- One engine for preview and saved output

### Bug: A structured problem record

- **symptom**: what the user saw go wrong in the prototype
- **root_cause**: the underlying reason it happened
- **fix**: what was changed in the design to correct it
- **rationale**: why that change is the right one

### Table: A comparison

| Block | Written as | Renders as |
| --- | --- | --- |
| Numbered section | \`## 1. Name\` | an \`<h2>\` in the sidebar |
| Phase | \`### Phase: Title\` | a titled panel |
| Bug | \`### Bug: Title\` | a definition list |
| Metrics | \`### Metrics\` | a row of badges |

### Metrics

- 4 fixed top-level sections
- 1 shared rendering engine
- 0 external dependencies

> Block quotes render as a pulled-aside note. Use them for a single emphasized point, such as a quotation from a user interview.

## 2. Status tokens

Bracketed all-caps tokens become colored status labels: [DONE], [FIXED], [VERIFIED], [PENDING], [BROKEN]. Use them inline to mark the state of a requirement or a task without breaking the sentence.

## 3. Lists and code

Ordered and nested lists work as in ordinary Markdown:

1. Interview three users.
2. Sketch two layouts.
   - A single column for phones
   - A sidebar for wide screens
3. Build the prototype.

Fenced code blocks keep their indentation and are never interpreted as Markdown:

\`\`\`javascript
function area(w, h) {
  return w * h;
}
\`\`\`

## 4. Math

Inline math such as $E = mc^2$ and display math

$$
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
$$

are typeset with MathJax when the reader is online. A document without math makes no network request.

## 5. Links and images

Standard Markdown links and images work inline. A link: [renickbell.net](https://renickbell.net). An inline image uses \`![alt](src)\` and renders as an \`<img>\` (the src can be a path, a URL, or a data URI):

This line in the Markdown:

\`\`\`markdown
![A yellow flower](images/yellow-flower.jpg)
\`\`\`

renders as:

![A yellow flower](images/yellow-flower.jpg)

# Lesson

A living example is the best documentation for a small format: the reader edits it, sees the effect immediately, and keeps the parts they need. Write the abstract last, after the design has settled, and keep it to the three sentences a busy reader will actually read.
`;

// Default starter assets embedded as high quality SVGs converted to Data URLs
export const DEFAULT_ASSETS: ProjectAsset[] = [
  {
    id: 'markdown-love-manga',
    name: 'markdown-love-manga_261102.png',
    path: 'images/markdown-love-manga_261102.png',
    dataUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420">
        <defs>
          <pattern id="halftone" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#e2e8f0"/>
          </pattern>
        </defs>
        <rect width="800" height="420" fill="#ffffff" stroke="#111111" stroke-width="4"/>
        <rect x="15" y="15" width="770" height="390" fill="url(#halftone)"/>

        <!-- Manga panels layout -->
        <g transform="translate(30, 30)">
          <!-- Left Panel -->
          <rect x="0" y="0" width="350" height="360" fill="#ffffff" stroke="#111111" stroke-width="3"/>
          <line x1="0" y1="200" x2="350" y2="200" stroke="#111111" stroke-width="2"/>
          
          <!-- Speed lines background in top left -->
          <line x1="0" y1="0" x2="175" y2="100" stroke="#cbd5e1" stroke-width="1.5"/>
          <line x1="350" y1="0" x2="175" y2="100" stroke="#cbd5e1" stroke-width="1.5"/>
          <line x1="0" y1="200" x2="175" y2="100" stroke="#cbd5e1" stroke-width="1.5"/>
          <line x1="350" y1="200" x2="175" y2="100" stroke="#cbd5e1" stroke-width="1.5"/>
          
          <rect x="30" y="40" width="290" height="110" rx="8" fill="#111111"/>
          <text x="175" y="85" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">I LOVE MARKDOWN!!</text>
          <text x="175" y="125" font-family="monospace" font-size="14" fill="#38bdf8" text-anchor="middle"># NO MORE WORD CRASHES</text>

          <g transform="translate(25, 230)">
            <text x="0" y="25" font-family="monospace" font-size="13" font-weight="bold" fill="#111111">---</text>
            <text x="0" y="45" font-family="monospace" font-size="13" fill="#0284c7">title: "Design Document"</text>
            <text x="0" y="65" font-family="monospace" font-size="13" fill="#059669">abstract: "Clean and pure."</text>
            <text x="0" y="85" font-family="monospace" font-size="13" font-weight="bold" fill="#111111">---</text>
            <text x="0" y="110" font-family="sans-serif" font-size="12" fill="#64748b">Instant reactive rendering.</text>
          </g>

          <!-- Right Large Panel -->
          <rect x="370" y="0" width="370" height="360" fill="#ffffff" stroke="#111111" stroke-width="3"/>
          <circle cx="555" cy="140" r="85" fill="#f8fafc" stroke="#111111" stroke-width="2.5"/>
          <!-- Manga eye / expression motif -->
          <path d="M 500 130 Q 530 110 550 130" stroke="#111111" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M 560 130 Q 580 110 610 130" stroke="#111111" stroke-width="4" fill="none" stroke-linecap="round"/>
          <polygon points="555,145 550,158 560,158" fill="#111111"/>
          <path d="M 525 175 Q 555 200 585 175" stroke="#111111" stroke-width="3" fill="none"/>
          
          <!-- Dialogue bubble -->
          <path d="M 430 250 Q 390 250 390 280 Q 390 310 440 310 L 430 335 L 470 310 Q 550 310 550 280 Q 550 250 430 250" fill="#111111"/>
          <text x="470" y="278" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">"What you preview is</text>
          <text x="470" y="296" font-family="sans-serif" font-size="13" font-weight="bold" fill="#38bdf8" text-anchor="middle">exactly what gets saved!"</text>
        </g>
      </svg>
    `),
    size: 3200,
    type: 'image/svg+xml',
    addedAt: Date.now()
  },
  {
    id: 'yellow-flower',
    name: 'yellow-flower.jpg',
    path: 'images/yellow-flower.jpg',
    dataUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="600" height="400" fill="#fefce8" stroke="#fef08a" stroke-width="2"/>
        <g transform="translate(300, 200)">
          <!-- Stem and leaves -->
          <path d="M 0 50 Q 20 120 -10 180" stroke="#15803d" stroke-width="12" fill="none" stroke-linecap="round"/>
          <path d="M -5 100 Q -60 90 -80 130 Q -30 140 -5 110" fill="#22c55e" stroke="#166534" stroke-width="2"/>
          <path d="M 10 120 Q 60 110 85 150 Q 40 160 10 130" fill="#22c55e" stroke="#166534" stroke-width="2"/>
          
          <!-- Petals (12 radiating petals) -->
          <g>
            <ellipse cx="0" cy="-80" rx="22" ry="55" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <ellipse cx="40" cy="-69" rx="22" ry="55" transform="rotate(30 40 -69)" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <ellipse cx="69" cy="-40" rx="22" ry="55" transform="rotate(60 69 -40)" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <ellipse cx="80" cy="0" rx="22" ry="55" transform="rotate(90 80 0)" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <ellipse cx="69" cy="40" rx="22" ry="55" transform="rotate(120 69 40)" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <ellipse cx="40" cy="69" rx="22" ry="55" transform="rotate(150 40 69)" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <ellipse cx="0" cy="80" rx="22" ry="55" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <ellipse cx="-40" cy="69" rx="22" ry="55" transform="rotate(210 -40 69)" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <ellipse cx="-69" cy="40" rx="22" ry="55" transform="rotate(240 -69 40)" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <ellipse cx="-80" cy="0" rx="22" ry="55" transform="rotate(270 -80 0)" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <ellipse cx="-69" cy="-40" rx="22" ry="55" transform="rotate(300 -69 -40)" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
            <ellipse cx="-40" cy="-69" rx="22" ry="55" transform="rotate(330 -40 -69)" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
          </g>

          <!-- Center Flower Disc -->
          <circle cx="0" cy="0" r="45" fill="#713f12" stroke="#451a03" stroke-width="3"/>
          <circle cx="0" cy="0" r="38" fill="#854d0e"/>
          <circle cx="-10" cy="-8" r="5" fill="#a16207"/>
          <circle cx="12" cy="10" r="6" fill="#a16207"/>
          <circle cx="8" cy="-14" r="5" fill="#a16207"/>
          <circle cx="-14" cy="12" r="5" fill="#a16207"/>
        </g>
        <text x="30" y="375" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#854d0e">Figure: Yellow Flower Specimen</text>
      </svg>
    `),
    size: 2600,
    type: 'image/svg+xml',
    addedAt: Date.now()
  },
  {
    id: 'moodboard-preview',
    name: 'moodboard-preview.svg',
    path: 'images/moodboard-preview.svg',
    dataUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="380" viewBox="0 0 800 380">
        <rect width="800" height="380" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
        <text x="30" y="45" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#0f172a">MOODBOARD // CURATED VISUAL ESSENCE</text>
        <text x="30" y="70" font-family="system-ui, sans-serif" font-size="13" fill="#64748b">Modern Technical Aesthetics, Balanced Typography &amp; Functional UI</text>
        <g transform="translate(30, 95)">
          <rect width="220" height="240" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect width="220" height="120" fill="#0f172a" rx="6 6 0 0"/>
          <text x="20" y="65" font-family="monospace" font-size="28" font-weight="700" fill="#ffffff">Aa 24</text>
          <text x="20" y="95" font-family="monospace" font-size="11" fill="#94a3b8">Fira Code &amp; Inter</text>
          <text x="20" y="150" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#1e293b">Typography Hierarchy</text>
          <text x="20" y="175" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">High legibility mono-type combined with geometric sans-serif.</text>
        </g>
        <g transform="translate(285, 95)">
          <rect width="220" height="240" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="1.5"/>
          <g>
            <rect x="15" y="15" width="40" height="85" fill="#0f172a" rx="4"/>
            <rect x="65" y="15" width="40" height="85" fill="#2563eb" rx="4"/>
            <rect x="115" y="15" width="40" height="85" fill="#10b981" rx="4"/>
            <rect x="165" y="15" width="40" height="85" fill="#f1f5f9" stroke="#cbd5e1" rx="4"/>
          </g>
          <text x="20" y="150" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#1e293b">Chromatic Identity</text>
          <text x="20" y="175" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Deep slate foundations with vibrant cobalt and green confirmation badges.</text>
        </g>
        <g transform="translate(540, 95)">
          <rect width="230" height="240" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect x="20" y="20" width="190" height="18" fill="#e2e8f0" rx="3"/>
          <rect x="20" y="48" width="80" height="12" fill="#3b82f6" rx="3"/>
          <rect x="20" y="70" width="190" height="8" fill="#f1f5f9" rx="2"/>
          <rect x="20" y="85" width="160" height="8" fill="#f1f5f9" rx="2"/>
          <rect x="20" y="100" width="140" height="8" fill="#f1f5f9" rx="2"/>
          <text x="20" y="150" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#1e293b">Clean Structural Grid</text>
          <text x="20" y="175" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Sticky metadata bar, dual pane live inspection, responsive table of contents.</text>
        </g>
      </svg>
    `),
    size: 2400,
    type: 'image/svg+xml',
    addedAt: Date.now()
  },
  {
    id: 'graphic-reference',
    name: 'graphic-reference.svg',
    path: 'images/graphic-reference.svg',
    dataUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="300" viewBox="0 0 800 300">
        <rect width="800" height="300" fill="#0f172a" rx="8"/>
        <text x="35" y="45" font-family="monospace" font-size="14" fill="#38bdf8">FIG 1.1 // SYSTEM PIPELINE ARCHITECTURE</text>
        <line x1="35" y1="65" x2="765" y2="65" stroke="#334155" stroke-width="1"/>
        <rect x="35" y="90" width="200" height="140" fill="#1e293b" rx="6" stroke="#475569" stroke-width="1.5"/>
        <text x="55" y="120" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#f8fafc">1. YAML Frontmatter</text>
        <text x="55" y="145" font-family="monospace" font-size="11" fill="#94a3b8">title, subtitle, name,</text>
        <text x="55" y="165" font-family="monospace" font-size="11" fill="#94a3b8">student_number, abstract</text>
        <text x="55" y="195" font-family="system-ui, sans-serif" font-size="10" fill="#38bdf8">&gt; Parsed &amp; Verified</text>
        <path d="M 245 160 L 295 160" stroke="#64748b" stroke-width="2"/>
        <rect x="300" y="90" width="200" height="140" fill="#1e293b" rx="6" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="320" y="120" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#f8fafc">2. Reactive Engine</text>
        <text x="320" y="145" font-family="monospace" font-size="11" fill="#94a3b8">Markdown &amp; HTML</text>
        <text x="320" y="165" font-family="monospace" font-size="11" fill="#94a3b8">Asset Link Resolver</text>
        <text x="320" y="195" font-family="system-ui, sans-serif" font-size="10" fill="#3b82f6">&gt; Live Preview Sync</text>
        <path d="M 510 160 L 560 160" stroke="#64748b" stroke-width="2"/>
        <rect x="565" y="90" width="200" height="140" fill="#1e293b" rx="6" stroke="#10b981" stroke-width="1.5"/>
        <text x="585" y="120" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#f8fafc">3. Standalone ZIP</text>
        <text x="585" y="145" font-family="monospace" font-size="11" fill="#94a3b8">report-001.html</text>
        <text x="585" y="165" font-family="monospace" font-size="11" fill="#94a3b8">report.md + images/</text>
        <text x="585" y="195" font-family="system-ui, sans-serif" font-size="10" fill="#10b981">&gt; 100% Portable Submission</text>
        <text x="35" y="270" font-family="monospace" font-size="11" fill="#64748b">STATUS: COMPILED // SPECIFICATION COMPLIANT // TESTS_TOTAL: 3 (PASS)</text>
      </svg>
    `),
    size: 3100,
    type: 'image/svg+xml',
    addedAt: Date.now()
  }
];
