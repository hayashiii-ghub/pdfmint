/** demo/ の成果物を再生成する。
 *  1) ビルド済み CLI で report.md → report.pdf (明朝・preset なし)
 *  2) PDF を 1 ページ = 1 PNG にラスタライズ (report-1.png, report-2.png, ...)
 *  PNG を 1 枚に詰め込まず、PDF と同じページ区切りでプレビューを出すのが目的。 */
import { execFileSync } from "node:child_process"
import { readdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { pdf } from "pdf-to-img"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const demoDir = join(root, "demo")
const mdPath = join(demoDir, "report.md")
const pdfPath = join(demoDir, "report.pdf")

// 1) PDF を生成 (明朝・preset なし)
execFileSync("node", [join(root, "dist", "cli.js"), mdPath, pdfPath, "--font", "serif"], { stdio: "inherit" })

// 2) 既存のページ PNG を一掃 (report-1.png 等 / 旧 report.png)
for (const f of readdirSync(demoDir)) {
  if (/^report-\d+\.png$/.test(f) || f === "report.png") rmSync(join(demoDir, f))
}

// 3) 1 ページ = 1 PNG にラスタライズ
const doc = await pdf(pdfPath, { scale: 2 })
let n = 0
for await (const page of doc) {
  n++
  writeFileSync(join(demoDir, `report-${n}.png`), page)
  console.log(`wrote demo/report-${n}.png`)
}
console.log(`done: ${n} page(s)`)
