> 🇯🇵 [日本語](./README.md)

# @hayashiii/pdfmint

[![npm version](https://img.shields.io/npm/v/@hayashiii/pdfmint.svg)](https://www.npmjs.com/package/@hayashiii/pdfmint)
[![npm downloads](https://img.shields.io/npm/dm/@hayashiii/pdfmint.svg)](https://www.npmjs.com/package/@hayashiii/pdfmint)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/node/v/@hayashiii/pdfmint.svg)](https://nodejs.org)

**AI-agent-first** CLI for converting HTML/Markdown to clean PDFs (with great Japanese font support). Designed so that AI agents (Claude Code, Codex, etc.) can generate HTML and pipeline it into PDF.

- 🤖 Structured output (`--json`) for AI agents
- 📝 HTML and Markdown both supported
- 🎨 Beautiful Japanese rendering (Hiragino Sans by default)
- 📦 Works with both Bun and Node.js
- 🪶 Claude Code Skill bundled

---

## Install

```bash
npm install -g @hayashiii/pdfmint
# or
bun install -g @hayashiii/pdfmint
```

Requires **Node.js 22+**.

## Quick Start

```bash
# Single file
pdfmint invoice.html invoice.pdf

# Markdown → PDF
pdfmint resume.md resume.pdf

# Batch
pdfmint batch "./html/*.html" ./pdf/

# JSON output (AI agent friendly)
pdfmint invoice.html invoice.pdf --json
```

## Commands

| Command | Purpose |
|---|---|
| `pdfmint <input> <output>` | Convert single HTML/Markdown to PDF |
| `pdfmint batch <pattern> <out-dir>` | Batch processing |
| `pdfmint help` | Help |
| `pdfmint --version` | Version |

### Flags

| Flag | Default | Description |
|---|---|---|
| `--json` | off | JSON output |
| `--format <size>` | A4 | Paper size (A4 / A3 / Letter / Legal) |
| `--margin <value>` | 0 | Margin |
| `--landscape` | off | Landscape orientation |
| `--no-background` | off | Disable CSS backgrounds |

## JSON Output Example

```json
{
  "success": true,
  "input": "/abs/invoice.html",
  "output": "/abs/invoice.pdf",
  "format": "A4",
  "size_bytes": 4827410,
  "duration_ms": 1234
}
```

---

## Notes

- **Images and fonts**: use absolute paths or `data:` URLs in HTML — Puppeteer's `file://` resolution may not behave as expected for relative paths.
- **Print CSS**: declare `@page` rules and margins in your HTML to combine with the default `--margin 0` for clean output.
- **Japanese fonts**: Markdown input uses default CSS targeting Hiragino Sans. For HTML input, set fonts in your own `<style>`.
- **AI agent integration**: always pass `--json` (progress logs go to stderr, the result JSON goes to stdout).

---

## License

MIT © 2026 Hayashi

---

## Links

- [GitHub repository](https://github.com/hayashiii-ghub/pdfmint)
- [Issues](https://github.com/hayashiii-ghub/pdfmint/issues)
- [npm](https://www.npmjs.com/package/@hayashiii/pdfmint)
- [AGENTS.md](./AGENTS.md) — AI agent guide
- [CHANGELOG](./CHANGELOG.md)
