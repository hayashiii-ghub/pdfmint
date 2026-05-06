# pdfmint - AI Agent Guide

## What is pdfmint

`@hayashiii/pdfmint` is a CLI tool for converting HTML/Markdown files to PDF. It is designed to be invoked by AI agents (Claude Code, Codex, etc.) as part of a "generate HTML → produce PDF" workflow.

## When to use

- The user asks to convert a HTML or Markdown file to PDF
- The user generates a document via natural language (invoice, resume, contract) and wants it as PDF
- Multiple HTML files need batch conversion

## Quick Reference

```bash
pdfmint <input> <output>              # Single file
pdfmint batch <glob> <out-dir>        # Batch
pdfmint help                          # Help
pdfmint --version                     # Version
```

Always pass `--json` when invoked by an agent for structured output.

## Input formats

- `.html` / `.htm` → rendered directly
- `.md` / `.markdown` → converted to HTML internally with default Japanese-friendly CSS, then to PDF
- Other extensions → error `UNSUPPORTED_INPUT`

## Output (`--json`)

### Success (single)
```json
{
  "success": true,
  "input": "/abs/in.html",
  "output": "/abs/out.pdf",
  "format": "A4",
  "size_bytes": 12345,
  "duration_ms": 1000
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
| `OUTPUT_DIR_NOT_FOUND` | Run `mkdir -p <dir>` first |
| `OUTPUT_NOT_WRITABLE` | Check directory permissions |
| `BROWSER_LAUNCH_FAILED` | Run `bunx puppeteer browsers install chrome` |
| `PAGE_LOAD_FAILED` | Check HTML for broken external resources (fonts, images) |
| `PDF_GENERATION_FAILED` | Check output path / disk space |
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
2. `mkdir -p ./pdf/`
3. `pdfmint batch "./reports/*.html" ./pdf/ --json`
4. Parse `errors` array; retry failed entries individually

## Best practices for AI agents

- **Always use `--json`** when invoking from an agent — easier to parse than text output
- **Generate absolute paths** in your HTML when referring to images/fonts (relative paths break inside Puppeteer)
- **Use `<style>` blocks inline** — avoid external CSS unless you control the path
- **For Japanese text**, no special config needed — default CSS uses Hiragino Sans
- **For QR codes**, embed as `<img src="data:image/svg+xml;base64,...">` (until v0.2.0 adds native QR support)
- **On `PAGE_LOAD_FAILED`**, suggest the user check external resources or simplify HTML
