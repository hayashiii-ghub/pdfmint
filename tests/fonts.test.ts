import { test, expect } from "bun:test"
import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { DOCUMENT_FONTS, FONT_PROFILES, DEFAULT_DOCUMENT_FONT } from "../src/fonts/stacks"
import { fontFaceCss } from "../src/fonts/index"

test("4つの文書フォントを公開し、zenを既定にする", () => {
  expect(DOCUMENT_FONTS).toEqual(["zen", "shippori", "kiwi", "klee"])
  expect(DEFAULT_DOCUMENT_FONT).toBe("zen")
})

test("各フォントはtoban-appと同じfamilyと実ウェイトを持つ", () => {
  expect(FONT_PROFILES.zen).toMatchObject({ family: "Zen Kaku Gothic New", normal: 400, bold: 500, extra: 700 })
  expect(FONT_PROFILES.shippori).toMatchObject({ family: "Shippori Mincho", normal: 400, bold: 600, extra: 700 })
  expect(FONT_PROFILES.kiwi).toMatchObject({ family: "Kiwi Maru", normal: 400, bold: 500, extra: 500 })
  expect(FONT_PROFILES.klee).toMatchObject({ family: "Klee One", normal: 400, bold: 600, extra: 600 })
})

test("選択したfamilyの@font-faceだけを生成し、ファイルが実在する", () => {
  for (const id of DOCUMENT_FONTS) {
    const profile = FONT_PROFILES[id]
    const css = fontFaceCss(id)
    expect(css).toContain(`font-family: "${profile.family}"`)
    expect(css.match(/@font-face/g)).toHaveLength(profile.faces.length)
    for (const match of css.matchAll(/src: url\("(file:\/\/[^\"]+\.ttf)"\)/g)) {
      expect(existsSync(fileURLToPath(match[1]!))).toBe(true)
    }
  }
})
