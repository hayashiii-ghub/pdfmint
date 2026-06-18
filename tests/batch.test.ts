import { test, expect } from "bun:test"
import { convertBatch } from "../src/batch"
import { existsSync, mkdtempSync, copyFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const FIXTURES = join(import.meta.dir, "fixtures")
/** CI の初回 Chromium 起動は 20s を超えることがある */
const BROWSER_TEST_TIMEOUT_MS = 45_000

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
}, { timeout: BROWSER_TEST_TIMEOUT_MS })

test("マッチするファイルがない場合 BATCH_NO_MATCHES をスロー", async () => {
  const outDir = newTmpDir()
  await expect(
    convertBatch("/nonexistent/*.html", outDir, {})
  ).rejects.toMatchObject({
    code: "BATCH_NO_MATCHES",
  })
})

test("出力先ディレクトリが無い場合は自動作成して batch 変換する", async () => {
  const inDir = newTmpDir()
  const base = newTmpDir()
  const outDir = join(base, "nested", "pdf")
  copyFileSync(join(FIXTURES, "sample.html"), join(inDir, "a.html"))

  const { results, errors, browser_reused } = await convertBatch(`${inDir}/*.html`, outDir, {})
  expect(results).toHaveLength(1)
  expect(errors).toHaveLength(0)
  expect(browser_reused).toBe(true)
  expect(existsSync(join(outDir, "a.pdf"))).toBe(true)
}, { timeout: BROWSER_TEST_TIMEOUT_MS })

test("同名異拡張子の出力衝突は先勝ち変換 + BATCH_OUTPUT_COLLISION 報告（黙って上書きしない）", async () => {
  const inDir = newTmpDir()
  const outDir = newTmpDir()
  // x.html と x.md は両方 x.pdf に解決され衝突する
  copyFileSync(join(FIXTURES, "sample.html"), join(inDir, "x.html"))
  const { writeFileSync } = await import("node:fs")
  writeFileSync(join(inDir, "x.md"), "# x")

  const { results, errors } = await convertBatch(`${inDir}/*`, outDir, {})
  // 先勝ちで 1 件だけ変換、もう 1 件は衝突として報告
  expect(results).toHaveLength(1)
  expect(errors).toHaveLength(1)
  expect(errors[0]?.code).toBe("BATCH_OUTPUT_COLLISION")
  expect(existsSync(join(outDir, "x.pdf"))).toBe(true)
}, { timeout: BROWSER_TEST_TIMEOUT_MS })

test("一部のファイルが失敗しても他は成功する（エラー集約）", async () => {
  const inDir = newTmpDir()
  const outDir = newTmpDir()
  const { writeFileSync } = await import("node:fs")

  // 有効な HTML
  copyFileSync(join(FIXTURES, "sample.html"), join(inDir, "valid.html"))
  // 未対応拡張子（UNSUPPORTED_INPUT を引き起こす）
  writeFileSync(join(inDir, "invalid.txt"), "not html")

  const { results, errors } = await convertBatch(`${inDir}/*`, outDir, {})
  expect(results).toHaveLength(1)
  expect(errors).toHaveLength(1)
  expect(results[0]?.output).toContain("valid.pdf")
  expect(errors[0]?.code).toBe("UNSUPPORTED_INPUT")
  expect(errors[0]?.input).toContain("invalid.txt")
}, { timeout: BROWSER_TEST_TIMEOUT_MS })
