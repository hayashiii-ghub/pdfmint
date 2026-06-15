# examples

pdfmint の出力例。`demo.md` がソース、`demo.pdf` が成果物、`demo.png` が README 用プレビュー（PDF 1 ページ目を幅約 1000px に縮小）。

[demo.md](./demo.md) は **デフォルト設定（preset なし）** で変換しており、フロントマター・表（数値右揃え）・callout・コードのシンタックスハイライト・脚注を 1 枚にまとめている。

## 再生成

```bash
pdfmint examples/demo.md examples/demo.pdf --png examples/demo.png
```

> プレビュー PNG はリポジトリを軽く保つため幅約 1000px に縮小しています。
