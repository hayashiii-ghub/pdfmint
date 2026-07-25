# Demo

AIエージェントが作成したMarkdownを、提出用の1ページPDFへ仕上げる事例です。

- [`release-brief.md`](./release-brief.md): 入力原稿
- [`release-brief.pdf`](./release-brief.pdf): Shippori Minchoで生成したPDF
- [`release-brief.png`](./release-brief.png): エージェントが確認するPNG

```bash
bun run build
node dist/cli.js demo/release-brief.md demo/release-brief.pdf \
  --font shippori \
  --margin 14mm \
  --png demo/release-brief.png \
  --expect-pages 1 \
  --json
```

事例は架空で、実在の案件や計測値を含みません。PDFとPNGはpdfmint自身で生成し、追加の変換ツールは使用していません。
