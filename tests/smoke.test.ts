import { test, expect } from "bun:test"
import { existsSync, mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const FIXTURES = join(import.meta.dir, "fixtures")
const CLI = join(import.meta.dir, "..", "src", "cli.ts")

function newTmpDir() {
  return mkdtempSync(join(tmpdir(), "pdfmint-smoke-"))
}

test("--version はバージョンを表示する", async () => {
  const proc = Bun.spawn(["bun", CLI, "--version"], { stdout: "pipe", stderr: "pipe" })
  const out = await new Response(proc.stdout).text()
  await proc.exited
  expect(proc.exitCode).toBe(0)
  expect(out).toMatch(/^\d+\.\d+\.\d+/)
})

test("help は使い方を表示する", async () => {
  const proc = Bun.spawn(["bun", CLI, "help"], { stdout: "pipe", stderr: "pipe" })
  const out = await new Response(proc.stdout).text()
  await proc.exited
  expect(proc.exitCode).toBe(0)
  expect(out).toContain("pdfmint")
  expect(out).toContain("Usage")
})

test("引数なしはヘルプを表示し終了コード2", async () => {
  const proc = Bun.spawn(["bun", CLI], { stdout: "pipe", stderr: "pipe" })
  await proc.exited
  expect(proc.exitCode).toBe(2)
})

test("単一HTML→PDF変換が動く（end-to-end）", async () => {
  const out = join(newTmpDir(), "out.pdf")
  const proc = Bun.spawn(["bun", CLI, join(FIXTURES, "sample.html"), out], {
    stdout: "pipe",
    stderr: "pipe",
  })
  await proc.exited
  expect(proc.exitCode).toBe(0)
  expect(existsSync(out)).toBe(true)
})

test("--json フラグで JSON 出力", async () => {
  const out = join(newTmpDir(), "out.pdf")
  const proc = Bun.spawn(["bun", CLI, join(FIXTURES, "sample.html"), out, "--json"], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const stdoutText = await new Response(proc.stdout).text()
  await proc.exited
  expect(proc.exitCode).toBe(0)
  const json = JSON.parse(stdoutText.trim())
  expect(json.success).toBe(true)
  expect(json.output).toBe(out)
  expect(json.page_count).toBe(1)
})

test("--png フラグで PDF と PNG を同時生成し JSON に PNG 情報を含める", async () => {
  const dir = newTmpDir()
  const pdf = join(dir, "out.pdf")
  const png = join(dir, "out.png")
  const proc = Bun.spawn(
    [
      "bun",
      CLI,
      join(FIXTURES, "sample.html"),
      pdf,
      "--png",
      png,
      "--viewport",
      "800x600",
      "--scale",
      "1",
      "--json",
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
    }
  )
  const stdoutText = await new Response(proc.stdout).text()
  await proc.exited
  expect(proc.exitCode).toBe(0)
  expect(existsSync(pdf)).toBe(true)
  expect(existsSync(png)).toBe(true)
  expect(readFileSync(png).subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a")
  const json = JSON.parse(stdoutText.trim())
  expect(json.success).toBe(true)
  expect(json.output).toBe(pdf)
  expect(json.png).toMatchObject({
    output: png,
    width: 800,
    height: 600,
  })
  expect(json.png.size_bytes).toBeGreaterThan(1000)
})

test("--expect-pages はページ数不一致を JSON エラーにする", async () => {
  const out = join(newTmpDir(), "out.pdf")
  const proc = Bun.spawn(
    ["bun", CLI, join(FIXTURES, "sample.html"), out, "--expect-pages", "99", "--json"],
    {
      stdout: "pipe",
      stderr: "pipe",
    }
  )
  const stdoutText = await new Response(proc.stdout).text()
  await proc.exited
  expect(proc.exitCode).toBe(1)
  const json = JSON.parse(stdoutText.trim())
  expect(json.success).toBe(false)
  expect(json.error.code).toBe("PAGE_COUNT_MISMATCH")
  expect(json.error.expected_pages).toBe(99)
})

test("入力ファイル不在のエラー（--json）", async () => {
  const out = join(newTmpDir(), "out.pdf")
  const proc = Bun.spawn(["bun", CLI, "/nonexistent/in.html", out, "--json"], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const stdoutText = await new Response(proc.stdout).text()
  await proc.exited
  expect(proc.exitCode).toBe(1)
  const json = JSON.parse(stdoutText.trim())
  expect(json.success).toBe(false)
  expect(json.error.code).toBe("INPUT_NOT_FOUND")
})
