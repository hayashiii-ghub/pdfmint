import { convertHtmlToPdf, type ConvertOptions } from "./convert"
import { convertBatch } from "./batch"
import { runDoctor } from "./doctor"
import {
  formatSuccessSingle,
  formatSuccessBatch,
  formatDoctor,
  formatError,
  type OutputFormat,
} from "./output"
import { getVersion } from "./version"
import { PdfMintError } from "./errors"
import type { MarkdownFontPreset } from "./markdown"
import { MARKDOWN_PRESETS, type MarkdownPreset } from "./presets"

const HELP = `pdfmint - HTML/Markdown → PDF converter (AI-friendly CLI)

Usage:
  pdfmint <input> <output>              Convert single file (HTML or Markdown)
  pdfmint batch <pattern> <out-dir>     Batch convert (reuses one Chromium session)
  pdfmint doctor                        Run environment diagnostics
  pdfmint help                          Show this help
  pdfmint --version                     Show version

Flags (apply to convert / batch):
  --json                                Output JSON to stdout (for AI agents)
  --format <A4|A3|Letter|Legal>         Paper size (default: A4)
  --margin <value>                      Margin (e.g., 10mm; default: 0)
  --landscape                           Landscape orientation
  --no-background                       Disable CSS backgrounds
  --font <sans|serif>                   Markdown font preset (default: sans)
  --preset <memo|report|letter>         Markdown document preset (default: legacy sans CSS)
  --css <file.css>                      Custom CSS file for Markdown input
  --png <output.png>                    Also render a PNG screenshot (single conversion only)
  --viewport <width>x<height>           PNG viewport (default: 1055x1491; with --png)
  --scale <number>                      PNG device scale factor (default: 3; with --png)
  --expect-pages <number>               Fail if generated PDF page count differs

Examples:
  pdfmint invoice.html invoice.pdf
  pdfmint memo.md memo.pdf --preset memo --json
  pdfmint report.md report.pdf --preset report --font serif
  pdfmint report.html report.pdf --png report.png --viewport 1055x1491 --scale 3
  pdfmint batch "./html/*.html" ./pdf/ --json
  pdfmint doctor --json

Docs:
  AGENTS.md  - AI agent guide
  https://github.com/hayashiii-ghub/pdfmint
`

interface ParsedArgs {
  positional: string[]
  json: boolean
  format?: string
  margin?: string
  font?: string
  preset?: string
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
  "--preset": "preset",
  "--css": "css",
  "--png": "png",
  "--viewport": "viewport",
  "--scale": "scale",
  "--expect-pages": "expectPages",
} as const

type ValueFlag = keyof typeof VALUE_FLAGS

function invalidOption(message: string, hint = "pdfmint help で利用可能なオプションを確認してください。"): PdfMintError {
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

  function readValue(flag: string, index: number): string {
    const value = argv[index + 1]
    if (!value || value.startsWith("-")) {
      throw invalidOption(
        `${flag} には値を指定してください。`,
        `${flag} <value> の形式で指定してください。`
      )
    }
    return value
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!
    if (a === "--json") result.json = true
    else if (a === "--landscape") result.landscape = true
    else if (a === "--no-background") result.noBackground = true
    else if (a === "--version") result.showVersion = true
    else if (a === "help" || a === "--help" || a === "-h") result.showHelp = true
    else if (isValueFlag(a)) {
      result[VALUE_FLAGS[a]] = readValue(a, i)
      i++
    }
    else if (a.startsWith("-")) throw invalidOption(`未知のオプションです: ${a}`)
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

function parseFontPreset(value: string | undefined): MarkdownFontPreset | undefined {
  if (!value) return undefined
  if (value === "sans" || value === "serif") return value
  throw new PdfMintError(
    "INVALID_FONT",
    `font preset が不正です: ${value}`,
    "--font には sans または serif を指定してください。",
    {}
  )
}

function parseMarkdownPreset(value: string | undefined): MarkdownPreset | undefined {
  if (!value) return undefined
  if ((MARKDOWN_PRESETS as readonly string[]).includes(value)) {
    return value as MarkdownPreset
  }
  throw new PdfMintError(
    "INVALID_PRESET",
    `preset が不正です: ${value}`,
    `--preset には ${MARKDOWN_PRESETS.join(", ")} を指定してください。`,
    {}
  )
}

function parseFormat(value: string | undefined): ConvertOptions["format"] | undefined {
  if (!value) return undefined
  if (PAPER_FORMATS.has(value)) return value as ConvertOptions["format"]
  throw invalidOption(
    `format が不正です: ${value}`,
    "--format には A4, A3, Letter, Legal のいずれかを指定してください。"
  )
}

function buildOptions(args: ParsedArgs): ConvertOptions {
  const opts: ConvertOptions = {}
  if (args.format) opts.format = parseFormat(args.format)
  if (args.margin) opts.margin = args.margin
  if (args.font) opts.font = parseFontPreset(args.font)
  if (args.preset) opts.preset = parseMarkdownPreset(args.preset)
  if (args.css) opts.css = args.css
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
  let fmt: OutputFormat = argv.includes("--json") ? "json" : "text"

  try {
    const args = parseArgs(argv)
    fmt = args.json ? "json" : "text"

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

    if (args.positional[0] === "doctor") {
      if (args.positional.length > 1) {
        throw invalidOption(
          `doctor コマンドに余分な引数があります: ${args.positional.slice(1).join(" ")}`,
          "doctor は pdfmint doctor の形式で指定してください。"
        )
      }
      if (args.png || args.preset || args.css || args.format || args.margin) {
        throw invalidOption(
          "doctor コマンドでは変換用オプションは利用できません",
          "pdfmint doctor --json"
        )
      }
      const result = await runDoctor()
      console.log(formatDoctor(result, fmt))
      return result.success ? 0 : 1
    }

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
      if (!pattern || !outDir || args.positional.length !== 3) {
        if (args.positional.length > 3) {
          throw invalidOption(
            `batch コマンドの引数が多すぎます: ${args.positional.slice(3).join(" ")}`,
            "batch は pdfmint batch <pattern> <out-dir> の形式で指定してください。"
          )
        }
        console.log(HELP)
        return 2
      }
      const { results, errors, browser_reused } = await convertBatch(pattern, outDir, buildOptions(args))
      console.log(formatSuccessBatch(results, errors, fmt, { browser_reused }))
      return errors.length > 0 ? 1 : 0
    }

    if (args.positional.length < 2) {
      console.log(HELP)
      return 2
    }
    if (args.positional.length > 2) {
      throw invalidOption(
        `単一変換の引数が多すぎます: ${args.positional.slice(2).join(" ")}`,
        "単一変換は pdfmint <input> <output> の形式で指定してください。"
      )
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
