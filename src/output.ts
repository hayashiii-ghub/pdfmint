import { PdfMintError, type ErrorCode } from "./errors"
import type { ConvertResult } from "./convert"

export type OutputFormat = "json" | "text"

export interface BatchErrorEntry {
  input: string
  code: ErrorCode
  message: string
}

export function formatSuccessSingle(result: ConvertResult, format: OutputFormat): string {
  if (format === "json") {
    return JSON.stringify({
      success: true,
      ...result,
    })
  }
  // text
  return `✓ ${result.output} (${result.size_bytes} bytes, ${result.duration_ms}ms)`
}

export function formatSuccessBatch(
  results: ConvertResult[],
  errors: BatchErrorEntry[],
  format: OutputFormat
): string {
  const total = results.length + errors.length
  const succeeded = results.length
  const failed = errors.length

  if (format === "json") {
    return JSON.stringify({
      success: true,
      total,
      succeeded,
      failed,
      results,
      errors,
    })
  }
  const lines = [
    `Batch complete: ${succeeded}/${total} succeeded`,
    ...results.map((r) => `  ✓ ${r.output} (${(r.size_bytes / 1024).toFixed(1)}KB)`),
    ...errors.map((e) => `  ✗ ${e.input}: [${e.code}] ${e.message}`),
  ]
  return lines.join("\n")
}

export function formatError(err: unknown, format: OutputFormat): string {
  if (err instanceof PdfMintError) {
    if (format === "json") {
      return JSON.stringify({
        success: false,
        error: err.toJSON(),
      })
    }
    return `[${err.code}] ${err.message}\n  hint: ${err.hint}`
  }

  const message = err instanceof Error ? err.message : String(err)
  if (format === "json") {
    return JSON.stringify({
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message,
        hint: "予期しないエラーです。詳細を確認してください。",
      },
    })
  }
  return `[UNKNOWN_ERROR] ${message}`
}
