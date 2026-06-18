/** prepare 層: 日本語フォントスタックと同梱 font の単一定義。
 *
 *  同梱 @font-face の family 名が各スタックの先頭と一致していないと、web font が
 *  システムの同名 font を上書きできず、同梱 font が無言で効かなくなる (= 出力の
 *  再現性が壊れる)。これを構造的に保証するため、スタックは「同梱 family + フォール
 *  バック群」から組み立て、fonts/index.ts も同じ bundled 定義を参照する。フォントを
 *  足す / 変えるときは FONT_SPECS の 1 箇所だけを直せばよい。 */

export type MarkdownFontPreset = "sans" | "serif"

export interface BundledFont {
  family: string
  file: string
}

interface FontSpec {
  /** 同梱 variable font。family は組み立て後のスタック先頭と一致する。 */
  bundled: BundledFont
  /** 同梱 family の後ろに続くフォールバック群 (システム font + 総称 family)。 */
  fallback: string
}

const FONT_SPECS: Record<MarkdownFontPreset, FontSpec> = {
  sans: {
    bundled: { family: "Noto Sans JP", file: "NotoSansJP.ttf" },
    fallback: `"Noto Sans CJK JP", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif`,
  },
  serif: {
    bundled: { family: "Noto Serif JP", file: "NotoSerifJP.ttf" },
    fallback: `"Noto Serif CJK JP", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif`,
  },
}

/** font-family 文字列。先頭は必ず同梱 family (= @font-face で同梱版に解決される)。 */
export const FONT_STACKS: Record<MarkdownFontPreset, string> = {
  sans: `"${FONT_SPECS.sans.bundled.family}", ${FONT_SPECS.sans.fallback}`,
  serif: `"${FONT_SPECS.serif.bundled.family}", ${FONT_SPECS.serif.fallback}`,
}

/** @font-face で供給する同梱 variable font 群。family は対応スタックの先頭に一致する。 */
export const BUNDLED_FONTS: BundledFont[] = [
  FONT_SPECS.sans.bundled,
  FONT_SPECS.serif.bundled,
]
