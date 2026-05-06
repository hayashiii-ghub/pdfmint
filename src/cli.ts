import { convertHtmlToPdf, type ConvertOptions } from "./convert"
import { convertBatch } from "./batch"
import { formatSuccessSingle, formatSuccessBatch, formatError, type OutputFormat } from "./output"
import { getVersion } from "./version"

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

Examples:
  pdfmint invoice.html invoice.pdf
  pdfmint resume.md resume.pdf --format A4
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
    else result.positional.push(a)
  }
  return result
}

function buildOptions(args: ParsedArgs): ConvertOptions {
  const opts: ConvertOptions = {}
  if (args.format) opts.format = args.format as ConvertOptions["format"]
  if (args.margin) opts.margin = args.margin
  if (args.landscape) opts.landscape = true
  if (args.noBackground) opts.noBackground = true
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
