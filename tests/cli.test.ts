import { test, expect } from "bun:test"
import { buildOptions, type ParsedArgs } from "../src/cli"
import { PdfMintError } from "../src/errors"

function args(over: Partial<ParsedArgs>): ParsedArgs {
  return {
    positional: [],
    json: false,
    landscape: false,
    noBackground: false,
    showVersion: false,
    showHelp: false,
    ...over,
  }
}

test("buildOptions: zenを既定フォントにする", () => {
  expect(buildOptions(args({})).font).toBe("zen")
})

test("buildOptions: 4フォントを受け付ける", () => {
  for (const font of ["zen", "shippori", "kiwi", "klee"] as const) {
    expect(buildOptions(args({ font })).font).toBe(font)
  }
})

test("buildOptions: marginをPDFとMarkdownの共通値にする", () => {
  expect(buildOptions(args({ margin: "30mm" })).margin).toBe("30mm")
})

test("buildOptions: CSS安全でないmarginはINVALID_OPTION", () => {
  expect(() => buildOptions(args({ margin: "10mm; } body{display:none}" }))).toThrow(PdfMintError)
  expect(() => buildOptions(args({ margin: "huge" }))).toThrow(PdfMintError)
})

test("buildOptions: marginの0と単位付き長さは許可する", () => {
  expect(buildOptions(args({ margin: "0" })).margin).toBe("0")
  expect(buildOptions(args({ margin: "1in" })).margin).toBe("1in")
  expect(buildOptions(args({ margin: "12.5mm" })).margin).toBe("12.5mm")
})
