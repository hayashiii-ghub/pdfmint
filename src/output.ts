import { PdfMintError } from "./errors"
import type { ConvertResult } from "./convert"

export type OutputFormat = "json" | "text"

export function formatSuccessSingle(result: ConvertResult, format: OutputFormat): string {
  if (format === "json") return JSON.stringify({ success: true, ...result })
  const font = result.font ? `, ${result.font}` : ""
  const parts = [`✓ ${result.output} (${(result.size_bytes / 1024).toFixed(1)}KB, ${result.duration_ms}ms${font})`]
  if (result.png) parts.push(`  PNG: ${result.png.output} (${(result.png.size_bytes / 1024).toFixed(1)}KB)`)
  if (result.page_count !== undefined) parts.push(`  pages: ${result.page_count}`)
  return parts.join("\n")
}

export function formatError(error: unknown, format: OutputFormat): string {
  if (error instanceof PdfMintError) {
    if (format === "json") return JSON.stringify({ success: false, error: error.toJSON() })
    return `[${error.code}] ${error.message}\n  hint: ${error.hint}`
  }
  const message = error instanceof Error ? error.message : String(error)
  if (format === "json") {
    return JSON.stringify({ success: false, error: { code: "UNKNOWN_ERROR", message, hint: "予期しないエラーです。詳細を確認してください。" } })
  }
  return `[UNKNOWN_ERROR] ${message}`
}
