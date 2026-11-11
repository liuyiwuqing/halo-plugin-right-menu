<script setup lang="ts">
import { FormKit } from '@formkit/vue'
import { coreApiClient } from '@halo-dev/api-client'
import { onMounted, ref } from 'vue'

const props = defineProps<{
  context: { value?: unknown; node: { input: (value: unknown) => unknown } }
}>()
const ready = ref(false)
const message = ref('正在检查 AI Foundation…')
onMounted(async () => {
  try {
    const { data } = await coreApiClient.plugin.plugin.getPlugin({ name: 'ai-foundation' })
    ready.value = data.spec?.enabled === true && data.status?.phase === 'STARTED'
    message.value = ready.value
      ? ''
      : '启用 AI Foundation 后可选择模型。AI 功能需要 Halo 2.26 或更新版本。'
  } catch {
    message.value = '安装并启用 AI Foundation 后可选择模型。AI 功能需要 Halo 2.26 或更新版本。'
  }
})
</script>

<template>
  <FormKit
    v-if="ready"
    type="aiModelSelector"
    model-type="language"
    :model-value="context.value"
    :ignore="true"
    :clearable="true"
    placeholder="留空使用 AI Foundation 默认语言模型"
    @update:model-value="props.context.node.input($event)"
  />
  <p v-else class="text-sm text-gray-500">{{ message }}</p>
</template>
