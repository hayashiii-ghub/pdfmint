import { test, expect } from "bun:test"
import { markdownToHtml } from "../src/markdown"
import { DOCUMENT_FONTS, FONT_PROFILES } from "../src/fonts/stacks"

test("既定はZen Kaku Gothic New", () => {
  const html = markdownToHtml("# テスト")
  expect(html).toContain('font-family: "Zen Kaku Gothic New"')
  expect(html).toContain('font-family: "Zen Kaku Gothic New",')
})

test("4書体を選べる", () => {
  for (const font of DOCUMENT_FONTS) {
    const html = markdownToHtml("# テスト", { font })
    expect(html).toContain(`font-family: "${FONT_PROFILES[font].family}"`)
    expect(html).not.toContain("Noto Sans JP")
    expect(html).not.toContain("Noto Serif JP")
  }
})

test("選択書体の実ウェイトを見出し・本文・強調へ適用する", () => {
  const html = markdownToHtml("# 見出し\n\n**強調**", { font: "shippori" })
  expect(html).toContain("font-weight: 400")
  expect(html).toContain("font-weight: 600")
  expect(html).toContain("font-weight: 700")
})

test("marginはPDFとPNGで同じCSS変数を参照する", () => {
  const html = markdownToHtml("# x", { margin: "30mm" })
  expect(html).toContain(":root { --pm-margin: 30mm; }")
  expect(html).toContain("@page { size: A4; margin: var(--pm-margin, 20mm); }")
  expect(html).toContain("padding: var(--pm-margin, 20mm)")
})

test("custom CSSは既定組版の後ろへ重ねる", () => {
  const custom = "body { color: rebeccapurple; }"
  const html = markdownToHtml("# x", { customCss: custom })
  expect(html).toContain("Zen Kaku Gothic New")
  expect(html.indexOf(custom)).toBeGreaterThan(html.indexOf("@page"))
})

test("frontmatterを本文に漏らさずtitleへ反映する", () => {
  const html = markdownToHtml("---\ntitle: テスト文書\nauthor: X\n---\n\n# 見出し")
  expect(html).toContain("<title>テスト文書</title>")
  expect(html).not.toContain("author: X")
  expect(html).toContain("<h1>見出し</h1>")
})

test("脚注・callout・syntax highlightを変換する", () => {
  const html = markdownToHtml("本文[^1]\n\n[^1]: 注釈\n\n> [!NOTE]\n> 補足\n\n```ts\nconst x = 1\n```")
  expect(html).toContain('class="footnotes"')
  expect(html).toContain("markdown-alert-note")
  expect(html).toContain('class="hljs language-ts"')
})

test("Markdownの表揃えを尊重する", () => {
  const html = markdownToHtml("| A | B |\n|---|---:|\n| x | 1,234 |")
  expect(html).toContain('align="right"')
  expect(html).toContain('td[align="right"] { text-align: right; }')
})

test("長いコード行をPDF幅に折り返す", () => {
  const html = markdownToHtml("```text\nlong line\n```")
  expect(html).toContain("white-space: pre-wrap")
  expect(html).toContain("overflow-wrap: anywhere")
  expect(html).toContain("word-break: break-word")
})

test("完全なHTMLドキュメントを返す", () => {
  const html = markdownToHtml("# テスト")
  expect(html.startsWith("<!DOCTYPE html>")).toBe(true)
  expect(html.endsWith("</html>")).toBe(true)
})
