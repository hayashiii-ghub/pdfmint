import { test, expect } from "bun:test"
import { formatSuccessSingle, formatSuccessBatch, formatError } from "../src/output"
import { PdfMintError } from "../src/errors"

test("formatSuccessSingle: JSON 形式で成功結果を返す", () => {
  const result = {
    input: "/abs/in.html",
    output: "/abs/out.pdf",
    format: "A4",
    size_bytes: 12345,
    duration_ms: 1000,
  }
  const json = formatSuccessSingle(result, "json")
  const parsed = JSON.parse(json)
  expect(parsed).toEqual({
    success: true,
    input: "/abs/in.html",
    output: "/abs/out.pdf",
    format: "A4",
    size_bytes: 12345,
    duration_ms: 1000,
  })
})

test("formatSuccessSingle: text 形式で人間可読な結果を返す", () => {
  const result = {
    input: "/abs/in.html",
    output: "/abs/out.pdf",
    format: "A4",
    size_bytes: 12345,
    duration_ms: 1000,
  }
  const text = formatSuccessSingle(result, "text")
  expect(text).toContain("/abs/out.pdf")
  expect(text).toContain("12345")
})

test("formatSuccessBatch: JSON 形式で集計結果を返す", () => {
  const results = [
    { input: "a.html", output: "a.pdf", format: "A4", size_bytes: 100, duration_ms: 50 },
    { input: "b.html", output: "b.pdf", format: "A4", size_bytes: 200, duration_ms: 60 },
  ]
  const errors = [{ input: "c.html", code: "INPUT_NOT_FOUND" as const, message: "no" }]
  const json = formatSuccessBatch(results, errors, "json")
  const parsed = JSON.parse(json)
  expect(parsed.success).toBe(true)
  expect(parsed.total).toBe(3)
  expect(parsed.succeeded).toBe(2)
  expect(parsed.failed).toBe(1)
  expect(parsed.results).toHaveLength(2)
  expect(parsed.errors).toHaveLength(1)
})

test("formatError: PdfMintError を JSON 構造で返す", () => {
  const err = new PdfMintError("INPUT_NOT_FOUND", "msg", "hint", { input: "x.html" })
  const json = formatError(err, "json")
  const parsed = JSON.parse(json)
  expect(parsed).toEqual({
    success: false,
    error: {
      code: "INPUT_NOT_FOUND",
      message: "msg",
      hint: "hint",
      input: "x.html",
    },
  })
})

test("formatError: 通常 Error を構造化して返す（unknown code）", () => {
  const err = new Error("something broke")
  const json = formatError(err, "json")
  const parsed = JSON.parse(json)
  expect(parsed.success).toBe(false)
  expect(parsed.error.code).toBe("UNKNOWN_ERROR")
  expect(parsed.error.message).toBe("something broke")
})
