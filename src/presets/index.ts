/** prepare 層: Markdown 向け preset CSS をファイルから組み立てる。 */
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { MarkdownFontPreset } from "../markdown"

export type MarkdownPreset = "memo" | "report" | "letter"

export const MARKDOWN_PRESETS = ["memo", "report", "letter"] as const

// CSS の所在は実行形態で変わる:
//   source 実行 (bun src/cli.ts)  … この index.ts と同階層 (src/presets/*.css)
//   bundle 実行 (node dist/cli.js) … バンドルされた cli.js から見て presets/ サブディレクトリ (dist/presets/*.css)
// import.meta.url の dirname は前者では src/presets、後者では dist を指すため、両候補を探索する。
const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const CSS_DIRS = [MODULE_DIR, join(MODULE_DIR, "presets")]

const FONT_STACKS: Record<MarkdownFontPreset, string> = {
  sans: `"Noto Sans JP", "Noto Sans CJK JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif`,
  serif: `"Noto Serif JP", "Noto Serif CJK JP", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif`,
}

const PRESET_VARS: Record<MarkdownPreset, { fontSize: string; lineHeight: string }> = {
  memo: { fontSize: "11pt", lineHeight: "1.7" },
  report: { fontSize: "10.5pt", lineHeight: "1.65" },
  letter: { fontSize: "11pt", lineHeight: "1.8" },
}

function readCssFile(name: string): string {
  for (const dir of CSS_DIRS) {
    const path = join(dir, name)
    if (existsSync(path)) return readFileSync(path, "utf-8")
  }
  // どちらにも無ければ最初の候補で読み、自然な ENOENT を投げる。
  return readFileSync(join(CSS_DIRS[0]!, name), "utf-8")
}

function applyVars(template: string, font: MarkdownFontPreset, preset: MarkdownPreset): string {
  const vars = PRESET_VARS[preset]
  return template
    .replaceAll("{{font-family}}", FONT_STACKS[font])
    .replaceAll("{{font-size}}", vars.fontSize)
    .replaceAll("{{line-height}}", vars.lineHeight)
}

export function presetCss(preset: MarkdownPreset, font: MarkdownFontPreset = "sans"): string {
  const shared = applyVars(readCssFile("shared.css"), font, preset)
  const specific = readCssFile(`${preset}.css`)
  return `${shared}\n${specific}`
}
