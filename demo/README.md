# demo

pdfmint の出力デモ。1 つのデモにつき **ソース・PDF・ページ別プレビュー** を置く。

| ファイル | 役割 |
|---|---|
| [`report.md`](./report.md) | ソース Markdown（入力） |
| [`report.pdf`](./report.pdf) | 生成された PDF（成果物・主役） |
| `report-1.png` / `report-2.png` | PDF と同じページ区切りのプレビュー（1 ページ = 1 枚） |

`report.md` は **明朝（`--font serif`）・preset なし** で変換しており、フロントマター・表（数値右揃え）・callout・コードのシンタックスハイライト・脚注に対応している。完全な体裁は [report.pdf](./report.pdf) を参照。

## 再生成

PDF を作り、ページごとに PNG 化する（PNG を 1 枚に詰め込まず PDF と同じ区切りにする）:

```bash
bun run build          # dist/cli.js を更新
bun run render:demo    # report.pdf と report-<n>.png を再生成
```

> プレビュー PNG は PDF を 1 ページ 1 枚にラスタライズしたもの。`demo/` は npm パッケージには含めず、GitHub 上のデモ用。
