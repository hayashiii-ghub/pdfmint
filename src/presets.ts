import type { MarkdownFontPreset } from "./markdown"

export type MarkdownPreset = "memo" | "report" | "letter"

const FONT_STACKS: Record<MarkdownFontPreset, string> = {
  sans: `"Noto Sans JP", "Noto Sans CJK JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif`,
  serif: `"Noto Serif JP", "Noto Serif CJK JP", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif`,
}

function baseBody(font: MarkdownFontPreset, size: string, lineHeight: string): string {
  return `
body {
  font-family: ${FONT_STACKS[font]};
  font-size: ${size};
  line-height: ${lineHeight};
  color: #1a1a1a;
}
p { margin: 0.5em 0; }
ul, ol { padding-left: 1.5em; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
th { background: #f5f5f5; }
code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: "SFMono-Regular", "Menlo", monospace; }
pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto; }
pre code { background: none; padding: 0; }
`
}

const PRESET_BUILDERS: Record<
  MarkdownPreset,
  (font: MarkdownFontPreset) => string
> = {
  memo: (font) => `
@page { size: A4; margin: 20mm; }
${baseBody(font, "11pt", "1.7")}
h1, h2, h3, h4 { color: #222; margin-top: 1.4em; }
h1 { font-size: 18pt; border-bottom: 1px solid #ccc; padding-bottom: 0.2em; }
h2 { font-size: 14pt; }
h3 { font-size: 12pt; }
blockquote { border-left: 4px solid #ddd; padding-left: 1em; color: #666; margin: 1em 0; }
`,
  report: (font) => `
@page { size: A4; margin: 18mm; }
${baseBody(font, "10.5pt", "1.65")}
h1, h2, h3, h4 { color: #1a1a1a; margin-top: 1.6em; }
h1 { font-size: 20pt; border-bottom: 2px solid #333; padding-bottom: 0.2em; }
h2 { font-size: 16pt; border-left: 4px solid #4a6741; padding-left: 0.5em; }
h3 { font-size: 14pt; }
blockquote { border-left: 4px solid #4a6741; padding-left: 1em; color: #444; margin: 1em 0; }
`,
  letter: (font) => `
@page { size: A4; margin: 25mm; }
${baseBody(font, "11pt", "1.8")}
h1, h2, h3 { color: #111; margin-top: 1.2em; font-weight: normal; }
h1 { font-size: 16pt; text-align: center; border: none; margin-bottom: 1.5em; }
h2 { font-size: 12pt; }
p { text-indent: 0; }
blockquote { border-left: 2px solid #999; padding-left: 1em; color: #555; margin: 1.2em 0; }
`,
}

export function presetCss(preset: MarkdownPreset, font: MarkdownFontPreset = "sans"): string {
  return PRESET_BUILDERS[preset](font)
}

export const MARKDOWN_PRESETS = ["memo", "report", "letter"] as const
