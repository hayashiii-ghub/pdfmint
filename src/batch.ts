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
  const session = new BrowserSession()

  try {
    await session.launch()
    for (const input of matches) {
      const base = basename(input, extname(input))
      const output = join(outDirAbs, `${base}.pdf`)
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
