/** 選択した日本語フォントをローカル資産から供給する。 */
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { DEFAULT_DOCUMENT_FONT, FONT_PROFILES, type DocumentFont } from "./stacks"

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const FONT_DIRS = [MODULE_DIR, join(MODULE_DIR, "fonts")]

function resolveFontPath(file: string): string {
  for (const dir of FONT_DIRS) {
    const path = join(dir, file)
    if (existsSync(path)) return path
  }
  return join(FONT_DIRS[0]!, file)
}

export function fontFaceCss(font: DocumentFont = DEFAULT_DOCUMENT_FONT): string {
  const profile = FONT_PROFILES[font]
  return profile.faces
    .map(({ file, weight }) => {
      const url = pathToFileURL(resolveFontPath(file)).href
      return `@font-face { font-family: "${profile.family}"; src: url("${url}") format("truetype"); font-weight: ${weight}; font-style: normal; font-display: block; }`
    })
    .join("\n")
}
