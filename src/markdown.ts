/** Markdownを共通文書CSSと選択フォント付きHTMLへ変換する。 */
import { Marked } from "marked"
import markedFootnote from "marked-footnote"
import { markedHighlight } from "marked-highlight"
import hljs from "highlight.js/lib/common"
import markedAlert from "marked-alert"
import { fontFaceCss } from "./fonts/index"
import {
  DEFAULT_DOCUMENT_FONT,
  FONT_PROFILES,
  FONT_STACKS,
  type DocumentFont,
} from "./fonts/stacks"

export type { DocumentFont } from "./fonts/stacks"

export interface MarkdownOptions {
  font?: DocumentFont
  customCss?: string
  margin?: string
}

/** 脚注・GitHub callout・シンタックスハイライトを有効化したmarkedインスタンス。 */
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

/** footnotes / alert / highlight.jsの共通スタイル。 */
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

/** 全書体で共有する文書スタイル。書体固有値はweightだけに限定する。 */
function defaultCss(font: DocumentFont): string {
  const profile = FONT_PROFILES[font]
  return `
@page { size: A4; margin: var(--pm-margin, 20mm); }
body {
  font-family: ${FONT_STACKS[font]};
  font-weight: ${profile.normal};
  font-size: var(--pm-font-size, 11pt);
  line-height: var(--pm-line-height, 1.7);
  color: var(--pm-ink, #1a1a1a);
}
/* 差し色は深緑 (--pm-accent) で統一し、明色はcolor-mixで派生する。
   見出しはページ末で孤立させない (break-after: avoid)。 */
h1, h2, h3, h4 { color: var(--pm-ink, #222); margin-top: 1.5em; break-after: avoid; font-weight: ${profile.extra}; }
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
th { background: color-mix(in srgb, var(--pm-accent, #2f5d4e) 8%, #ffffff); border-bottom: 2px solid var(--pm-accent, #2f5d4e); font-weight: ${profile.bold}; }
strong, b { font-weight: ${profile.bold}; }
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
  const font = options.font ?? DEFAULT_DOCUMENT_FONT
  const margin = options.margin ? `:root { --pm-margin: ${options.margin}; }\n` : ""
  // custom CSSは既定スタイルの後ろへ重ね、フォント・拡張記法・基本組版を失わず上書きできるようにする。
  return fontFaceCss(font) + "\n" + margin + EXTENSIONS_CSS + defaultCss(font) + (options.customCss ?? "")
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** 入力Markdown先頭のfrontmatterを除去し、titleを取り出す。未知keyは無視する。 */
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
