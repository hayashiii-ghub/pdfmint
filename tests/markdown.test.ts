import { test, expect } from "bun:test"
import { markdownToHtml } from "../src/markdown"

test("全 preset と legacy の @page margin は --pm-margin を参照する（既定値は fallback）", () => {
  const cases = [
    { preset: undefined, def: "20mm" },
    { preset: "memo", def: "20mm" },
    { preset: "report", def: "18mm" },
    { preset: "letter", def: "25mm" },
  ] as const
  for (const { preset, def } of cases) {
    const html = markdownToHtml("# x", preset ? { preset } : {})
    expect(html).toContain(`margin: var(--pm-margin, ${def})`)
  }
})

test("--pm-margin は @page(PDF) と @media screen(PNG) の両方に効く（同一変数を参照）", () => {
  const brandCss = ":root { --pm-margin: 40mm; }\n"
  for (const preset of [undefined, "memo", "report", "letter"] as const) {
    const html = markdownToHtml("# x", preset ? { preset, brandCss } : { brandCss })
    expect(html).toContain("--pm-margin: 40mm")
    const pageRule = html.match(/@page\s*{[^}]*}/)?.[0] ?? ""
    expect(pageRule).toContain("var(--pm-margin,")
    expect(html).toContain("padding: var(--pm-margin,")
  }
})

test("NOTE callout の差し色は --pm-accent 由来（brand accent で追従する）", () => {
  const html = markdownToHtml("> [!NOTE]\n> x")
  expect(html).toContain(".markdown-alert-note")
  // タイトル色が accent からの color-mix 派生（深緑）になっている
  expect(html).toContain(".markdown-alert-note .markdown-alert-title { color: color-mix(in srgb, var(--pm-accent")
})

test("見出しに break-after: avoid（ページ末で見出しだけ孤立させない）", () => {
  const html = markdownToHtml("# x")
  expect(html).toContain("break-after: avoid")
})

test("frontmatter を本文に漏らさず title を <title> に反映する", () => {
  const md = "---\ntitle: テスト文書\nauthor: X\n---\n\n# 見出し\n\n本文"
  const html = markdownToHtml(md)
  // frontmatter は本文に出ない (--- が <hr>、key:value が <h2> にならない)
  expect(html).not.toContain("author: X")
  expect(html).not.toContain("<hr>")
  expect(html).toContain("<h1>見出し</h1>")
  // title を文書タイトルに使う
  expect(html).toContain("<title>テスト文書</title>")
})

test("frontmatter が無いときは <title>Document</title> のまま", () => {
  const html = markdownToHtml("# 見出し")
  expect(html).toContain("<title>Document</title>")
})

test("脚注 [^1] を section.footnotes に変換する", () => {
  const md = "本文[^1]\n\n[^1]: 注釈テキスト"
  const html = markdownToHtml(md)
  expect(html).toContain('class="footnotes"')
  expect(html).toContain("data-footnote-ref")
  expect(html).toContain("注釈テキスト")
})

test("コードブロックを hljs でシンタックスハイライトする", () => {
  const md = "```ts\nconst x = 1\n```"
  const html = markdownToHtml(md)
  expect(html).toContain('class="hljs language-ts"')
  expect(html).toContain("hljs-keyword")
})

test("GitHub callout (> [!NOTE]) を markdown-alert に変換する", () => {
  const md = "> [!NOTE]\n> 補足です"
  const html = markdownToHtml(md)
  expect(html).toContain("markdown-alert-note")
  expect(html).toContain("補足です")
})

test("拡張要素 (footnotes/alert/hljs) の CSS を全 preset と legacy が含む", () => {
  for (const preset of [undefined, "memo", "report", "letter"] as const) {
    const html = markdownToHtml("# x", preset ? { preset } : {})
    expect(html).toContain(".markdown-alert")
    expect(html).toContain(".hljs")
    expect(html).toContain(".footnotes")
  }
})

test("Markdown を HTML 文字列に変換する", () => {
  const md = "# 見出し\n\n本文です。"
  const html = markdownToHtml(md)
  expect(html).toContain("<h1>")
  expect(html).toContain("見出し")
  expect(html).toContain("本文です。")
})

test("HTML には日本語フォント指定の CSS が含まれる", () => {
  const html = markdownToHtml("# テスト")
  expect(html).toContain('"Noto Sans JP"')
  expect(html).toContain("sans-serif")
})

test("serif preset は Noto Serif JP を優先する", () => {
  const html = markdownToHtml("# テスト", { font: "serif" })
  expect(html).toContain('"Noto Serif JP"')
  expect(html).toContain("serif")
})

test("HTML は完全な HTML ドキュメント（<!DOCTYPE html> から </html>）", () => {
  const html = markdownToHtml("# テスト")
  expect(html.startsWith("<!DOCTYPE html>")).toBe(true)
  expect(html.endsWith("</html>")).toBe(true)
})

test("テーブルが正しく変換される", () => {
  const md = "| A | B |\n|---|---|\n| 1 | 2 |"
  const html = markdownToHtml(md)
  expect(html).toContain("<table>")
  expect(html).toContain("<th>A</th>")
})

test("report preset は accent 文字色の h2 と改ページ制御を含む", () => {
  const html = markdownToHtml("# テスト", { preset: "report" })
  // アクセントは h2 の文字色 1 点 (brand token --pm-accent で差し替え可能)
  expect(html).toContain("color: var(--pm-accent, #395437)")
  // 表・コードの泣き別れ防止と桁揃え
  expect(html).toContain("break-inside: avoid")
  expect(html).toContain("font-variant-numeric: tabular-nums")
})

test("brand 未指定時は :root 変数ブロックを生成しない（既存挙動を変えない）", () => {
  for (const preset of [undefined, "memo", "report", "letter"] as const) {
    const html = markdownToHtml("# テスト", preset ? { preset } : {})
    expect(html).not.toContain(":root")
    // var() の fallback は現行ハードコード値なので brand 不在では同値に解決される
    expect(html).toContain("var(--pm-ink, ")
  }
})

test("brandCss は <style> 先頭に prepend される", () => {
  const brandCss = ":root { --pm-accent: #1B365D; }\n"
  const html = markdownToHtml("# テスト", { preset: "report", brandCss })
  expect(html).toContain("--pm-accent: #1B365D")
  // brand ブロックが preset 本体より前に来る
  expect(html.indexOf("--pm-accent: #1B365D")).toBeLessThan(html.indexOf("var(--pm-accent, #395437)"))
})

test("PNG (screen) 用の余白 padding を全 preset と legacy CSS が持つ", () => {
  // @page は印刷専用のため、screen 側に padding が無いと PNG が縁なしになる (regression guard)
  for (const preset of [undefined, "memo", "report", "letter"] as const) {
    const html = markdownToHtml("# テスト", preset ? { preset } : {})
    expect(html).toContain("@media screen")
    expect(html).toContain("padding: var(--pm-margin, ")
  }
})

test("Markdown のテーブル揃え記法 (|---:|) を全 preset で尊重する", () => {
  const md = "| A | B |\n|---|---:|\n| x | 1,234 |"
  for (const preset of [undefined, "memo", "report", "letter"] as const) {
    const html = markdownToHtml(md, preset ? { preset } : {})
    // marked は align 属性を出すので、CSS の text-align: left が打ち消さないこと
    expect(html).toContain('align="right"')
    expect(html).toContain('td[align="right"] { text-align: right; }')
  }
})

test("letter preset は中央寄せ h1 を含む", () => {
  const html = markdownToHtml("# テスト", { preset: "letter" })
  expect(html).toContain("text-align: center")
})
