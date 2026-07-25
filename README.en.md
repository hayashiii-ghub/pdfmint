# @hayashiii/pdfmint

An agent-friendly CLI that turns HTML or Markdown drafts into polished PDF deliverables with dependable Japanese typography.

```bash
npm install -g @hayashiii/pdfmint
pdfmint report.md report.pdf --font shippori --json
```

## Fonts

Four Japanese families are bundled locally and never fetched at runtime:

| ID | Family | Best for |
|---|---|---|
| `zen` | Zen Kaku Gothic New | Practical documents and tables (default) |
| `shippori` | Shippori Mincho | Formal reports and proposals |
| `kiwi` | Kiwi Maru | Friendly notices |
| `klee` | Klee One | Letters and soft one-page documents |

Font selection applies to Markdown. HTML keeps its own CSS.

## Usage

```bash
pdfmint <input.html|input.md> <output.pdf> [options]
```

Important options:

- `--font <zen|shippori|kiwi|klee>`
- `--css <file.css>` for Markdown overrides
- `--format <A4|A3|Letter|Legal>`
- `--margin <value>` and `--landscape`
- `--png <output.png>` with `--viewport` and `--scale`
- `--expect-pages <number>`
- `--json` for structured agent output

Markdown supports GFM, frontmatter titles, footnotes, GitHub callouts, syntax highlighting, and aligned tables.

Requires Node.js 22+. MIT licensed. Bundled fonts retain their SIL Open Font License 1.1 notices under `dist/fonts/`.
