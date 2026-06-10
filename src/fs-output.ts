/** prepare 層: 出力ファイルの親ディレクトリを idempotent に作成する。 */
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"

/** Create parent directories for an output file path (idempotent). */
export function ensureOutputPath(outputPath: string): void {
  mkdirSync(dirname(outputPath), { recursive: true })
}
