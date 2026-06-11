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

test("report preset は左ボーダー付き h2 スタイルを含む", () => {
  const html = markdownToHtml("# テスト", { preset: "report" })
  expect(html).toContain("border-left: 4px solid var(--pm-accent, #4a6741)")
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
  expect(html.indexOf("--pm-accent: #1B365D")).toBeLessThan(html.indexOf("var(--pm-accent, #4a6741)"))
})

test("letter preset は中央寄せ h1 を含む", () => {
  const html = markdownToHtml("# テスト", { preset: "letter" })
  expect(html).toContain("text-align: center")
})
