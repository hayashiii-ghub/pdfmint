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
  expect(html).toContain("Hiragino")
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
