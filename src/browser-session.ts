/** render 層: Chromium セッションの起動・再利用・終了を管理する。 */
import puppeteer, { type Browser } from "puppeteer"
import { PdfMintError } from "./errors"

const LAUNCH_ARGS = ["--no-sandbox", "--disable-setuid-sandbox"] as const

async function launchBrowser(): Promise<Browser> {
  const base = { args: [...LAUNCH_ARGS] as string[] }
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return puppeteer.launch({
      ...base,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    })
  }
  try {
    return await puppeteer.launch({ ...base, channel: "chrome" })
  } catch {
    return puppeteer.launch(base)
  }
}

export class BrowserSession {
  private browser: Browser | null = null
  private launchMs = 0

  get launchDurationMs(): number {
    return this.launchMs
  }

  async launch(): Promise<Browser> {
    if (this.browser) return this.browser
    const start = Date.now()
    try {
      this.browser = await launchBrowser()
    } catch (err) {
      throw new PdfMintError(
        "BROWSER_LAUNCH_FAILED",
        `Chromium の起動に失敗しました: ${(err as Error).message}`,
        "puppeteer の Chromium ダウンロードを再実行してください: npx puppeteer browsers install chrome",
        {}
      )
    }
    this.launchMs = Date.now() - start
    return this.browser
  }

  async getBrowser(): Promise<Browser> {
    return this.browser ?? (await this.launch())
  }

  async close(): Promise<void> {
    if (!this.browser) return
    await this.browser.close()
    this.browser = null
  }
}
