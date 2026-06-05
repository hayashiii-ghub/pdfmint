# Changelog

すべての注目すべき変更点はこのファイルに記録されます。

このプロジェクトは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に従い、
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) を採用しています。

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
