/** render 層: Puppeteer で HTML を PDF/PNG に描画する。 */
import { readFileSync, statSync } from "node:fs"
import type { Browser } from "puppeteer"
import { BrowserSession } from "./browser-session"
import { PdfMintError } from "./errors"

export interface PdfRenderOptions {
  output: string
  format: "A4" | "A3" | "Letter" | "Legal"
  margin: string
  landscape: boolean
  printBackground: boolean
  expectPages?: number
}

export interface PngRenderOptions {
  output: string
  width: number
  height: number
  scale: number
}

export interface ArtifactRenderOptions {
  input: string
  pdf: PdfRenderOptions
  png?: PngRenderOptions
}

export interface RenderTiming {
  browser_launch_ms: number
  goto_ms: number
  pdf_ms: number
  png_ms?: number
}

export interface PdfArtifact {
  output: string
  size_bytes: number
  page_count?: number
}

export interface PngArtifact {
  output: string
  width: number
  height: number
  size_bytes: number
}

export interface ArtifactRenderResult {
  pdf: PdfArtifact
  png?: PngArtifact
  timing: RenderTiming
}

export function countPdfPages(pdfPath: string): number {
  const data = readFileSync(pdfPath)
  return [...data.toString("latin1").matchAll(/\/Type\s*\/Page\b/g)].length
}

async function renderOnPage(
  browser: Browser,
  renderPath: string,
  options: ArtifactRenderOptions
): Promise<ArtifactRenderResult> {
  const timing: RenderTiming = {
    browser_launch_ms: 0,
    goto_ms: 0,
    pdf_ms: 0,
  }

  const page = await browser.newPage()
  try {
    if (options.png) {
      await page.setViewport({
        width: options.png.width,
        height: options.png.height,
        deviceScaleFactor: options.png.scale,
      })
    }

    const gotoStart = Date.now()
    try {
      await page.goto(`file://${renderPath}`, { waitUntil: "domcontentloaded" })
    } catch (err) {
      throw new PdfMintError(
        "PAGE_LOAD_FAILED",
        `ページの読み込みに失敗しました: ${(err as Error).message}`,
        "HTMLファイル内の外部リソース（フォント・画像）が読み込み可能か確認してください。",
        { input: options.input }
      )
    }
    timing.goto_ms = Date.now() - gotoStart

    const pdfStart = Date.now()
    try {
      await page.pdf({
        path: options.pdf.output,
        format: options.pdf.format,
        printBackground: options.pdf.printBackground,
        landscape: options.pdf.landscape,
        margin: {
          top: options.pdf.margin,
          right: options.pdf.margin,
          bottom: options.pdf.margin,
          left: options.pdf.margin,
        },
      })
    } catch (err) {
      throw new PdfMintError(
        "PDF_GENERATION_FAILED",
        `PDF 生成に失敗しました: ${(err as Error).message}`,
        "出力先への書き込み権限を確認してください。",
        { output: options.pdf.output }
      )
    }
    timing.pdf_ms = Date.now() - pdfStart

    const pageCount = countPdfPages(options.pdf.output)
    if (options.pdf.expectPages !== undefined && pageCount !== options.pdf.expectPages) {
      throw new PdfMintError(
        "PAGE_COUNT_MISMATCH",
        `PDF のページ数が期待値と一致しません: expected ${options.pdf.expectPages}, actual ${pageCount}`,
        "HTML の @page / @media print / body 高さ / overflow を確認してください。",
        {
          output: options.pdf.output,
          expected_pages: options.pdf.expectPages,
          actual_pages: pageCount,
        }
      )
    }

    let png: PngArtifact | undefined
    if (options.png) {
      const pngStart = Date.now()
      try {
        await page.screenshot({
          path: options.png.output,
          fullPage: false,
        })
      } catch (err) {
        throw new PdfMintError(
          "PNG_GENERATION_FAILED",
          `PNG 生成に失敗しました: ${(err as Error).message}`,
          "viewport / scale / 出力先への書き込み権限を確認してください。",
          { output: options.png.output }
        )
      }
      timing.png_ms = Date.now() - pngStart
      png = {
        output: options.png.output,
        width: Math.round(options.png.width * options.png.scale),
        height: Math.round(options.png.height * options.png.scale),
        size_bytes: statSync(options.png.output).size,
      }
    }

    return {
      pdf: {
        output: options.pdf.output,
        size_bytes: statSync(options.pdf.output).size,
        page_count: pageCount,
      },
      ...(png ? { png } : {}),
      timing,
    }
  } finally {
    await page.close()
  }
}

export async function renderArtifacts(
  renderPath: string,
  options: ArtifactRenderOptions,
  session?: BrowserSession
): Promise<ArtifactRenderResult> {
  const ownsSession = !session
  const activeSession = session ?? new BrowserSession()

  try {
    await activeSession.launch()
    const result = await renderOnPage(await activeSession.getBrowser(), renderPath, options)
    result.timing.browser_launch_ms = ownsSession ? activeSession.launchDurationMs : 0
    return result
  } finally {
    if (ownsSession) await activeSession.close()
  }
}
