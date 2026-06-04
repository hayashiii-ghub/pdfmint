---
name: pdfmint
description: HTML/Markdown を綺麗な日本語PDFやPNGに変換する CLI ツール。請求書・履歴書・案内書・1枚ものレポートなどをPDF化し、必要に応じて同じ入力から高解像度PNGも生成する。
---

# pdfmint Skill

## When to use this skill

- ユーザーが HTML/Markdown ファイルを PDF にしたいと言ったとき
- ユーザーが HTML/Markdown から PNG と PDF の両方を作りたいと言ったとき
- 請求書・契約書・履歴書のような書類をPDF化したいとき
- 1ページ帳票でPDFが2ページに流れていないか検証したいとき
- 複数HTMLを一括でPDFにしたいとき

## How to invoke

1. 入力がHTMLかMarkdownか確認（拡張子で判別）
2. 出力先ディレクトリが存在することを確認（必要なら `mkdir -p`）
3. PDFだけなら `pdfmint <input> <output> --json` を実行
4. Markdown入力で明朝系にしたい場合は `--font serif` を付ける（既定は `--font sans`）
5. PNGも必要なら `--png <output.png> --viewport <width>x<height> --scale <number>` を付ける
6. 1ページ固定が必要なら `--expect-pages 1` を付ける
7. JSON出力を解析して結果を報告

## Examples

### 単一HTML→PDF
```bash
pdfmint invoice.html invoice.pdf --json
```

### Markdown→PDF
```bash
pdfmint resume.md resume.pdf --json
```

### Markdown→PDF（明朝系）
```bash
pdfmint report.md report.pdf --font serif --json
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
mkdir -p ./pdf/
pdfmint batch "./html/*.html" ./pdf/ --json
```

## Error recovery

- `INPUT_NOT_FOUND`: ファイルパスを `ls` で確認、誤字や相対パスを訂正
- `OUTPUT_DIR_NOT_FOUND`: 出力先を `mkdir -p` で先に作成
- `PAGE_LOAD_FAILED`: HTML内の外部リソース（フォント・画像）がアクセス可能か確認
- `BROWSER_LAUNCH_FAILED`: `bunx puppeteer browsers install chrome` を提案
- `PNG_GENERATION_FAILED`: PNG出力先・viewport・scaleを確認
- `INVALID_VIEWPORT`: `--viewport 1055x1491` のように `<width>x<height>` 形式へ修正
- `INVALID_FONT`: `--font sans` または `--font serif` に修正
- `PAGE_COUNT_MISMATCH`: `@page` / `@media print` / 高さ / overflow を確認

詳細は `AGENTS.md` を参照。
