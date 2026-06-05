<template>
  <view class="page-container">
    <view class="about-card">
      <view class="app-icon">
        <image
          class="app-icon-img"
          src="/static/images/app-icon.svg"
          mode="aspectFit"
        />
      </view>
      <text class="app-name">魔法工具屋</text>
      <text class="app-version">v1.0.0</text>
      <text class="app-desc">实用工具集合，让工作更高效</text>
    </view>

    <view class="info-card">
      <view class="info-item">
        <text class="info-label">功能</text>
        <text class="info-value">图片转PDF、PDF转图片、图片压缩、PDF合并</text>
      </view>
      <view class="info-item">
        <text class="info-label">技术栈</text>
        <text class="info-value">uni-app + Vue3</text>
      </view>
      <view class="info-item">
        <text class="info-label">更多功能</text>
        <text class="info-value">持续开发中...</text>
      </view>
    </view>

    <view class="footer">
      <text class="footer-text">— Made with 💜 —</text>
    </view>

    <!-- 自定义 TabBar 占位 -->
    <view class="tab-bar-placeholder"></view>
  </view>

  <!-- 自定义 TabBar -->
  <my-tab-bar :list="tabList" :current="1" @change="onTabChange" />
</template>

<script setup>
const tabList = [
  { text: '工具', icon: '🪄', path: '/pages/index/index' },
  { text: '关于', icon: '💜', path: '/pages/about/index' }
]

const onTabChange = (index) => {
  uni.redirectTo({ url: tabList[index].path })
}
</script>

<style lang="scss" scoped>
.about-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.app-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 28rpx;
  overflow: hidden;
  margin: 0 auto 24rpx;
}

.app-icon-img {
  width: 100%;
  height: 100%;
}

.app-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #333333;
  display: block;
}

.app-version {
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
  display: block;
}

.app-desc {
  font-size: 26rpx;
  color: #666666;
  margin-top: 16rpx;
  display: block;
}

.info-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 10rpx 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 28rpx;
  color: #666666;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
}

.footer {
  text-align: center;
  padding: 60rpx 0;
}

.footer-text {
  font-size: 24rpx;
  color: #cccccc;
}

.tab-bar-placeholder {
  height: 120rpx;
}
</style>
