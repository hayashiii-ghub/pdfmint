import { convertHtmlToPdf, type ConvertOptions } from "./convert"
import { convertBatch } from "./batch"
import { formatSuccessSingle, formatSuccessBatch, formatError, type OutputFormat } from "./output"
import { getVersion } from "./version"
import { PdfMintError } from "./errors"

const HELP = `pdfmint - HTML/Markdown → PDF converter (AI-friendly CLI)

Usage:
  pdfmint <input> <output>              Convert single file (HTML or Markdown)
  pdfmint batch <pattern> <out-dir>     Batch convert
  pdfmint help                          Show this help
  pdfmint --version                     Show version

Flags (apply to all commands):
  --json                                Output JSON to stdout (for AI agents)
  --format <A4|A3|Letter|Legal>         Paper size (default: A4)
  --margin <value>                      Margin (e.g., 10mm; default: 0)
  --landscape                           Landscape orientation
  --no-background                       Disable CSS backgrounds
  --png <output.png>                    Also render a PNG screenshot (single conversion only)
  --viewport <width>x<height>           PNG viewport (default: 1055x1491; with --png)
  --scale <number>                      PNG device scale factor (default: 3; with --png)
  --expect-pages <number>               Fail if generated PDF page count differs

Examples:
  pdfmint invoice.html invoice.pdf
  pdfmint resume.md resume.pdf --format A4
  pdfmint report.html report.pdf --png report.png --viewport 1055x1491 --scale 3
  pdfmint batch "./html/*.html" ./pdf/ --json

Docs:
  AGENTS.md  - AI agent guide
  https://github.com/hayashiii-ghub/pdfmint
`

interface ParsedArgs {
  positional: string[]
  json: boolean
  format?: string
  margin?: string
  landscape: boolean
  noBackground: boolean
  png?: string
  viewport?: string
  scale?: string
  expectPages?: string
  showVersion: boolean
  showHelp: boolean
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
    const a = argv[i]!
    if (a === "--json") result.json = true
    else if (a === "--landscape") result.landscape = true
    else if (a === "--no-background") result.noBackground = true
    else if (a === "--version") result.showVersion = true
    else if (a === "help" || a === "--help" || a === "-h") result.showHelp = true
    else if (a === "--format") result.format = argv[++i]
    else if (a === "--margin") result.margin = argv[++i]
    else if (a === "--png") result.png = argv[++i]
    else if (a === "--viewport") result.viewport = argv[++i]
    else if (a === "--scale") result.scale = argv[++i]
    else if (a === "--expect-pages") result.expectPages = argv[++i]
    else result.positional.push(a)
  }
  return result
}

function parsePositiveNumber(value: string | undefined, flag: string): number {
  const n = Number(value)
  if (!value || !Number.isFinite(n) || n <= 0) {
    throw new PdfMintError(
      "INVALID_VIEWPORT",
      `${flag} には正の数値を指定してください: ${value ?? ""}`,
      `${flag} の値を確認してください。例: --scale 3 / --expect-pages 1`,
      {}
    )
  }
  return n
}

function parsePositiveInteger(value: string | undefined, flag: string): number {
  const n = parsePositiveNumber(value, flag)
  if (!Number.isInteger(n)) {
    throw new PdfMintError(
      "INVALID_VIEWPORT",
      `${flag} には正の整数を指定してください: ${value ?? ""}`,
      `${flag} の値を確認してください。例: --expect-pages 1`,
      {}
    )
  }
  return n
}

function parseViewport(value: string | undefined): { width: number; height: number } {
  const viewport = value ?? "1055x1491"
  const match = /^(\d+)x(\d+)$/i.exec(viewport)
  if (!match) {
    throw new PdfMintError(
      "INVALID_VIEWPORT",
      `viewport の形式が不正です: ${viewport}`,
      "viewport は <width>x<height> 形式で指定してください。例: --viewport 1055x1491",
      {}
    )
  }
  const width = Number(match[1])
  const height = Number(match[2])
  if (width <= 0 || height <= 0) {
    throw new PdfMintError(
      "INVALID_VIEWPORT",
      `viewport には正の整数を指定してください: ${viewport}`,
      "viewport は <width>x<height> 形式で指定してください。例: --viewport 1055x1491",
      {}
    )
  }
  return { width, height }
}

function buildOptions(args: ParsedArgs): ConvertOptions {
  const opts: ConvertOptions = {}
  if (args.format) opts.format = args.format as ConvertOptions["format"]
  if (args.margin) opts.margin = args.margin
  if (args.landscape) opts.landscape = true
  if (args.noBackground) opts.noBackground = true
  if (args.expectPages) opts.expectPages = parsePositiveInteger(args.expectPages, "--expect-pages")
  if (args.png) {
    const viewport = parseViewport(args.viewport)
    opts.png = {
      output: args.png,
      ...viewport,
      scale: args.scale ? parsePositiveNumber(args.scale, "--scale") : 3,
    }
  } else if (args.viewport || args.scale) {
    throw new PdfMintError(
      "INVALID_VIEWPORT",
      "--viewport / --scale は --png と一緒に指定してください",
      "PNG を生成する場合は --png <output.png> を指定してください。",
      {}
    )
  }
  return opts
}

async function main(argv: string[]): Promise<number> {
  const args = parseArgs(argv)
  const fmt: OutputFormat = args.json ? "json" : "text"

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

  try {
    if (args.positional[0] === "batch") {
      if (args.png || args.viewport || args.scale) {
        throw new PdfMintError(
          "INVALID_VIEWPORT",
          "batch コマンドでは --png / --viewport / --scale はまだ利用できません",
          "PNG も必要な場合は単一変換を個別に実行してください。",
          {}
        )
      }
      const [, pattern, outDir] = args.positional
      if (!pattern || !outDir) {
        console.log(HELP)
        return 2
      }
      const { results, errors } = await convertBatch(pattern, outDir, buildOptions(args))
      console.log(formatSuccessBatch(results, errors, fmt))
      return errors.length > 0 ? 1 : 0
    }

    // 単一変換
    if (args.positional.length < 2) {
      console.log(HELP)
      return 2
    }
    const [input, output] = args.positional
    const result = await convertHtmlToPdf(input!, output!, buildOptions(args))
    console.log(formatSuccessSingle(result, fmt))
    return 0
  } catch (err) {
    console.log(formatError(err, fmt))
    return 1
  }
}

const code = await main(process.argv.slice(2))
process.exit(code)
