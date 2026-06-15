# demo

pdfmint の出力デモ。1 つのデモにつき **ソース・PDF・プレビュー** の 3 点を置く。

| ファイル | 役割 |
|---|---|
| [`report.md`](./report.md) | ソース Markdown（入力） |
| [`report.pdf`](./report.pdf) | 生成された PDF（成果物・主役） |
| `report.png` | README 用の 1 ページ目プレビュー |

`report.md` は **明朝（`--font serif`）・preset なし** で変換しており、フロントマター・表（数値右揃え）・callout・コードのシンタックスハイライト・脚注に対応している。完全な体裁は [report.pdf](./report.pdf) を参照。

## 再生成

```bash
pdfmint demo/report.md demo/report.pdf --font serif --png demo/report.png
```

> PNG はあくまでプレビュー（1 ページ目）。`demo/` は npm パッケージには含めず、GitHub 上のデモ用。
