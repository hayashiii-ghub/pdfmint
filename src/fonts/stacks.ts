/** pdfmintが保証する4つの日本語文書フォント。 */
export const DOCUMENT_FONTS = ["zen", "shippori", "kiwi", "klee"] as const
export type DocumentFont = (typeof DOCUMENT_FONTS)[number]

export const DEFAULT_DOCUMENT_FONT: DocumentFont = "zen"

export interface FontFace {
  file: string
  weight: number
}

export interface FontProfile {
  family: string
  fallback: string
  normal: number
  bold: number
  extra: number
  faces: readonly FontFace[]
}

export const FONT_PROFILES: Record<DocumentFont, FontProfile> = {
  zen: {
    family: "Zen Kaku Gothic New",
    fallback: '"Hiragino Sans", "Yu Gothic", "Meiryo", sans-serif',
    normal: 400,
    bold: 500,
    extra: 700,
    faces: [
      { file: "ZenKakuGothicNew-Regular.ttf", weight: 400 },
      { file: "ZenKakuGothicNew-Medium.ttf", weight: 500 },
      { file: "ZenKakuGothicNew-Bold.ttf", weight: 700 },
    ],
  },
  shippori: {
    family: "Shippori Mincho",
    fallback: '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif',
    normal: 400,
    bold: 600,
    extra: 700,
    faces: [
      { file: "ShipporiMincho-Regular.ttf", weight: 400 },
      { file: "ShipporiMincho-SemiBold.ttf", weight: 600 },
      { file: "ShipporiMincho-Bold.ttf", weight: 700 },
    ],
  },
  kiwi: {
    family: "Kiwi Maru",
    fallback: '"Hiragino Maru Gothic ProN", "Yu Gothic", serif',
    normal: 400,
    bold: 500,
    extra: 500,
    faces: [
      { file: "KiwiMaru-Regular.ttf", weight: 400 },
      { file: "KiwiMaru-Medium.ttf", weight: 500 },
    ],
  },
  klee: {
    family: "Klee One",
    fallback: '"Hiragino Mincho ProN", "Yu Mincho", serif',
    normal: 400,
    bold: 600,
    extra: 600,
    faces: [
      { file: "KleeOne-Regular.ttf", weight: 400 },
      { file: "KleeOne-SemiBold.ttf", weight: 600 },
    ],
  },
}

export const FONT_STACKS: Record<DocumentFont, string> = Object.fromEntries(
  DOCUMENT_FONTS.map((id) => {
    const profile = FONT_PROFILES[id]
    return [id, `"${profile.family}", ${profile.fallback}`]
  })
) as Record<DocumentFont, string>
