> 🇬🇧 [English](./README.en.md)

# @hayashiii/pdfmint

[![npm version](https://img.shields.io/npm/v/@hayashiii/pdfmint.svg)](https://www.npmjs.com/package/@hayashiii/pdfmint)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

pdfmintは、AIが作ったHTMLまたはMarkdownを、目的に合う日本語書体で提出用PDFへ仕上げるCLIです。確認用PNGも同じ入力から生成できます。

```text
HTML / Markdown
       ↓
    pdfmint
       ↓
PDF + 確認用PNG + JSON結果
```

## まず使う

Node.js 22以上が必要です。

```bash
npm install -g @hayashiii/pdfmint
pdfmint report.md report.pdf --json
```

目的に応じて書体や確認用PNGを追加します。

```bash
pdfmint proposal.md proposal.pdf --font shippori --json
pdfmint notice.md notice.pdf --font kiwi --png notice.png --json
pdfmint document.html document.pdf --format A4 --margin 18mm --json
```

Puppeteerが使用するChromeを取得できない場合は、エラーJSONの `next_command` を実行してください。

## シリーズ内の役割

| やりたいこと | 使うツール |
|---|---|
| 公開サイトをスクリーンショットアーカイブとして収集する | [`sitesnap`](https://github.com/hayashiii-ghub/sitesnap) |
| 開発中UIの状態、レスポンシブ、品質を検証する | [`shimon`](https://github.com/hayashiii-ghub/shimon) |
| HTMLやMarkdownを提出用PDFへ仕上げる | `pdfmint` |

pdfmintは文書を作成するエージェントではなく、完成した1つの原稿をPDF成果物へ変換するツールです。

## 特徴

- 入口は `pdfmint <input> <output>` の1つだけ
- HTML / Markdown → PDF
- 日本語4書体をローカル同梱し、オフラインでも同じ見た目
- PDFと確認用PNGを同時生成
- ページ数検証と構造化エラー
- `--json` でAIエージェントから扱いやすい出力

## 出力例

[リリース判定レポートのMarkdown、PDF、確認用PNG](https://github.com/hayashiii-ghub/pdfmint/tree/main/demo)を公開しています。Shippori Mincho、表、callout、脚注、1ページ検証を使った架空の事例です。

![pdfmintで生成したリリース判定レポート](https://raw.githubusercontent.com/hayashiii-ghub/pdfmint/main/demo/release-brief.png)

## 日本語フォント

| ID | 書体 | 向いている文書 |
|---|---|---|
| `zen` | Zen Kaku Gothic New | 実務文書、表、仕様書（既定） |
| `shippori` | Shippori Mincho | 提案書、報告書、正式文書 |
| `kiwi` | Kiwi Maru | 案内、親しみのある資料 |
| `klee` | Klee One | 手紙、柔らかい一枚もの |

```bash
pdfmint input.md output.pdf --font zen
pdfmint input.md output.pdf --font shippori
pdfmint input.md output.pdf --font kiwi
pdfmint input.md output.pdf --font klee
```

各書体は実ウェイトを含めてパッケージへ同梱しています。実行時にGoogle Fontsへ接続しません。フォント選択はMarkdown入力に適用され、HTML入力はHTML自身のCSSを尊重します。

## オプション

| オプション | 説明 |
|---|---|
| `--json` | stdoutへJSONを出力 |
| `--font <zen\|shippori\|kiwi\|klee>` | Markdownの日本語書体（既定: `zen`） |
| `--css <file.css>` | Markdownの既定スタイルへCSSを追加 |
| `--format <A4\|A3\|Letter\|Legal>` | 用紙サイズ（既定: A4） |
| `--margin <value>` | 余白。例: `18mm`、`1in`、`0` |
| `--landscape` | 横向き |
| `--no-background` | CSS背景を無効化 |
| `--png <output.png>` | 確認用PNGも生成 |
| `--viewport <WxH>` | PNG viewport（既定: `1055x1491`） |
| `--scale <number>` | PNG scale（既定: `3`） |
| `--expect-pages <number>` | PDFページ数が異なれば失敗 |

`--css` は既定組版の後ろへ追加されるため、見出し・色・余白などを案件ごとに上書きできます。

## JSON出力

```json
{
  "success": true,
  "input": "/abs/report.md",
  "output": "/abs/report.pdf",
  "format": "A4",
  "font": "shippori",
  "size_bytes": 482741,
  "page_count": 3,
  "duration_ms": 1234
}
```

失敗時:

```json
{
  "success": false,
  "error": {
    "code": "PAGE_COUNT_MISMATCH",
    "message": "...",
    "hint": "..."
  }
}
```

stdoutには最終結果だけを出します。エージェントから実行するときは常に `--json` を付けてください。

## Markdown

GFMに加えて、以下をそのまま扱えます。

- 先頭frontmatterの除去と `title:` の反映
- 脚注
- GitHub形式のcallout
- コードのシンタックスハイライト
- 表の左右・中央揃え
- 長いコード行の折り返し

## 注意

- HTML入力の見た目はHTML内のCSSが正本です。`--font` と `--css` はMarkdown入力向けです。
- HTML内の画像や外部資産は絶対パスまたは `data:` URLを推奨します。
- 1ページ物は `--expect-pages 1` で意図しない改ページを検出できます。
- フォントはSIL Open Font License 1.1です。各ライセンスを `dist/fonts/` に同梱します。

## 0.xからの移行

```text
pdfmint convert input.md output.pdf  → pdfmint input.md output.pdf
--font sans                          → --font zen
--font serif                         → --font shippori
--preset / --brand                   → --css + --font / --format / --margin
```

`batch`と`doctor`は1.0で削除しました。1回の実行では1つの原稿を変換し、起動エラーは構造化エラーの`next_command`から復旧します。

## 開発

```bash
bun install
bun run typecheck
bun test
bun run build
bun run pack:smoke
```

package versionと一致する`v1.0.0`形式のtagをpushすると、検証後にnpmとGitHub Releaseへ公開します。

## License

MIT © 2026 Hayashi
