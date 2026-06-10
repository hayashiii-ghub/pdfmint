---
name: pdfmint
description: HTML/Markdown を綺麗な日本語PDFやPNGに変換する CLI ツール。請求書・履歴書・案内書・1枚ものレポートなどをPDF化し、必要に応じて同じ入力から高解像度PNGも生成する。
---

# pdfmint Skill

## When to use this skill

- ユーザーが HTML/Markdown ファイルを PDF にしたいと言ったとき
- ユーザーが HTML/Markdown から PNG と PDF の両方を作りたいと言ったとき
- Markdown をシンプルな書類（メモ・報告書・正式文）として PDF 化したいとき
- 1ページ帳票でPDFが2ページに流れていないか検証したいとき
- 複数HTMLを一括でPDFにしたいとき
- Chromium 起動失敗時の環境診断が必要なとき

## How to invoke

1. 初回または `BROWSER_LAUNCH_FAILED` 時は `pdfmint doctor --json`
2. 入力がHTMLかMarkdownか確認（拡張子で判別）
3. PDFだけなら `pdfmint convert <input> <output> --json` を実行（`pdfmint <in> <out>` も可。出力ディレクトリは自動作成）
4. Markdown は用途に応じて `--preset memo|report|letter` を付ける
5. 明朝系にしたい場合は `--font serif`（`letter` preset は既定で serif 寄り）
6. 書体・余白を完全固定したい場合は `--css <file.css>`
7. PNGも必要なら `--png <output.png> --viewport <width>x<height> --scale <number>`
8. 1ページ固定が必要なら `--expect-pages 1`
9. JSON出力を解析して結果を報告

## Examples

### 単一HTML→PDF
```bash
pdfmint convert invoice.html invoice.pdf --json
```

### Markdown→PDF（preset）
```bash
pdfmint memo.md memo.pdf --preset memo --json
pdfmint report.md report.pdf --preset report --json
pdfmint letter.md letter.pdf --preset letter --json
```

### HTML→PDF + PNG
```bash
pdfmint report.html report.pdf \
  --png report.png \
  --viewport 1055x1491 \
  --scale 3 \
  --expect-pages 1 \
  --json
```

### バッチ処理
```bash
pdfmint batch "./html/*.html" ./pdf/ --json
```

### 環境診断
```bash
pdfmint doctor --json
```

## Error recovery

- `BROWSER_LAUNCH_FAILED`: JSON の `next_command` を実行 → `pdfmint doctor --json`
- `INPUT_NOT_FOUND`: ファイルパスを確認
- `PAGE_LOAD_FAILED`: HTML内の外部リソース（フォント・画像）を確認
- `INVALID_PRESET`: `--preset memo|report|letter`
- `PAGE_COUNT_MISMATCH`: `@page` / 高さ / overflow を確認

詳細は `AGENTS.md` を参照。
