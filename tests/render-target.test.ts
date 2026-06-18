import { test, expect } from "bun:test"
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { prepareRenderTarget } from "../src/render-target"

function newTmpDir() {
  return mkdtempSync(join(tmpdir(), "pdfmint-render-target-"))
}

test("Markdown input can load custom CSS from a file", () => {
  const dir = newTmpDir()
  const md = join(dir, "report.md")
  const css = join(dir, "report.css")
  writeFileSync(md, "# レポート", "utf-8")
  writeFileSync(css, "body { font-family: custom-report-font; }", "utf-8")

  const target = prepareRenderTarget(md, { cssPath: css })
  try {
    const html = readFileSync(target.renderPath, "utf-8")
    expect(html).toContain("custom-report-font")
    // custom CSS は既定の font スタックを上書きする。同梱 font の @font-face 宣言
    // ("Noto Sans JP" を含む) は常に注入されるため、ここでは「既定スタックが課されて
    // いない」ことを、スタック内にしか現れない "Hiragino Sans" の不在で確認する。
    expect(html).not.toContain("Hiragino Sans")
  } finally {
    target.cleanup()
  }
})

test("Markdown input rejects a missing custom CSS file", () => {
  const dir = newTmpDir()
  const md = join(dir, "report.md")
  writeFileSync(md, "# レポート", "utf-8")

  expect(() => prepareRenderTarget(md, { cssPath: join(dir, "missing.css") })).toThrow(
    "CSSファイルが見つかりません"
  )
})

test("HTML input ignores custom CSS file validation", () => {
  const dir = newTmpDir()
  const htmlPath = join(dir, "report.html")
  writeFileSync(htmlPath, "<!doctype html><html><body>ok</body></html>", "utf-8")

  const target = prepareRenderTarget(htmlPath, { cssPath: join(dir, "missing.css") })
  expect(target.renderPath).toBe(htmlPath)
  expect(existsSync(target.renderPath)).toBe(true)
})
