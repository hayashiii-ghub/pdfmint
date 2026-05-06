import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

export function getVersion(): string {
  // path.join はファイル名を含む here の最後の segment を ".." で打ち消すので、
  // src/version.ts の場合: ../../package.json → リポジトリルート
  // dist/cli.js の場合（publish時）: ../../package.json → パッケージルート
  // 両ケースで同じ相対パスが使える
  const here = fileURLToPath(import.meta.url)
  const packageJsonPath = join(here, "..", "..", "package.json")
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
    if (pkg.name === "@hayashiii/pdfmint") {
      return pkg.version
    }
  } catch {
    // package.json が見つからない / パースエラー → fallback
  }
  return "0.0.0-unknown"
}
