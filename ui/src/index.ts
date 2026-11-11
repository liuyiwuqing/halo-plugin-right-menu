import { definePlugin } from '@halo-dev/ui-shared'
import { markRaw } from 'vue'
import MenuPreview from './components/MenuPreview.vue'
import AiModelSetting from './components/AiModelSetting.vue'

export default definePlugin({
  components: {},
  formkit: {
    inputs: {
      rightMenuPreview: {
        type: 'input',
        schema: [{ $cmp: 'MenuPreview', props: { context: '$node.context' } }],
        library: { MenuPreview: markRaw(MenuPreview) },
      },
      rightMenuAiModel: {
        type: 'input',
        schema: [{ $cmp: 'AiModelSetting', props: { context: '$node.context' } }],
        library: { AiModelSetting: markRaw(AiModelSetting) },
      },
    },
  },
  routes: [],
  extensionPoints: {},
})
