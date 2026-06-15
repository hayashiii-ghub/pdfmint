import { test, expect } from "bun:test"
import { buildOptions, type ParsedArgs } from "../src/cli"
import { PdfMintError } from "../src/errors"

function args(over: Partial<ParsedArgs>): ParsedArgs {
  return {
    positional: [],
    json: false,
    noBrand: true,
    landscape: false,
    noBackground: false,
    showVersion: false,
    showHelp: false,
    ...over,
  }
}

test("buildOptions: --margin が --pm-margin に流れ Puppeteer margin にも入る", () => {
  // Markdown の @page は var(--pm-margin) を参照するため、--margin はこの経路で PDF に効く。
  const opts = buildOptions(args({ margin: "30mm" }))
  expect(opts.margin).toBe("30mm")
  expect(opts.brandCss ?? "").toContain("--pm-margin: 30mm")
})

test("buildOptions: margin 未指定なら --pm-margin を出さない（既定値 fallback に任せる）", () => {
  const opts = buildOptions(args({}))
  expect(opts.margin).toBeUndefined()
  expect(opts.brandCss ?? "").not.toContain("--pm-margin")
})

test("buildOptions: CSS 安全でない margin は INVALID_OPTION", () => {
  // CSS 変数へ注入するため、単位付きの長さ (または 0) のみ許可する。
  expect(() => buildOptions(args({ margin: "10mm; } body{display:none}" }))).toThrow(PdfMintError)
  expect(() => buildOptions(args({ margin: "huge" }))).toThrow(PdfMintError)
})

test("buildOptions: margin の 0 と単位付き長さは許可する", () => {
  expect(buildOptions(args({ margin: "0" })).margin).toBe("0")
  expect(buildOptions(args({ margin: "1in" })).margin).toBe("1in")
  expect(buildOptions(args({ margin: "12.5mm" })).margin).toBe("12.5mm")
})
