---
title: pdfmint サンプルレポート
---

# pdfmint サンプルレポート

これは `pdfmint` で Markdown から生成した PDF のサンプルです。日本語のレンダリングと基本的な記法の確認用に作成しました。

## 概要

pdfmint は HTML / Markdown を綺麗な日本語 PDF に変換する CLI ツールです。AI エージェントが生成した原稿を、提出・共有しやすい成果物へコマンド一発で変換します。

## 対応している記法

- 見出し（h1〜h4）
- 箇条書き / 番号付きリスト
- **太字** と *斜体*、`インラインコード`
- 引用、表、コードブロック
- 脚注[^1]・GitHub 形式の callout・シンタックスハイライト

> [!NOTE]
> フロントマターは本文に漏れず、`title` が文書タイトルになります。

## 数値表（右揃え）

| 項目 | 単価 | 数量 | 金額 |
|---|---:|---:|---:|
| デザイン費 | 50,000 | 1 | 50,000 |
| 運用保守（年額） | 50,000 | 1 | 50,000 |
| 合計 | | | 100,000 |

## コード例

```ts
import { markdownToHtml } from "./markdown"

const html = markdownToHtml("# Hello", { font: "serif" })
console.log(html)
```

## 引用

> 良い内容には、良い紙を。
> ドキュメントの見た目は、内容の信頼性を左右する。

## まとめ

1. Markdown を書く
2. `pdfmint demo.md demo.pdf --font serif` を実行
3. 提出用 PDF が完成

[^1]: 脚注は文書末にまとめて出力されます。

---

*Generated with pdfmint*
