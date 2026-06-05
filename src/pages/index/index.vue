<template>
  <view class="page-container">
    <!-- 头部欢迎 -->
    <view class="header">
      <text class="header-title">百宝箱</text>
      <text class="header-desc">实用工具，触手可及</text>
    </view>

    <!-- 工具列表 -->
    <view class="tool-grid">
      <view
        class="tool-card"
        v-for="tool in tools"
        :key="tool.id"
        @click="navigateTo(tool.path)"
      >
        <view class="tool-icon" :style="{ background: tool.bgColor }">
          <text class="icon-text">{{ tool.icon }}</text>
        </view>
        <text class="tool-name">{{ tool.name }}</text>
        <text class="tool-desc">{{ tool.desc }}</text>
      </view>
    </view>

    <!-- 自定义 TabBar 占位 -->
    <view class="tab-bar-placeholder"></view>
  </view>

  <!-- 自定义 TabBar -->
  <my-tab-bar :list="tabList" :current="0" @change="onTabChange" />
</template>

<script setup>
const tabList = [
  { text: '工具', icon: '🏠', path: '/pages/index/index' },
  { text: '关于', icon: '💖', path: '/pages/about/index' }
]

const tools = [
  {
    id: 'img2pdf',
    name: '图片转PDF',
    desc: '多张图片合并为PDF',
    icon: '📄',
    bgColor: '#FFF0F3',
    path: '/pages/img2pdf/index'
  },
  {
    id: 'pdf2img',
    name: 'PDF转图片',
    desc: '将PDF转换为图片',
    icon: '🖼️',
    bgColor: '#F0F5FF',
    path: '/pages/pdf2img/index'
  },
  {
    id: 'image-compress',
    name: '图片压缩',
    desc: '压缩图片体积',
    icon: '🗜️',
    bgColor: '#F0FFF0',
    path: '/pages/image-compress/index'
  },
  {
    id: 'merge',
    name: 'PDF合并',
    desc: '敬请期待',
    icon: '🔗',
    bgColor: '#F0F0F0',
    path: ''
  }
]

const onTabChange = (index) => {
  uni.redirectTo({ url: tabList[index].path })
}

const navigateTo = (path) => {
  if (!path) {
    uni.showToast({ title: '功能开发中...', icon: 'none' })
    return
  }
  uni.navigateTo({ url: path })
}
</script>

<style lang="scss" scoped>
.header {
  padding: 40rpx 0 30rpx;
}

.header-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #333333;
  display: block;
}

.header-desc {
  font-size: 26rpx;
  color: #999999;
  margin-top: 8rpx;
  display: block;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.tool-card {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 36rpx 24rpx;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.97);
  }
}

.tool-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20rpx;
}

.icon-text {
  font-size: 48rpx;
}

.tool-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  display: block;
}

.tool-desc {
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
  display: block;
}

.tab-bar-placeholder {
  height: 120rpx;
}
</style>
