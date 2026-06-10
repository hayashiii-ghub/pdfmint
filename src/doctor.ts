import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { BrowserSession } from "./browser-session"
import { renderArtifacts } from "./render"

export type DoctorStatus = "ok" | "warn" | "fail"

export interface DoctorCheck {
  name: string
  status: DoctorStatus
  message: string
  next_command?: string
}

export interface DoctorResult {
  success: boolean
  checks: DoctorCheck[]
  duration_ms: number
}

const MIN_NODE_MAJOR = 22

function parseNodeMajor(version: string): number {
  const match = /^v?(\d+)/.exec(version)
  return match ? Number(match[1]) : 0
}

export async function runDoctor(): Promise<DoctorResult> {
  const start = Date.now()
  const checks: DoctorCheck[] = []

  const nodeMajor = parseNodeMajor(process.version)
  if (nodeMajor >= MIN_NODE_MAJOR) {
    checks.push({
      name: "node",
      status: "ok",
      message: `Node.js ${process.version}`,
    })
  } else {
    checks.push({
      name: "node",
      status: "fail",
      message: `Node.js ${process.version} (requires >= ${MIN_NODE_MAJOR})`,
      next_command: "mise use node@22  # or nvm install 22",
    })
  }

  const tmpDir = mkdtempSync(join(tmpdir(), "pdfmint-doctor-"))
  let session: BrowserSession | undefined
  try {
    session = new BrowserSession()
    await session.launch()
    checks.push({
      name: "chromium",
      status: "ok",
      message: `Chromium launched (${session.launchDurationMs}ms)`,
    })

    const sampleHtml = join(tmpDir, "sample.html")
    const samplePdf = join(tmpDir, "sample.pdf")
    writeFileSync(
      sampleHtml,
      `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><style>body{font-family:sans-serif;padding:2em}</style></head><body><h1>pdfmint doctor</h1><p>診断用サンプル</p></body></html>`,
      "utf-8"
    )

    await renderArtifacts(sampleHtml, {
      input: sampleHtml,
      pdf: {
        output: samplePdf,
        format: "A4",
        margin: "0",
        landscape: false,
        printBackground: true,
        expectPages: 1,
      },
    }, session)

    checks.push({
      name: "sample_conversion",
      status: "ok",
      message: "Sample HTML → PDF succeeded (1 page)",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    checks.push({
      name: checks.some((c) => c.name === "chromium") ? "sample_conversion" : "chromium",
      status: "fail",
      message,
      next_command: "npx puppeteer browsers install chrome",
    })
  } finally {
    await session?.close()
    rmSync(tmpDir, { recursive: true, force: true })
  }

  const success = checks.every((c) => c.status === "ok")
  return {
    success,
    checks,
    duration_ms: Date.now() - start,
  }
}
