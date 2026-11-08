---
name: html-to-indesign-mac
description: 在 macOS 将固定分页 HTML 转成可编辑 InDesign 文档，使用 Chrome 提取布局、AppleScript 执行 JSX，输出 INDD 和 PDF 校样。适用于明确需要 HTML 转 InDesign 的 Mac 用户。
---

# HTML → InDesign on macOS

本 Skill 自带转换器，不依赖 Windows COM 或 indesign-cli。
需要 macOS、Adobe InDesign、Google Chrome、Node.js 和 Playwright。先探测本机程序；在 Codex 桌面可用 load_workspace_dependencies 查找 Node 和 node_modules，不要硬编码其他机器的用户路径。Playwright 缺失时在本 Skill 目录安装 `npm install --no-save --ignore-scripts playwright`，使用系统 Chrome，无需下载浏览器。

## 转换

用 Node 运行本目录 `scripts/convert.cjs`：

```sh
NODE_PATH="/absolute/path/to/node_modules" /absolute/path/to/node scripts/convert.cjs /absolute/input.html --out /absolute/new-output --selector .page --app "Adobe InDesign 2026"
```

- 默认每个 `.page` 对应一页；无分页 HTML 使用 `--selector body`。页面宽高由浏览器实际尺寸决定，96 CSS px = 72 pt，不默认改成 A4。`--width 1200` 可设置浏览器视口。
- 输出目录须是新的交付目录，已有 document.indd 时拒绝覆盖。
- `--extract-only` 仅输出布局 JSON、HTML 截图和 JSX。InDesign 无法连接时保留这些产物，不声称已完成转换。
- 转换器会新建文档、保存、关闭并重新打开自身创建的文档核验，再导出 PDF；不关闭用户原有文档。首次 AppleScript 连接可能需要用户在 macOS 系统提示中允许自动化。
- 输出 `document.indd`、`proof.pdf`、`report.json`、`html-preview.png`、`layout.json`、`build.jsx`。检查 report 的 ok、页面数、对象数、overset、missingFonts、outside 和 warnings。missingFonts 只统计字体名称匹配失败，不能发现中文等字符的系统字体回退，需目视检查。ok 仅表示脚本和导出成功；存在溢出、缺字或越界不能宣称版面通过。
- 将 PDF 渲染成图片，与 HTML 截图比较后交付。尤其检查字体、中文、换行和图片裁切。按需修改 HTML 后在新目录重新转换。

## 实际支持范围

文字按 DOM 文本节点创建可编辑文本框，背景为矩形，图片为链接图片。浏览器负责 Flex/Grid 的最终坐标，InDesign 不保留其响应式行为。字体尽量按名称匹配，粗体/斜体尽力匹配；富文本会拆成多个文本框。适合固定尺寸、简单文本与图片布局。

不是任意网页无损导入器：不保留复杂 CSS、伪元素、圆角边框、渐变、阴影、透明度、变换、SVG、canvas、交互、语义表格、母版和段落样式。远程图片需先由任务准备成本地文件；脚本不会下载。HTML 可执行其自带脚本，只处理用户可信文件。用相同来源的本地字体减少替换，不以整页截图冒充可编辑转换。

实现为本地独立代码；路线参考 mindboard/indesign-extendscript-plugins 的 Mac AppleScript/JSX 机制，以及 Young4ever33/ppt-html-idml-convert 的浏览器布局提取思路，未复制其源码。
