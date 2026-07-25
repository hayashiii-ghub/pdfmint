/** verify 層: エラーコードごとのエージェント向け復旧コマンドを返す。 */
import type { ErrorCode } from "./errors"

export interface ErrorRecovery {
  next_command?: string
  verify_command?: string
}

const RECOVERY: Partial<Record<ErrorCode, ErrorRecovery>> = {
  BROWSER_LAUNCH_FAILED: {
    next_command: "npx puppeteer browsers install chrome",
  },
}

export function recoveryFor(code: ErrorCode): ErrorRecovery {
  return RECOVERY[code] ?? {}
}
