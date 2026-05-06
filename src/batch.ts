import { existsSync } from "node:fs"
import { basename, extname, join, resolve } from "node:path"
import { glob } from "glob"
import { convertHtmlToPdf, type ConvertOptions, type ConvertResult } from "./convert"
import { PdfMintError } from "./errors"
import type { BatchErrorEntry } from "./output"

export interface BatchResult {
  results: ConvertResult[]
  errors: BatchErrorEntry[]
}

export async function convertBatch(
  pattern: string,
  outDir: string,
  options: ConvertOptions
): Promise<BatchResult> {
  const outDirAbs = resolve(outDir)
  if (!existsSync(outDirAbs)) {
    throw new PdfMintError(
      "OUTPUT_DIR_NOT_FOUND",
      `出力先ディレクトリが存在しません: ${outDir}`,
      "出力先ディレクトリを事前に作成してください（mkdir -p）。",
      { output: outDir, pattern }
    )
  }

  // glob展開（npm の glob パッケージ、Node互換）
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

  for (const input of matches) {
    const base = basename(input, extname(input))
    const output = join(outDirAbs, `${base}.pdf`)
    try {
      const r = await convertHtmlToPdf(input, output, options)
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

  return { results, errors }
}
