# examples

pdfmint の出力例。`demo.md` がソース、`demo.pdf` が成果物（主役）、`demo.png` は README 用の 1 ページ目プレビュー。

[demo.md](./demo.md) は **明朝（`--font serif`）・preset なし** で変換しており、フロントマター・表（数値右揃え）・callout・コードのシンタックスハイライト・脚注に対応している。仕上がりは [demo.pdf](./demo.pdf) を参照。

## 再生成

```bash
pdfmint examples/demo.md examples/demo.pdf --font serif --png examples/demo.png
```

> PNG はあくまで README 用のプレビュー（1 ページ目）です。完全な体裁は PDF を参照してください。
