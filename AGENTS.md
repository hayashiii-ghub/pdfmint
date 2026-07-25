# pdfmint — AI Agent Guide

## Purpose

`@hayashiii/pdfmint` turns one HTML or Markdown draft into a PDF deliverable. It is intentionally a single-file compiler, not a template manager, batch runner, archive, or document authoring agent.

## Command

```bash
pdfmint <input.html|input.md> <output.pdf> --json
```

Always pass `--json`. Parse `success`, `output`, `page_count`, optional `font` (Markdown), and optional `png` from stdout.

## Choose a font

Font selection applies to Markdown input:

| ID | Use when |
|---|---|
| `zen` | Practical documents, specs, tables, general use (default) |
| `shippori` | Formal reports, proposals, official documents |
| `kiwi` | Friendly notices and approachable material |
| `klee` | Letters and intentionally soft one-page documents |

```bash
pdfmint report.md report.pdf --font shippori --json
```

HTML owns its typography through its own CSS. For Markdown-specific design changes, use `--css <file.css>`; the file is layered over pdfmint's base document CSS.

## Quality checks

```bash
pdfmint sheet.md sheet.pdf \
  --font zen \
  --png sheet.png \
  --expect-pages 1 \
  --json
```

- Use `--expect-pages` when the intended page count is known.
- Use `--png` when the agent needs a visual preview.
- Report absolute PDF and PNG paths.
- Never claim visual quality from `success: true` alone; inspect the preview when layout matters.

## Input behavior

- `.html` / `.htm`: rendered directly; the HTML's CSS is authoritative.
- `.md` / `.markdown`: rendered with the selected bundled font and one common document stylesheet.
- Markdown supports GFM, frontmatter title, footnotes, GitHub callouts, syntax highlighting, and aligned tables.
- Prefer absolute paths or `data:` URLs for images and external assets.

## Recovery

| Code | Action |
|---|---|
| `INPUT_NOT_FOUND` | Check the input or CSS path |
| `UNSUPPORTED_INPUT` | Use HTML or Markdown |
| `INVALID_FONT` | Use `zen`, `shippori`, `kiwi`, or `klee` |
| `BROWSER_LAUNCH_FAILED` | Run the returned `next_command`, then retry the same conversion |
| `PAGE_LOAD_FAILED` | Check external images/fonts and simplify remote dependencies |
| `PAGE_COUNT_MISMATCH` | Fix page CSS or the expected count |
| `OUTPUT_NOT_WRITABLE` | Check output path permissions |

## Development verification

```bash
bun run typecheck
bun test
bun run build
bun run pack:smoke
```
