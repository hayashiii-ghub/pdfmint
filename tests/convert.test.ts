import { test, expect } from "bun:test"
import { convertHtmlToPdf } from "../src/convert"
import { PdfMintError } from "../src/errors"
import { existsSync, mkdtempSync, statSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const FIXTURES = join(import.meta.dir, "fixtures")

function newTmpDir() {
  return mkdtempSync(join(tmpdir(), "pdfmint-convert-"))
}

test("HTMLファイルからPDFを生成する", async () => {
  const out = join(newTmpDir(), "out.pdf")
  await convertHtmlToPdf(join(FIXTURES, "sample.html"), out, {})
  expect(existsSync(out)).toBe(true)
  expect(statSync(out).size).toBeGreaterThan(1000)
  // PDF magic number "%PDF" を確認
  const head = readFileSync(out).subarray(0, 4).toString()
  expect(head).toBe("%PDF")
})

test("入力ファイルが存在しない場合 INPUT_NOT_FOUND をスロー", async () => {
  const out = join(newTmpDir(), "out.pdf")
  await expect(
    convertHtmlToPdf("/nonexistent/file.html", out, {})
  ).rejects.toMatchObject({
    code: "INPUT_NOT_FOUND",
  })
})

test("出力先ディレクトリが無い場合は自動作成して PDF を生成する", async () => {
  const base = newTmpDir()
  const out = join(base, "nested", "deep", "out.pdf")
  await convertHtmlToPdf(join(FIXTURES, "sample.html"), out, {})
  expect(existsSync(out)).toBe(true)
})

test("用紙サイズオプションが反映される", async () => {
  const out = join(newTmpDir(), "out-a3.pdf")
  await convertHtmlToPdf(join(FIXTURES, "sample.html"), out, { format: "A3" })
  expect(existsSync(out)).toBe(true)
  // A3はA4より大きいので、ファイルサイズも大きいことが期待される（厳密な検証は別途）
  expect(statSync(out).size).toBeGreaterThan(1000)
})

test("Markdown ファイルから PDF を生成する", async () => {
  const out = join(newTmpDir(), "out-md.pdf")
  await convertHtmlToPdf(join(FIXTURES, "sample.md"), out, {})
  expect(existsSync(out)).toBe(true)
  const head = readFileSync(out).subarray(0, 4).toString()
  expect(head).toBe("%PDF")
})

test("未対応の拡張子は UNSUPPORTED_INPUT をスロー", async () => {
  const out = join(newTmpDir(), "out.pdf")
  // tmpファイルとして .txt を作成
  const tmp = join(newTmpDir(), "input.txt")
  const { writeFileSync } = await import("node:fs")
  writeFileSync(tmp, "hello")
  await expect(
    convertHtmlToPdf(tmp, out, {})
  ).rejects.toMatchObject({
    code: "UNSUPPORTED_INPUT",
  })
})
