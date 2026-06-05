<template>
  <view class="tab-bar">
    <view
      class="tab-item"
      v-for="(item, index) in list"
      :key="index"
      @click="switchTab(index)"
    >
      <view class="tab-icon" :class="{ active: current === index }">
        <text class="icon-text">{{ item.icon }}</text>
      </view>
      <text class="tab-text" :class="{ active: current === index }">{{ item.text }}</text>
    </view>
  </view>
</template>

<script setup>

const props = defineProps({
  list: {
    type: Array,
    default: () => []
  },
  current: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['change'])

const switchTab = (index) => {
  if (index === props.current) return
  emit('change', index)
}
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1rpx solid #F0F0F0;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 999;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 8rpx 0;
}

.tab-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4rpx;
}

.icon-text {
  font-size: 40rpx;
  opacity: 0.5;
  transition: all 0.2s;
}

.tab-icon.active .icon-text {
  opacity: 1;
  transform: scale(1.1);
}

.tab-text {
  font-size: 22rpx;
  color: #999999;
  transition: color 0.2s;
}

.tab-text.active {
  color: #7c3aed;
  font-weight: 600;
}
</style>
