/** batch オーケストレーション: 1 Chromium セッションで複数ファイルを変換する。 */
import { mkdirSync } from "node:fs"
import { basename, extname, join, resolve } from "node:path"
import { glob } from "glob"
import { BrowserSession } from "./browser-session"
import { convertHtmlToPdf, type ConvertOptions, type ConvertResult } from "./convert"
import { PdfMintError } from "./errors"
import type { BatchErrorEntry } from "./output"

export interface BatchResult {
  results: ConvertResult[]
  errors: BatchErrorEntry[]
  browser_reused: boolean
}

export async function convertBatch(
  pattern: string,
  outDir: string,
  options: ConvertOptions
): Promise<BatchResult> {
  const outDirAbs = resolve(outDir)
  mkdirSync(outDirAbs, { recursive: true })

  const matches = await glob(pattern, { absolute: true })

  if (matches.length === 0) {
    throw new PdfMintError(
      "BATCH_NO_MATCHES",
      `パターンにマッチするファイルがありません: ${pattern}`,
      "glob パターンが正しいか、対象ファイルが存在するか確認してください。",
      { pattern }
    )
  }

  const results: ConvertResult[] = []
  const errors: BatchErrorEntry[] = []
  // 出力名は basename(入力) + .pdf で決まるため、別ディレクトリの同名や同名異拡張子
  // (a/x.html と b/x.md など) は同一 .pdf に潰れて黙って上書きされる。先勝ちで変換し、
  // 後続の衝突は変換せず BATCH_OUTPUT_COLLISION として報告する (データ消失を防ぐ)。
  const claimedOutputs = new Map<string, string>()
  const session = new BrowserSession()

  try {
    await session.launch()
    for (const input of matches) {
      const base = basename(input, extname(input))
      const output = join(outDirAbs, `${base}.pdf`)
      const claimedBy = claimedOutputs.get(output)
      if (claimedBy !== undefined) {
        errors.push({
          input,
          code: "BATCH_OUTPUT_COLLISION",
          message: `出力先 ${output} が ${claimedBy} と衝突するため変換をスキップしました（上書き防止）。入力を別ディレクトリでなく一意な名前にするか個別に変換してください。`,
        })
        continue
      }
      claimedOutputs.set(output, input)
      try {
        const r = await convertHtmlToPdf(input, output, options, session)
        results.push(r)
      } catch (err) {
        if (err instanceof PdfMintError) {
          errors.push({ input, code: err.code, message: err.message })
        } else {
          errors.push({
            input,
            code: "PDF_GENERATION_FAILED",
            message: (err as Error).message,
          })
        }
      }
    }
  } finally {
    await session.close()
  }

  return { results, errors, browser_reused: true }
}
