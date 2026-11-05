export const USER_EMBEDDED_CSS = `/* Roboto is embedded by the renderer from report-fonts.css (generated from
   fonts/ by build-assets.js), so reports need no network to show it. */

/* ------------------------------------------------------------------
   Report stylesheet: minimalist, high data-ink ratio.

   Following Tufte: erase non-data ink. Almost no boxes or fills; a
   short gray ramp; whitespace and type weight do the work that
   borders and shading used to. White page, centered ~820px reading
   column, fixed TOC in the left gutter, NO box-shadow.

   Gray ramp (the whole palette):
     #222  primary text / headings
     #444  secondary headings, de-emphasised body
     #666  meta, captions, TOC links
     #ccc  structural rule (header underline, table header, change-bars)
     #eee  hairline (table row separators, faint dividers)
     #f5f5f5  the one subtle fill (inline code / pre)
     #fff  page
   Color is reserved for status, where it encodes meaning.
   ------------------------------------------------------------------ */

/* --header-h approximates the sticky header's height (project eyebrow +
   title + meta line, plus an optional working-directory line). Drives the
   anchor-jump offset and the TOC's top inset. The 130px here is a static
   fallback only: a small inline script (see just before </body>) measures the
   real header at runtime and overrides this with the header's actual height,
   so wrapped titles or the optional working-directory line stay accounted for. */
:root {
    --header-h: 130px;
    /* Type scale: five sizes, each step recognizably distinct (~1.2 ratio).
       Every element maps to one of these; nothing sits between them. Roles:
       small = meta/caption/eyebrow/TOC/code/tables/labels/status;
       body  = copy, list items, definitions, and h4 (weight, not size, sets
       h4 apart). h4 deliberately shares the body size to avoid a near-duplicate. */
    --fs-small: 12px;
    --fs-body:  14px;
    --fs-h3:    17px;
    --fs-h2:    20px;
    --fs-h1:    24px;
}

html {
    scroll-behavior: smooth;
    scroll-padding-top: var(--header-h);
}

body {
    font-family: "Roboto", sans-serif;
    background-color: #fff;
    color: #222;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    /* override max-width that pandoc/other generators may inject on body */
    max-width: none;
}

/* ---- Full-width sticky header: title + a single meta line ---- */
.header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: #fff;
    border-bottom: 1px solid #ccc;
    padding: 16px;
}
/* Project name: small eyebrow/kicker above the title. */
.header-project {
    margin: 0 0 2px;
    color: #666;
    font-size: var(--fs-small);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1.5px;
}
.header-title {
    /* reset the default h1 styling; this h1 lives in the header bar */
    margin: 0 0 4px;
    padding: 0;
    border: none;
    color: #222;
    font-size: var(--fs-h1);
    font-weight: 700;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.header .meta { margin: 0; }
/* Optional project working directory, under the meta line. */
.header-cwd {
    margin: 2px 0 0;
    color: #666;
    font-size: var(--fs-small);
}
.header-cwd code {
    background: none;
    padding: 0;
    font-size: var(--fs-small);
    color: #666;
}

/* ---- Table of contents: fixed in the left gutter ---- */
.toc {
    position: fixed;
    top: var(--header-h);
    left: 0;
    width: 220px;
    height: calc(100vh - var(--header-h));
    overflow-y: auto;
    box-sizing: border-box;
    padding: 20px 0;
    font-size: var(--fs-small);
}
.toc-title {
    color: #222;
    font-weight: 700;
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 0 16px 8px;
}
.toc a {
    display: block;
    padding: 3px 16px;
    color: #666;
    text-decoration: none;
}
.toc a:hover { color: #222; text-decoration: underline; }

/* Operator / Follows pinned to the bottom of the TOC, under a rule. */
.toc-rule {
    border: none;
    border-top: 1px solid #eee;
    margin: 14px 16px;
}
.toc-meta {
    padding: 0 16px;
    color: #666;
    font-size: var(--fs-small);
    line-height: 1.7;
}

/* The fixed TOC only fits when the gutter beside the 820px column is
   wide enough. Below that, hide it and read top-to-bottom. */
@media (max-width: 1280px) {
    .toc { display: none; }
}

/* ---- Reading column ---- */
.container {
    max-width: 820px;
    /* horizontal gutter so the column never touches the viewport edge */
    width: calc(100% - 2 * clamp(16px, 3vw, 40px));
    margin: clamp(16px, 3vw, 40px) auto 64px;
    box-sizing: border-box;
}

/* ---- Headings: size and weight, not rules ---- */
h1 {
    color: #222;
    font-size: var(--fs-h1);
    font-weight: 700;
    text-transform: uppercase;
    margin: 24px 0 12px;
}
h2 {
    color: #222;
    font-size: var(--fs-h2);
    font-weight: 700;
    margin: 36px 0 10px;
}
h3 {
    color: #444;
    font-size: var(--fs-h3);
    font-weight: 500;
    margin: 20px 0 8px;
}
h4 { color: #666; font-size: var(--fs-body); margin: 16px 0 6px; }

/* ---- Body copy ---- */
p, li { font-size: var(--fs-body); }
ul, ol { padding-left: 20px; }
ul { list-style-type: disc; }
li { margin-bottom: 4px; }
a { color: #222; text-decoration: underline; text-decoration-color: #bbb; }
a:hover { text-decoration-color: #222; }

/* ---- Meta lines (header + footer) ---- */
.meta {
    font-size: var(--fs-small);
    color: #666;
    font-weight: 300;
    line-height: 1.5;
}

/* ---- Code: the one subtle fill ---- */
code {
    background-color: #f5f5f5;
    padding: 1px 4px;
    font-size: var(--fs-small);
    font-family: "Courier New", Courier, monospace;
}
pre {
    background-color: #f5f5f5;
    padding: 12px 14px;
    margin: 12px 0;
    font-size: var(--fs-small);
    overflow-x: auto;
    font-family: "Courier New", Courier, monospace;
    white-space: pre-wrap;
    word-wrap: break-word;
}
pre code { background: none; padding: 0; }

/* ---- Tables: horizontal rules only, no fills, no vertical lines ---- */
table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: var(--fs-body);
}
th, td {
    padding: 6px 10px;
    text-align: left;
    vertical-align: top;
    border: none;
}
thead th,
tr:first-child th {
    border-bottom: 1px solid #ccc;
    font-weight: 600;
}
td { border-bottom: 1px solid #eee; }

/* ---- Images: no frame ---- */
img { max-width: 100%; margin: 12px 0; }
.img-row { display: flex; flex-wrap: wrap; gap: 12px; margin: 16px 0; }
.img-row img { flex: 1 1 200px; min-width: 0; max-width: 100%; margin: 0; }

/* ==================================================================
   Semantic blocks. No boxes or fills. A few keep a single light
   left "change-bar" where the block is an inserted artifact worth
   setting apart; the rest rely on their heading and on whitespace.
   ================================================================== */

/* Quote, fix record, lesson, sync-lock: a thin left rule, nothing more. */
.userquote,
.bug,
.lessons,
.sync-lock {
    border: none;
    background: none;
    margin: 16px 0;
    padding: 2px 0 2px 16px;
    border-left: 2px solid #ccc;
}
.userquote { font-style: italic; color: #444; }
.sync-lock { font-weight: 600; }

/* Prompt: plain container; the inner <pre> carries the subtle fill. */
.prompt-box,
.prompt {
    border: none;
    background: none;
    margin: 16px 0;
    padding: 0;
    font-size: var(--fs-small);
}

/* TL;DR / QA highlight and phase steps: no box; the heading labels them. */
.slide,
.phase {
    border: none;
    background: none;
    margin: 12px 0;
    padding: 0;
}
.slide h3,
.phase h3 { margin-top: 0; }

/* Bug / fix record. */
.bug h3 { margin-top: 0; color: #222; }
.bug dl { margin: 6px 0 0; }
.bug dt { font-weight: 600; color: #444; margin-top: 6px; font-size: var(--fs-body); }
.bug dd { margin: 2px 0 0 16px; color: #222; font-size: var(--fs-body); }

/* Inline metric: monospace, no box. */
.metric {
    font-family: "Courier New", Courier, monospace;
    font-size: var(--fs-small);
    color: #444;
    margin-right: 14px;
    white-space: nowrap;
}

/* File list: a plain list; paths come through as <code>. */
.file-list { margin: 12px 0; }
.file-list ul { margin: 0; }
.file-list li { margin: 2px 0; font-size: var(--fs-small); }

/* Tier label: small caps, no pill. */
.tier {
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #666;
    font-weight: 500;
}

/* Status: color carries the meaning; no border, no fill. */
.status {
    font-size: var(--fs-small);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.status.verified,
.status.done,
.status.fixed       { color: #2e7d32; }
.status.incorrect,
.status.broken      { color: #c62828; }
.status.unverified,
.status.pending     { color: #946c00; }

/* Footer: a single light rule above a muted meta line. */
.footer {
    margin-top: 40px;
    border-top: 1px solid #eee;
    padding-top: 10px;
    font-size: var(--fs-small);
    color: #666;
    font-weight: 300;
}

/* ---- Narrow viewport ---- */
@media (max-width: 480px) {
    /* Shrink the top of the scale on narrow viewports; body/small stay put. */
    :root { --fs-h1: 20px; --fs-h2: 18px; }
    h2 { margin-top: 24px; }
    th, td { padding: 4px 6px; }
}
`;
