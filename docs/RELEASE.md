# リリース手順（ブランチ・タグ）

## ブランチ

| ブランチ | 用途 | 寿命 |
|----------|------|------|
| `main` | 本番。npm `latest` のソース | 常設 |
| `feat/<topic>` | 機能・修正の PR 用 | マージ後に削除 |
| `fix/<topic>` | 緊急修正の PR 用 | マージ後に削除 |

ルール:

- 直接 `main` へ push するのは **リリースコミット**（`chore(release): bump to vX.Y.Z`）と、ドキュメントのみの軽微修正に限る。機能変更は PR 経由。
- マージ済みの `feat/*` / `fix/*` はリモート・ローカルとも削除してよい。
- デフォルトブランチは `main`（`origin/HEAD` → `origin/main`）。

## タグ

| 項目 | 仕様 |
|------|------|
| 形式 | `v{major}.{minor}.{patch}`（例: `v0.3.0`） |
| 付与先 | `chore(release): bump to vX.Y.Z` のコミット **1 つ** |
| 種別 | annotated tag（`git tag -a v0.3.0 -m "v0.3.0"`） |
| 対応 | `package.json` の `version`、`CHANGELOG.md` の `[X.Y.Z]` と一致 |

`npm publish` 前にタグを付け、`git push origin vX.Y.Z` する。ビルド修正などリリース後のコミットはタグに含めない。

## リリース手順

```bash
# 1. main が green であることを確認
bun test && bun run typecheck && bun run build

# 2. バージョン更新
#    - package.json の version
#    - CHANGELOG.md: [Unreleased] を [X.Y.Z] - YYYY-MM-DD に移動

git add package.json CHANGELOG.md
git commit -m "chore(release): bump to vX.Y.Z"
git push origin main

# 3. タグ
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z

# 4. npm 公開（prepublishOnly が test / build / pack:smoke を実行）
npm publish

# 5. マージ済み feature ブランチの削除（任意）
git push origin --delete feat/some-topic
git branch -d feat/some-topic
```

## バージョンと CHANGELOG

- [Semantic Versioning](https://semver.org/) + [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/)
- 未公開の変更は `CHANGELOG.md` の `[Unreleased]` に集約
- `pdfmint --version` は `package.json` を読む（`src/version.ts`）

## 現在のタグ一覧（確認）

```bash
git tag -l 'v*' --sort=version:refname
npm view @hayashiii/pdfmint version
```

両方のバージョンが一致していること。
