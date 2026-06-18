import { test, expect } from "bun:test"
import { FONT_STACKS, BUNDLED_FONTS } from "../src/fonts/stacks"
import { fontFaceCss } from "../src/fonts/index"

// 同梱 @font-face の family がスタック先頭と一致していないと、web font がシステムの同名
// font を上書きできず同梱 font が無言で効かなくなる (再現性が壊れる)。FONT_STACKS は
// 1 箇所で組み立てているので構造上ずれないはずだが、将来の分割を検知する回帰ガード。
test("各 FONT_STACKS の先頭 family が同梱 @font-face の family と一致する", () => {
  const css = fontFaceCss()
  for (const { family } of BUNDLED_FONTS) {
    expect(css).toContain(`font-family: "${family}"`)
  }
  // sans/serif スタックの先頭は対応する同梱 family で始まる
  expect(FONT_STACKS.sans.startsWith(`"${BUNDLED_FONTS[0]!.family}"`)).toBe(true)
  expect(FONT_STACKS.serif.startsWith(`"${BUNDLED_FONTS[1]!.family}"`)).toBe(true)
})

test("@font-face は同梱フォントごとに 1 宣言（variable font なので weight ごとに分けない）", () => {
  const declarations = fontFaceCss().match(/@font-face/g) ?? []
  expect(declarations).toHaveLength(BUNDLED_FONTS.length)
})
