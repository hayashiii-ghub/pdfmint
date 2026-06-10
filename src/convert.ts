/** prepare → render のオーケストレーション: 単一ファイル変換のエントリ。 */
import { resolve } from "node:path"
import type { BrowserSession } from "./browser-session"
import { ensureOutputPath } from "./fs-output"
import { prepareRenderTarget } from "./render-target"
import { renderArtifacts, type PngArtifact, type RenderTiming } from "./render"
import type { MarkdownFontPreset } from "./markdown"
import type { MarkdownPreset } from "./presets/index"

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
  preset?: MarkdownPreset
  css?: string
}

export interface ConvertResult {
  input: string
  output: string
  format: string
  size_bytes: number
  duration_ms: number
  page_count?: number
  png?: PngArtifact
  timing?: RenderTiming
}

export async function convertHtmlToPdf(
  inputPath: string,
  outputPath: string,
  options: ConvertOptions,
  session?: BrowserSession
): Promise<ConvertResult> {
  const start = Date.now()
  const outputAbs = resolve(outputPath)
  const target = prepareRenderTarget(inputPath, {
    font: options.font,
    preset: options.preset,
    cssPath: options.css,
  })
  const format = options.format ?? "A4"
  const margin = options.margin ?? "0"

  try {
    ensureOutputPath(outputAbs)
    const png = options.png
      ? {
          output: resolve(options.png.output),
          width: options.png.width,
          height: options.png.height,
          scale: options.png.scale ?? 1,
        }
      : undefined
    if (png) ensureOutputPath(png.output)

    const artifacts = await renderArtifacts(
      target.renderPath,
      {
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
      },
      session
    )

    return {
      input: target.inputAbs,
      output: outputAbs,
      format,
      size_bytes: artifacts.pdf.size_bytes,
      duration_ms: Date.now() - start,
      ...(artifacts.pdf.page_count !== undefined ? { page_count: artifacts.pdf.page_count } : {}),
      ...(artifacts.png ? { png: artifacts.png } : {}),
      timing: artifacts.timing,
    }
  } finally {
    target.cleanup()
  }
}
