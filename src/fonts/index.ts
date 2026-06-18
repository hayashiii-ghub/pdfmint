/** prepare 層: 同梱日本語フォント (Noto Sans/Serif JP) を @font-face として供給する。
 *
 *  出力の再現性のために font を同梱する: システムにインストールされた font に依存すると、
 *  Noto が無い環境では Hiragino 等にフォールバックして見た目が変わってしまう。@font-face の
 *  family 名を FONT_STACKS 先頭の "Noto Sans JP" / "Noto Serif JP" と一致させることで、
 *  font-family 文字列を変えずに全 preset が同梱 font に解決される (web font は同名のシステム
 *  font に優先する)。
 *
 *  注意: これは「再現性」のための同梱であって「軽量化」ではない。Chromium の page.pdf() は
 *  CJK グリフを Type3 font として焼くため、どの font を同梱しても PDF のサイズは変わらない。
 *  詳細は docs/troubleshooting.md を参照。 */
import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

// font ファイルの所在は実行形態で変わる (presets/index.ts と同じ二候補方式):
//   source 実行 (bun src/cli.ts)  … この index.ts と同階層 (src/fonts/*.ttf)
//   bundle 実行 (node dist/cli.js) … バンドルされた cli.js から見て fonts/ サブディレクトリ (dist/fonts/*.ttf)
const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
const FONT_DIRS = [MODULE_DIR, join(MODULE_DIR, "fonts")]

function resolveFontPath(file: string): string {
  for (const dir of FONT_DIRS) {
    const path = join(dir, file)
    if (existsSync(path)) return path
  }
  // どちらにも無ければ最初の候補を返す (file:// が解決できず font はシステムへフォールバックする)。
  return join(FONT_DIRS[0]!, file)
}

interface BundledFont {
  family: string
  file: string
}

const BUNDLED_FONTS: BundledFont[] = [
  { family: "Noto Sans JP", file: "NotoSansJP.ttf" },
  { family: "Noto Serif JP", file: "NotoSerifJP.ttf" },
]

/** 同梱 font の @font-face 宣言群を返す。CSS の先頭に注入する。
 *  variable font (wght 100..900) を 1 family 1 ファイルで持つため weight ごとの宣言は不要。 */
export function fontFaceCss(): string {
  return BUNDLED_FONTS.map(({ family, file }) => {
    const url = pathToFileURL(resolveFontPath(file)).href
    return `@font-face { font-family: "${family}"; src: url("${url}") format("truetype"); font-weight: 100 900; font-style: normal; font-display: block; }`
  }).join("\n")
}
