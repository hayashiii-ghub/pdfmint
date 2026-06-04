import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { PdfMintError } from "./errors"
import { prepareRenderTarget } from "./render-target"
import { renderArtifacts, type PngArtifact } from "./render"
import type { MarkdownFontPreset } from "./markdown"

export interface PngOptions {
  output: string
  width: number
  height: number
  scale?: number
}

export interface ConvertOptions {
  format?: "A4" | "A3" | "Letter" | "Legal"
  margin?: string
  landscape?: boolean
  noBackground?: boolean
  png?: PngOptions
  expectPages?: number
  font?: MarkdownFontPreset
}

export interface ConvertResult {
  input: string
  output: string
  format: string
  size_bytes: number
  duration_ms: number
  page_count?: number
  png?: PngArtifact
}

function ensureOutputDir(outputPath: string) {
  const outDir = dirname(outputPath)
  if (!existsSync(outDir)) {
    throw new PdfMintError(
      "OUTPUT_DIR_NOT_FOUND",
      `出力先ディレクトリが存在しません: ${outDir}`,
      "出力先ディレクトリを事前に作成してください（mkdir -p）。",
      { output: outputPath }
    )
  }
}

export async function convertHtmlToPdf(
  inputPath: string,
  outputPath: string,
  options: ConvertOptions
): Promise<ConvertResult> {
  const start = Date.now()
  const outputAbs = resolve(outputPath)
  const target = prepareRenderTarget(inputPath, { font: options.font })
  const format = options.format ?? "A4"
  const margin = options.margin ?? "0"

  try {
    ensureOutputDir(outputAbs)
    const png = options.png
      ? {
          output: resolve(options.png.output),
          width: options.png.width,
          height: options.png.height,
          scale: options.png.scale ?? 1,
        }
      : undefined
    if (png) ensureOutputDir(png.output)

    const artifacts = await renderArtifacts(target.renderPath, {
      input: target.inputAbs,
      pdf: {
        output: outputAbs,
        format,
        margin,
        landscape: options.landscape ?? false,
        printBackground: !options.noBackground,
        ...(options.expectPages !== undefined ? { expectPages: options.expectPages } : {}),
      },
      ...(png ? { png } : {}),
    })

    return {
      input: target.inputAbs,
      output: outputAbs,
      format,
      size_bytes: artifacts.pdf.size_bytes,
      duration_ms: Date.now() - start,
      ...(artifacts.pdf.page_count !== undefined ? { page_count: artifacts.pdf.page_count } : {}),
      ...(artifacts.png ? { png: artifacts.png } : {}),
    }
  } finally {
    target.cleanup()
  }
}
