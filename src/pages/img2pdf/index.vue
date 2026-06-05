<template>
  <view class="page-container">
    <!-- 上传区域 -->
    <view class="upload-area" @click="selectImages">
      <view class="upload-icon">
        <text class="icon-large">📷</text>
      </view>
      <text class="upload-text">点击选择图片</text>
      <text class="upload-hint">支持 JPG / PNG，最多9张</text>
    </view>

    <!-- 已选图片列表 -->
    <view v-if="imageList.length > 0" class="section">
      <view class="section-header">
        <text class="section-title">已选择 {{ imageList.length }} 张图片</text>
        <text class="clear-btn" @click="clearImages">清空</text>
      </view>

      <view class="image-list">
        <view
          class="image-item"
          v-for="(img, index) in imageList"
          :key="index"
        >
          <image
            class="image-thumb"
            :src="img"
            mode="aspectFill"
            @click="previewImage(index)"
          />
          <view class="image-index">{{ index + 1 }}</view>
          <view class="image-delete" @click.stop="removeImage(index)">
            <text class="delete-icon">✕</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 设置选项 -->
    <view v-if="imageList.length > 0" class="settings-card">
      <text class="settings-title">PDF 设置</text>

      <!-- 页面方向 -->
      <view class="setting-row">
        <text class="setting-label">页面方向</text>
        <view class="setting-options">
          <view
            class="option-btn"
            :class="{ active: orientation === 'portrait' }"
            @click="orientation = 'portrait'"
          >
            <text>纵向</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: orientation === 'landscape' }"
            @click="orientation = 'landscape'"
          >
            <text>横向</text>
          </view>
        </view>
      </view>

      <!-- 页边距 -->
      <view class="setting-row">
        <text class="setting-label">页边距</text>
        <view class="setting-options">
          <view
            class="option-btn"
            :class="{ active: margin === 0 }"
            @click="margin = 0"
          >
            <text>无</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: margin === 30 }"
            @click="margin = 30"
          >
            <text>窄</text>
          </view>
          <view
            class="option-btn"
            :class="{ active: margin === 50 }"
            @click="margin = 50"
          >
            <text>标准</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 生成按钮 -->
    <view v-if="imageList.length > 0" class="action-area">
      <my-button
        :text="converting ? `正在生成... ${progress}%` : '生成PDF'"
        icon="📄"
        :disabled="converting"
        :loading="converting"
        @click="generatePDF"
      />
    </view>

    <!-- 进度条 -->
    <view v-if="converting" class="progress-wrap">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: progress + '%' }"></view>
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
import { ref } from 'vue'
import { imagesToPDF } from '../../utils/pdf.js'
import { chooseImages, formatFileSize, downloadFile, previewFile, savePdfData, getPdfByteSize, getPdfSaveActionLabel } from '../../utils/file.js'

const imageList = ref([])
const orientation = ref('portrait')
const margin = ref(50)
const converting = ref(false)
const progress = ref(0)
const pdfPath = ref('')

// 自定义弹窗
const showModal = ref(false)
const modalTitle = ref('')
const modalContent = ref('')
const confirmText = ref('预览')
const cancelText = ref('下载')
let modalConfirmFn = null
let modalCancelFn = null

const openModal = (title, content, onConfirm, onCancel, confirm = '预览', cancel = '下载') => {
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

// 选择图片
const selectImages = async () => {
  try {
    const paths = await chooseImages(9 - imageList.value.length)
    imageList.value = [...imageList.value, ...paths].slice(0, 9)
  } catch (err) {
    console.error('选择图片失败:', err)
  }
}

// 移除图片
const removeImage = (index) => {
  imageList.value.splice(index, 1)
}

// 清空图片
const clearImages = () => {
  imageList.value = []
}

// 预览图片
const previewImage = (index) => {
  uni.previewImage({
    urls: imageList.value,
    current: index
  })
}

// 生成 PDF
const generatePDF = async () => {
  if (imageList.value.length === 0) {
    uni.showToast({ title: '请先选择图片', icon: 'none' })
    return
  }

  converting.value = true
  progress.value = 0

  try {
    const pdfData = await imagesToPDF(imageList.value, {
      orientation: orientation.value,
      margin: margin.value,
      onProgress: (p) => { progress.value = p }
    })

    const filePath = await savePdfData(pdfData, 'img2pdf')
    pdfPath.value = filePath

    openModal(
      '生成成功！',
      `PDF 已生成，大小约 ${formatFileSize(getPdfByteSize(pdfData))}`,
      () => previewFile(filePath),
      () => downloadFile(filePath, '图片合集.pdf'),
      '预览',
      getPdfSaveActionLabel()
    )
  } catch (err) {
    console.error('生成PDF失败:', err)
    uni.showToast({ title: '生成失败，请重试', icon: 'none' })
  } finally {
    converting.value = false
    progress.value = 0
  }
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
  color: #FA3534;
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
  color: #FFFFFF;
  font-size: 20rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
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
  color: #FFFFFF;
  font-size: 20rpx;
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
