export type ErrorCode =
  | "INPUT_NOT_FOUND"
  | "INPUT_NOT_READABLE"
  | "UNSUPPORTED_INPUT"
  | "OUTPUT_DIR_NOT_FOUND"
  | "OUTPUT_NOT_WRITABLE"
  | "BROWSER_LAUNCH_FAILED"
  | "PAGE_LOAD_FAILED"
  | "PDF_GENERATION_FAILED"
  | "PNG_GENERATION_FAILED"
  | "INVALID_VIEWPORT"
  | "PAGE_COUNT_MISMATCH"
  | "BATCH_NO_MATCHES"

export interface ErrorContext {
  input?: string
  output?: string
  pattern?: string
  expected_pages?: number
  actual_pages?: number
}

export class PdfMintError extends Error {
  code: ErrorCode
  hint: string
  context: ErrorContext

  constructor(code: ErrorCode, message: string, hint: string, context: ErrorContext = {}) {
    super(message)
    this.name = "PdfMintError"
    this.code = code
    this.hint = hint
    this.context = context
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      hint: this.hint,
      ...this.context,
    }
  }
}
