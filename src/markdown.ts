/** prepare 層: Markdown を preset/legacy CSS 付き HTML に変換する。 */
import { marked } from "marked"
import { presetCss, type MarkdownPreset } from "./presets/index"

export type MarkdownFontPreset = "sans" | "serif"

export interface MarkdownOptions {
  font?: MarkdownFontPreset
  preset?: MarkdownPreset
  customCss?: string
  cssPath?: string
  /** brand profile 由来の :root 変数ブロック。常に先頭へ prepend する。 */
  brandCss?: string
}

const FONT_STACKS: Record<MarkdownFontPreset, string> = {
  sans: `"Noto Sans JP", "Noto Sans CJK JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif`,
  serif: `"Noto Serif JP", "Noto Serif CJK JP", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif`,
}

/** Legacy default CSS (--font sans without --preset). */
function legacyDefaultCss(font: MarkdownFontPreset): string {
  return `
@page { size: A4; margin: 20mm; }
body {
  font-family: ${FONT_STACKS[font]};
  font-size: var(--pm-font-size, 11pt);
  line-height: var(--pm-line-height, 1.7);
  color: var(--pm-ink, #1a1a1a);
}
h1, h2, h3, h4 { color: var(--pm-ink, #222); margin-top: 1.5em; }
h1 { font-size: 20pt; border-bottom: 2px solid #333; padding-bottom: 0.2em; }
h2 { font-size: 16pt; border-left: 4px solid var(--pm-accent, #4a6741); padding-left: 0.5em; }
h3 { font-size: 14pt; }
p { margin: 0.5em 0; }
ul, ol { padding-left: 1.5em; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
th[align="center"], td[align="center"] { text-align: center; }
th[align="right"], td[align="right"] { text-align: right; }
th { background: #f5f5f5; }
code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: "SFMono-Regular", "Menlo", monospace; }
pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto; }
pre code { background: none; padding: 0; }
blockquote { border-left: 4px solid #ddd; padding-left: 1em; color: #666; margin: 1em 0; }
/* PNG (screen) 用の余白: @page は印刷にしか効かないため、screen では同じ余白を padding で再現する。 */
@media screen {
  body { margin: 0; padding: var(--pm-margin, 20mm); box-sizing: border-box; }
}
`
}

function resolveCss(options: MarkdownOptions): string {
  // brand の :root 変数は customCss escape hatch でも参照できるよう常に先頭に置く。
  const brand = options.brandCss ?? ""
  if (options.customCss) return brand + options.customCss
  const font = options.font ?? "sans"
  if (options.preset) {
    const effectiveFont = options.preset === "letter" ? (options.font ?? "serif") : font
    return brand + presetCss(options.preset, effectiveFont)
  }
  return brand + legacyDefaultCss(font)
}

export function markdownToHtml(md: string, options: MarkdownOptions | string = {}): string {
  const body = marked.parse(md, { async: false }) as string
  const resolvedOptions = typeof options === "string" ? { customCss: options } : options
  const css = resolveCss(resolvedOptions)
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>Document</title>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`
}
