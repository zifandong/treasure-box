<template>
  <button
    class="my-button"
    :class="[type, { disabled: disabled, loading: loading }]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <text v-if="loading" class="loading-icon">⏳</text>
    <text v-else class="btn-icon">{{ icon }}</text>
    <text class="btn-text">{{ text }}</text>
  </button>
</template>

<script setup>
const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  if (!props.disabled && !props.loading) {
    emit('click')
  }
}
</script>

<style lang="scss" scoped>
.my-button {
  display: flex !important;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  padding: 0;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%) !important;
  color: #FFFFFF !important;

  &::after {
    border: none !important;
  }

  &:active:not(.disabled):not(.loading) {
    opacity: 0.85;
  }

  &.disabled {
    opacity: 0.6 !important;
  }

  &.loading {
    opacity: 0.8 !important;
  }

  &.secondary {
    background: #F0E6FF !important;
    color: #7c3aed !important;
  }

  &.danger {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%) !important;
    color: #FFFFFF !important;
  }
}

.loading-icon {
  margin-right: 8rpx;
}

.btn-icon {
  margin-right: 8rpx;
}
</style>
