/**
 * PDF 渲染工具 - 使用 PDF.js 将 PDF 转换为图片
 */

// 动态加载 PDF.js（多 CDN 降级）
let pdfjsLoaded = false

function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (pdfjsLoaded && globalThis.pdfjsLib) {
      resolve(globalThis.pdfjsLib)
      return
    }

    const existing = document.getElementById('pdfjs-script')
    if (existing) {
      existing.onload = () => {
        pdfjsLoaded = true
        resolve(globalThis.pdfjsLib)
      }
      existing.onerror = () => {}
      return
    }

    const cdnUrls = [
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
      'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    ]

    let index = 0

    const tryLoad = () => {
      if (index >= cdnUrls.length) {
        reject(new Error('Failed to load PDF.js from all CDN sources'))
        return
      }

      const script = document.createElement('script')
      script.id = 'pdfjs-script'
      script.src = cdnUrls[index]
      script.onload = () => {
        pdfjsLoaded = true
        // 设置 worker 路径
        const pdfjsLib = globalThis.pdfjsLib
        if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = cdnUrls[index].replace('pdf.min.js', 'pdf.worker.min.js')
        }
        resolve(pdfjsLib)
      }
      script.onerror = () => {
        index++
        tryLoad()
      }
      document.head.appendChild(script)
    }

    tryLoad()
  })
}

/**
 * 读取文件为 ArrayBuffer
 */
function readFileAsArrayBuffer(filePath) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    fetch(filePath)
      .then(res => res.arrayBuffer())
      .then(resolve)
      .catch(reject)
    // #endif

    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath,
      success: (res) => resolve(res.data),
      fail: reject
    })
    // #endif
  })
}

/**
 * 加载 PDF 文档
 * @param {string} filePath - PDF 文件路径
 * @returns {Promise<Object>} PDF 文档对象
 */
export async function loadPdfDocument(filePath) {
  const pdfjsLib = await loadPdfJs()
  const arrayBuffer = await readFileAsArrayBuffer(filePath)
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  return await loadingTask.promise
}

/**
 * 获取 PDF 页面信息
 * @param {Object} pdf - PDF 文档对象
 * @param {number} pageNum - 页码（从1开始）
 * @returns {Promise<Object>} 页面信息 { width, height, pageNumber, totalPages }
 */
export async function getPageInfo(pdf, pageNum) {
  const page = await pdf.getPage(pageNum)
  const viewport = page.getViewport({ scale: 1.0 })
  return {
    width: viewport.width,
    height: viewport.height,
    pageNumber: pageNum,
    totalPages: pdf.numPages
  }
}

/**
 * 将 PDF 页面渲染为图片
 * @param {Object} pdf - PDF 文档对象
 * @param {number} pageNum - 页码（从1开始）
 * @param {Object} options - 配置选项
 * @param {number} options.scale - 缩放比例（默认 2.0，高分辨率）
 * @param {string} options.format - 图片格式 'png' | 'jpeg'
 * @param {number} options.quality - JPEG 质量 0-1（仅 jpeg 格式）
 * @returns {Promise<string>} 图片数据 URL 或临时文件路径
 */
export async function renderPageToImage(pdf, pageNum, options = {}) {
  const {
    scale = 2.0,
    format = 'png',
    quality = 0.92
  } = options

  const page = await pdf.getPage(pageNum)
  const viewport = page.getViewport({ scale })

  // #ifdef H5
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')

  await page.render({
    canvasContext: ctx,
    viewport: viewport
  }).promise

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const dataUrl = canvas.toDataURL(mimeType, quality)
  return dataUrl
  // #endif

  // #ifdef MP-WEIXIN
  // 微信小程序环境使用离屏 Canvas
  return new Promise((resolve, reject) => {
    const query = uni.createSelectorQuery()
    // 需要页面中有 canvas 元素
    setTimeout(() => {
      // 创建离屏 canvas
      const offscreen = wx.createOffscreenCanvas({
        type: '2d',
        width: viewport.width,
        height: viewport.height
      })
      const ctx = offscreen.getContext('2d')

      page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise.then(() => {
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
        offscreen.toDataURL({
          type: mimeType,
          quality,
          success: (res) => {
            resolve(res.data)
          },
          fail: reject
        })
      }).catch(reject)
    }, 100)
  })
  // #endif
}

/**
 * 将 PDF 所有页面渲染为图片
 * @param {string} filePath - PDF 文件路径
 * @param {Object} options - 配置选项
 * @param {number} options.scale - 缩放比例
 * @param {string} options.format - 图片格式
 * @param {number} options.quality - JPEG 质量
 * @param {Array<number>} options.pages - 要渲染的页码数组（默认全部）
 * @param {Function} options.onProgress - 进度回调
 * @returns {Promise<Array>} 图片数据数组
 */
export async function renderAllPages(filePath, options = {}) {
  const {
    scale = 2.0,
    format = 'png',
    quality = 0.92,
    pages = null,
    onProgress = () => {}
  } = options

  const pdf = await loadPdfDocument(filePath)
  const totalPages = pdf.numPages
  const pagesToRender = pages || Array.from({ length: totalPages }, (_, i) => i + 1)

  const images = []
  for (let i = 0; i < pagesToRender.length; i++) {
    onProgress(Math.round(((i + 1) / pagesToRender.length) * 100))
    const imageData = await renderPageToImage(pdf, pagesToRender[i], { scale, format, quality })
    images.push({
      pageNumber: pagesToRender[i],
      data: imageData
    })
  }

  onProgress(100)
  return { images, totalPages }
}

/**
 * 保存图片数据为文件
 * @param {string} imageData - 图片数据（data URL 或 base64）
 * @param {string} fileName - 文件名
 * @returns {Promise<string>} 文件路径
 */
export function saveImageToFile(imageData, fileName) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    // H5 环境直接返回 data URL
    resolve(imageData)
    // #endif

    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`

    // 移除 data URL 前缀
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = uni.base64ToArrayBuffer(base64Data)

    fs.writeFile({
      filePath,
      data: buffer,
      encoding: 'binary',
      success: () => resolve(filePath),
      fail: reject
    })
    // #endif
  })
}

/**
 * 批量保存图片
 * @param {Array} images - 图片数据数组
 * @param {string} prefix - 文件名前缀
 * @param {string} format - 图片格式
 * @returns {Promise<Array>} 文件路径数组
 */
export async function saveImagesToFiles(images, prefix = 'pdf_page', format = 'png') {
  const paths = []
  for (const img of images) {
    const fileName = `${prefix}_${img.pageNumber}.${format}`
    const path = await saveImageToFile(img.data, fileName)
    paths.push({ pageNumber: img.pageNumber, path })
  }
  return paths
}
