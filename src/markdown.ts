/** prepare 層: Markdown を preset/legacy CSS 付き HTML に変換する。 */
import { Marked } from "marked"
import markedFootnote from "marked-footnote"
import { markedHighlight } from "marked-highlight"
import hljs from "highlight.js/lib/common"
import markedAlert from "marked-alert"
import { presetCss, type MarkdownPreset } from "./presets/index"
import { fontFaceCss } from "./fonts/index"
import { FONT_STACKS, type MarkdownFontPreset } from "./fonts/stacks"

export type { MarkdownFontPreset } from "./fonts/stacks"

export interface MarkdownOptions {
  font?: MarkdownFontPreset
  preset?: MarkdownPreset
  customCss?: string
  cssPath?: string
  /** brand profile 由来の :root 変数ブロック。常に先頭へ prepend する。 */
  brandCss?: string
}

/** 拡張記法 (脚注 / GitHub callout / シンタックスハイライト) を有効化した marked インスタンス。
 *  preset/legacy/custom いずれの CSS でも同じ HTML 構造が出るよう 1 つを共有する。 */
const md_ = new Marked()
  .use(
    markedHighlight({
      langPrefix: "hljs language-",
      highlight(code, lang) {
        const language = lang && hljs.getLanguage(lang) ? lang : "plaintext"
        return hljs.highlight(code, { language }).value
      },
    })
  )
  .use(markedFootnote())
  .use(markedAlert())

/** 拡張要素 (footnotes/alert + hljs テーマ) の見た目。preset 非依存なので常に注入する。 */
const EXTENSIONS_CSS = `
/* 脚注 */
.footnotes { font-size: 0.85em; color: #555; margin-top: 2.5em; padding-top: 0.6em; border-top: 1px solid #ddd; break-inside: avoid; }
.footnotes .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
.footnotes ol { padding-left: 1.2em; margin: 0; }
.footnotes li { margin: 0.2em 0; }
sup a[data-footnote-ref] { text-decoration: none; padding: 0 0.15em; }
a[data-footnote-backref] { text-decoration: none; }
/* GitHub callout (admonition) */
.markdown-alert { padding: 0.6em 1em; margin: 1.1em 0; border-left: 4px solid #888; background: #f6f8fa; border-radius: 4px; break-inside: avoid; }
.markdown-alert > :first-child { margin-top: 0; }
.markdown-alert > :last-child { margin-bottom: 0; }
.markdown-alert-title { display: flex; align-items: center; font-weight: 600; margin-bottom: 0.3em; }
.markdown-alert-title svg { fill: currentColor; margin-right: 0.4em; }
/* note は差し色 (--pm-accent = 深緑) で統一: 縦バー＝深緑、地＝淡い深緑、タイトル＝深緑。 */
.markdown-alert-note { border-left-color: var(--pm-accent, #2f5d4e); background-color: color-mix(in srgb, var(--pm-accent, #2f5d4e) 7%, #ffffff); }
.markdown-alert-note .markdown-alert-title { color: var(--pm-accent, #2f5d4e); }
.markdown-alert-tip { border-left-color: #1a7f37; } .markdown-alert-tip .markdown-alert-title { color: #1a7f37; }
.markdown-alert-important { border-left-color: #8250df; } .markdown-alert-important .markdown-alert-title { color: #8250df; }
.markdown-alert-warning { border-left-color: #9a6700; } .markdown-alert-warning .markdown-alert-title { color: #9a6700; }
.markdown-alert-caution { border-left-color: #cf222e; } .markdown-alert-caution .markdown-alert-title { color: #cf222e; }
/* highlight.js (GitHub light テーマ・最小) */
.hljs { color: #24292e; background: transparent; }
.hljs-comment, .hljs-quote { color: #6a737d; }
.hljs-keyword, .hljs-selector-tag, .hljs-doctag, .hljs-formula { color: #d73a49; }
.hljs-string, .hljs-meta .hljs-string, .hljs-regexp { color: #032f62; }
.hljs-number, .hljs-literal { color: #005cc5; }
.hljs-built_in, .hljs-class .hljs-title, .hljs-title.class_ { color: #6f42c1; }
.hljs-variable, .hljs-template-variable, .hljs-attr, .hljs-attribute { color: #005cc5; }
.hljs-section, .hljs-name, .hljs-selector-id, .hljs-selector-class { color: #22863a; }
.hljs-symbol, .hljs-bullet, .hljs-link { color: #e36209; }
.hljs-title, .hljs-title.function_ { color: #6f42c1; }
.hljs-emphasis { font-style: italic; } .hljs-strong { font-weight: bold; }
.hljs-addition { color: #22863a; background: #f0fff4; }
.hljs-deletion { color: #b31d28; background: #ffeef0; }
`

/** Legacy default CSS (--font sans without --preset). */
function legacyDefaultCss(font: MarkdownFontPreset): string {
  return `
@page { size: A4; margin: var(--pm-margin, 20mm); }
body {
  font-family: ${FONT_STACKS[font]};
  font-size: var(--pm-font-size, 11pt);
  line-height: var(--pm-line-height, 1.7);
  color: var(--pm-ink, #1a1a1a);
}
/* 差し色は深緑 (--pm-accent) で統一。明色は color-mix で派生する (brand で accent を変えると全体が追従)。
   見出しはページ末で孤立させない (break-after: avoid)。 */
h1, h2, h3, h4 { color: var(--pm-ink, #222); margin-top: 1.5em; break-after: avoid; }
h1 { font-size: 20pt; border-bottom: 2px solid var(--pm-accent, #2f5d4e); padding-bottom: 0.2em; }
h2 { font-size: 16pt; border-left: 4px solid var(--pm-accent, #2f5d4e); padding-left: 0.5em; }
h3 { font-size: 14pt; color: color-mix(in srgb, var(--pm-ink, #222) 70%, var(--pm-accent, #2f5d4e)); }
a { color: var(--pm-accent, #2f5d4e); }
p { margin: 0.5em 0; }
ul, ol { padding-left: 1.5em; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
th[align="center"], td[align="center"] { text-align: center; }
th[align="right"], td[align="right"] { text-align: right; }
/* 表ヘッダも深緑テーマに揃える (淡い深緑地 + 深緑の下罫線)。 */
th { background: color-mix(in srgb, var(--pm-accent, #2f5d4e) 8%, #ffffff); border-bottom: 2px solid var(--pm-accent, #2f5d4e); font-weight: 600; }
code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: "SFMono-Regular", "Menlo", monospace; }
pre { background: #f4f4f4; padding: 12px; border-radius: 4px; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; overflow-x: visible; }
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
  // EXTENSIONS_CSS は preset 非依存の拡張要素 (脚注/callout/hljs) の土台。preset/custom より前に置き上書きを許す。
  // 同梱 font の @font-face は最先頭に置き、preset/legacy/custom いずれの経路でも "Noto Sans JP" /
  // "Noto Serif JP" が同梱版に解決されるようにする (font-family 文字列は変えない)。
  const brand = options.brandCss ?? ""
  const base = fontFaceCss() + "\n" + brand + EXTENSIONS_CSS
  if (options.customCss) return base + options.customCss
  const font = options.font ?? "sans"
  if (options.preset) {
    const effectiveFont = options.preset === "letter" ? (options.font ?? "serif") : font
    return base + presetCss(options.preset, effectiveFont)
  }
  return base + legacyDefaultCss(font)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** 入力 Markdown 先頭の frontmatter を除去し、title を取り出す。
 *  brand.md と違い未知 key は全て無視 (本文に漏らさないことが目的)。 */
function stripFrontmatter(md: string): { body: string; title?: string } {
  const normalized = md.replace(/^﻿/, "")
  const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(normalized)
  if (!match) return { body: md }
  const body = normalized.slice(match[0].length)
  let title: string | undefined
  for (const raw of match[1]!.split("\n")) {
    const line = raw.trim()
    const colon = line.indexOf(":")
    if (colon === -1) continue
    if (line.slice(0, colon).trim() === "title") {
      let value = line.slice(colon + 1).trim()
      if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
        value = value.slice(1, -1)
      }
      if (value) title = value
      break
    }
  }
  return { body, title }
}

export function markdownToHtml(md: string, options: MarkdownOptions | string = {}): string {
  const { body: source, title } = stripFrontmatter(md)
  const body = md_.parse(source, { async: false }) as string
  const resolvedOptions = typeof options === "string" ? { customCss: options } : options
  const css = resolveCss(resolvedOptions)
  const docTitle = title ? escapeHtml(title) : "Document"
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`
}
