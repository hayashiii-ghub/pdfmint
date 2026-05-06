import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

export function getVersion(): string {
  // package.json は dist/cli.js から見て ../package.json (publish時)
  // 開発時は src/version.ts から見て ../package.json
  const here = fileURLToPath(import.meta.url)
  const candidates = [
    join(here, "..", "..", "package.json"), // src/version.ts → ../package.json
    join(here, "..", "package.json"),       // dist/cli.js → ../package.json
  ]
  for (const path of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(path, "utf-8"))
      if (pkg.name === "@hayashiii/pdfmint") {
        return pkg.version
      }
    } catch {
      // 次の候補を試す
    }
  }
  return "0.0.0-unknown"
}
