# pdfmint - AI Agent Guide

## What is pdfmint

`@hayashiii/pdfmint` is a CLI tool for converting HTML/Markdown files to PDF. It is designed to be invoked by AI agents (Claude Code, Codex, etc.) as part of a "generate HTML → produce PDF" workflow.

## When to use

- The user asks to convert a HTML or Markdown file to PDF
- The user generates a document via natural language (invoice, resume, contract) and wants it as PDF
- Multiple HTML files need batch conversion

## Quick Reference

```bash
pdfmint convert <input> <output>      # Single file (preferred)
pdfmint <input> <output>              # Same as convert (legacy alias)
pdfmint batch <glob> <out-dir>        # Batch (reuses one Chromium session)
pdfmint doctor                        # Environment diagnostics
pdfmint help                          # Help
pdfmint --version                     # Version
```

Troubleshooting: `docs/troubleshooting.md`  
Release / branch / tag policy: `docs/RELEASE.md`

Always pass `--json` when invoked by an agent for structured output.

## Input formats

- `.html` / `.htm` → rendered directly
- `.md` / `.markdown` → converted to HTML internally with default Japanese-friendly CSS, then to PDF
- Other extensions → error `UNSUPPORTED_INPUT`

## Markdown presets

Markdown input supports document presets and font overrides:

```bash
pdfmint memo.md memo.pdf --preset memo --json
pdfmint report.md report.pdf --preset report --json
pdfmint letter.md letter.pdf --preset letter --json
pdfmint report.md report.pdf --font serif --json
pdfmint report.md report.pdf --css report.css --json
```

- `--preset memo|report|letter` applies a simple Japanese document stylesheet.
- `--font sans` is the default and prioritizes Noto Sans JP (`letter` defaults to serif unless overridden).
- `--font serif` prioritizes Noto Serif JP for more formal reports.
- `--css <file.css>` replaces the preset/default Markdown CSS with a file.
- HTML input is not modified; set fonts in the HTML `<style>` block.

## Brand profile

A brand profile persists a consistent look (accent color, ink color, font, size, line-height, paper, margin) and applies it to every Markdown conversion automatically — no per-document flags needed.

```bash
# auto-discovered: ./pdfmint.brand.md (project) then ~/.config/pdfmint/brand.md (global)
pdfmint report.md report.pdf --preset report --json
pdfmint report.md report.pdf --brand ./client-a.brand.md --json   # explicit profile
pdfmint report.md report.pdf --no-brand --json                    # ignore profiles
```

`brand.md` is YAML-style frontmatter (flat `key: value`); unknown keys are ignored for forward-compat:

```markdown
---
accent: "#1B365D"      # heading rule / blockquote accent (CSS var --pm-accent)
ink: "#1a1a1a"         # body + heading text color (CSS var --pm-ink)
font: serif            # sans | serif (same as --font)
font_size: 10.5pt
line_height: 1.65
paper: A4              # A4 | A3 | Letter | Legal (same as --format)
margin: 18mm           # same as --margin
---
Free notes below the frontmatter are ignored by the renderer.
```

- Discovery order: `--brand <path>` > `./pdfmint.brand.md` > `~/.config/pdfmint/brand.md` (honors `XDG_CONFIG_HOME`).
- Precedence: explicit CLI flag (`--font`/`--format`/`--margin`) > brand token > built-in default.
- `accent`/`ink`/`font_size`/`line_height` apply via CSS custom properties on Markdown output; HTML input is not modified.
- `--json` always reports `"brand": { "source": <abs path|null>, "applied": <bool> }` so the agent can confirm which profile was used.
- Malformed frontmatter or invalid values → error `BRAND_INVALID` with a `hint`.

## Doctor

Run before first use or when Chromium fails:

```bash
pdfmint doctor --json
```

Returns structured checks for Node.js, Chromium launch, and a sample HTML→PDF conversion.

## PNG and page-count validation

Single-file conversion can also render a PNG from the same HTML/Markdown input:

```bash
pdfmint report.html report.pdf \
  --png report.png \
  --viewport 1055x1491 \
  --scale 3 \
  --expect-pages 1 \
  --json
```

- Use `--png <output.png>` to create a PNG alongside the PDF.
- Use `--viewport <width>x<height>` for the screenshot viewport.
- Use `--scale <number>` for high-resolution PNG output.
- Use `--expect-pages <number>` to fail when the generated PDF has an unexpected page count.
- `--png`, `--viewport`, and `--scale` are not supported for `batch` yet.

## Output (`--json`)

### Success (single)
```json
{
  "success": true,
  "input": "/abs/in.html",
  "output": "/abs/out.pdf",
  "format": "A4",
  "size_bytes": 12345,
  "page_count": 1,
  "duration_ms": 1000,
  "brand": { "source": "/abs/pdfmint.brand.md", "applied": true }
}
```

### Success (batch)
```json
{
  "success": true,
  "total": 10,
  "succeeded": 9,
  "failed": 1,
  "results": [{ "input": "...", "output": "...", "size_bytes": 1234, "duration_ms": 500 }],
  "errors": [{ "input": "...", "code": "PAGE_LOAD_FAILED", "message": "..." }]
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "INPUT_NOT_FOUND",
    "message": "...",
    "hint": "...",
    "input": "..."
  }
}
```

## Error codes

| Code | Recovery hint |
|---|---|
| `INPUT_NOT_FOUND` | Verify path; try `ls` to check |
| `INPUT_NOT_READABLE` | Check file permissions |
| `UNSUPPORTED_INPUT` | Use `.html`, `.htm`, `.md`, or `.markdown` |
| `OUTPUT_DIR_NOT_FOUND` | Rare after auto-create; check parent path permissions |
| `OUTPUT_NOT_WRITABLE` | Check directory permissions |
| `BROWSER_LAUNCH_FAILED` | Run `error.next_command` (usually `npx puppeteer browsers install chrome`), then `pdfmint doctor --json` |
| `INVALID_PRESET` | Use `--preset memo`, `report`, or `letter` |
| `PAGE_LOAD_FAILED` | Check HTML for broken external resources (fonts, images) |
| `PDF_GENERATION_FAILED` | Check output path / disk space |
| `PNG_GENERATION_FAILED` | Check viewport, scale, output path, and disk space |
| `INVALID_VIEWPORT` | Use `--viewport <width>x<height>` and positive numeric scale |
| `INVALID_FONT` | Use `--font sans` or `--font serif` |
| `BRAND_INVALID` | Fix brand.md frontmatter / token value per the `hint`, or pass `--no-brand` |
| `PAGE_COUNT_MISMATCH` | Fix print CSS or expected page count |
| `BATCH_NO_MATCHES` | Verify glob pattern; check files exist |

## Common tasks

### Generate invoice PDF
1. Write HTML with invoice content
2. Save to `invoice.html`
3. Run `pdfmint invoice.html invoice.pdf --json`
4. Parse the JSON to confirm success and report `output` path to the user

### Generate resume PDF from Markdown
1. Write Markdown
2. Save to `resume.md`
3. Run `pdfmint resume.md resume.pdf --json`

### Batch convert reports
1. Place all HTML in `./reports/`
2. `pdfmint batch "./reports/*.html" ./pdf/ --json` (output dir is auto-created)
3. Parse `errors` array; retry failed entries individually
4. JSON includes `browser_reused: true` when one Chromium session handled all files

### Generate one-page visual report artifacts
1. Write the final report as a single HTML file with screen CSS and `@media print`
2. Run `pdfmint report.html report.pdf --png report.png --viewport 1055x1491 --scale 3 --expect-pages 1 --json`
3. Parse `page_count` and `png` in the JSON result
4. Report both output paths to the user

## Change → test matrix

| Change area | Verify with |
|---|---|
| CLI routing / flags | `bun test tests/smoke.test.ts` |
| Single convert / PNG / presets | `bun test tests/convert.test.ts tests/smoke.test.ts` |
| Markdown CSS / presets | `bun test tests/markdown.test.ts` |
| Batch reuse | `bun test tests/batch.test.ts` |
| Error JSON / recovery | `bun test tests/errors.test.ts` |
| Doctor | `pdfmint doctor --json` |
| npm package contents | `bun run pack:smoke` |
| Full regression | `bun test && bun run typecheck && bun run build` |

## Best practices for AI agents

- **Always use `--json`** when invoking from an agent — easier to parse than text output
- **Generate absolute paths** in your HTML when referring to images/fonts (relative paths break inside Puppeteer)
- **Use `<style>` blocks inline** — avoid external CSS unless you control the path
- **Use `--font serif`** for Markdown reports that should look more formal; use HTML CSS for fully custom typography
- **Use `--css report.css`** for Markdown reports that need fixed fonts via `@font-face`, margins, or heading styles
- **Use one HTML source of truth** when generating both PNG and PDF; avoid permanent wrapper HTML files
- **Use `--expect-pages 1`** for one-page reports so accidental pagination is caught
- **For Japanese text**, Markdown defaults to `--font sans` with Noto Sans JP first; use `--font serif` for Noto Serif JP first; use `--css` when the exact rendered font must be guaranteed
- **For QR codes**, embed as `<img src="data:image/svg+xml;base64,...">` (until v0.2.0 adds native QR support)
- **On `PAGE_LOAD_FAILED`**, suggest the user check external resources or simplify HTML
