import { test, expect } from "bun:test"
import { markdownToHtml } from "../src/markdown"

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
  expect(html).toContain("color: var(--pm-accent, #1b3a5e)")
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
  expect(html.indexOf("--pm-accent: #1B365D")).toBeLessThan(html.indexOf("var(--pm-accent, #1b3a5e)"))
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
