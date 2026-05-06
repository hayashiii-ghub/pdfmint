> 🇬🇧 [English](./README.en.md)

# @hayashiii/pdfmint

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen.svg)](https://nodejs.org)

HTML/Markdown を綺麗な日本語PDFに変換する **AIエージェントファースト** な CLI ツール。AIエージェントが生成したHTMLを、コマンド一発でPDF化。

- 🤖 AIエージェント（Claude Code / Codex 等）が使う前提の構造化出力（`--json`）
- 📝 HTML / Markdown 両対応
- 🎨 日本語フォントを綺麗にレンダリング（Hiragino Sans 標準）
- 📦 Bun でも Node.js でも動く（`npm install -g` または `bun install -g`）
- 🪶 Claude Code Skill 同梱（`/pdfmint` で呼び出し可能）

---

## インストール

```bash
# Node.js (npm)
npm install -g @hayashiii/pdfmint

# または Bun
bun install -g @hayashiii/pdfmint

# 初回のみ Chromium 自動DL（puppeteer内部）
```

**Node.js 22以上** が必要です。

## Quick Start

```bash
# 単一変換
pdfmint invoice.html invoice.pdf

# Markdown→PDF
pdfmint resume.md resume.pdf

# バッチ変換
pdfmint batch "./html/*.html" ./pdf/

# AIエージェント連携（JSON出力）
pdfmint invoice.html invoice.pdf --json
```

## コマンド

| コマンド | 用途 |
|---|---|
| `pdfmint <input> <output>` | 単一HTML/Markdown→PDF |
| `pdfmint batch <pattern> <out-dir>` | バッチ処理 |
| `pdfmint help` | ヘルプ |
| `pdfmint --version` | バージョン |

### フラグ

| フラグ | デフォルト | 説明 |
|---|---|---|
| `--json` | off | JSON 出力（AIエージェント連携） |
| `--format <size>` | A4 | 用紙サイズ（A4 / A3 / Letter / Legal） |
| `--margin <value>` | 0 | 余白 |
| `--landscape` | off | 横向き |
| `--no-background` | off | CSS背景無効 |

## JSON 出力例

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

エラー時:

```json
{
  "success": false,
  "error": {
    "code": "INPUT_NOT_FOUND",
    "message": "入力ファイルが見つかりません",
    "hint": "ファイルパスを確認してください",
    "input": "./missing.html"
  }
}
```

## AIエージェントから使う

`AGENTS.md` を参照。Claude Code は `skills/pdfmint/SKILL.md` を自動認識します。

## 開発

```bash
git clone https://github.com/hayashiii-ghub/pdfmint.git
cd pdfmint
bun install
bun test
bun src/cli.ts <input> <output>  # 直接実行
bun run build  # dist/cli.js 生成
```

## ライセンス

MIT
