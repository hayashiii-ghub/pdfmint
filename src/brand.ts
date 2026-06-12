/** prepare 層: brand profile (brand.md frontmatter) を解決し design token 化する。
 *
 * Phase1 token 語彙:
 *   accent / ink            → CSS custom property (:root) … brandToCss
 *   font_size / line_height → CSS custom property (:root) … brandToCss
 *   font                    → MarkdownFontPreset (sans|serif) … ConvertOptions.font
 *   paper                   → 用紙サイズ … ConvertOptions.format
 *   margin                  → 余白 … ConvertOptions.margin
 *
 * 探索順: --brand <path> > ./pdfmint.brand.md (project) > $XDG/pdfmint/brand.md (global)。
 * 値バリデーションは CSS への素通し注入 (`}` 等での break out) を防ぐガードを兼ねる。
 */
import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join, resolve } from "node:path"
import { PdfMintError } from "./errors"
import type { MarkdownFontPreset } from "./markdown"

export interface BrandTokens {
  accent?: string
  ink?: string
  font?: MarkdownFontPreset
  fontSize?: string
  lineHeight?: string
  paper?: "A4" | "A3" | "Letter" | "Legal"
  margin?: string
}

export interface ResolvedBrand {
  tokens: BrandTokens
  source: string | null
}

export interface ResolveBrandOptions {
  brandPath?: string
  noBrand?: boolean
  cwd: string
}

const PROJECT_FILENAME = "pdfmint.brand.md"
const GLOBAL_SUBPATH = ["pdfmint", "brand.md"] as const

function globalConfigPath(): string {
  const xdg = process.env.XDG_CONFIG_HOME
  const base = xdg && xdg.length > 0 ? xdg : join(homedir(), ".config")
  return join(base, ...GLOBAL_SUBPATH)
}

function brandError(message: string, hint: string, source?: string): PdfMintError {
  return new PdfMintError("BRAND_INVALID", message, hint, source ? { brand: source } : {})
}

/** brand.md を探索・解決する。見つからなければ tokens 空・source null (= 既存挙動)。 */
export function resolveBrand(opts: ResolveBrandOptions): ResolvedBrand {
  if (opts.noBrand) return { tokens: {}, source: null }

  if (opts.brandPath) {
    const abs = resolve(opts.cwd, opts.brandPath)
    if (!existsSync(abs)) {
      throw brandError(
        `brand ファイルが見つかりません: ${opts.brandPath}`,
        "--brand のパスを確認してください。相対パスは現在の作業ディレクトリ基準です。",
        opts.brandPath
      )
    }
    return { tokens: parseBrand(readFileSync(abs, "utf-8"), abs), source: abs }
  }

  const candidates = [join(opts.cwd, PROJECT_FILENAME), globalConfigPath()]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return { tokens: parseBrand(readFileSync(candidate, "utf-8"), candidate), source: candidate }
    }
  }
  return { tokens: {}, source: null }
}

/** frontmatter (--- ... ---) の flat key:value を BrandTokens にする。 */
export function parseBrand(content: string, source: string): BrandTokens {
  const fm = extractFrontmatter(content)
  if (fm === null) {
    throw brandError(
      "brand.md に frontmatter がありません",
      "先頭を `---` で開始し `---` で閉じた YAML 風 frontmatter に token を記述してください。",
      source
    )
  }

  const tokens: BrandTokens = {}
  for (const raw of fm.split("\n")) {
    const line = raw.trim()
    if (line === "" || line.startsWith("#")) continue
    const colon = line.indexOf(":")
    if (colon === -1) {
      throw brandError(
        `brand.md の行を解釈できません: ${line}`,
        "各行は `key: value` 形式で記述してください。",
        source
      )
    }
    const key = line.slice(0, colon).trim()
    const value = stripQuotes(line.slice(colon + 1).trim())
    applyToken(tokens, key, value, source)
  }
  return tokens
}

function extractFrontmatter(content: string): string | null {
  // 先頭の --- から次の --- までを frontmatter とみなす (BOM / 改行揺れを許容)。
  const normalized = content.replace(/^﻿/, "")
  const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(normalized)
  return match ? match[1]! : null
}

function stripQuotes(value: string): string {
  if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    return value.slice(1, -1)
  }
  return value
}

const COLOR_RE = /^#[0-9a-fA-F]{3,8}$|^[a-zA-Z]+$/
const LENGTH_RE = /^[0-9.]+(pt|px|mm|cm|em|rem|in)$/
// render は margin 文字列を top/right/bottom/left の各辺へそのまま渡す (render.ts) ため単値のみ許可する。
const MARGIN_RE = /^[0-9.]+(pt|px|mm|cm|in)$/
const LINE_HEIGHT_RE = /^[0-9.]+$/
const PAPERS = new Set(["A4", "A3", "Letter", "Legal"])

function applyToken(tokens: BrandTokens, key: string, value: string, source: string): void {
  const bad = (expected: string) =>
    brandError(`brand token の値が不正です: ${key} = ${value}`, `${key} には ${expected} を指定してください。`, source)

  switch (key) {
    case "accent":
      if (!COLOR_RE.test(value)) throw bad("色 (#RGB / #RRGGBB / 色名)")
      tokens.accent = value
      break
    case "ink":
      if (!COLOR_RE.test(value)) throw bad("色 (#RGB / #RRGGBB / 色名)")
      tokens.ink = value
      break
    case "font":
      if (value !== "sans" && value !== "serif") throw bad("sans または serif")
      tokens.font = value
      break
    case "font_size":
      if (!LENGTH_RE.test(value)) throw bad("長さ (例 10.5pt)")
      tokens.fontSize = value
      break
    case "line_height":
      if (!LINE_HEIGHT_RE.test(value)) throw bad("数値 (例 1.65)")
      tokens.lineHeight = value
      break
    case "paper":
      if (!PAPERS.has(value)) throw bad("A4 / A3 / Letter / Legal")
      tokens.paper = value as BrandTokens["paper"]
      break
    case "margin":
      if (!MARGIN_RE.test(value)) throw bad("単一の長さ (例 18mm)")
      tokens.margin = value
      break
    default:
      // 未知 key は Phase2 token (logo 等) との前方互換のため無視する。
      break
  }
}

/** CSS custom property を扱う token (accent/ink/font_size/line_height/margin) を :root ブロックにする。
 *  margin は PDF へは ConvertOptions.margin、PNG (screen) へは --pm-margin の二経路で効く。
 *  該当 token が無ければ空文字 (= brand-absent 時に出力を一切変えない)。 */
export function brandToCss(tokens: BrandTokens): string {
  const decls: string[] = []
  if (tokens.accent) decls.push(`--pm-accent: ${tokens.accent};`)
  if (tokens.ink) decls.push(`--pm-ink: ${tokens.ink};`)
  if (tokens.fontSize) decls.push(`--pm-font-size: ${tokens.fontSize};`)
  if (tokens.lineHeight) decls.push(`--pm-line-height: ${tokens.lineHeight};`)
  if (tokens.margin) decls.push(`--pm-margin: ${tokens.margin};`)
  if (decls.length === 0) return ""
  return `:root { ${decls.join(" ")} }\n`
}
