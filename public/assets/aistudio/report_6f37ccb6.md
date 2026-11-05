---
title: "Example Report: The Markdown Dialect"
date: 2026-07-12 14:32:00
project: html-report-generator
project_dir: /home/you/projects/your-project
report_number: 1
subject: "A worked example showing every block the generator understands."
operator: "A Great Student"
follows: report-000
tldr: "This is a live example. Edit the Markdown on the left and the report regenerates on the right. The frontmatter block carries the metadata (title, date, project, and so on); the body uses a small, fixed set of headings. Everything you see here, the sticky header, the contents sidebar, the typed blocks, comes from the same engine the command-line tool uses, so what you preview is exactly what gets saved."
tests_total: 3
qa_verdict: PASS
---

# Prompt

Show me, in one file, every kind of block this report generator supports, so I can copy the shapes I need.

# Content

## 1. Frontmatter and structure

![A manga panel about loving Markdown](images/markdown-love-manga_261102.png)

The file opens with a YAML frontmatter block between `---` fences. It carries `title`, `date`, `project`, `project_dir`, `report_number`, `subject`, `operator`, `follows`, `tldr`, `tests_total`, and `qa_verdict`. Below the frontmatter, top-level `#` headings name the fixed sections: `Prompt`, `Content`, `Files Touched`, `Files Not Touched`, `Tests`, `QA`, and `Lesson`.

Inside `Content`, a `## N. Name` heading opens a numbered section, and typed `###` blocks add structure. Inline formatting is familiar: **bold**, *italic*, and `inline code` all work, and a double hyphen becomes an em-dash at render time.

### Phase: Typed blocks

A `### Phase:` block is rendered as a titled panel, good for a step in a sequence or a stage of work. There are matching `### Slide:` blocks for callouts.

### Bug: A structured defect record

- **symptom**: the thing the user saw go wrong
- **root_cause**: the underlying reason it happened
- **fix**: what was changed to correct it
- **rationale**: why that fix is the right one

### Table: A comparison

| Block | Written as | Renders as |
| --- | --- | --- |
| Numbered section | `## 1. Name` | an `<h2>` in the sidebar |
| Phase | `### Phase: Title` | a titled panel |
| Bug | `### Bug: Title` | a definition list |
| Metrics | `### Metrics` | a row of badges |

### Metrics

- 7 recognized section types
- 1 shared rendering engine
- 0 external dependencies

> Block quotes render as a pulled-aside note. Use them for a single emphasized point.

## 2. Status tokens

Bracketed all-caps tokens become colored status labels: [DONE], [FIXED], [VERIFIED], [PENDING], [BROKEN]. Use them inline to mark state without breaking the sentence.

## 3. Links and images

Standard Markdown links and images work inline. A link: [renickbell.net](https://renickbell.net). An inline image uses `![alt](src)` and renders as an `<img>` (the src can be a path, a URL, or a data URI):

This line in the Markdown:

```markdown
![A yellow flower](images/yellow-flower.jpg)
```

renders as:

![A yellow flower](images/yellow-flower.jpg)

# Files Touched

- `report-core.js` -- the shared engine
- `index.html` -- this interface

# Files Not Touched

- `report-template.latex` -- the PDF path is unchanged

# Tests

- Rendered this example and confirmed all block types appear
- Confirmed the sidebar lists every section in order
- Confirmed the saved HTML matches the command-line output

# QA

- Every documented block type is exercised above
- The preview matches what Save writes to disk
- No external network or dependency is required

This example doubles as a test: if every block above renders correctly, the engine is working. Verdict PASS.

# Lesson

A living example is the best documentation for a small format: the reader edits it, sees the effect immediately, and keeps the parts they need. Because the interface and the command-line tool share one engine, this preview is a faithful proof, not an approximation.
