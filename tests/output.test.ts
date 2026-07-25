import { test, expect } from "bun:test"
import { formatSuccessSingle, formatError } from "../src/output"
import { PdfMintError } from "../src/errors"

const result = {
  input: "/abs/in.md",
  output: "/abs/out.pdf",
  format: "A4",
  font: "shippori" as const,
  size_bytes: 12345,
  duration_ms: 1000,
}

test("formatSuccessSingle: JSONに選択フォントを含める", () => {
  expect(JSON.parse(formatSuccessSingle(result, "json"))).toEqual({ success: true, ...result })
})

test("formatSuccessSingle: textに成果物とフォントを含める", () => {
  const text = formatSuccessSingle(result, "text")
  expect(text).toContain("/abs/out.pdf")
  expect(text).toContain("12.1KB")
  expect(text).toContain("shippori")
})

test("formatError: PdfMintErrorをJSON構造で返す", () => {
  const err = new PdfMintError("INPUT_NOT_FOUND", "msg", "hint", { input: "x.html" })
  expect(JSON.parse(formatError(err, "json"))).toEqual({
    success: false,
    error: { code: "INPUT_NOT_FOUND", message: "msg", hint: "hint", input: "x.html" },
  })
})

test("formatError: 通常ErrorをUNKNOWN_ERRORにする", () => {
  const parsed = JSON.parse(formatError(new Error("something broke"), "json"))
  expect(parsed.success).toBe(false)
  expect(parsed.error.code).toBe("UNKNOWN_ERROR")
})
