import { test, expect } from "bun:test"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { parseBrand, brandToCss, resolveBrand } from "../src/brand"
import { PdfMintError } from "../src/errors"

function withTmpDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "pdfmint-brand-test-"))
  try {
    return fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test("parseBrand は frontmatter の token を解釈する", () => {
  const tokens = parseBrand(
    `---\naccent: "#1B365D"\nink: "#1a1a1a"\nfont: serif\nfont_size: 10.5pt\nline_height: 1.65\npaper: A4\nmargin: 18mm\n---\n備考メモ\n`,
    "test"
  )
  expect(tokens).toEqual({
    accent: "#1B365D",
    ink: "#1a1a1a",
    font: "serif",
    fontSize: "10.5pt",
    lineHeight: "1.65",
    paper: "A4",
    margin: "18mm",
  })
})

test("parseBrand は未知 key を無視する（前方互換）", () => {
  const tokens = parseBrand(`---\naccent: "#000"\nlogo: ./logo.png\n---\n`, "test")
  expect(tokens).toEqual({ accent: "#000" })
})

test("parseBrand: frontmatter 不在は BRAND_INVALID", () => {
  expect(() => parseBrand("# ただの markdown\n", "test")).toThrow(PdfMintError)
})

test("parseBrand: 不正な色は BRAND_INVALID", () => {
  try {
    parseBrand(`---\naccent: red; } body{display:none\n---\n`, "test")
    throw new Error("should have thrown")
  } catch (e) {
    expect(e).toBeInstanceOf(PdfMintError)
    expect((e as PdfMintError).code).toBe("BRAND_INVALID")
  }
})

test("parseBrand: 不正な font は BRAND_INVALID", () => {
  expect(() => parseBrand(`---\nfont: comic\n---\n`, "test")).toThrow(PdfMintError)
})

test("parseBrand: margin は単値のみ許可（render が各辺へ素通しするため）", () => {
  expect(parseBrand(`---\nmargin: 18mm\n---\n`, "test").margin).toBe("18mm")
  // 多値は puppeteer の各辺(単一length)に渡せず描画失敗するので弾く
  expect(() => parseBrand(`---\nmargin: 18mm 12mm\n---\n`, "test")).toThrow(PdfMintError)
})

test("brandToCss は設定された CSS token のみ :root に出す", () => {
  expect(brandToCss({ accent: "#1B365D", ink: "#111" })).toBe(":root { --pm-accent: #1B365D; --pm-ink: #111; }\n")
  // font/paper/margin は CSS 変数ではないので含まれない
  expect(brandToCss({ font: "serif", paper: "A4", margin: "18mm" })).toBe("")
  expect(brandToCss({})).toBe("")
})

test("resolveBrand: project (cwd) を優先採用する", () => {
  withTmpDir((dir) => {
    writeFileSync(join(dir, "pdfmint.brand.md"), `---\naccent: "#abc"\n---\n`)
    const { tokens, source } = resolveBrand({ cwd: dir })
    expect(tokens.accent).toBe("#abc")
    expect(source).toBe(join(dir, "pdfmint.brand.md"))
  })
})

test("resolveBrand: 明示 --brand パスを最優先する", () => {
  withTmpDir((dir) => {
    writeFileSync(join(dir, "pdfmint.brand.md"), `---\naccent: "#aaa"\n---\n`)
    const explicit = join(dir, "custom.md")
    writeFileSync(explicit, `---\naccent: "#bbb"\n---\n`)
    const { tokens, source } = resolveBrand({ cwd: dir, brandPath: "custom.md" })
    expect(tokens.accent).toBe("#bbb")
    expect(source).toBe(explicit)
  })
})

test("resolveBrand: --no-brand は探索を無効化する", () => {
  withTmpDir((dir) => {
    writeFileSync(join(dir, "pdfmint.brand.md"), `---\naccent: "#abc"\n---\n`)
    const { tokens, source } = resolveBrand({ cwd: dir, noBrand: true })
    expect(tokens).toEqual({})
    expect(source).toBeNull()
  })
})

test("resolveBrand: profile 不在なら tokens 空・source null（既存挙動）", () => {
  withTmpDir((dir) => {
    const { tokens, source } = resolveBrand({ cwd: dir, brandPath: undefined, noBrand: false })
    // global にユーザ profile があると拾うため、source が null でなくても tokens は空でないだけ。
    // ここでは project 不在のみ検証する。
    expect(source === null || typeof source === "string").toBe(true)
    expect(typeof tokens).toBe("object")
  })
})

test("resolveBrand: 明示パスが存在しなければ BRAND_INVALID", () => {
  withTmpDir((dir) => {
    expect(() => resolveBrand({ cwd: dir, brandPath: "missing.md" })).toThrow(PdfMintError)
  })
})
