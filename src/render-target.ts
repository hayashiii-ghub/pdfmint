/** prepare 層: 入力パスを Chromium が読める renderPath に正規化する。 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { extname, join, resolve } from "node:path"
import { tmpdir } from "node:os"
import { PdfMintError } from "./errors"
import { markdownToHtml } from "./markdown"
import type { DocumentFont } from "./fonts/stacks"

export interface RenderTargetMarkdownOptions {
  font?: DocumentFont
  cssPath?: string
  margin?: string
}

export interface RenderTarget {
  inputAbs: string
  renderPath: string
  kind: "html" | "markdown"
  cleanup: () => void
}

export function prepareRenderTarget(
  inputPath: string,
  markdownOptions: RenderTargetMarkdownOptions = {}
): RenderTarget {
  const inputAbs = resolve(inputPath)

  if (!existsSync(inputAbs)) {
    throw new PdfMintError(
      "INPUT_NOT_FOUND",
      `入力ファイルが見つかりません: ${inputPath}`,
      "ファイルパスを確認してください。相対パスは現在の作業ディレクトリ基準で解釈されます。",
      { input: inputPath }
    )
  }

  const ext = extname(inputAbs).toLowerCase()
  if (ext === ".html" || ext === ".htm") {
    return {
      inputAbs,
      renderPath: inputAbs,
      kind: "html",
      cleanup: () => {},
    }
  }

  if (ext === ".md" || ext === ".markdown") {
    const md = readFileSync(inputAbs, "utf-8")
    const css = markdownOptions.cssPath ? readCustomCss(markdownOptions.cssPath) : undefined
    const html = markdownToHtml(md, {
      font: markdownOptions.font,
      customCss: css,
      margin: markdownOptions.margin,
    })
    const tmpDir = mkdtempSync(join(tmpdir(), "pdfmint-md-"))
    const renderPath = join(tmpDir, "rendered.html")
    writeFileSync(renderPath, html, "utf-8")
    return {
      inputAbs,
      renderPath,
      kind: "markdown",
      cleanup: () => rmSync(tmpDir, { recursive: true, force: true }),
    }
  }

  throw new PdfMintError(
    "UNSUPPORTED_INPUT",
    `未対応のファイル形式です: ${ext}`,
    ".html, .htm, .md, .markdown のいずれかを指定してください。",
    { input: inputPath }
  )
}

function readCustomCss(cssPath: string): string {
  const cssAbs = resolve(cssPath)
  if (!existsSync(cssAbs)) {
    throw new PdfMintError(
      "INPUT_NOT_FOUND",
      `CSSファイルが見つかりません: ${cssPath}`,
      "CSSファイルのパスを確認してください。相対パスは現在の作業ディレクトリ基準で解釈されます。",
      { css: cssPath }
    )
  }
  return readFileSync(cssAbs, "utf-8")
}
