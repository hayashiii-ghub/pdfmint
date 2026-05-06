# Changelog

すべての注目すべき変更点はこのファイルに記録されます。

このプロジェクトは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に従い、
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) を採用しています。

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
