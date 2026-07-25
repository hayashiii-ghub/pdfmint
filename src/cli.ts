/** 単一ファイルをPDFへ仕上げるpdfmint CLI。 */
import { convertHtmlToPdf, type ConvertOptions } from "./convert"
import { formatSuccessSingle, formatError, type OutputFormat } from "./output"
import { getVersion } from "./version"
import { PdfMintError } from "./errors"
import { DOCUMENT_FONTS, DEFAULT_DOCUMENT_FONT, type DocumentFont } from "./fonts/stacks"

const HELP = `pdfmint - Japanese typography for agent-made documents

Usage:
  pdfmint <input.html|input.md> <output.pdf> [options]

Options:
  --json                                Output structured JSON
  --font <zen|shippori|kiwi|klee>       Japanese document font (default: zen)
  --css <file.css>                      Layer custom CSS over the default style
  --format <A4|A3|Letter|Legal>         Paper size (default: A4)
  --margin <value>                      Margin (e.g. 18mm; default: 0)
  --landscape                           Landscape orientation
  --no-background                       Disable CSS backgrounds
  --png <output.png>                    Also render a PNG preview
  --viewport <width>x<height>           PNG viewport (default: 1055x1491)
  --scale <number>                      PNG device scale factor (default: 3)
  --expect-pages <number>               Fail when the PDF page count differs
  --version                             Show version
  --help                                Show help

Examples:
  pdfmint report.md report.pdf --font shippori --json
  pdfmint notice.md notice.pdf --font kiwi --png notice.png --json
`

export interface ParsedArgs {
  positional: string[]
  json: boolean
  format?: string
  margin?: string
  font?: string
  css?: string
  landscape: boolean
  noBackground: boolean
  png?: string
  viewport?: string
  scale?: string
  expectPages?: string
  showVersion: boolean
  showHelp: boolean
}

const PAPER_FORMATS = new Set(["A4", "A3", "Letter", "Legal"])
const VALUE_FLAGS = {
  "--format": "format",
  "--margin": "margin",
  "--font": "font",
  "--css": "css",
  "--png": "png",
  "--viewport": "viewport",
  "--scale": "scale",
  "--expect-pages": "expectPages",
} as const

type ValueFlag = keyof typeof VALUE_FLAGS

function invalidOption(message: string, hint = "pdfmint --help で利用可能なオプションを確認してください。"): PdfMintError {
  return new PdfMintError("INVALID_OPTION", message, hint, {})
}

function isValueFlag(value: string): value is ValueFlag {
  return value in VALUE_FLAGS
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    positional: [],
    json: false,
    landscape: false,
    noBackground: false,
    showVersion: false,
    showHelp: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const value = argv[i]!
    if (value === "--json") result.json = true
    else if (value === "--landscape") result.landscape = true
    else if (value === "--no-background") result.noBackground = true
    else if (value === "--version") result.showVersion = true
    else if (value === "help" || value === "--help" || value === "-h") result.showHelp = true
    else if (isValueFlag(value)) {
      const next = argv[i + 1]
      if (!next || next.startsWith("-")) {
        throw invalidOption(`${value} には値を指定してください。`, `${value} <value> の形式で指定してください。`)
      }
      result[VALUE_FLAGS[value]] = next
      i++
    } else if (value.startsWith("-")) {
      throw invalidOption(`未知のオプションです: ${value}`)
    } else {
      result.positional.push(value)
    }
  }
  return result
}

function parsePositiveNumber(value: string | undefined, flag: string): number {
  const number = Number(value)
  if (!value || !Number.isFinite(number) || number <= 0) {
    throw new PdfMintError("INVALID_VIEWPORT", `${flag} には正の数値を指定してください: ${value ?? ""}`, `${flag} の値を確認してください。`, {})
  }
  return number
}

function parsePositiveInteger(value: string | undefined, flag: string): number {
  const number = parsePositiveNumber(value, flag)
  if (!Number.isInteger(number)) {
    throw new PdfMintError("INVALID_VIEWPORT", `${flag} には正の整数を指定してください: ${value ?? ""}`, `${flag} の値を確認してください。`, {})
  }
  return number
}

function parseViewport(value: string | undefined): { width: number; height: number } {
  const viewport = value ?? "1055x1491"
  const match = /^(\d+)x(\d+)$/i.exec(viewport)
  if (!match || Number(match[1]) <= 0 || Number(match[2]) <= 0) {
    throw new PdfMintError("INVALID_VIEWPORT", `viewport の形式が不正です: ${viewport}`, "--viewport <width>x<height> の形式で指定してください。", {})
  }
  return { width: Number(match[1]), height: Number(match[2]) }
}

const MARGIN_RE = /^(0|[0-9]*\.?[0-9]+(pt|px|mm|cm|in))$/

function parseMargin(value: string | undefined): string | undefined {
  if (value === undefined) return undefined
  if (!MARGIN_RE.test(value)) {
    throw invalidOption(`margin が不正です: ${value}`, "--margin には単位付きの長さ（例 18mm / 1in）または0を指定してください。")
  }
  return value
}

function parseFont(value: string | undefined): DocumentFont {
  if (!value) return DEFAULT_DOCUMENT_FONT
  if ((DOCUMENT_FONTS as readonly string[]).includes(value)) return value as DocumentFont
  throw new PdfMintError("INVALID_FONT", `font が不正です: ${value}`, `--font には ${DOCUMENT_FONTS.join(", ")} を指定してください。`, {})
}

function parseFormat(value: string | undefined): ConvertOptions["format"] | undefined {
  if (!value) return undefined
  if (PAPER_FORMATS.has(value)) return value as ConvertOptions["format"]
  throw invalidOption(`format が不正です: ${value}`, "--format には A4, A3, Letter, Legal のいずれかを指定してください。")
}

export function buildOptions(args: ParsedArgs): ConvertOptions {
  const options: ConvertOptions = { font: parseFont(args.font) }
  const format = parseFormat(args.format)
  if (format) options.format = format
  const margin = parseMargin(args.margin)
  if (margin !== undefined) options.margin = margin
  if (args.css) options.css = args.css
  if (args.landscape) options.landscape = true
  if (args.noBackground) options.noBackground = true
  if (args.expectPages) options.expectPages = parsePositiveInteger(args.expectPages, "--expect-pages")
  if (args.png) {
    options.png = {
      output: args.png,
      ...parseViewport(args.viewport),
      scale: args.scale ? parsePositiveNumber(args.scale, "--scale") : 3,
    }
  } else if (args.viewport || args.scale) {
    throw new PdfMintError("INVALID_VIEWPORT", "--viewport / --scale は --png と一緒に指定してください", "--png <output.png> を指定してください。", {})
  }
  return options
}

async function main(argv: string[]): Promise<number> {
  let format: OutputFormat = argv.includes("--json") ? "json" : "text"
  try {
    const args = parseArgs(argv)
    format = args.json ? "json" : "text"
    if (args.showVersion) {
      console.log(getVersion())
      return 0
    }
    if (args.showHelp) {
      console.log(HELP)
      return 0
    }
    if (args.positional.length === 0) {
      console.log(HELP)
      return 2
    }
    if (args.positional.length !== 2) {
      throw invalidOption(`入力と出力を1つずつ指定してください: ${args.positional.join(" ")}`, "pdfmint <input> <output> の形式で指定してください。")
    }
    const [input, output] = args.positional as [string, string]
    const result = await convertHtmlToPdf(input, output, buildOptions(args))
    console.log(formatSuccessSingle(result, format))
    return 0
  } catch (error) {
    console.log(formatError(error, format))
    return 1
  }
}

if (import.meta.main ?? true) {
  process.exit(await main(process.argv.slice(2)))
}
