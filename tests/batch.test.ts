import { test, expect } from "bun:test"
import { convertBatch } from "../src/batch"
import { existsSync, mkdtempSync, copyFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const FIXTURES = join(import.meta.dir, "fixtures")

function newTmpDir() {
  return mkdtempSync(join(tmpdir(), "pdfmint-batch-"))
}

test("複数HTMLファイルを一括変換する", async () => {
  const inDir = newTmpDir()
  const outDir = newTmpDir()
  copyFileSync(join(FIXTURES, "sample.html"), join(inDir, "a.html"))
  copyFileSync(join(FIXTURES, "sample.html"), join(inDir, "b.html"))

  const { results, errors } = await convertBatch(`${inDir}/*.html`, outDir, {})
  expect(results).toHaveLength(2)
  expect(errors).toHaveLength(0)
  expect(existsSync(join(outDir, "a.pdf"))).toBe(true)
  expect(existsSync(join(outDir, "b.pdf"))).toBe(true)
})

test("マッチするファイルがない場合 BATCH_NO_MATCHES をスロー", async () => {
  const outDir = newTmpDir()
  await expect(
    convertBatch("/nonexistent/*.html", outDir, {})
  ).rejects.toMatchObject({
    code: "BATCH_NO_MATCHES",
  })
})

test("出力先ディレクトリが存在しない場合 OUTPUT_DIR_NOT_FOUND をスロー", async () => {
  const inDir = newTmpDir()
  copyFileSync(join(FIXTURES, "sample.html"), join(inDir, "a.html"))
  await expect(
    convertBatch(`${inDir}/*.html`, "/nonexistent/dir", {})
  ).rejects.toMatchObject({
    code: "OUTPUT_DIR_NOT_FOUND",
  })
})
