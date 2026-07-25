import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const npmCache = mkdtempSync(join(tmpdir(), "pdfmint-npm-cache-"))
const packTmp = mkdtempSync(join(tmpdir(), "pdfmint-pack-smoke-"))
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8")) as { version: string }

function run(command: string, args: string[], cwd = root): string {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf-8",
    env: {
      ...process.env,
      npm_config_cache: npmCache,
      npm_config_fetch_retries: "1",
      npm_config_fetch_retry_mintimeout: "1000",
      npm_config_fetch_retry_maxtimeout: "5000",
      npm_config_fetch_timeout: "15000",
    },
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 120_000,
  })

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        `exit: ${result.status}`,
        result.stdout.trim(),
        result.stderr.trim(),
      ]
        .filter(Boolean)
        .join("\n")
    )
  }

  return result.stdout
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

try {
  const dryRun = JSON.parse(run("npm", ["pack", "--dry-run", "--json"])) as Array<{
    files: Array<{ path: string }>
  }>
  const packedPaths = new Set(dryRun[0]?.files.map((file) => file.path) ?? [])

  for (const required of [
    "dist/cli.js",
    "dist/fonts/KiwiMaru-Regular.ttf",
    "dist/fonts/KiwiMaru-Medium.ttf",
    "dist/fonts/KleeOne-Regular.ttf",
    "dist/fonts/KleeOne-SemiBold.ttf",
    "dist/fonts/ShipporiMincho-Regular.ttf",
    "dist/fonts/ShipporiMincho-SemiBold.ttf",
    "dist/fonts/ShipporiMincho-Bold.ttf",
    "dist/fonts/ZenKakuGothicNew-Regular.ttf",
    "dist/fonts/ZenKakuGothicNew-Medium.ttf",
    "dist/fonts/ZenKakuGothicNew-Bold.ttf",
    "dist/fonts/OFL-KiwiMaru.txt",
    "dist/fonts/OFL-KleeOne.txt",
    "dist/fonts/OFL-ShipporiMincho.txt",
    "dist/fonts/OFL-ZenKakuGothicNew.txt",
    "package.json",
    "README.md",
    "README.en.md",
    "CHANGELOG.md",
    "AGENTS.md",
    "skills/pdfmint/SKILL.md",
  ]) {
    assert(packedPaths.has(required), `npm package is missing ${required}`)
  }

  for (const path of packedPaths) {
    assert(!path.startsWith("src/"), `npm package should not include source file: ${path}`)
    assert(!path.startsWith("tests/"), `npm package should not include test file: ${path}`)
    assert(!/^dist\/fonts\/.*\.ts$/.test(path), `npm package should not include font source code: ${path}`)
  }

  const pack = JSON.parse(run("npm", ["pack", "--json", "--pack-destination", packTmp])) as Array<{
    filename: string
  }>
  const tarball = join(packTmp, pack[0]!.filename)
  assert(existsSync(tarball), `packed tarball does not exist: ${tarball}`)

  const installDir = join(packTmp, "install")
  mkdirSync(installDir)
  run("npm", ["install", tarball, "--ignore-scripts", "--no-audit", "--no-fund"], installDir)

  const bin = join(installDir, "node_modules", ".bin", process.platform === "win32" ? "pdfmint.cmd" : "pdfmint")
  assert(existsSync(bin), `installed pdfmint bin does not exist: ${bin}`)

  const version = run(bin, ["--version"], installDir).trim()
  assert(version === pkg.version, `expected installed CLI version ${pkg.version}, got ${version}`)

  // バンドル済みdistが同梱フォントだけでオフライン変換できることを確認する。
  const distCli = join(root, "dist", "cli.js")
  const sampleMd = join(packTmp, "font-smoke.md")
  const samplePdf = join(packTmp, "font-smoke.pdf")
  writeFileSync(sampleMd, "# 日本語の見出し\n\n本文です。\n", "utf-8")
  const output = run(process.execPath, [distCli, sampleMd, samplePdf, "--font", "shippori", "--json"])
  const result = JSON.parse(output) as { success: boolean; font?: string }
  assert(result.success === true && result.font === "shippori", `distの書体付き変換が失敗しました: ${output.trim()}`)
  assert(existsSync(samplePdf), `dist変換のPDFが生成されませんでした: ${samplePdf}`)
} finally {
  rmSync(packTmp, { recursive: true, force: true })
  rmSync(npmCache, { recursive: true, force: true })
}
