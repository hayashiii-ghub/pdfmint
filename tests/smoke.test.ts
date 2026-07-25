import { test, expect } from "bun:test"
import { existsSync, mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const FIXTURES = join(import.meta.dir, "fixtures")
const CLI = join(import.meta.dir, "..", "src", "cli.ts")
const BROWSER_TIMEOUT_MS = 45_000

function newTmpDir() {
  return mkdtempSync(join(tmpdir(), "pdfmint-smoke-"))
}

async function run(args: string[]) {
  const proc = Bun.spawn(["bun", CLI, ...args], { stdout: "pipe", stderr: "pipe" })
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  await proc.exited
  return { code: proc.exitCode, stdout, stderr }
}

test("--versionはバージョンを表示する", async () => {
  const result = await run(["--version"])
  expect(result.code).toBe(0)
  expect(result.stdout).toMatch(/^\d+\.\d+\.\d+/)
})

test("--helpは単一のusageを表示する", async () => {
  const result = await run(["--help"])
  expect(result.code).toBe(0)
  expect(result.stdout).toContain("pdfmint <input.html|input.md> <output.pdf>")
  expect(result.stdout).not.toContain("pdfmint batch")
  expect(result.stdout).not.toContain("pdfmint doctor")
})

test("引数なしはヘルプを表示し終了コード2", async () => {
  expect((await run([])).code).toBe(2)
})

test("旧convert形式はINVALID_OPTION", async () => {
  const result = await run(["convert", "in.md", "out.pdf", "--json"])
  expect(result.code).toBe(1)
  expect(JSON.parse(result.stdout).error.code).toBe("INVALID_OPTION")
})

test("Markdownを選択フォントでPDF化しJSONへfontを返す", async () => {
  const out = join(newTmpDir(), "out.pdf")
  const result = await run([join(FIXTURES, "sample.md"), out, "--font", "shippori", "--json"])
  expect(result.code).toBe(0)
  expect(existsSync(out)).toBe(true)
  const json = JSON.parse(result.stdout)
  expect(json).toMatchObject({ success: true, output: out, font: "shippori", page_count: 1 })
}, { timeout: BROWSER_TIMEOUT_MS })

test("フォント未指定はzen", async () => {
  const out = join(newTmpDir(), "out.pdf")
  const result = await run([join(FIXTURES, "sample.md"), out, "--json"])
  expect(result.code).toBe(0)
  expect(JSON.parse(result.stdout).font).toBe("zen")
}, { timeout: BROWSER_TIMEOUT_MS })

test("--pngでPDFとPNGを同時生成する", async () => {
  const dir = newTmpDir()
  const pdf = join(dir, "out.pdf")
  const png = join(dir, "out.png")
  const result = await run([join(FIXTURES, "sample.md"), pdf, "--png", png, "--viewport", "800x600", "--scale", "1", "--json"])
  expect(result.code).toBe(0)
  expect(readFileSync(png).subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a")
  expect(JSON.parse(result.stdout).png).toMatchObject({ output: png, width: 800, height: 600 })
}, { timeout: BROWSER_TIMEOUT_MS })

test("--expect-pagesは不一致を構造化エラーにする", async () => {
  const out = join(newTmpDir(), "out.pdf")
  const result = await run([join(FIXTURES, "sample.html"), out, "--expect-pages", "99", "--json"])
  expect(result.code).toBe(1)
  expect(JSON.parse(result.stdout).error).toMatchObject({ code: "PAGE_COUNT_MISMATCH", expected_pages: 99 })
}, { timeout: BROWSER_TIMEOUT_MS })

test("不正なフォントを拒否する", async () => {
  const result = await run([join(FIXTURES, "sample.md"), join(newTmpDir(), "out.pdf"), "--font", "noto", "--json"])
  expect(result.code).toBe(1)
  expect(JSON.parse(result.stdout).error.code).toBe("INVALID_FONT")
})

test("未知のオプションを拒否する", async () => {
  const result = await run([join(FIXTURES, "sample.md"), join(newTmpDir(), "out.pdf"), "--unknown", "--json"])
  expect(result.code).toBe(1)
  expect(JSON.parse(result.stdout).error.code).toBe("INVALID_OPTION")
})

test("Markdown inputの存在しない--cssを拒否する", async () => {
  const dir = newTmpDir()
  const result = await run([join(FIXTURES, "sample.md"), join(dir, "out.pdf"), "--css", join(dir, "missing.css"), "--json"])
  expect(result.code).toBe(1)
  expect(JSON.parse(result.stdout).error).toMatchObject({ code: "INPUT_NOT_FOUND", css: join(dir, "missing.css") })
})

test("存在しない出力ディレクトリを作成する", async () => {
  const out = join(newTmpDir(), "auto", "nested", "out.pdf")
  const result = await run([join(FIXTURES, "sample.html"), out, "--json"])
  expect(result.code).toBe(0)
  expect(existsSync(out)).toBe(true)
}, { timeout: BROWSER_TIMEOUT_MS })
