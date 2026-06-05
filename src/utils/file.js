/**
 * 文件处理工具
 */

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
 * 下载文件
 * @param {string} filePath - 文件路径
 * @param {string} fileName - 文件名
 */
export function downloadFile(filePath, fileName) {
  // #ifdef MP-WEIXIN
  wx.saveFileToDisk({
    filePath,
    fileName,
    success: () => {
      uni.showToast({ title: '保存成功', icon: 'success' })
    },
    fail: () => {
      uni.showToast({ title: '保存失败', icon: 'none' })
    }
  })
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
