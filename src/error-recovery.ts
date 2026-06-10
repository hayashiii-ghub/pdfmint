/** verify 層: エラーコードごとのエージェント向け復旧コマンドを返す。 */
import type { ErrorCode } from "./errors"

export interface ErrorRecovery {
  next_command?: string
  verify_command?: string
}

const RECOVERY: Partial<Record<ErrorCode, ErrorRecovery>> = {
  BROWSER_LAUNCH_FAILED: {
    next_command: "npx puppeteer browsers install chrome",
    verify_command: "pdfmint doctor --json",
  },
  PAGE_LOAD_FAILED: {
    verify_command: "pdfmint doctor --json",
  },
  OUTPUT_NOT_WRITABLE: {
    verify_command: "pdfmint doctor --json",
  },
  PDF_GENERATION_FAILED: {
    verify_command: "pdfmint doctor --json",
  },
}

export function recoveryFor(code: ErrorCode): ErrorRecovery {
  return RECOVERY[code] ?? {}
}
