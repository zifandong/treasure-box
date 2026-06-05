/**
 * 文件处理工具
 */

function hasBlob() {
  return typeof Blob !== 'undefined'
}

/**
 * 选择图片文件
 * @param {number} count - 最多选择数量
 * @returns {Promise<Array>} 文件路径数组
 */
export function chooseImages(count = 9) {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        resolve(res.tempFilePaths)
      },
      fail: (err) => {
        if (err.errMsg.includes('cancel')) {
          resolve([])
        } else {
          reject(err)
        }
      }
    })
  })
}

/**
 * 选择 Word 文件
 * @returns {Promise<Object|null>} 文件信息
 */
export function chooseWordFile() {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['docx'],
      success: (res) => {
        if (res.tempFiles.length > 0) {
          resolve({
            path: res.tempFiles[0].path,
            name: res.tempFiles[0].name,
            size: res.tempFiles[0].size
          })
        } else {
          resolve(null)
        }
      },
      fail: (err) => {
        if (err.errMsg.includes('cancel')) {
          resolve(null)
        } else {
          reject(err)
        }
      }
    })
    // #endif

    // #ifdef H5
    // H5 环境使用 input[type=file]
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.docx'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const url = URL.createObjectURL(file)
        resolve({
          path: url,
          name: file.name,
          size: file.size
        })
      } else {
        resolve(null)
      }
    }
    input.click()
    // #endif
  })
}

/**
 * 选择 PDF 文件
 * @returns {Promise<Object|null>} 文件信息
 */
export function choosePdfFile() {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        if (res.tempFiles.length > 0) {
          resolve({
            path: res.tempFiles[0].path,
            name: res.tempFiles[0].name,
            size: res.tempFiles[0].size
          })
        } else {
          resolve(null)
        }
      },
      fail: (err) => {
        if (err.errMsg.includes('cancel')) {
          resolve(null)
        } else {
          reject(err)
        }
      }
    })
    // #endif

    // #ifdef H5
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const url = URL.createObjectURL(file)
        resolve({
          path: url,
          name: file.name,
          size: file.size
        })
      } else {
        resolve(null)
      }
    }
    input.click()
    // #endif
  })
}

/**
 * 选择多个 PDF 文件
 * @param {number} count - 最多选择数量
 * @returns {Promise<Array>} 文件信息数组
 */
export function chooseMultiplePdfFiles(count = 9) {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.chooseMessageFile({
      count,
      type: 'file',
      extension: ['pdf'],
      success: (res) => {
        const files = res.tempFiles.map(file => ({
          path: file.path,
          name: file.name,
          size: file.size
        }))
        resolve(files)
      },
      fail: (err) => {
        if (err.errMsg.includes('cancel')) {
          resolve([])
        } else {
          reject(err)
        }
      }
    })
    // #endif

    // #ifdef H5
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from(e.target.files).map(file => ({
        path: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      }))
      resolve(files)
    }
    input.click()
    // #endif
  })
}

/**
 * 获取 PDF 输出数据的字节大小（兼容 Blob / Uint8Array）
 */
export function getPdfByteSize(data) {
  if (hasBlob() && data instanceof Blob) return data.size
  if (data instanceof Uint8Array) return data.byteLength
  if (data && typeof data.byteLength === 'number') return data.byteLength
  return 0
}

/**
 * 保存 PDF 数据为可访问的文件路径
 * @param {Blob|Uint8Array} data - PDF 数据
 * @param {string} filenamePrefix - 临时文件名前缀
 */
export function savePdfData(data, filenamePrefix = 'document') {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/${filenamePrefix}_${Date.now()}.pdf`
    const buffer = data instanceof Uint8Array
      ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
      : data

    fs.writeFile({
      filePath,
      data: buffer,
      success: () => resolve(filePath),
      fail: reject
    })
    // #endif

    // #ifdef H5
    const blob = hasBlob() && data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' })
    resolve(URL.createObjectURL(blob))
    // #endif
  })
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 获取 PDF 保存操作的按钮文案
 */
export function getPdfSaveActionLabel() {
  // #ifdef MP-WEIXIN
  return isWeixinPC() ? '保存' : '分享'
  // #endif

  // #ifdef H5
  return '下载'
  // #endif
}

/**
 * 判断是否为微信 PC 端（Windows / Mac）
 */
function isWeixinPC() {
  const platform = uni.getSystemInfoSync().platform
  return platform === 'windows' || platform === 'mac'
}

/**
 * 用户取消分享/保存时不提示失败
 */
function isUserCancelled(err) {
  const errMsg = err?.errMsg || ''
  return errMsg.includes('cancel') || errMsg.includes('取消')
}

/**
 * 通过文档预览引导用户保存（兜底方案）
 */
function openPdfForSaving(filePath) {
  uni.showModal({
    title: '保存文件',
    content: '请点击预览页右上角菜单，选择「保存」或「转发」',
    confirmText: '去预览',
    success: (res) => {
      if (res.confirm) {
        previewFile(filePath)
      }
    }
  })
}

/**
 * 下载/保存文件
 * 微信小程序：PC 端保存到磁盘，手机端转发到聊天
 * @param {string} filePath - 文件路径
 * @param {string} fileName - 文件名
 */
export function downloadFile(filePath, fileName) {
  // #ifdef MP-WEIXIN
  if (isWeixinPC()) {
    wx.saveFileToDisk({
      filePath,
      success: () => {
        uni.showToast({ title: '保存成功', icon: 'success' })
      },
      fail: (err) => {
        console.error('保存到磁盘失败:', err)
        if (isUserCancelled(err)) return
        openPdfForSaving(filePath)
      }
    })
    return
  }

  if (wx.canIUse('shareFileMessage')) {
    wx.shareFileMessage({
      filePath,
      fileName,
      success: () => {
        uni.showToast({ title: '已发送，可在聊天中保存', icon: 'success' })
      },
      fail: (err) => {
        console.error('转发文件失败:', err)
        if (isUserCancelled(err)) return
        openPdfForSaving(filePath)
      }
    })
    return
  }

  openPdfForSaving(filePath)
  // #endif

  // #ifdef H5
  const a = document.createElement('a')
  a.href = filePath
  a.download = fileName
  a.click()
  uni.showToast({ title: '下载已开始', icon: 'success' })
  // #endif
}

/**
 * 预览文件
 * @param {string} filePath - 文件路径
 */
export function previewFile(filePath) {
  // #ifdef MP-WEIXIN
  uni.openDocument({
    filePath,
    showMenu: true,
    success: () => {
      console.log('打开文档成功')
    },
    fail: (err) => {
      console.error('打开文档失败:', err)
      uni.showToast({ title: '无法预览该文件', icon: 'none' })
    }
  })
  // #endif

  // #ifdef H5
  window.open(filePath, '_blank')
  // #endif
}
