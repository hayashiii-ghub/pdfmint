> 🇯🇵 [日本語](./README.md)

# @hayashiii/pdfmint

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)

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

## License

MIT
