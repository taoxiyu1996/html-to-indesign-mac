# HTML to InDesign for macOS

将固定分页 HTML 转换为可编辑 Adobe InDesign 文档的 Codex Skill。使用 Chrome 提取布局，通过 AppleScript 执行 ExtendScript，输出 INDD、PDF 校样和检查报告。

## 环境

macOS、Adobe InDesign（本地验证版本 2026）、Google Chrome、Node.js 18+。

## 安装

将整个仓库放到 `~/.codex/skills/html-to-indesign-mac`，重新开启 Codex 聊天。

```sh
npm install --ignore-scripts
node scripts/convert.cjs input.html --out new-output --selector .page --app "Adobe InDesign 2026"
```

只提取布局可添加 `--extract-only`；无分页 HTML 可用 `--selector body`。视口宽度默认为 1200 CSS px，可用 `--width` 调整。新输出目录内不能已有 document.indd。

Codex 用法：`使用 $html-to-indesign-mac 将我的 HTML 转成 InDesign，并检查 PDF 校样。`

## 输出与限制

输出 `document.indd`、`proof.pdf`、`report.json`、布局 JSON、HTML 截图和 JSX。文字、背景、图片分别创建为原生对象。CSS px 按 0.75 转为 pt。

这是针对受控固定布局的初始版本，不是任意网页无损转换器。复杂 CSS、伪元素、SVG、canvas、交互和响应式语义不保留。字体可能替换，图片裁切、中文换行和溢出必须检查。远程图片应预先准备成本地素材；此初版使用原有本地图片路径，移动交付物时需重新链接或使用 InDesign 打包。

`report.json` 中 `ok` 表示执行和导出成功，不等同于版面完全一致；还需检查 overset、missingFonts、outside、warnings 并目视比较校样。只运行可信 HTML（浏览器会执行其脚本）。

## 验证范围

本版本在 macOS + InDesign 2026 上验证了两页中英文基本布局和本地图片导入。复杂真实网页需额外适配；未将项目专属适配作为通用能力宣称。

## 致谢

实现为独立代码，参考以下项目的工作路线，未复制其源码：

- https://github.com/mindboard/indesign-extendscript-plugins
- https://github.com/Young4ever33/ppt-html-idml-convert
