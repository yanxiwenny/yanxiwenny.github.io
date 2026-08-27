# 老币的生日星光

一个使用 Vite、Three.js 与原生 CSS/JavaScript 制作的单页生日惊喜网站。包含星尘汇聚的立体栀子花束、星尘转场、可旋转的星空蛋糕、许愿烛光、背景代码片尾和音乐控制。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端显示的本地地址。音乐必须在点击“轻触开启”后播放，这是移动浏览器的正常限制。

## 音乐与构建

- 背景音乐源文件放在 `public/audio/bgm.mp3`。
- 替换音乐时保持文件名不变，再运行 `npm run build`。
- 生产构建命令：`npm run build`。
- 构建后的 `dist/` 是需要上传至国内静态托管服务的完整最终目录。
- 仓库中的 `docs/` 是经过验证的 `dist/` 完整副本，可直接选作 GitHub Pages 的发布目录；每次重新构建后需同步更新。

页面所需的 Three.js、样式、字体和音频均为本地资源或由 Vite 打包，运行时不依赖境外 CDN、在线字体或外部图片。

## 预览生产版本

```bash
npm run preview
```
