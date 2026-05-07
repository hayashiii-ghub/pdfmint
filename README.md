> 🇬🇧 [English](./README.en.md)

# @hayashiii/pdfmint

[![npm version](https://img.shields.io/npm/v/@hayashiii/pdfmint.svg)](https://www.npmjs.com/package/@hayashiii/pdfmint)
[![npm downloads](https://img.shields.io/npm/dm/@hayashiii/pdfmint.svg)](https://www.npmjs.com/package/@hayashiii/pdfmint)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/node/v/@hayashiii/pdfmint.svg)](https://nodejs.org)

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

---

## 注意

- **画像・フォント**: HTML 内の `src` は絶対パスまたは `data:` URL にしてください(Puppeteer の `file://` 環境では相対パスのリゾルブが期待通り動かないケースがあります)
- **印刷用 CSS**: `@page` ルールで余白等を HTML 側に書いておくと、`--margin` のデフォルト 0 と組み合わせて綺麗に印刷できます
- **日本語フォント**: Markdown 入力時はデフォルト CSS が Hiragino Sans を指定。HTML 入力時は自分で `<style>` に指定してください
- **AIエージェント連携時**: 必ず `--json` を付けてください(進捗ログは stderr、結果 JSON は stdout に分離)

---

## ライセンス

MIT © 2026 Hayashi

---

## リンク

- [GitHubリポジトリ](https://github.com/hayashiii-ghub/pdfmint)
- [Issues](https://github.com/hayashiii-ghub/pdfmint/issues)
- [npm](https://www.npmjs.com/package/@hayashiii/pdfmint)
- [AGENTS.md](./AGENTS.md) — AIエージェント向け仕様書
- [CHANGELOG](./CHANGELOG.md)
