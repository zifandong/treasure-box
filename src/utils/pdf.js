/**
 * PDF 工具 - 直接使用 npm 依赖的 pdf-lib
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

/**
 * 将文件数据规范化为 pdf-lib 可接受的 Uint8Array
 * 微信小程序 readFile 返回的 ArrayBuffer 可能无法通过 instanceof 检测
 */
function normalizeBinaryData(data) {
  if (data instanceof Uint8Array) {
    return data
  }
  if (typeof data === 'string') {
    return data
  }
  return new Uint8Array(data)
}

/**
 * 读取文件为 ArrayBuffer
 */
function readFileAsArrayBuffer(filePath) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    fetch(filePath)
      .then(res => res.arrayBuffer())
      .then(buffer => resolve(normalizeBinaryData(buffer)))
      .catch(reject)
    // #endif

    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath,
      success: (res) => resolve(normalizeBinaryData(res.data)),
      fail: reject
    })
    // #endif
  })
}

/**
 * 通过文件头魔数判断图片格式
 * PNG: 89 50 4E 47 (0x89PNG)
 * JPG: FF D8 FF
 */
function isPNG(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
}

/**
 * 将 pdf-lib 输出的字节包装为平台可用格式
 * H5 使用 Blob，微信小程序无 Blob，直接返回 Uint8Array
 */
function toPdfOutput(pdfBytes) {
  // #ifdef H5
  return new Blob([pdfBytes], { type: 'application/pdf' })
  // #endif

  // #ifdef MP-WEIXIN
  return pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes)
  // #endif
}

/**
 * 将多张图片合并为 PDF
 * @param {Array} imageFiles - 图片文件路径数组
 * @param {Object} options - 配置选项
 * @param {string} options.orientation - 页面方向 'portrait' | 'landscape'
 * @param {number} options.margin - 页边距 (pt)
 * @param {Function} options.onProgress - 进度回调
 * @returns {Promise<Blob>} PDF 文件 Blob
 */
export async function imagesToPDF(imageFiles, options = {}) {
  const {
    orientation = 'portrait',
    margin = 40,
    onProgress = () => {}
  } = options

  const pdfDoc = await PDFDocument.create()

  for (let i = 0; i < imageFiles.length; i++) {
    onProgress(Math.round(((i + 1) / imageFiles.length) * 100))

    const filePath = imageFiles[i]
    const fileData = await readFileAsArrayBuffer(filePath)
    let image

    if (isPNG(fileData)) {
      image = await pdfDoc.embedPng(fileData)
    } else {
      image = await pdfDoc.embedJpg(fileData)
    }

    const pageWidth = orientation === 'landscape' ? 841.89 : 595.28
    const pageHeight = orientation === 'landscape' ? 595.28 : 841.89

    const maxWidth = pageWidth - margin * 2
    const maxHeight = pageHeight - margin * 2

    let { width, height } = image.scale(1)
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width *= ratio
    height *= ratio

    const page = pdfDoc.addPage([pageWidth, pageHeight])
    page.drawImage(image, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height
    })
  }

  onProgress(100)

  const pdfBytes = await pdfDoc.save()
  return toPdfOutput(pdfBytes)
}

/**
 * 合并多个 PDF 文件
 * @param {Array<string>} pdfFiles - PDF 文件路径数组
 * @param {Object} options - 配置选项
 * @param {Function} options.onProgress - 进度回调
 * @returns {Promise<Blob>} 合并后的 PDF 文件 Blob
 */
export async function mergePDFs(pdfFiles, options = {}) {
  const { onProgress = () => {} } = options

  const mergedPdf = await PDFDocument.create()

  for (let i = 0; i < pdfFiles.length; i++) {
    onProgress(Math.round(((i + 1) / pdfFiles.length) * 100))

    const filePath = pdfFiles[i]
    const fileData = await readFileAsArrayBuffer(filePath)
    const pdfDoc = await PDFDocument.load(fileData)
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())
    copiedPages.forEach((page) => mergedPdf.addPage(page))
  }

  onProgress(100)

  const pdfBytes = await mergedPdf.save()
  return toPdfOutput(pdfBytes)
}

/**
 * 从纯文本创建 PDF
 */
export async function createPDFFromText(text) {
  const pdfDoc = await PDFDocument.create()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize = 12
  const lineHeight = fontSize * 1.5
  const margin = 50

  const pageWidth = 595.28
  const pageHeight = 841.89
  const maxWidth = pageWidth - margin * 2
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight)

  const paragraphs = text.split('\n').filter(p => p.trim())

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
  let currentLine = 0
  let yPosition = pageHeight - margin

  for (const paragraph of paragraphs) {
    const lines = wrapText(paragraph, font, fontSize, maxWidth)

    for (const line of lines) {
      if (currentLine >= maxLinesPerPage) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight])
        currentLine = 0
        yPosition = pageHeight - margin
      }

      currentPage.drawText(line, {
        x: margin,
        y: yPosition,
        size: fontSize,
        font,
        color: rgb(0.2, 0.2, 0.2)
      })

      yPosition -= lineHeight
      currentLine++
    }

    yPosition -= lineHeight * 0.5
  }

  const pdfBytes = await pdfDoc.save()
  return toPdfOutput(pdfBytes)
}

/**
 * 文本自动换行
 */
function wrapText(text, font, fontSize, maxWidth) {
  const lines = []
  let currentLine = ''

  for (const char of text) {
    const testLine = currentLine + char
    const width = font.widthOfTextAtSize(testLine, fontSize)

    if (width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = char
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : ['']
}
