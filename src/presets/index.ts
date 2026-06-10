/** prepare 層: Markdown 向け preset CSS をファイルから組み立てる。 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { MarkdownFontPreset } from "../markdown"

export type MarkdownPreset = "memo" | "report" | "letter"

export const MARKDOWN_PRESETS = ["memo", "report", "letter"] as const

const PRESETS_DIR = join(dirname(fileURLToPath(import.meta.url)))

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
  return readFileSync(join(PRESETS_DIR, name), "utf-8")
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
