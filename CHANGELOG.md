# Changelog

すべての注目すべき変更点はこのファイルに記録されます。

このプロジェクトは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に従い、
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) を採用しています。

## [Unreleased]

### Added
- brand profile 機構: `brand.md`（YAML風 frontmatter）で色・書体・余白・用紙を一度定義すると Markdown 変換すべてに自動適用
  - 探索順 `--brand <path>` > `./pdfmint.brand.md` > `~/.config/pdfmint/brand.md`（`XDG_CONFIG_HOME` 対応）、`--no-brand` で無効化
  - token: `accent` / `ink` / `font_size` / `line_height`（CSS custom property 経由）、`font` / `paper` / `margin`（既存オプションへ反映）
  - 優先順位は 明示 CLI フラグ > brand token > 既定値
  - 変換結果 JSON に `brand: { source, applied }`、不正時は `BRAND_INVALID`

### Changed
- preset / 既定 Markdown CSS をブランド token 対応の CSS custom property（`var(--pm-*, <既定値>)`）化（brand 未指定時のレンダリングは不変）

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
