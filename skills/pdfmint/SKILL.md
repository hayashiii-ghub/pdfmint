---
name: pdfmint
description: HTMLまたはMarkdownの原稿を、日本語組版されたPDF/PNG成果物へ変換する。
---

# pdfmint

ユーザーが原稿をPDFへ仕上げたいときに使う。常に `--json` を付ける。

```bash
pdfmint <input.html|input.md> <output.pdf> --json
```

Markdownでは目的に合う書体を選ぶ。

- `zen`: 実務文書、仕様書、表（既定）
- `shippori`: 報告書、提案書、正式文書
- `kiwi`: 案内、親しみのある資料
- `klee`: 手紙、柔らかい一枚もの

```bash
pdfmint report.md report.pdf --font shippori --json
```

レイアウト確認が必要ならPNGとページ数検証を付ける。

```bash
pdfmint sheet.md sheet.pdf --png sheet.png --expect-pages 1 --json
```

成功時は `output`、`font`、`page_count`、任意の `png.output` を報告する。見た目が重要な場合はPNGを実際に確認する。

HTMLのCSSはHTML自身を正本とする。Markdownの見た目を案件ごとに変える場合だけ `--css <file.css>` を使う。

`BROWSER_LAUNCH_FAILED` ではJSONの `next_command` を実行して同じ変換を再試行する。パス・ヘッダー・外部資産に秘密情報がある場合は出力や報告へ含めない。
