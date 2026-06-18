# pdfmint トラブルシューティング

環境診断、よくあるエラー、復旧手順をまとめたガイドです。エージェント運用では `--json` を付けて実行してください。

## 最初に試すこと

```bash
pdfmint doctor --json
```

`success: false` の場合、各 `checks[]` の `status` と `next_command` を順に実行します。

## よくある問題

### Chromium が起動しない（`BROWSER_LAUNCH_FAILED`）

**症状:** 変換のたびにブラウザ起動で失敗する。

**復旧:**

```bash
npx puppeteer browsers install chrome
pdfmint doctor --json
```

macOS ではシステム Google Chrome も自動で試します。独自バイナリを使う場合:

```bash
export PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
pdfmint doctor --json
```

### ページ読み込み失敗（`PAGE_LOAD_FAILED`）

**症状:** HTML は存在するが Puppeteer が `file://` 読み込みに失敗する。

**主な原因:**

- 相対パスの画像・CSS・フォント（`src="logo.png"` など）
- 外部 URL への依存（オフライン・サンドボックスで到達不可）
- 壊れた HTML

**対処:**

1. 画像は `data:` URL または絶対パスに変更
2. CSS は `<style>` にインライン化
3. 外部フォント依存を減らす（Markdown は `--preset` / `--font` を利用）

### 日本語フォントが意図と違う

**症状:** PDF の日本語が環境によって違うフォントになる。

pdfmint は **Noto Sans JP / Noto Serif JP を同梱**しており、Markdown 変換時に `@font-face` で
読み込むため、**どの環境でも同じ見た目**になります（システムに Noto が入っていなくてもフォール
バックしません）。`--font sans`（既定）/ `--font serif` で切り替えられます。

**それでも変えたい場合:**

- `--css custom.css` で自分の `@font-face` / `font-family` を指定（custom CSS が優先）
- HTML 入力（`.html`）は同梱フォントを注入しません。HTML 側で `font-family` を完全に制御してください

### PDF のファイルサイズが大きい / 開くのが重い

**症状:** 数ページの日本語 PDF が 1MB を超え、ビューアでの表示がもたつく。

**原因:** Chromium（Puppeteer）の PDF 生成は、**CJK（日本語）グリフを Type3 フォントとして
焼き込む**という制約があります。Type3 はグリフを 1 文字ずつ描画プログラムとして持つため、
ファイルが膨らみ、ビューアが描画のたびにグリフを実行するので体感も重くなります。欧文は通常の
サブセット埋め込み（軽い）になりますが、日本語本文ではこれが主なサイズ要因です。

**重要:** これは**埋め込むフォントの種類や同梱の有無では解決しません**（フォントを変えても
Type3 になります）。サイズは実用上問題ない範囲（数ページで 1〜2MB 程度）です。

**どうしても小さくしたい場合:**

- 生成後に外部の PDF 最適化ツール（Ghostscript 等）を通す
- 画像を多用している場合は、画像側を事前に圧縮・適切な解像度にする

### PDF が複数ページになる（`PAGE_COUNT_MISMATCH`）

**症状:** `--expect-pages 1` で失敗する。

**対処:**

- HTML の `height: 100vh` や長い `min-height` を見直す
- `@media print` / `@page` で余白・改ページを調整
- 1枚ものレポートは viewport と CSS をセットで設計

### 出力先に書けない（`PDF_GENERATION_FAILED` / `OUTPUT_NOT_WRITABLE`）

**症状:** PDF 生成自体が失敗する。

**対処:**

- 出力ディレクトリは自動作成されますが、親ディレクトリの書き込み権限を確認
- ディスク容量を確認
- 出力ファイルが他プロセスでロックされていないか確認

### batch でマッチしない（`BATCH_NO_MATCHES`）

**症状:** glob に一致するファイルがない。

**対処:**

```bash
ls ./reports/*.html    # パターンを目視確認
pdfmint batch "./reports/*.html" ./pdf/ --json
```

シェルが glob を展開してしまう場合は、パターンをクォートしてください。

### 未知のオプション（`INVALID_OPTION`）

**症状:** タイポや batch 専用/単体専用オプションの混用。

**対処:**

```bash
pdfmint help
```

- `--png` / `--viewport` / `--scale` は単一変換のみ
- `doctor` では変換用フラグは使えません

### brand profile が不正（`BRAND_INVALID`）

**症状:** `brand.md` の frontmatter 欠落・`key: value` 以外の行・token 値の形式不正（色/長さ/列挙値）。

**対処:**

```bash
pdfmint report.md report.pdf --no-brand --json   # まず brand 抜きで変換できるか切り分け
```

- エラー JSON の `hint` に期待形式が出ます（例: margin は `18mm` のような単一の長さ）
- 意図しない profile が拾われていないかは、成功時 JSON の `brand.source` で確認できます
- 探索順は `--brand <path>` > `./pdfmint.brand.md` > `~/.config/pdfmint/brand.md`

## CLI の形式

推奨:

```bash
pdfmint convert input.html output.pdf --json
```

互換 alias（従来どおり）:

```bash
pdfmint input.html output.pdf --json
```

## エージェント向け復旧フロー

1. エラー JSON の `code` を確認
2. `next_command` があれば実行
3. `verify_command`（多くは `pdfmint doctor --json`）で再確認
4. 単一ファイルで再現 → batch に戻る

## それでも解決しない場合

- [GitHub Issues](https://github.com/hayashiii-ghub/pdfmint/issues) に `--json` 出力（秘密情報を除く）を添付
- 再現用の最小 HTML/MD と実行コマンドを記載
