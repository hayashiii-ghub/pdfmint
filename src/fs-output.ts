import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

/** Create parent directories for an output file path (idempotent). */
export function ensureOutputPath(outputPath: string): void {
  mkdirSync(dirname(outputPath), { recursive: true })
}
