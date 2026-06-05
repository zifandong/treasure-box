<template>
  <view class="page-container">
    <!-- 上传区域 -->
    <view v-if="!pdfFile" class="upload-area" @click="selectPdf">
      <view class="upload-icon">
        <text class="icon-large">📑</text>
      </view>
      <text class="upload-text">点击选择 PDF 文件</text>
      <text class="upload-hint">支持 PDF 格式文件</text>
    </view>

    <!-- 已选 PDF 信息 -->
    <view v-if="pdfFile" class="pdf-info-card">
      <view class="pdf-icon">
        <text class="icon-large">📄</text>
      </view>
      <view class="pdf-details">
        <text class="pdf-name">{{ pdfFile.name }}</text>
        <text class="pdf-size">{{ formatFileSize(pdfFile.size) }}</text>
        <text v-if="totalPages > 0" class="pdf-pages">共 {{ totalPages }} 页</text>
      </view>
      <view class="pdf-clear" @click="clearPdf">
        <text class="clear-icon">✕</text>
      </view>
    </view>

    <!-- 页面选择 -->
    <view v-if="pdfFile && totalPages > 0" class="settings-card">
      <text class="settings-title">页面选择</text>

      <!-- 选择模式 -->
      <view class="setting-row">
        <text class="setting-label">选择范围</text>
        <view class="setting-options">
          <view
            class="option-btn"
            :class="{ active: selectMode === 'all' }"
            @click="selectMode = 'all'"
          >
            <text>全部页面</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: selectMode === 'custom' }"
            @click="selectMode = 'custom'"
          >
            <text>自定义</text>
          </view>
        </view>
      </view>

      <!-- 自定义页码输入 -->
      <view v-if="selectMode === 'custom'" class="setting-row">
        <text class="setting-label">页码范围</text>
        <input
          class="page-input"
          v-model="pageRange"
          placeholder="如: 1,3,5-8"
          @input="validatePageRange"
        />
      </view>

      <!-- 预览页码 -->
      <view v-if="selectMode === 'custom' && selectedPages.length > 0" class="page-preview">
        <text class="page-preview-text">将转换 {{ selectedPages.length }} 页</text>
      </view>
    </view>

    <!-- 输出设置 -->
    <view v-if="pdfFile && totalPages > 0" class="settings-card">
      <text class="settings-title">输出设置</text>

      <!-- 图片格式 -->
      <view class="setting-row">
        <text class="setting-label">图片格式</text>
        <view class="setting-options">
          <view
            class="option-btn"
            :class="{ active: imageFormat === 'png' }"
            @click="imageFormat = 'png'"
          >
            <text>PNG</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: imageFormat === 'jpeg' }"
            @click="imageFormat = 'jpeg'"
          >
            <text>JPEG</text>
          </view>
        </view>
      </view>

      <!-- 图片质量 -->
      <view class="setting-row">
        <text class="setting-label">图片质量</text>
        <view class="setting-options">
          <view
            class="option-btn"
            :class="{ active: imageQuality === 1.0 }"
            @click="imageQuality = 1.0"
          >
            <text>标准</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: imageQuality === 2.0 }"
            @click="imageQuality = 2.0"
          >
            <text>高清</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: imageQuality === 3.0 }"
            @click="imageQuality = 3.0"
          >
            <text>超清</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 转换按钮 -->
    <view v-if="pdfFile && totalPages > 0" class="action-area">
      <my-button
        :text="converting ? `正在转换... ${progress}%` : '转换为图片'"
        icon="🖼️"
        :disabled="converting"
        :loading="converting"
        @click="convertToImages"
      />
    </view>

    <!-- 进度条 -->
    <view v-if="converting" class="progress-wrap">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progress + '%' }"></view>
      </view>
    </view>

    <!-- 转换结果 -->
    <view v-if="convertedImages.length > 0" class="section">
      <view class="section-header">
        <text class="section-title">转换完成 ({{ convertedImages.length }} 张)</text>
        <view class="action-btns">
          <text class="action-btn" @click="previewAllImages">预览</text>
          <text class="action-btn" @click="downloadAllImages">下载全部</text>
        </view>
      </view>

      <view class="image-grid">
        <view
          class="image-item"
          v-for="(img, index) in convertedImages"
          :key="index"
        >
          <image
            class="image-thumb"
            :src="img.data"
            mode="aspectFit"
            @click="previewSingleImage(index)"
          />
          <view class="image-label">第 {{ img.pageNumber }} 页</view>
        </view>
      </view>
    </view>

    <!-- 自定义弹窗 -->
    <view v-if="showModal" class="modal-mask" @click="showModal = false">
      <view class="modal-box" @click.stop>
        <text class="modal-title">{{ modalTitle }}</text>
        <text class="modal-content">{{ modalContent }}</text>
        <view class="modal-btns">
          <view class="modal-btn" @click="onModalCancel">
            <text class="modal-btn-text">{{ cancelText }}</text>
          </view>
          <view class="modal-btn modal-btn-primary" @click="onModalConfirm">
            <text class="modal-btn-text modal-btn-primary-text">{{ confirmText }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { loadPdfDocument, renderAllPages } from '../../utils/pdf-render.js'
import { choosePdfFile, formatFileSize, downloadFile, previewFile } from '../../utils/file.js'

const pdfFile = ref(null)
const totalPages = ref(0)
const selectMode = ref('all')
const pageRange = ref('')
const imageFormat = ref('png')
const imageQuality = ref(2.0)
const converting = ref(false)
const progress = ref(0)
const convertedImages = ref([])

// 自定义弹窗
const showModal = ref(false)
const modalTitle = ref('')
const modalContent = ref('')
const confirmText = ref('确定')
const cancelText = ref('取消')
let modalConfirmFn = null
let modalCancelFn = null

const openModal = (title, content, onConfirm, onCancel, confirm = '确定', cancel = '取消') => {
  modalTitle.value = title
  modalContent.value = content
  confirmText.value = confirm
  cancelText.value = cancel
  modalConfirmFn = onConfirm
  modalCancelFn = onCancel
  showModal.value = true
}

const onModalConfirm = () => {
  showModal.value = false
  modalConfirmFn && modalConfirmFn()
}

const onModalCancel = () => {
  showModal.value = false
  modalCancelFn && modalCancelFn()
}

// 解析后的页码列表
const selectedPages = computed(() => {
  if (selectMode.value === 'all') {
    return Array.from({ length: totalPages.value }, (_, i) => i + 1)
  }

  if (!pageRange.value.trim()) return []

  const pages = new Set()
  const parts = pageRange.value.split(',')

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages.value) {
        for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
          pages.add(i)
        }
      }
    } else {
      const num = Number(trimmed)
      if (!isNaN(num) && num >= 1 && num <= totalPages.value) {
        pages.add(num)
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b)
})

// 选择 PDF 文件
const selectPdf = async () => {
  try {
    const file = await choosePdfFile()
    if (file) {
      pdfFile.value = file
      await loadPdfInfo(file.path)
    }
  } catch (err) {
    console.error('选择 PDF 失败:', err)
    uni.showToast({ title: '选择文件失败', icon: 'none' })
  }
}

// 加载 PDF 信息
const loadPdfInfo = async (filePath) => {
  try {
    uni.showLoading({ title: '加载中...' })
    const pdf = await loadPdfDocument(filePath)
    totalPages.value = pdf.numPages
    uni.hideLoading()
  } catch (err) {
    console.error('加载 PDF 失败:', err)
    uni.hideLoading()
    uni.showToast({ title: '无法打开该 PDF 文件', icon: 'none' })
    pdfFile.value = null
  }
}

// 清空 PDF
const clearPdf = () => {
  pdfFile.value = null
  totalPages.value = 0
  pageRange.value = ''
  convertedImages.value = []
}

// 验证页码输入
const validatePageRange = () => {
  // 允许输入数字、逗号、连字符和空格
  pageRange.value = pageRange.value.replace(/[^\d,\-\s]/g, '')
}

// 转换为图片
const convertToImages = async () => {
  if (!pdfFile.value) {
    uni.showToast({ title: '请先选择 PDF 文件', icon: 'none' })
    return
  }

  if (selectedPages.value.length === 0) {
    uni.showToast({ title: '请输入有效的页码范围', icon: 'none' })
    return
  }

  converting.value = true
  progress.value = 0
  convertedImages.value = []

  try {
    const result = await renderAllPages(pdfFile.value.path, {
      scale: imageQuality.value,
      format: imageFormat.value,
      pages: selectedPages.value,
      onProgress: (p) => { progress.value = p }
    })

    convertedImages.value = result.images

    openModal(
      '转换完成！',
      `已将 ${result.images.length} 页转换为 ${imageFormat.value.toUpperCase()} 图片`,
      () => previewAllImages(),
      () => downloadAllImages(),
      '预览',
      '下载'
    )
  } catch (err) {
    console.error('转换失败:', err)
    uni.showToast({ title: '转换失败，请重试', icon: 'none' })
  } finally {
    converting.value = false
    progress.value = 0
  }
}

// 预览所有图片
const previewAllImages = () => {
  if (convertedImages.value.length === 0) return

  const urls = convertedImages.value.map(img => img.data)
  uni.previewImage({
    urls,
    current: 0
  })
}

// 预览单张图片
const previewSingleImage = (index) => {
  const urls = convertedImages.value.map(img => img.data)
  uni.previewImage({
    urls,
    current: index
  })
}

// 下载所有图片
const downloadAllImages = async () => {
  if (convertedImages.value.length === 0) return

  try {
    uni.showLoading({ title: '保存中...' })

    for (const img of convertedImages.value) {
      // H5 环境：创建下载链接
      // #ifdef H5
      const link = document.createElement('a')
      link.href = img.data
      link.download = `page_${img.pageNumber}.${imageFormat.value}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // #endif

      // #ifdef MP-WEIXIN
      // 微信小程序环境：保存到相册
      const tempPath = await saveBase64ToTemp(img.data)
      await uni.saveImageToPhotosAlbum({
        filePath: tempPath
      })
      // #endif
    }

    uni.hideLoading()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (err) {
    uni.hideLoading()
    console.error('保存失败:', err)

    if (err.errMsg && err.errMsg.includes('auth deny')) {
      uni.showModal({
        title: '提示',
        content: '需要授权保存到相册',
        success: (res) => {
          if (res.confirm) {
            uni.openSetting()
          }
        }
      })
    } else {
      uni.showToast({ title: '保存失败', icon: 'none' })
    }
  }
}

// 将 base64 保存为临时文件（微信小程序）
const saveBase64ToTemp = (base64Data) => {
  return new Promise((resolve, reject) => {
    const fs = uni.getFileSystemManager()
    const filePath = `${wx.env.USER_DATA_PATH}/temp_${Date.now()}.png`

    // 移除 data URL 前缀
    const data = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = uni.base64ToArrayBuffer(data)

    fs.writeFile({
      filePath,
      data: buffer,
      encoding: 'binary',
      success: () => resolve(filePath),
      fail: reject
    })
  })
}
</script>

<style lang="scss" scoped>
.upload-area {
  background: #FFFFFF;
  border: 3rpx dashed #D0D7E2;
  border-radius: 16rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  margin-bottom: 30rpx;

  &:active {
    background: #F8F9FB;
  }
}

.upload-icon {
  margin-bottom: 16rpx;
}

.icon-large {
  font-size: 72rpx;
}

.upload-text {
  font-size: 30rpx;
  color: #333333;
  display: block;
}

.upload-hint {
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
  display: block;
}

.pdf-info-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
}

.pdf-icon {
  margin-right: 20rpx;
}

.pdf-details {
  flex: 1;
}

.pdf-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  word-break: break-all;
}

.pdf-size {
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
  display: block;
}

.pdf-pages {
  font-size: 24rpx;
  color: #7c3aed;
  margin-top: 4rpx;
  display: block;
}

.pdf-clear {
  width: 48rpx;
  height: 48rpx;
  background: #F5F5F5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-icon {
  font-size: 24rpx;
  color: #999999;
}

.settings-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.settings-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 24rpx;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #F5F5F5;

  &:last-child {
    border-bottom: none;
  }
}

.setting-label {
  font-size: 28rpx;
  color: #666666;
}

.setting-options {
  display: flex;
  gap: 12rpx;
}

.option-btn {
  padding: 10rpx 24rpx;
  border-radius: 8rpx;
  background: #F5F6FA;
  font-size: 24rpx;
  color: #666666;

  &.active {
    background: #F0E6FF;
    color: #7c3aed;
  }
}

.page-input {
  width: 300rpx;
  height: 60rpx;
  border: 2rpx solid #E8E8E8;
  border-radius: 8rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
  text-align: center;
}

.page-preview {
  padding: 16rpx 0 0;
}

.page-preview-text {
  font-size: 24rpx;
  color: #7c3aed;
}

.action-area {
  margin-top: 20rpx;
}

.progress-wrap {
  margin-top: 20rpx;
}

.progress-bar {
  height: 8rpx;
  background: #E8E8E8;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #7c3aed;
  border-radius: 4rpx;
  transition: width 0.3s;
}

.section {
  margin-top: 30rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  color: #666666;
}

.action-btns {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  font-size: 26rpx;
  color: #7c3aed;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.image-item {
  background: #FFFFFF;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.image-thumb {
  width: 100%;
  height: 300rpx;
}

.image-label {
  padding: 12rpx;
  font-size: 22rpx;
  color: #666666;
  text-align: center;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-box {
  background: #FFFFFF;
  border-radius: 24rpx;
  width: 560rpx;
  padding: 48rpx 40rpx 0;
  text-align: center;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #333333;
  display: block;
  margin-bottom: 20rpx;
}

.modal-content {
  font-size: 28rpx;
  color: #666666;
  display: block;
  margin-bottom: 40rpx;
}

.modal-btns {
  display: flex;
  border-top: 1rpx solid #F0F0F0;
}

.modal-btn {
  flex: 1;
  padding: 28rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;

  & + & {
    border-left: 1rpx solid #F0F0F0;
  }
}

.modal-btn-text {
  font-size: 30rpx;
  color: #666666;
}

.modal-btn-primary-text {
  color: #7c3aed;
  font-weight: 500;
}
</style>
