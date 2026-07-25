import { test, expect } from "bun:test"
import { PdfMintError } from "../src/errors"

test("PdfMintError は code, message, hint, context を保持する", () => {
  const err = new PdfMintError(
    "INPUT_NOT_FOUND",
    "入力ファイルが見つかりません",
    "ファイルパスを確認してください",
    { input: "./missing.html" }
  )
  expect(err.code).toBe("INPUT_NOT_FOUND")
  expect(err.message).toBe("入力ファイルが見つかりません")
  expect(err.hint).toBe("ファイルパスを確認してください")
  expect(err.context).toEqual({ input: "./missing.html" })
})

test("PdfMintError は Error のインスタンス", () => {
  const err = new PdfMintError("UNSUPPORTED_INPUT", "msg", "hint")
  expect(err).toBeInstanceOf(Error)
})

test("PdfMintError.toJSON() は構造化データを返す", () => {
  const err = new PdfMintError(
    "INPUT_NOT_FOUND",
    "入力ファイルが見つかりません",
    "ファイルパスを確認してください",
    { input: "./missing.html" }
  )
  expect(err.toJSON()).toEqual({
    code: "INPUT_NOT_FOUND",
    message: "入力ファイルが見つかりません",
    hint: "ファイルパスを確認してください",
    input: "./missing.html",
  })
})

test("BROWSER_LAUNCH_FAILED は復旧コマンドを含む", () => {
  const err = new PdfMintError("BROWSER_LAUNCH_FAILED", "msg", "hint")
  expect(err.toJSON()).toEqual({
    code: "BROWSER_LAUNCH_FAILED",
    message: "msg",
    hint: "hint",
    next_command: "npx puppeteer browsers install chrome",
  })
})
