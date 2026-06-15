> 🇬🇧 [English](./README.en.md)

# @hayashiii/pdfmint

[![npm version](https://img.shields.io/npm/v/@hayashiii/pdfmint.svg)](https://www.npmjs.com/package/@hayashiii/pdfmint)
[![npm downloads](https://img.shields.io/npm/dm/@hayashiii/pdfmint.svg)](https://www.npmjs.com/package/@hayashiii/pdfmint)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/node/v/@hayashiii/pdfmint.svg)](https://nodejs.org)

HTML/Markdown を綺麗な日本語PDFに変換する **AIエージェントファースト** な CLI ツール。AIエージェントが生成した原稿を、提出・共有しやすいPDF/PNG成果物へコマンド一発で変換することを目的として設計。

- 📄 成果物はPDF + 任意のPNGファイルとして保存(DB不要)
- 🤖 Claude Code / Codex などのAIエージェントから1コマンドで実行可能(Claude Code Skill同梱)
- 📡 `--json` フラグで構造化出力 → エージェントが結果をパース可能
- ⚙️ 構造化エラー(`code` + `hint`)と `--expect-pages` で自動リトライ・品質チェックがしやすい
- 📝 HTML / Markdown / batch 変換に対応し、agent生成ドキュメントをまとめてPDF化できる
- ✍️ Markdown は GFM に加え **フロントマター除去・脚注・GitHub callout・シンタックスハイライト** に対応
- 🎨 日本語フォントを綺麗にレンダリング(Noto Sans JP 優先、Noto Serif JP も選択可)
- 🔧 TypeScript で実装、Bun 開発 / Node.js 22+ 配布のハイブリッド構成

---

## 出力例

Markdown 1 枚を明朝（`--font serif`・preset なし）で変換した例です。フロントマター・表（数値右揃え）・callout・コードのハイライト・脚注まで、素のまま対応します。ソース・PDF・プレビューは [`demo/`](./demo) にまとめてあります。

**▶ PDF で見る: [demo/report.pdf](./demo/report.pdf)** （ソース: [report.md](./demo/report.md)）

[![1 ページ目プレビュー](./demo/report.png)](./demo/report.pdf)

```bash
pdfmint demo/report.md report.pdf --font serif
```

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

# Markdown→PDF（明朝系）
pdfmint report.md report.pdf --font serif

# Markdown→PDF（CSSを固定）
pdfmint report.md report.pdf --css report.css

# PDF + 高解像度 PNG を同時生成
pdfmint report.html report.pdf --png report.png --viewport 1055x1491 --scale 3

# バッチ変換
pdfmint batch "./html/*.html" ./pdf/

# AIエージェント連携（JSON出力）
pdfmint invoice.html invoice.pdf --json
```

## コマンド

| コマンド | 用途 |
|---|---|
| `pdfmint convert <input> <output>` | 単一HTML/Markdown→PDF（推奨） |
| `pdfmint <input> <output>` | 上記と同じ（互換 alias） |
| `pdfmint batch <pattern> <out-dir>` | バッチ処理 |
| `pdfmint doctor` | 環境診断 |
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
| `--font <sans\|serif>` | sans | Markdown入力時の日本語フォントpreset |
| `--css <file.css>` | off | Markdown入力時のCSSをファイルから指定 |
| `--brand <file.md>` | 自動探索 | brand profile を明示指定（見た目を統一） |
| `--no-brand` | off | brand profile の自動探索を無効化 |
| `--png <output.png>` | off | PDF と同じ入力から PNG も生成 |
| `--viewport <WxH>` | 1055x1491 | PNG の画面サイズ |
| `--scale <number>` | 3 | PNG のデバイススケール |
| `--expect-pages <number>` | off | 生成PDFのページ数が違えばエラー |

## JSON 出力例

```json
{
  "success": true,
  "input": "/abs/invoice.html",
  "output": "/abs/invoice.pdf",
  "format": "A4",
  "size_bytes": 4827410,
  "page_count": 1,
  "duration_ms": 1234
}
```

PDF と PNG を同時生成した場合:

```json
{
  "success": true,
  "input": "/abs/report.html",
  "output": "/abs/report.pdf",
  "format": "A4",
  "size_bytes": 920701,
  "duration_ms": 3042,
  "page_count": 1,
  "png": {
    "output": "/abs/report.png",
    "width": 3165,
    "height": 4473,
    "size_bytes": 10078027
  }
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

## 対応Markdown記法

GFM（表・タスクリスト・打消し・自動リンク）に加えて以下に対応しています。すべてのpreset・既定CSS・`--css` で有効です。

- **フロントマター**: 先頭の `--- ... ---` は本文に漏らさず除去。`title:` は文書タイトル（`<title>`）に使われます。それ以外のkeyはここでは無視（見た目の統一は別ファイル `brand.md` で行います）
- **脚注**: `本文[^1]` ＋ `[^1]: 注釈` で上付き参照＋文書末の脚注セクション（戻りリンク付き）
- **callout（GitHub形式）**: `> [!NOTE]` / `[!TIP]` / `[!IMPORTANT]` / `[!WARNING]` / `[!CAUTION]` を色付きの注意ブロックに変換
- **シンタックスハイライト**: コードフェンスを highlight.js（GitHubライトテーマ）で色付け。言語指定（` ```ts `）で文法を選択、未指定/未知の言語はプレーン表示

````markdown
---
title: 月次レポート
---

本文に脚注を付けられます[^1]。

[^1]: これは脚注です。

> [!NOTE]
> 補足はこの形式で目立たせられます。

```ts
const html = markdownToHtml("# Hello", { font: "serif" })
```
````

## brand profile（見た目の統一）

色・書体・余白・用紙サイズを `brand.md` に一度書いておくと、Markdown変換すべてに自動適用されます（毎回フラグ指定が不要）。`./pdfmint.brand.md`（プロジェクト）→ `~/.config/pdfmint/brand.md`（グローバル）の順に自動探索。

```markdown
---
accent: "#1B365D"      # 見出し罫線・引用のアクセント色
ink: "#1a1a1a"         # 本文・見出しの文字色
font: serif            # sans | serif
font_size: 10.5pt
line_height: 1.65
paper: A4              # A4 | A3 | Letter | Legal
margin: 18mm
---
（frontmatter 以降の本文はメモ。レンダリングには使われません）
```

- 優先順位: 明示フラグ（`--font` / `--format` / `--margin`）> brand token > 既定値
- `--brand <file.md>` で明示指定、`--no-brand` で無効化
- `--json` の `brand` フィールドで適用された profile を確認できます

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
- **余白**: Markdown 入力では `--margin`（フラグ優先 > brand `margin` token > preset 既定）が PDF・PNG の両方に同じ値で効きます（内部的に `@page` と画面用 padding が同一の `--pm-margin` を参照）。値は単位付き長さ（例 `18mm` / `1in`）または `0`。HTML 入力では HTML 側の `@page` ルールが優先され、`@page` に margin が無いときだけ `--margin` が効きます
- **1枚ものの帳票**: `--expect-pages 1` を付けると、意図せず2ページ目に流れたPDFを検出できます
- **画像納品**: `--png` と `--viewport` / `--scale` を使うと、同じHTMLから共有用PNGと提出用PDFを同時に作れます
- **日本語フォント**: Markdown 入力時は `--font sans` が既定で Noto Sans JP を優先します。明朝系にしたい場合は `--font serif` で Noto Serif JP を優先します。納品物の書体・余白・見出しを固定したい場合は `--css report.css` を使ってCSSを指定してください。HTML 入力時は自分で `<style>` に指定してください
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
