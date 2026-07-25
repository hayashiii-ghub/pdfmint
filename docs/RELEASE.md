# リリース

`v*` タグをpushすると、GitHub Actionsが検証、npm公開、GitHub Release作成を行います。

1. `package.json` と `CHANGELOG.md` のバージョンを更新する
2. `bun run typecheck && bun test && bun run build && bun run pack:smoke` を通す
3. 変更を `main` へpushし、CI成功を確認する
4. annotated tagを作成してpushする

```bash
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

npm公開にはGitHub ActionsのOIDC Trusted Publishingを使用します。対象バージョンがすでにnpmへ存在する場合は公開をスキップし、GitHub Release作成まで続行します。

```bash
git tag -l 'v*' --sort=version:refname
npm view @hayashiii/pdfmint version
gh release view vX.Y.Z
```
