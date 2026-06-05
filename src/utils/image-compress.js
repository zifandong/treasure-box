/**
 * 图片压缩工具 - 使用 Canvas 实现
 */

/**
 * 压缩单张图片
 * @param {string} filePath - 图片路径
 * @param {Object} options - 压缩选项
 * @param {number} options.quality - 压缩质量 0-1（默认 0.8）
 * @param {number} options.maxWidth - 最大宽度（可选）
 * @param {number} options.maxHeight - 最大高度（可选）
 * @param {string} options.format - 输出格式 'jpeg' | 'png' | 'auto'（默认 auto）
 * @param {number} options.originalSize - 原始文件大小（可选，用于对比）
 * @returns {Promise<Object>} 压缩后的图片信息 { data, width, height, size, format }
 */
export function compressImage(filePath, options = {}) {
  const {
    quality = 0.8,
    maxWidth = null,
    maxHeight = null,
    format = 'auto',
    originalSize = 0
  } = options

  // 检测原图格式
  const isPNG = filePath.toLowerCase().endsWith('.png')

  return new Promise((resolve, reject) => {
    // #ifdef H5
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      let { width, height } = img
      let needResize = false

      // 计算缩放比例
      if (maxWidth && width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
        needResize = true
      }
      if (maxHeight && height > maxHeight) {
        width = Math.round((width * maxHeight) / height)
        height = maxHeight
        needResize = true
      }

      // 如果不需要缩放，且原图是 PNG，尝试保持 PNG 格式
      // 如果需要缩放或原图是 JPEG，使用指定格式或默认 JPEG
      let targetFormat = format
      if (targetFormat === 'auto') {
        targetFormat = (needResize || !isPNG) ? 'jpeg' : 'png'
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      const mimeType = targetFormat === 'png' ? 'image/png' : 'image/jpeg'
      const dataUrl = canvas.toDataURL(mimeType, quality)

      // 计算大小（Base64 约增加 33%）
      const base64 = dataUrl.split(',')[1]
      const size = Math.round((base64.length * 3) / 4)

      // 如果压缩后反而变大，且没有强制缩放，返回原始格式
      if (originalSize > 0 && size > originalSize && !needResize) {
        // 使用原始格式重新尝试
        const originalMimeType = isPNG ? 'image/png' : 'image/jpeg'
        const originalDataUrl = canvas.toDataURL(originalMimeType, quality)
        const originalBase64 = originalDataUrl.split(',')[1]
        const originalSizeCalculated = Math.round((originalBase64.length * 3) / 4)

        if (originalSizeCalculated < size) {
          resolve({
            data: originalDataUrl,
            width,
            height,
            size: originalSizeCalculated,
            format: isPNG ? 'png' : 'jpeg'
          })
          return
        }
      }

      resolve({
        data: dataUrl,
        width,
        height,
        size,
        format: targetFormat
      })
    }

    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }

    img.src = filePath
    // #endif

    // #ifdef MP-WEIXIN
    uni.getImageInfo({
      src: filePath,
      success: (res) => {
        let { width, height } = res
        let needResize = false

        // 计算缩放比例
        if (maxWidth && width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
          needResize = true
        }
        if (maxHeight && height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
          needResize = true
        }

        // 确定目标格式
        let targetFormat = format
        if (targetFormat === 'auto') {
          targetFormat = (needResize || !isPNG) ? 'jpeg' : 'png'
        }

        setTimeout(() => {
          const offscreen = wx.createOffscreenCanvas({
            type: '2d',
            width,
            height
          })
          const ctx = offscreen.getContext('2d')

          const image = offscreen.createImage()
          image.onload = () => {
            ctx.drawImage(image, 0, 0, width, height)

            const mimeType = targetFormat === 'png' ? 'image/png' : 'image/jpeg'
            offscreen.toDataURL({
              type: mimeType,
              quality,
              success: (result) => {
                const base64 = result.data.split(',')[1]
                const size = Math.round((base64.length * 3) / 4)

                // 如果压缩后反而变大，尝试原始格式
                if (originalSize > 0 && size > originalSize && !needResize) {
                  const originalMimeType = isPNG ? 'image/png' : 'image/jpeg'
                  offscreen.toDataURL({
                    type: originalMimeType,
                    quality,
                    success: (originalResult) => {
                      const originalBase64 = originalResult.data.split(',')[1]
                      const originalSizeCalculated = Math.round((originalBase64.length * 3) / 4)

                      if (originalSizeCalculated < size) {
                        resolve({
                          data: originalResult.data,
                          width,
                          height,
                          size: originalSizeCalculated,
                          format: isPNG ? 'png' : 'jpeg'
                        })
                      } else {
                        resolve({
                          data: result.data,
                          width,
                          height,
                          size,
                          format: targetFormat
                        })
                      }
                    },
                    fail: () => {
                      resolve({
                        data: result.data,
                        width,
                        height,
                        size,
                        format: targetFormat
                      })
                    }
                  })
                } else {
                  resolve({
                    data: result.data,
                    width,
                    height,
                    size,
                    format: targetFormat
                  })
                }
              },
              fail: reject
            })
          }
          image.onerror = reject
          image.src = filePath
        }, 100)
      },
      fail: reject
    })
    // #endif
  })
}

/**
 * 批量压缩图片
 * @param {Array<string>} filePaths - 图片路径数组
 * @param {Object} options - 压缩选项
 * @param {Function} options.onProgress - 进度回调
 * @returns {Promise<Array>} 压缩结果数组
 */
export async function compressImages(filePaths, options = {}) {
  const { onProgress = () => {} } = options
  const results = []

  for (let i = 0; i < filePaths.length; i++) {
    onProgress(Math.round(((i + 1) / filePaths.length) * 100))

    try {
      const result = await compressImage(filePaths[i], options)
      results.push({
        originalPath: filePaths[i],
        ...result
      })
    } catch (err) {
      console.error(`压缩第 ${i + 1} 张图片失败:`, err)
      results.push({
        originalPath: filePaths[i],
        error: err.message
      })
    }
  }

  onProgress(100)
  return results
}

/**
 * 保存压缩后的图片
 * @param {string} imageData - Base64 图片数据
 * @param {string} fileName - 文件名
 * @returns {Promise<string>} 文件路径
 */
export function saveCompressedImage(imageData, fileName) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    resolve(imageData)
    // #endif

    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`

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
 * 获取图片原始大小
 * @param {string} filePath - 图片路径
 * @returns {Promise<number>} 文件大小（字节）
 */
export function getImageSize(filePath) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    fetch(filePath)
      .then(res => res.blob())
      .then(blob => resolve(blob.size))
      .catch(reject)
    // #endif

    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    fs.getFileInfo({
      filePath,
      success: (res) => resolve(res.size),
      fail: reject
    })
    // #endif
  })
}
