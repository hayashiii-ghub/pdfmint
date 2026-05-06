import { marked } from "marked"

const DEFAULT_CSS = `
@page { size: A4; margin: 20mm; }
body {
  font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
  font-size: 11pt;
  line-height: 1.7;
  color: #1a1a1a;
}
h1, h2, h3, h4 { color: #222; margin-top: 1.5em; }
h1 { font-size: 20pt; border-bottom: 2px solid #333; padding-bottom: 0.2em; }
h2 { font-size: 16pt; border-left: 4px solid #4a6741; padding-left: 0.5em; }
h3 { font-size: 14pt; }
p { margin: 0.5em 0; }
ul, ol { padding-left: 1.5em; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
th { background: #f5f5f5; }
code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: "SFMono-Regular", "Menlo", monospace; }
pre { background: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto; }
pre code { background: none; padding: 0; }
blockquote { border-left: 4px solid #ddd; padding-left: 1em; color: #666; margin: 1em 0; }
`

export function markdownToHtml(md: string, customCss?: string): string {
  const body = marked.parse(md, { async: false }) as string
  const css = customCss ?? DEFAULT_CSS
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>Document</title>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`
}
