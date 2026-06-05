<template>
  <view class="page-container">
    <!-- 上传区域 -->
    <view class="upload-area" @click="selectPdfFiles">
      <view class="upload-icon">
        <text class="icon-large">📑</text>
      </view>
      <text class="upload-text">点击选择 PDF 文件</text>
      <text class="upload-hint">支持 PDF 格式，可选择多个文件</text>
    </view>

    <!-- 已选文件列表 -->
    <view v-if="pdfList.length > 0" class="section">
      <view class="section-header">
        <text class="section-title">已选择 {{ pdfList.length }} 个文件</text>
        <text class="clear-btn" @click="clearFiles">清空</text>
      </view>

      <view class="file-list">
        <view
          class="file-item"
          v-for="(file, index) in pdfList"
          :key="index"
        >
          <view class="file-order">
            <text class="order-num">{{ index + 1 }}</text>
          </view>
          <view class="file-icon">
            <text class="icon-medium">📄</text>
          </view>
          <view class="file-info">
            <text class="file-name">{{ file.name }}</text>
            <text class="file-size">{{ formatFileSize(file.size) }}</text>
          </view>
          <view class="file-actions">
            <view
              class="action-btn"
              :class="{ disabled: index === 0 }"
              @click.stop="moveUp(index)"
            >
              <text class="action-icon">↑</text>
            </view>
            <view
              class="action-btn"
              :class="{ disabled: index === pdfList.length - 1 }"
              @click.stop="moveDown(index)"
            >
              <text class="action-icon">↓</text>
            </view>
            <view class="delete-btn" @click.stop="removeFile(index)">
              <text class="delete-icon">✕</text>
            </view>
          </view>
        </view>
      </view>

      <view class="order-hint">
        <text class="hint-text">点击箭头调整顺序</text>
      </view>
    </view>

    <!-- 合并按钮 -->
    <view v-if="pdfList.length >= 2" class="action-area">
      <my-button
        :text="merging ? `正在合并... ${progress}%` : '合并 PDF'"
        icon="🔗"
        :disabled="merging"
        :loading="merging"
        @click="startMerge"
      />
    </view>

    <!-- 提示信息 -->
    <view v-if="pdfList.length === 1" class="tip-card">
      <text class="tip-text">请至少选择 2 个 PDF 文件进行合并</text>
    </view>

    <!-- 进度条 -->
    <view v-if="merging" class="progress-wrap">
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
import { mergePDFs } from '../../utils/pdf.js'
import { chooseMultiplePdfFiles, formatFileSize, downloadFile, previewFile, savePdfData, getPdfByteSize, getPdfSaveActionLabel } from '../../utils/file.js'

const pdfList = ref([])
const merging = ref(false)
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

// 选择 PDF 文件
const selectPdfFiles = async () => {
  try {
    const remaining = 9 - pdfList.value.length
    if (remaining <= 0) {
      uni.showToast({ title: '最多选择 9 个文件', icon: 'none' })
      return
    }
    const files = await chooseMultiplePdfFiles(remaining)
    pdfList.value = [...pdfList.value, ...files].slice(0, 9)
  } catch (err) {
    console.error('选择文件失败:', err)
  }
}

// 移除文件
const removeFile = (index) => {
  pdfList.value.splice(index, 1)
}

// 清空文件
const clearFiles = () => {
  pdfList.value = []
}

// 上移文件
const moveUp = (index) => {
  if (index === 0) return
  const item = pdfList.value.splice(index, 1)[0]
  pdfList.value.splice(index - 1, 0, item)
}

// 下移文件
const moveDown = (index) => {
  if (index === pdfList.value.length - 1) return
  const item = pdfList.value.splice(index, 1)[0]
  pdfList.value.splice(index + 1, 0, item)
}

// 合并 PDF
const startMerge = async () => {
  if (pdfList.value.length < 2) {
    uni.showToast({ title: '请至少选择 2 个文件', icon: 'none' })
    return
  }

  merging.value = true
  progress.value = 0

  try {
    const filePaths = pdfList.value.map(f => f.path)
    const pdfData = await mergePDFs(filePaths, {
      onProgress: (p) => { progress.value = p }
    })

    const filePath = await savePdfData(pdfData, 'merge')
    pdfPath.value = filePath

    openModal(
      '合并成功！',
      `已将 ${pdfList.value.length} 个文件合并为一个 PDF，大小约 ${formatFileSize(getPdfByteSize(pdfData))}`,
      () => previewFile(filePath),
      () => downloadFile(filePath, '合并文档.pdf'),
      '预览',
      getPdfSaveActionLabel()
    )
  } catch (err) {
    console.error('合并失败:', err)
    uni.showToast({ title: '合并失败，请重试', icon: 'none' })
  } finally {
    merging.value = false
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

.icon-medium {
  font-size: 40rpx;
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

.file-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.file-item {
  background: #FFFFFF;
  border-radius: 12rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.file-order {
  width: 40rpx;
  height: 40rpx;
  background: #7c3aed;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.order-num {
  font-size: 22rpx;
  color: #FFFFFF;
  font-weight: 600;
}

.file-icon {
  margin-right: 16rpx;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 28rpx;
  color: #333333;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
  display: block;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-left: 12rpx;
}

.action-btn {
  width: 48rpx;
  height: 48rpx;
  background: #F5F6FA;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &.disabled {
    opacity: 0.4;
  }

  &:active:not(.disabled) {
    background: #E8E8E8;
  }
}

.action-icon {
  font-size: 28rpx;
  color: #666666;
}

.delete-btn {
  width: 48rpx;
  height: 48rpx;
  background: #FFF0F0;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    background: #FFE0E0;
  }
}

.delete-icon {
  font-size: 22rpx;
  color: #FA3534;
}

.order-hint {
  margin-top: 16rpx;
  text-align: center;
}

.hint-text {
  font-size: 22rpx;
  color: #CCCCCC;
}

.tip-card {
  background: #FFF8E6;
  border-radius: 12rpx;
  padding: 24rpx;
  text-align: center;
}

.tip-text {
  font-size: 26rpx;
  color: #FF9900;
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
