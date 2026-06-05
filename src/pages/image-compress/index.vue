<template>
  <view class="page-container">
    <!-- 上传区域 -->
    <view class="upload-area" @click="selectImages">
      <view class="upload-icon">
        <text class="icon-large">🖼️</text>
      </view>
      <text class="upload-text">点击选择图片</text>
      <text class="upload-hint">支持 JPG / PNG，可批量压缩</text>
    </view>

    <!-- 已选图片列表 -->
    <view v-if="imageList.length > 0" class="section">
      <view class="section-header">
        <text class="section-title">已选择 {{ imageList.length }} 张图片</text>
        <text class="clear-btn" @click="clearImages">清空</text>
      </view>

      <view class="image-list">
        <view class="image-item" v-for="(img, index) in imageList" :key="index">
          <image
            class="image-thumb"
            :src="img.path"
            mode="aspectFill"
            @click="previewImage(index)"
          />
          <view class="image-index">{{ index + 1 }}</view>
          <view class="image-size">{{ formatFileSize(img.size) }}</view>
          <view class="image-delete" @click.stop="removeImage(index)">
            <text class="delete-icon">✕</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 压缩设置 -->
    <view v-if="imageList.length > 0" class="settings-card">
      <text class="settings-title">压缩设置</text>

      <!-- 压缩模式 -->
      <view class="setting-row">
        <text class="setting-label">压缩模式</text>
        <view class="setting-options">
          <view
            class="option-btn"
            :class="{ active: compressMode === 'quality' }"
            @click="compressMode = 'quality'"
          >
            <text>按质量</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: compressMode === 'size' }"
            @click="compressMode = 'size'"
          >
            <text>按尺寸</text>
          </view>
        </view>
      </view>

      <!-- 质量压缩选项 -->
      <view v-if="compressMode === 'quality'" class="setting-row">
        <text class="setting-label">压缩质量</text>
        <view class="setting-options">
          <view
            class="option-btn"
            :class="{ active: quality === 0.6 }"
            @click="quality = 0.6"
          >
            <text>高压缩</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: quality === 0.8 }"
            @click="quality = 0.8"
          >
            <text>标准</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: quality === 0.9 }"
            @click="quality = 0.9"
          >
            <text>低压缩</text>
          </view>
        </view>
      </view>

      <!-- 尺寸压缩选项 -->
      <view v-if="compressMode === 'size'" class="setting-row">
        <text class="setting-label">最大宽度</text>
        <view class="setting-options">
          <view
            class="option-btn"
            :class="{ active: maxSize === 800 }"
            @click="maxSize = 800"
          >
            <text>800px</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: maxSize === 1200 }"
            @click="maxSize = 1200"
          >
            <text>1200px</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: maxSize === 1920 }"
            @click="maxSize = 1920"
          >
            <text>1920px</text>
          </view>
        </view>
      </view>

      <!-- 输出格式 -->
      <view class="setting-row">
        <text class="setting-label">输出格式</text>
        <view class="setting-options">
          <view
            class="option-btn"
            :class="{ active: outputFormat === 'auto' }"
            @click="outputFormat = 'auto'"
          >
            <text>自动</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: outputFormat === 'jpeg' }"
            @click="outputFormat = 'jpeg'"
          >
            <text>JPEG</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: outputFormat === 'png' }"
            @click="outputFormat = 'png'"
          >
            <text>PNG</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 压缩按钮 -->
    <view v-if="imageList.length > 0" class="action-area">
      <my-button
        :text="compressing ? `正在压缩... ${progress}%` : '开始压缩'"
        icon="📉"
        :disabled="compressing"
        :loading="compressing"
        @click="startCompress"
      />
    </view>

    <!-- 进度条 -->
    <view v-if="compressing" class="progress-wrap">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progress + '%' }"></view>
      </view>
    </view>

    <!-- 压缩结果 -->
    <view v-if="compressedResults.length > 0" class="section">
      <view class="section-header">
        <text class="section-title">压缩完成</text>
        <view class="action-btns">
          <text class="action-btn" @click="previewAllImages">预览</text>
          <text class="action-btn" @click="downloadAllImages">下载全部</text>
        </view>
      </view>

      <!-- 压缩统计 -->
      <view class="stats-card">
        <view class="stat-item">
          <text class="stat-value">{{
            formatFileSize(totalOriginalSize)
          }}</text>
          <text class="stat-label">原始大小</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{
            formatFileSize(totalCompressedSize)
          }}</text>
          <text class="stat-label">压缩后</text>
        </view>
        <view class="stat-item">
          <text class="stat-value stat-highlight"
            >-{{ compressionRatio }}%</text
          >
          <text class="stat-label">减小</text>
        </view>
      </view>

      <view class="result-list">
        <view
          class="result-item"
          v-for="(item, index) in compressedResults"
          :key="index"
        >
          <image
            class="result-thumb"
            :src="item.data"
            mode="aspectFit"
            @click="previewSingleImage(index)"
          />
          <view class="result-info">
            <text class="result-original">{{
              formatFileSize(item.originalSize)
            }}</text>
            <text class="result-arrow">→</text>
            <text class="result-compressed">{{
              formatFileSize(item.size)
            }}</text>
            <text class="result-reduction">-{{ item.reduction }}%</text>
          </view>
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
            <text class="modal-btn-text modal-btn-primary-text">{{
              confirmText
            }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { compressImage, saveCompressedImage } from '../../utils/image-compress.js'
import { chooseImages, formatFileSize } from '../../utils/file.js'

const imageList = ref([])
const compressMode = ref('quality')
const quality = ref(0.8)
const maxSize = ref(1200)
const outputFormat = ref('auto')
const compressing = ref(false)
const progress = ref(0)
const compressedResults = ref([])

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

// 计算总大小
const totalOriginalSize = computed(() => {
  return compressedResults.value.reduce((sum, item) => sum + item.originalSize, 0)
})

const totalCompressedSize = computed(() => {
  return compressedResults.value.reduce((sum, item) => sum + item.size, 0)
})

const compressionRatio = computed(() => {
  if (totalOriginalSize.value === 0) return 0
  return Math.round((1 - totalCompressedSize.value / totalOriginalSize.value) * 100)
})

// 选择图片
const selectImages = async () => {
  try {
    const paths = await chooseImages(9 - imageList.value.length)
    // 获取图片大小
    const newImages = []
    for (const path of paths) {
      const info = await getFileInfo(path)
      newImages.push({
        path,
        size: info.size || 0
      })
    }
    imageList.value = [...imageList.value, ...newImages].slice(0, 9)
  } catch (err) {
    console.error('选择图片失败:', err)
  }
}

// 获取文件信息
const getFileInfo = (filePath) => {
  return new Promise((resolve) => {
    // #ifdef H5
    fetch(filePath)
      .then(res => res.blob())
      .then(blob => resolve({ size: blob.size }))
      .catch(() => resolve({ size: 0 }))
    // #endif

    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    fs.getFileInfo({
      filePath,
      success: (res) => resolve({ size: res.size }),
      fail: () => resolve({ size: 0 })
    })
    // #endif
  })
}

// 移除图片
const removeImage = (index) => {
  imageList.value.splice(index, 1)
}

// 清空图片
const clearImages = () => {
  imageList.value = []
  compressedResults.value = []
}

// 预览图片
const previewImage = (index) => {
  const urls = imageList.value.map(img => img.path)
  uni.previewImage({
    urls,
    current: index
  })
}

// 开始压缩
const startCompress = async () => {
  if (imageList.value.length === 0) {
    uni.showToast({ title: '请先选择图片', icon: 'none' })
    return
  }

  compressing.value = true
  progress.value = 0
  compressedResults.value = []

  try {
    for (let i = 0; i < imageList.value.length; i++) {
      progress.value = Math.round(((i + 1) / imageList.value.length) * 100)

      const img = imageList.value[i]
      const options = {
        quality: quality.value,
        format: outputFormat.value,
        originalSize: img.size
      }

      if (compressMode.value === 'size') {
        options.maxWidth = maxSize.value
        options.maxHeight = maxSize.value
      }

      const result = await compressImage(img.path, options)

      compressedResults.value.push({
        ...result,
        originalSize: img.size,
        originalPath: img.path,
        reduction: img.size > 0
          ? Math.round((1 - result.size / img.size) * 100)
          : 0
      })
    }

    progress.value = 100

    openModal(
      '压缩完成！',
      `已压缩 ${compressedResults.value.length} 张图片，共节省 ${formatFileSize(totalOriginalSize.value - totalCompressedSize.value)}`,
      () => previewAllImages(),
      () => downloadAllImages(),
      '预览',
      '下载'
    )
  } catch (err) {
    console.error('压缩失败:', err)
    uni.showToast({ title: '压缩失败，请重试', icon: 'none' })
  } finally {
    compressing.value = false
    progress.value = 0
  }
}

// 预览所有图片
const previewAllImages = () => {
  if (compressedResults.value.length === 0) return

  const urls = compressedResults.value.map(img => img.data)
  uni.previewImage({
    urls,
    current: 0
  })
}

// 预览单张图片
const previewSingleImage = (index) => {
  const urls = compressedResults.value.map(img => img.data)
  uni.previewImage({
    urls,
    current: index
  })
}

// 下载所有图片
const downloadAllImages = async () => {
  if (compressedResults.value.length === 0) return

  // #ifdef H5
  // H5 环境：将 data URL 转换为 Blob 再下载
  for (let i = 0; i < compressedResults.value.length; i++) {
    const img = compressedResults.value[i]
    const fileFormat = img.format === 'auto' ? 'jpeg' : img.format
    const fileName = `compressed_${i + 1}.${fileFormat}`

    // 将 data URL 转换为 Blob
    const res = await fetch(img.data)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 释放 Blob URL
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)

    // 等待一段时间，避免浏览器阻止下载
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  uni.showToast({ title: '下载已开始', icon: 'success' })
  // #endif

  // #ifdef MP-WEIXIN
  try {
    uni.showLoading({ title: '保存中...' })

    for (let i = 0; i < compressedResults.value.length; i++) {
      const img = compressedResults.value[i]
      const fileFormat = img.format === 'auto' ? 'jpeg' : img.format
      const fileName = `compressed_${i + 1}.${fileFormat}`

      const tempPath = await saveCompressedImage(img.data, fileName)
      await uni.saveImageToPhotosAlbum({
        filePath: tempPath
      })
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
  // #endif
}
</script>

<style lang="scss" scoped>
.upload-area {
  background: #ffffff;
  border: 3rpx dashed #d0d7e2;
  border-radius: 16rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  margin-bottom: 30rpx;

  &:active {
    background: #f8f9fb;
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

.section {
  margin-bottom: 30rpx;
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

.clear-btn {
  font-size: 26rpx;
  color: #fa3534;
}

.image-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12rpx;
  overflow: hidden;
}

.image-thumb {
  width: 100%;
  height: 100%;
}

.image-index {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  font-size: 20rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-size {
  position: absolute;
  bottom: 8rpx;
  left: 8rpx;
  right: 8rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  font-size: 18rpx;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
  text-align: center;
}

.image-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  background: rgba(0, 0, 0, 0.5);
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  color: #ffffff;
  font-size: 20rpx;
}

.settings-card {
  background: #ffffff;
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
  border-bottom: 1rpx solid #f5f5f5;

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
  background: #f5f6fa;
  font-size: 24rpx;
  color: #666666;

  &.active {
    background: #f0e6ff;
    color: #7c3aed;
  }
}

.action-area {
  margin-top: 20rpx;
}

.progress-wrap {
  margin-top: 20rpx;
}

.progress-bar {
  height: 8rpx;
  background: #e8e8e8;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #7c3aed;
  border-radius: 4rpx;
  transition: width 0.3s;
}

.stats-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
  display: block;
}

.stat-highlight {
  color: #19be6b;
}

.stat-label {
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
  display: block;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.result-item {
  background: #ffffff;
  border-radius: 12rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
}

.result-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.result-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.result-original {
  font-size: 24rpx;
  color: #999999;
  text-decoration: line-through;
}

.result-arrow {
  font-size: 24rpx;
  color: #cccccc;
}

.result-compressed {
  font-size: 24rpx;
  color: #333333;
  font-weight: 500;
}

.result-reduction {
  font-size: 22rpx;
  color: #19be6b;
  background: #e8f8ef;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.action-btns {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  font-size: 26rpx;
  color: #7c3aed;
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
  background: #ffffff;
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
  border-top: 1rpx solid #f0f0f0;
}

.modal-btn {
  flex: 1;
  padding: 28rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;

  & + & {
    border-left: 1rpx solid #f0f0f0;
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
