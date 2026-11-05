import { ProjectAsset } from '../types';

export const INITIAL_MARKDOWN = `---
title: "Assignment 1"
date: 2026-07-12 14:32:00
project: Design Document
project_dir: /home/you/projects/your-project
report_number: 1
subject: "Design document of Assignment"
operator: "A Great Student"
follows: report-000
tldr: "This is a live example. Edit the Markdown on the left and the report regenerates on the right. The frontmatter block carries the metadata (title, date, project, and so on); the body uses a small, fixed set of headings. Everything you see here, the sticky header, the contents sidebar, the typed blocks, comes from the same engine the command-line tool uses, so what you preview is exactly what gets saved."
tests_total: 3
---

# Prompt

Create a comprehensive design document for Assignment 1 with full technical and aesthetic specifications.

# Content

## 1. Abstract

This design document outlines the comprehensive creative and technical framework for **Assignment 1**. It covers the entire development lifecycle, bridging conceptual inquiry, user empathy, interactive design paradigms, and verifiable software implementations. 

The primary objective is to deliver a cohesive interactive system that balances rigorous communication standards with intuitive student engagement.

## 2. Problem Definition

Traditional design documentation frequently suffers from fragmentation between design mockups, written rationales, and programmatic deliverables:

- **Information Silos:** Design artifacts remain separated from the living codebase.
- **Evaluation Friction:** Reviewers and QA testers lack a unified timeline of iterations and verification metrics.
- **Cognitive Load:** Context-switching between markdown notes, graphic exports, and sound assets delays consensus.

### Phase: Target Objectives
- Provide a single source of truth containing technical metadata, visual guidelines, and interactive proofs.
- Establish transparent iteration checkpoints with test verdicts.
- Facilitate modular asset packaging for portable submission.

## 3. Target Audience Insights

The design is engineered primarily for academic reviewers, design peers, and software collaborators:

| Persona | Primary Goal | Pain Points | Desired Outcome |
| :--- | :--- | :--- | :--- |
| **Course Assessor** | Fast rubric evaluation & verification | Hunting across multiple folders for assets | Unified sticky metadata, QA badge & clear sections |
| **Peer Reviewer** | Understanding design rationale & aesthetic decisions | Missing moodboard context & color tokens | Inline visual swatches & structured ideation logs |
| **Developer Partner**| Implementing interactive components | Unclear asset dimensions and code logic | Clean markdown architecture with syntax blocks |

### Metrics
- 3 key collaborator personas supported
- 0 fragmented asset folders
- 100% portable single-archive bundle

## 4. Ideation

During the discovery phase, three distinct design approaches were investigated:

1. **Option A: Monolithic PDF Report**
   - *Pros:* Fixed print formatting.
   - *Cons:* Inflexible on mobile, cannot embed playable audio or interactive code easily.
2. **Option B: Multi-page Static Site**
   - *Pros:* High modularity.
   - *Cons:* Complex overhead for single-milestone assignments.
3. **Option C: Unified Living Design Document (Selected)**
   - *Pros:* Markdown-first authoring, reactive HTML preview, portable single-archive export with inline media.
   - *Cons:* Requires disciplined section hierarchy.

> **Selected Direction:** Option C combines the lightweight portability of Markdown with the rich visual power of a standalone HTML report.

## 5. Moodboard

The visual atmosphere draws inspiration from clean Swiss typography, technical drafting blueprints, and minimalist laboratory instruments.

![Design Studio Moodboard](images/moodboard-preview.svg)

### Aesthetic Pillars
- **Technical Rigor:** Crisp geometric borders, subtle monospace accents, and high-contrast typography.
- **Warm Functionality:** Neutral slate surfaces with deliberate signal accents (Emerald for PASS, Indigo for Primary).
- **Spatial Rhythm:** Generous breathing room between analytical sections.

## 6. Style Guide

### Color Palette

| Token | Hex Value | Usage | Sample |
| :--- | :--- | :--- | :--- |
| \`--surface-primary\` | \`#0f172a\` | Sticky Header & Deep Accents | \`Deep Slate\` |
| \`--brand-accent\` | \`#3b82f6\` | Hyperlinks, Focus States | \`Cobalt Blue\` |
| \`--verdict-pass\` | \`#10b981\` | QA Badges & Success Verifications | \`Emerald 500\` |
| \`--text-body\` | \`#334155\` | Primary Reading Body Copy | \`Slate 700\` |
| \`--border-subtle\` | \`#e2e8f0\` | Table Dividers & Cards | \`Slate 200\` |

### Typography Scale
- **Document Title / H1:** Inter Display / Semi-Bold 24pt
- **Section Headings / H2:** Inter / Medium 18pt (Numbered Prefix)
- **Sub-headings / H3:** Inter / Medium 14pt
- **Body Text:** Inter / Regular 11pt, 1.6 line height
- **Code & Metadata:** Fira Code / Mono 10pt

## 7. Iterations

### Phase: Sprint 1 — Architecture & Structural Wireframes
- Drafted initial frontmatter schema: \`project\`, \`report_number\`, \`qa_verdict\`.
- Tested baseline Markdown parsing performance.

### Phase: Sprint 2 — Visual Styling & Asset Resolution
- Integrated sticky technical header with responsive metadata badges.
- Embedded local \`images/\` relative path resolution for seamless offline viewing.

### Phase: Sprint 3 — Verification & Packaging
- Validated ZIP packaging containing \`report.md\`, self-contained \`index.html\`, and \`images/\`.
- Confirmed QA pass with 3 total automated test runs. [DONE]

## 8. Code Explanation

The document generation engine parses the YAML frontmatter block into a typed descriptor and pipes the body through a GitHub-Flavored Markdown renderer with asset rewriting:

\`\`\`typescript
interface Frontmatter {
  title: string;
  project: string;
  report_number: number;
  qa_verdict: 'PASS' | 'FAIL' | 'PENDING';
  tests_total: number;
}

// Rewrites local images/ relative paths to bundled assets
function resolveImagePath(src: string, assets: Map<string, string>): string {
  if (src.startsWith('images/')) {
    const filename = src.replace('images/', '');
    return assets.get(filename) || src;
  }
  return src;
}
\`\`\`

All assets in \`images/\` are bundled alongside the markdown file during export, ensuring cross-platform reproducibility without broken remote URLs.

## 9. Graphic references

Below are the primary graphic references and structural diagrams employed in the design:

![System Architecture Reference](images/graphic-reference.svg)

1. **Figure 1.1:** *Studio Layout & Compositional Grid* — 12-column responsive layout with 320px sticky navigation rail.
2. **Figure 1.2:** *Type Specimen Sheet* — Contrast ratios verified at 7.2:1 (WCAG AAA compliant).
3. **Figure 1.3:** *Component Blueprint* — Visual specification for status pills and metadata chips.

## 10. Sound references

Interactive auditory cues provide subtle tactile feedback without distracting from documentation readability:

- **Track 01:** *Subtle Keystroke & Document Save Cue* (48kHz Stereo, 120ms duration)
  - Purpose: Confirms asynchronous auto-save state.
- **Track 02:** *Verification Success Chime* (Sine Wave Harmonics C5-G5, 300ms decay)
  - Purpose: Triggered upon successful QA test validation.
- **Track 03:** *Export Complete Notification* (Warm Bell, 400ms duration)
  - Purpose: Alerts user that \`.zip\` archive has downloaded.

> **Audio Implementation Note:** In web implementations, sound elements are triggered via standard Web Audio API oscillators to avoid external audio dependency bottlenecks.

# Files Touched

- \`report.md\` -- primary markdown living specification
- \`index.html\` -- compiled standalone HTML report
- \`images/\` -- local asset directory

# Files Not Touched

- \`report-template.latex\` -- preserved for print PDF generation

# Tests

- Rendered document preview and confirmed all headings and images appear
- Confirmed TOC sidebar lists every section in order
- Confirmed saved Markdown and HTML match upstream CLI expectations

# QA

- Frontmatter adheres strictly to the upstream report schema [VERIFIED]
- Top-level fixed sections (# Prompt, # Content, # Files Touched, etc.) aligned [VERIFIED]

Verdict: [PASS]

# Lesson

Structuring design documentation within the exact schema expected by the report engine guarantees seamless round-trips: author in Simple DesDoc, test in the CLI report tool, and share anywhere with zero formatting friction.
`;

// Default starter assets embedded as high quality SVGs converted to Data URLs
export const DEFAULT_ASSETS: ProjectAsset[] = [
  {
    id: 'moodboard-preview',
    name: 'moodboard-preview.svg',
    path: 'images/moodboard-preview.svg',
    dataUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="380" viewBox="0 0 800 380">
        <rect width="800" height="380" fill="#f8fafc" rx="8" stroke="#cbd5e1" stroke-width="2"/>
        <text x="30" y="45" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#0f172a">MOODBOARD // CURATED VISUAL ESSENCE</text>
        <text x="30" y="70" font-family="system-ui, sans-serif" font-size="13" fill="#64748b">Modern Technical Aesthetics, Balanced Typography &amp; Functional UI</text>
        
        <!-- Grid Items -->
        <g transform="translate(30, 95)">
          <!-- Box 1: Typography -->
          <rect width="220" height="240" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="1.5"/>
          <rect width="220" height="120" fill="#0f172a" rx="6 6 0 0"/>
          <text x="20" y="65" font-family="monospace" font-size="28" font-weight="700" fill="#ffffff">Aa 24</text>
          <text x="20" y="95" font-family="monospace" font-size="11" fill="#94a3b8">Fira Code &amp; Inter</text>
          <text x="20" y="150" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#1e293b">Typography Hierarchy</text>
          <text x="20" y="175" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">High legibility mono-type combined with geometric sans-serif.</text>
        </g>
        
        <g transform="translate(285, 95)">
          <!-- Box 2: Palette -->
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
          <!-- Box 3: Minimal Layout -->
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
        
        <!-- Node 1 -->
        <rect x="35" y="90" width="200" height="140" fill="#1e293b" rx="6" stroke="#475569" stroke-width="1.5"/>
        <text x="55" y="120" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#f8fafc">1. YAML Frontmatter</text>
        <text x="55" y="145" font-family="monospace" font-size="11" fill="#94a3b8">title, date, project,</text>
        <text x="55" y="165" font-family="monospace" font-size="11" fill="#94a3b8">report_number, tldr</text>
        <text x="55" y="195" font-family="system-ui, sans-serif" font-size="10" fill="#38bdf8">&gt; Parsed &amp; Verified</text>
        
        <!-- Arrow 1 -->
        <path d="M 245 160 L 295 160" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
        
        <!-- Node 2 -->
        <rect x="300" y="90" width="200" height="140" fill="#1e293b" rx="6" stroke="#3b82f6" stroke-width="1.5"/>
        <text x="320" y="120" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#f8fafc">2. Reactive Engine</text>
        <text x="320" y="145" font-family="monospace" font-size="11" fill="#94a3b8">Markdown &amp; HTML</text>
        <text x="320" y="165" font-family="monospace" font-size="11" fill="#94a3b8">Asset Link Resolver</text>
        <text x="320" y="195" font-family="system-ui, sans-serif" font-size="10" fill="#3b82f6">&gt; Live Preview Sync</text>
        
        <!-- Arrow 2 -->
        <path d="M 510 160 L 560 160" stroke="#64748b" stroke-width="2"/>
        
        <!-- Node 3 -->
        <rect x="565" y="90" width="200" height="140" fill="#1e293b" rx="6" stroke="#10b981" stroke-width="1.5"/>
        <text x="585" y="120" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="#f8fafc">3. Standalone ZIP</text>
        <text x="585" y="145" font-family="monospace" font-size="11" fill="#94a3b8">index.html (styles)</text>
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
