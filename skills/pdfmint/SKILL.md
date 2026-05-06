---
name: pdfmint
description: HTML/Markdown を綺麗な日本語PDFに変換する CLI ツール。請求書・履歴書・案内書など書類のPDF化に使う。
---

# pdfmint Skill

## When to use this skill

- ユーザーが HTML/Markdown ファイルを PDF にしたいと言ったとき
- 請求書・契約書・履歴書のような書類をPDF化したいとき
- 複数HTMLを一括でPDFにしたいとき

## How to invoke

1. 入力がHTMLかMarkdownか確認（拡張子で判別）
2. 出力先ディレクトリが存在することを確認（必要なら `mkdir -p`）
3. `pdfmint <input> <output> --json` を実行
4. JSON出力を解析して結果を報告

## Examples

### 単一HTML→PDF
```bash
pdfmint invoice.html invoice.pdf --json
```

### Markdown→PDF
```bash
pdfmint resume.md resume.pdf --json
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

詳細は `AGENTS.md` を参照。
