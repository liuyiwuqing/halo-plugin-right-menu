<script setup lang="ts">
import { FormKit, parentSymbol } from '@formkit/vue'
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'

type Item = {
  id?: string
  label?: string
  action?: string
  context?: string
  group?: string
  enabled?: boolean
  order?: number
}
type Settings = {
  menuItems?: Item[]
  groupMenu?: boolean
  style?: { theme?: string; primaryColor?: string; menuWidth?: number; borderRadius?: number }
}
type Parent = {
  value: unknown
  on: (event: string, handler: (event: { payload: unknown }) => void) => string
  off: (receipt: string) => void
}
const props = defineProps<{ context: { node: { parent?: Parent } } }>()
// Ignored inputs are detached from the form tree; use the surrounding form provider.
const parent = props.context.node.parent || inject(parentSymbol, undefined)
const settings = ref<Settings>((parent?.value || {}) as Settings)
const scenario = ref('common')
const scenarios = [
  { label: '普通页面', value: 'common' },
  { label: '选中文字', value: 'text' },
  { label: '图片', value: 'image' },
  { label: '链接', value: 'link' },
  { label: '文章页', value: 'article' },
]
let receipt: string | undefined
onMounted(() => {
  receipt = parent?.on('commit', ({ payload }) => {
    // FormKit mutates group values in place; a new root reference invalidates the preview.
    settings.value = { ...((payload || {}) as Settings) }
  })
})
onBeforeUnmount(() => {
  if (receipt) parent?.off(receipt)
})
const groups = computed(() => {
  const entries = new Map<string, Item[]>()
  const labels: Record<string, string> = {
    reading: '阅读工具',
    sharing: '复制与分享',
    navigation: '页面导航',
    interaction: '站点互动',
    custom: '自定义',
  }
  const items = (settings.value.menuItems || [])
    .filter(
      (item) =>
        item &&
        item.enabled !== false &&
        item.label &&
        (!item.context || item.context === 'common' || item.context === scenario.value),
    )
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
  for (const item of items) {
    let label = ''
    if (settings.value.groupMenu !== false) {
      let key = item.group || 'auto'
      if (key === 'auto')
        key = /^(ai|createQuote|saveReading|resumeReading)/.test(item.action || '')
          ? 'reading'
          : /^copy/.test(item.action || '')
            ? 'sharing'
            : /^(member|openLinksSubmit)/.test(item.action || '')
              ? 'interaction'
              : 'navigation'
      label = labels[key] || labels.custom || ''
    }
    if (!entries.has(label)) entries.set(label, [])
    entries.get(label)!.push(item)
  }
  return [...entries]
})
const style = computed(() => ({
  width: `${Math.min(320, Math.max(180, settings.value.style?.menuWidth || 220))}px`,
  borderRadius: `${settings.value.style?.borderRadius ?? 8}px`,
}))
</script>

<template>
  <div class="right-menu-preview">
    <FormKit
      v-model="scenario"
      type="select"
      label="预览场景"
      :options="scenarios"
      :ignore="true"
    />
    <div
      class="right-menu-preview-card"
      :data-theme="settings.style?.theme || 'auto'"
      :style="style"
    >
      <template v-for="[label, items] in groups" :key="label">
        <div v-if="label" class="right-menu-preview-group">{{ label }}</div>
        <div v-for="(item, index) in items" :key="item.id || index" class="right-menu-preview-item">
          {{ item.label }}
        </div>
      </template>
      <div v-if="!groups.length" class="right-menu-preview-item">此场景没有菜单项</div>
    </div>
    <p class="right-menu-preview-help">
      预览名称、分组、排序和尺寸；前台会按页面内容与可用插件显示入口。
    </p>
  </div>
</template>

<style scoped>
.right-menu-preview-card {
  max-width: 100%;
  margin-top: 12px;
  padding: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  box-shadow: 0 8px 24px #0001;
}
.right-menu-preview-card[data-theme='dark'] {
  background: #111827;
  color: #f8fafc;
}
@media (prefers-color-scheme: dark) {
  .right-menu-preview-card[data-theme='auto'] {
    background: #111827;
    color: #f8fafc;
  }
}
.right-menu-preview-item {
  padding: 7px 9px;
  font-size: 14px;
}
.right-menu-preview-group {
  padding: 7px 9px 3px;
  font-size: 11px;
  opacity: 0.65;
}
.right-menu-preview-help {
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
}
</style>
