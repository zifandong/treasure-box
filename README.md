# 百宝箱 - 微信小程序

实用工具集合小程序，首期支持图片转PDF和Word转PDF功能。

## 功能特性

- **图片转PDF**: 多张图片合并为PDF，支持JPG/PNG格式，可设置页面方向和页边距
- **Word转PDF**: Word文档(.docx)转换为PDF，支持内容预览

## 技术栈

- 框架: uni-app (Vue3 + Composition API)
- PDF生成: pdf-lib
- Word解析: mammoth.js
- 构建工具: Vite

## 开发环境准备

1. 安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html) (推荐)
2. 或者安装 Node.js 16+ 并使用 CLI 方式

## 快速开始

```bash
# 安装依赖
npm install

# H5 开发模式
npm run dev:h5

# 微信小程序开发模式
npm run dev:mp-weixin

# 构建微信小程序
npm run build:mp-weixin
```

## 项目结构

```
treasure-box/
├── src/
│   ├── pages/
│   │   ├── index/          # 首页 - 工具列表
│   │   ├── img2pdf/        # 图片转PDF
│   │   └── word2pdf/       # Word转PDF
│   ├── utils/
│   │   ├── pdf.js          # PDF 生成工具
│   │   ├── word.js         # Word 解析工具
│   │   └── file.js         # 文件处理工具
│   ├── static/             # 静态资源
│   ├── App.vue
│   ├── main.js
│   ├── pages.json          # 页面路由配置
│   └── uni.scss            # 全局样式
├── package.json
└── vite.config.js
```

## 发布流程

1. 在 [微信公众平台](https://mp.weixin.qq.com/) 注册小程序账号
2. 获取 AppID 并配置到 `manifest.json`
3. 使用微信开发者工具打开 `dist/dev/mp-weixin` 目录
4. 在微信开发者工具中上传代码
5. 在微信公众平台提交审核
6. 审核通过后发布上线

## 后续规划

- [ ] PDF转图片
- [ ] PDF合并/拆分
- [ ] 图片压缩
- [ ] 二维码生成
- [ ] 文件格式转换
