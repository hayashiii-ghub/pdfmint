# examples

pdfmint の出力例。各 `*.md` がソース、`*.pdf` が成果物、`*.png` が README 用プレビュー（PDF 1 ページ目を幅 1000px に縮小）。

| ソース | preset | 内容 |
|---|---|---|
| [report.md](./report.md) | `report` | 技術レポート（表・コード・callout・脚注） |
| [letter.md](./letter.md) | `letter` | 挨拶状（明朝・中央寄せタイトル） |
| [memo.md](./memo.md) | `memo` | 議事メモ（シンプルな業務文書） |

## 再生成

```bash
for p in report letter memo; do
  pdfmint examples/$p.md examples/$p.pdf --preset $p --png examples/$p.png --scale 1
done
```

> プレビュー PNG はリポジトリを軽く保つため幅 1000px 程度に縮小しています（上のコマンドは等倍生成。コミット済みの PNG はさらに縮小したもの）。
