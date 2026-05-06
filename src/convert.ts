import puppeteer from "puppeteer"
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs"
import { dirname, extname, resolve, join } from "node:path"
import { tmpdir } from "node:os"
import { PdfMintError } from "./errors"
import { markdownToHtml } from "./markdown"

export interface ConvertOptions {
  format?: "A4" | "A3" | "Letter" | "Legal"
  margin?: string
  landscape?: boolean
  noBackground?: boolean
}

export interface ConvertResult {
  input: string
  output: string
  format: string
  size_bytes: number
  duration_ms: number
}

export async function convertHtmlToPdf(
  inputPath: string,
  outputPath: string,
  options: ConvertOptions
): Promise<ConvertResult> {
  const start = Date.now()
  const inputAbs = resolve(inputPath)
  const outputAbs = resolve(outputPath)

  if (!existsSync(inputAbs)) {
    throw new PdfMintError(
      "INPUT_NOT_FOUND",
      `入力ファイルが見つかりません: ${inputPath}`,
      "ファイルパスを確認してください。相対パスは現在の作業ディレクトリ基準で解釈されます。",
      { input: inputPath }
    )
  }

  const outDir = dirname(outputAbs)
  if (!existsSync(outDir)) {
    throw new PdfMintError(
      "OUTPUT_DIR_NOT_FOUND",
      `出力先ディレクトリが存在しません: ${outDir}`,
      "出力先ディレクトリを事前に作成してください（mkdir -p）。",
      { output: outputPath }
    )
  }

  const format = options.format ?? "A4"
  const margin = options.margin ?? "0"

  // 入力ファイル種別の判定 + Markdown→HTML 変換
  const ext = extname(inputAbs).toLowerCase()
  let renderTarget = inputAbs
  let mdTmpDir: string | null = null
  if (ext === ".md" || ext === ".markdown") {
    const md = readFileSync(inputAbs, "utf-8")
    const html = markdownToHtml(md)
    mdTmpDir = mkdtempSync(join(tmpdir(), "pdfmint-md-"))
    renderTarget = join(mdTmpDir, "rendered.html")
    writeFileSync(renderTarget, html, "utf-8")
  } else if (ext !== ".html" && ext !== ".htm") {
    throw new PdfMintError(
      "UNSUPPORTED_INPUT",
      `未対応のファイル形式です: ${ext}`,
      ".html, .htm, .md, .markdown のいずれかを指定してください。",
      { input: inputPath }
    )
  }

  let browser
  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
  } catch (err) {
    if (mdTmpDir) rmSync(mdTmpDir, { recursive: true, force: true })
    throw new PdfMintError(
      "BROWSER_LAUNCH_FAILED",
      `Chromium の起動に失敗しました: ${(err as Error).message}`,
      "puppeteer の Chromium ダウンロードを再実行してください: bunx puppeteer browsers install chrome",
      {}
    )
  }

  try {
    const page = await browser.newPage()
    try {
      await page.goto(`file://${renderTarget}`, { waitUntil: "networkidle0" })
    } catch (err) {
      throw new PdfMintError(
        "PAGE_LOAD_FAILED",
        `ページの読み込みに失敗しました: ${(err as Error).message}`,
        "HTMLファイル内の外部リソース（フォント・画像）が読み込み可能か確認してください。",
        { input: inputPath }
      )
    }

    try {
      await page.pdf({
        path: outputAbs,
        format,
        printBackground: !options.noBackground,
        landscape: options.landscape ?? false,
        margin: { top: margin, right: margin, bottom: margin, left: margin },
      })
    } catch (err) {
      throw new PdfMintError(
        "PDF_GENERATION_FAILED",
        `PDF 生成に失敗しました: ${(err as Error).message}`,
        "出力先への書き込み権限を確認してください。",
        { output: outputPath }
      )
    }
  } finally {
    await browser.close()
    if (mdTmpDir) rmSync(mdTmpDir, { recursive: true, force: true })
  }

  const { statSync } = await import("node:fs")
  return {
    input: inputAbs,
    output: outputAbs,
    format,
    size_bytes: statSync(outputAbs).size,
    duration_ms: Date.now() - start,
  }
}
