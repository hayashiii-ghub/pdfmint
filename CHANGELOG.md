# Changelog

すべての注目すべき変更点はこのファイルに記録されます。

このプロジェクトは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に従い、
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) を採用しています。

## [Unreleased]

## [0.6.0] - 2026-06-18

### Added
- **日本語フォント (Noto Sans JP / Noto Serif JP) を同梱**し、Markdown 変換時に `@font-face` で読み込むようにした。システムにインストールされたフォントに依存せず、**どの環境でも同じ見た目の出力**になる（Noto 未導入環境での Hiragino 等へのフォールバックを解消）。`--font sans|serif` の双方をカバー。フォントは OFL-1.1（`dist/fonts/OFL.txt` に同梱）。
  - **注意（サイズは変わりません）**: これは再現性のための変更であって軽量化ではない。Chromium の `page.pdf()` は CJK グリフを Type3 フォントとして焼くため、同梱フォントを使っても PDF のサイズ・描画コストは変わらない。背景は `docs/troubleshooting.md` を参照。
- `.html` 入力には同梱フォントを注入しない（HTML 側が `font-family` を完全に制御する）。

### Fixed
- Markdown 変換時、`@font-face`（同梱フォント）の読み込み完了を待ってから PDF/PNG を描画するようにした（`document.fonts.ready`）。待たないと初回描画で fallback フォントが使われる競合があった。

## [0.5.1] - 2026-06-17

### Fixed
- Markdown の fenced code block 内に長い1行（ファイルパスなど）がある場合、PDF 出力で横方向に切れて読めなくなる問題を修正。`pre` に `pre-wrap` / `overflow-wrap: anywhere` を追加（全 preset と legacy CSS）
- CI で初回 Chromium 起動が 15s を超えて `convert.test` が落ちる flake を修正（Chromium 依存テストに 45s タイムアウト）

## [0.5.0] - 2026-06-15

### Added
- Markdown 拡張記法に対応（全 preset / 既定 CSS / `--css` で有効）:
  - **フロントマター**: 先頭の `--- ... ---` を本文に漏らさず除去し、`title:` を文書タイトル（`<title>`）に反映。その他の key は無視（見た目の統一は従来どおり `brand.md` 側）
  - **脚注**: `本文[^1]` ＋ `[^1]: 注釈` を上付き参照＋文書末の脚注セクション（戻りリンク付き）に変換（`marked-footnote`）
  - **callout（GitHub alerts）**: `> [!NOTE]` / `[!TIP]` / `[!IMPORTANT]` / `[!WARNING]` / `[!CAUTION]` を色付きの注意ブロックに変換（`marked-alert`）
  - **シンタックスハイライト**: コードフェンスを highlight.js（GitHub ライトテーマ）で色付け（`marked-highlight` + `highlight.js`）

### Changed
- 既定 Markdown CSS（preset なし）の差し色を深緑のカラーテーマで統一。見出し（h1 下線・h2 縦バー・h3 文字色）、リンク、表ヘッダ（淡い深緑地＋深緑の下罫線）、`> [!NOTE]` callout（縦バー・タイトル・地）を同じ `--pm-accent`（深緑）に揃え、明色は `color-mix` で派生。brand の `accent` token を変えると全体が追従する（他の callout 種別の意味色・preset の見た目は不変）
- 見出し（h1〜h4）に `break-after: avoid` を付け、ページ末で見出しだけが孤立しないようにした

### Fixed
- バンドル後（`node dist/cli.js`）に `--preset memo|report|letter` が CSS ファイルを見つけられず失敗していたのを修正（`PRESETS_DIR` が `dist` を指す一方で CSS は `dist/presets/` にあった）。source 実行と bundle 実行の両方の CSS 所在を探索するようにし、`pack:smoke` にビルド済み dist での実 preset 変換ガードを追加
- Markdown 入力で `--margin` と brand の `margin` token が PDF に反映されていなかったのを修正。preset / 既定 CSS の `@page` margin が固定値で、Chromium では `@page { margin }` が Puppeteer の margin 指定を常に上書きするため、`--margin` は no-op、brand margin は PNG（screen）にしか効かず PDF と食い違っていた。`@page` margin を `var(--pm-margin, <既定値>)` 化し、解決済み margin（`--margin` フラグ優先 > brand token）を `--pm-margin` に流すことで、PDF（@page）と PNG（screen padding）が同一変数を参照して常に一致するようにした。`--margin` は CSS 注入防止のため単位付き長さ / 0 のみ許可（不正値は `INVALID_OPTION`）

## [0.4.1] - 2026-06-12

### Fixed
- Markdown 入力の PNG 出力に余白が一切付かなかったのを修正（`@page` の margin は印刷=PDF にしか効かないため、screen 側に同じ余白の `body` padding を追加）。brand の `margin` token も `--pm-margin` 経由で PNG に反映される

## [0.4.0] - 2026-06-11

### Added
- brand profile 機構: `brand.md`（YAML風 frontmatter）で色・書体・余白・用紙を一度定義すると Markdown 変換すべてに自動適用
  - 探索順 `--brand <path>` > `./pdfmint.brand.md` > `~/.config/pdfmint/brand.md`（`XDG_CONFIG_HOME` 対応）、`--no-brand` で無効化
  - token: `accent` / `ink` / `font_size` / `line_height`（CSS custom property 経由）、`font` / `paper` / `margin`（既存オプションへ反映）
  - 優先順位は 明示 CLI フラグ > brand token > 既定値
  - 変換結果 JSON に `brand: { source, applied }`、不正時は `BRAND_INVALID`

### Changed
- preset / 既定 Markdown CSS をブランド token 対応の CSS custom property（`var(--pm-*, <既定値>)`）化（brand 未指定時のレンダリングは不変）
- `--preset report` を納品書類向けに再設計: 見出しは線でなくウェイトと余白で階層化（アクセントは h2 文字色のみ、既定色を緑 `#4a6741` → 深緑 `#395437`）、表は booktabs 風横罫線のみ + `tabular-nums`、表・コード・引用に改ページ制御（`break-inside: avoid`）。preset なしの既定 CSS は不変

### Fixed
- Markdown のテーブル揃え記法（`|---:|` / `|:---:|`）が全 preset で無視されていたのを修正（CSS の `text-align: left` が marked の `align` 属性を上書きしていた）

## [0.3.0] - 2026-06-10

### Added
- `pdfmint convert` サブコマンド（`pdfmint <input> <output>` は互換 alias として維持）
- `docs/troubleshooting.md`（環境診断・復旧手順）
- `src/presets/*.css` による Markdown preset スタイルのファイル分離
- `pdfmint doctor` コマンド（Node / Chromium / サンプル変換の診断、`--json` 対応）
- Markdown 向け `--preset memo|report|letter`（シンプルな書類スタイル）
- エラー JSON に `next_command` / `verify_command`（エージェント自動復旧向け）
- 変換結果 JSON に `timing`（`browser_launch_ms`, `goto_ms`, `pdf_ms`, `png_ms`）
- batch 結果 JSON に `browser_reused: true`

### Changed
- 主要モジュールに prepare / render / verify 層の責務コメントを追加
- batch 変換で Chromium セッションを再利用（起動コストを1回に集約）
- 出力ディレクトリを自動作成（`mkdir -p` 相当）
- ローカル `file://` HTML の読み込みを `domcontentloaded` に変更（待ち時間短縮）
- システム Google Chrome（`channel: chrome`）を優先起動、`PUPPETEER_EXECUTABLE_PATH` もサポート
- README と package description の導入説明を、成果物・AIエージェント連携・品質チェックが伝わる内容に更新

## [0.2.2] - 2026-06-05

### Fixed
- 未知のCLIオプション、値不足、不正な `--format`、余分なpositional引数を変換前に `INVALID_OPTION` として検出

## [0.2.1] - 2026-06-05

### Changed
- `glob` を 13系へ更新し、install時のdeprecated warningを解消
- `marked` / `puppeteer` / `@types/bun` / `typescript` を最新互換版へ更新

## [0.2.0] - 2026-06-05

### Added
- 同じ入力からPDFと高解像度PNGを生成する `--png` / `--viewport` / `--scale`
- 生成PDFのページ数を検証する `--expect-pages`
- Markdown入力向け日本語フォントpreset `--font sans|serif`
- Markdown入力向け外部CSS指定 `--css <file.css>`
- npm packageの内容とinstall後CLIを確認する `pack:smoke`

### Changed
- Markdownの既定フォントをNoto Sans JP優先に変更し、Hiragino/Yu/Meiryoをfallbackとして維持
- HTML/Markdownの一時レンダリング処理を分離し、PDF/PNG生成の責務を整理
- AIエージェント向けREADME / AGENTS / Skillの利用手順を更新

## [0.1.0] - 2026-05-07

### Added
- HTML → PDF 変換（Puppeteer ベース）
- Markdown → PDF 変換（marked ベース、デフォルトで日本語フォント対応CSS）
- バッチ処理（glob パターンで複数ファイル一括変換）
- `--json` 構造化出力（成功・失敗・パス情報）
- 構造化エラー（`code` + `message` + `hint` + `context`）
- AIエージェント向けドキュメント `AGENTS.md`
- Claude Code Skill 同梱（`skills/pdfmint/SKILL.md`）
- Bun + TypeScript で開発、Node.js 互換 ESM にバンドル配布
