# 全能右键

为 Halo 主题页面注入一套可配置的自定义右键菜单。插件通过 Halo 的 `TemplateHeadProcessor` 自动注入运行时资源，不需要改主题模板。

## 交流群

[点击链接加入群聊【halo博客-lywq插件】](https://qm.qq.com/q/wuC7NZr0sw)

<img src="https://github.com/user-attachments/assets/bf162401-07fd-49ec-b50f-5218c9510937" style="height: 400px !important; width: auto; object-fit: contain;" />

## 功能特性

- 自定义右键菜单：支持通用、选中文本、链接、图片、文章页 5 类显示场景。
- 内置常用动作：复制页面链接、复制标题和链接、复制选中文本、复制图片地址、打开图片、复制链接地址、打开链接、返回顶部、刷新页面、返回首页、搜索、自定义链接。
- 可选插件联动：支持会员收藏、会员签到、友链自助提交。
- 阅读工具：本地生成摘句 PNG 分享卡、复制带来源的 Markdown 引用、保存并恢复阅读位置。
- AI 划词：通过 AI Foundation 解释、翻译或举例，流式展示结果，支持停止、重试与复制。
- 菜单分组与设置预览：按阅读、复制分享、导航、互动组织入口，实时预览名称、排序、场景与样式。
- 路径控制：支持启用路径、排除路径，并且排除规则优先。
- 样式配置：支持浅色、深色、跟随系统，支持强调色、菜单宽度、圆角配置。
- PJAX 兼容：监听 `pjax:complete`、`pjax:end`、`turbo:load`、`swup:contentReplaced` 后重新初始化。
- 编辑区域保护：可在输入框、文本域、可编辑区域保留浏览器原生右键菜单。
- 键盘与小屏适配：方向键、Home/End 导航，Escape 关闭，长菜单滚动；Shift + 右键随时使用系统菜单。

## 兼容要求

| 项目 | 要求 |
| --- | --- |
| Halo | `>= 2.25.0` |
| Java | 21 |
| Node.js | 推荐 24，CI 使用 24 |
| pnpm | 推荐 10，项目锁定 `pnpm@10.12.4` |

可选依赖：

| 插件 | 用途 |
| --- | --- |
| `PluginMember >= 1.1.4-alpha6` | 会员收藏、会员签到 |
| `LinksSubmit >= 2.3.5` | 申请友链 |
| `ai-foundation >= 1.1.1 & < 2.0.0` | AI 阅读助手，另需 Halo `>= 2.26.0` |

这些依赖是可选的。没有安装或前台 API 尚未就绪时，对应入口隐藏，基础菜单和本地阅读工具仍可使用。AI 默认关闭。

## 安装使用

1. 从 GitHub Release 下载插件 JAR。
2. 进入 Halo 控制台，打开“插件”页面。
3. 上传并启用插件。
4. 进入插件设置页，按需调整启用路径、菜单项和样式。
5. 回到前台主题页面，右键检查菜单是否出现。

从旧版本升级时，已有菜单配置会保留，**不会自动追加新动作**。在“菜单项”中手动添加摘句卡、Markdown 引用、书签或 AI 动作即可；主动清空菜单会保留空配置。

本地构建安装：

```bash
./gradlew build
```

构建产物位于 `build/libs`，上传生成的 JAR 即可。

## 配置说明

### 基本设置

| 配置项 | 说明 | 默认值 |
| --- | --- | --- |
| 启用全能右键 | 总开关，关闭后不注入右键菜单 | 开启 |
| 启用路径 | 留空表示全站主题页面启用 | `[]` |
| 排除路径 | 命中后不启用，优先级高于启用路径 | `/console/**`、`/uc/**`、`/apis/**` |
| PJAX 兼容模式 | 前台路由切换后重新读取配置并初始化 | 开启 |
| 编辑区域保留系统右键 | 输入框、文本域、可编辑区域不拦截右键 | 开启 |
| 菜单分组 | 按动作自动分组，也可给单项指定分组 | 开启 |
| 菜单预览 | 预览当前配置；不执行动作，也不作为配置保存 | — |

### 路径规则

支持以下写法：

| 写法 | 示例 | 含义 |
| --- | --- | --- |
| 精确路径 | `/about` | 仅匹配 `/about` |
| 递归匹配 | `/posts/**` | 匹配 `/posts` 以及 `/posts/hello`、`/posts/a/b` |
| 单层匹配 | `/photos/*` | 匹配 `/photos/a`，不匹配 `/photos/a/b` |
| 路径变量 | `/archives/{slug}` | 匹配 `/archives/hello` |

排除规则永远优先。比如启用路径配置 `/posts/**`，排除路径配置 `/posts/private/**`，那么 `/posts/private/secret` 不会启用菜单。

### 菜单项字段

| 字段 | 说明 |
| --- | --- |
| `enabled` | 是否启用当前菜单项 |
| `id` | 菜单项标识，留空会自动生成 |
| `label` | 菜单显示名称 |
| `action` | 点击后执行的动作 |
| `context` | 显示场景：`common`、`text`、`link`、`image`、`article` |
| `group` | 分组：`auto`、`reading`、`sharing`、`navigation`、`interaction`、`custom` |
| `icon` | 图标，推荐使用 Iconify 名称，例如 `ri:link` |
| `url` | 自定义链接动作使用 |
| `target` | 打开方式：`_self` 或 `_blank` |
| `order` | 排序值，越小越靠前 |

图标支持 Iconify 名称、`http(s)` 图片地址、站内绝对路径、`data:image/*` 和内联 SVG。默认菜单使用的部分 Remix Icon 会内置为 SVG，其他 Iconify 图标会从 `https://api.iconify.design` 加载。

### 内置动作

| 动作 | 显示场景建议 | 行为 |
| --- | --- | --- |
| `copyPageLink` | `common` | 复制当前页面链接 |
| `copyPageTitleLink` | `common` | 复制当前页面标题和链接 |
| `copySelection` | `text` | 复制当前选中的文本 |
| `copyMarkdownQuote` | `text` | 复制引用，附标题和来源链接 |
| `createQuoteCard` | `text` | 本地绘制分享卡并导出 PNG，选区最多 1000 字符 |
| `saveReadingPosition` | `article` | 保存当前段落及阅读进度 |
| `resumeReadingPosition` | `article` | 恢复当前文章的阅读书签，有书签时显示 |
| `aiExplain` | `text` | 用简体中文通俗解释选区 |
| `aiExample` | `text` | 提供帮助理解选区的具体例子 |
| `aiTranslate` | `text` | 翻译成简体中文；中文选区翻译成英文 |
| `copyImageUrl` | `image` | 复制当前图片地址 |
| `openImage` | `image` | 打开当前图片 |
| `copyLinkUrl` | `link` | 复制当前链接地址 |
| `openLink` | `link` | 打开当前链接 |
| `scrollTop` | `common` | 平滑返回页面顶部 |
| `reload` | `common` | 刷新当前页面 |
| `home` | `common` | 跳转到 `/` |
| `search` | `common` 或 `text` | 有选中文本时跳转到 `/search?keyword=...`，否则跳转到 `/search` |
| `customLink` | `common` | 打开自定义链接 |
| `memberFavorite` | `common` | 调用会员插件收藏能力 |
| `memberSignIn` | `common` | 调用会员插件签到能力 |
| `openLinksSubmit` | `common` | 打开友链自助提交弹窗 |

`customLink` 的 `url` 支持占位符：

```text
{url}        当前页面链接，已 URL 编码
{title}      当前页面标题，已 URL 编码
{selection}  当前选中文本，已 URL 编码
```

示例：

```text
https://example.com/share?title={title}&url={url}
```

打开页面、图片或自定义链接仅允许 `http:`、`https:`、`mailto:`、`tel:` 协议；`javascript:`、`data:` 等会拒绝并提示。

## 阅读工具

选中文字后右键，可生成摘句卡或复制 Markdown 引用。分享卡在浏览器 Canvas 本地绘制，不请求 AI 或上传选区，包含文字、标题和来源 URL，可保存为 PNG。

在文章段落上右键选择“读到这里”，保存此处的段落标识、文字片段与阅读进度。再次打开当前文章后选择“继续上次阅读”，优先定位相同段落；正文发生变化时回退到大致进度。书签按文章标识与路径隔离，最多保留 50 篇。

书签仅存于**当前浏览器的 localStorage**，不会同步到其他设备；清理站点数据会删除书签。浏览器禁止存储时会提示保存失败。

## AI 阅读助手

接入依据为 [AI Foundation](https://github.com/halo-dev/plugin-ai-foundation) `v1.1.1` 的公开 Java SDK 与 FormKit `aiModelSelector`。本插件通过 `ExtensionGetter` 获取模型能力，不保存供应商密钥，也不直接请求模型供应商。

启用步骤：

1. 在 Halo `>= 2.26.0` 安装并启用 AI Foundation `>= 1.1.1 & < 2.0.0`。
2. 在 AI Foundation 中配置供应商及可用语言模型，并设置默认模型。
3. 在本插件“AI 阅读助手”设置中启用开关，选择模型或留空使用默认模型。
4. 升级用户还需在菜单项中添加 `aiExplain`、`aiExample`、`aiTranslate`，场景选择“选中文本”。
5. 登录后在前台选中文字并右键；结果面板支持停止、重新生成与复制。

默认仅登录用户能够生成。启用“允许限额访客使用”后，访客按服务端远端地址计数，不使用客户端自行传入的 `X-Forwarded-For` 等头部重置额度；使用反向代理时，多个访客可能共享额度。

| 配置 | 默认值 | 允许范围 |
| --- | --- | --- |
| 单次输入字符数 | 3000 | 100～6000 |
| 单次输出 Token | 800 | 100～2000 |
| 每用户每分钟次数 | 3 | 1～20 |
| 每用户每天次数 | 20 | 1～200 |
| 站点每天总次数 | 200 | 1～10000 |
| 站点同时生成数 | 2 | 1～10 |

同一身份同时只允许一次生成。每日额度按北京时间重置；额度保存在进程内存，插件或 Halo 重启会重置，多个实例各自计数。已通过校验开始的生成，包括失败、停止和重试，都消耗次数。服务端模型调用最长 60 秒，关闭面板或停止会取消订阅并发送 SDK 取消信号。

仅将选区及预设阅读指令发送给站长配置的模型；供应商如何保留数据取决于其配置与条款。结果按纯文本展示，并标注 AI 阅读参考。当前不包含全站知识库、图片理解或多轮聊天。

接口位于 `/apis/api.right-menu.muyin.site/v1alpha1/ai`：

- `GET /config`：获取开关、可用状态、访客策略及输入上限，响应 `Cache-Control: no-store`。
- `POST /explain`：JSON 请求 `{ "mode": "explain|example|translate", "text": "选区" }`，响应 NDJSON `delta`、`done` 或 `error`。
- 请求错误返回 400，未登录返回 401，关闭返回 403，超额或忙碌返回 429，依赖、模型或设置不可用返回 503。流开始后的模型错误通过 `error` 帧返回，不标记为成功完成。

## 可选插件联动

### 会员收藏

`memberFavorite` 会优先使用当前 Halo 文章上下文作为收藏对象。插件会从主题模板变量 `post` 中读取：

- `metadata.name`
- `spec.title`
- `status.permalink`
- `spec.cover`

如果当前页面没有 `post` 变量，运行时会尝试读取页面中的 `data-member-favorite-subject` 作为备用文章标识。

### 会员签到

`memberSignIn` 会等待会员插件前台 API 就绪，再执行签到。用户未登录时会跳转到登录页。

收藏和签到会读取当前状态并更新按钮文案，进行中的操作不重复提交。

### 友链自助提交

`openLinksSubmit` 会尝试调用 `window.LinksSubmit.openLinksSubmitOverlay()`，也兼容 `window.openLinksSubmitOverlay()`。仅在主题已注入友链弹窗及可用 API 时显示入口。

## 主题兼容说明

插件会向主题页面 `<head>` 注入：

- `/plugins/right-menu/assets/static/right-menu/right-menu.css`
- 内联 JSON 配置脚本 `#right-menu-config`
- `/plugins/right-menu/assets/static/right-menu/right-menu-panel.js`
- `/plugins/right-menu/assets/static/right-menu/right-menu-reader.js`
- `/plugins/right-menu/assets/static/right-menu/right-menu-ai.js`
- `/plugins/right-menu/assets/static/right-menu/right-menu.js`

默认不会在 `/console/**`、`/uc/**`、`/apis/**` 生效。右键菜单挂载在 `document.body` 下，层级较高，通常不需要主题额外适配。

PJAX 切换时会重新核对文章 URL；新页面缺少配置节点时保留路径等站点规则并清除旧文章身份，避免在另一篇文章上收藏或恢复旧书签。

如果菜单没有显示，优先检查：

1. 插件是否启用。
2. 当前路径是否被排除规则命中。
3. 主题页面源码中是否存在 `right-menu-config` 和 `right-menu-runtime`。
4. 浏览器控制台是否能访问 `/plugins/right-menu/assets/static/right-menu/right-menu.js`。
5. 当前右键位置是否在输入框、文本域或可编辑区域。

## 开发

启动 Halo 开发环境：

```bash
./gradlew haloServer
```

前端依赖安装与监听构建：

```bash
cd ui
pnpm install
pnpm dev
```

项目结构：

| 路径 | 说明 |
| --- | --- |
| `src/main/resources/plugin.yaml` | 插件元信息、Halo 版本要求、可选依赖 |
| `src/main/resources/extensions/settings.yaml` | 插件设置表单 |
| `src/main/resources/extensions/reverseProxy.yaml` | 静态资源反向代理 |
| `src/main/java/site/muyin/rightmenu/processor/RightMenuHeadProcessor.java` | 主题 `<head>` 注入入口 |
| `src/main/java/site/muyin/rightmenu/setting/RightMenuSetting.java` | 设置模型与默认菜单 |
| `src/main/java/site/muyin/rightmenu/support/RightMenuPathMatcher.java` | 路径匹配规则 |
| `src/main/java/site/muyin/rightmenu/support/RightMenuPostContextExtractor.java` | 文章上下文提取 |
| `src/main/java/site/muyin/rightmenu/template/RightMenuHtmlTpl.java` | 注入 HTML 片段生成 |
| `src/main/resources/static/right-menu/right-menu.js` | 前台运行时 |
| `src/main/resources/static/right-menu/right-menu.css` | 前台样式 |
| `src/main/java/site/muyin/rightmenu/ai/` | AI 可选适配器、接口及访问额度 |
| `src/main/resources/static/right-menu/right-menu-reader.js` | 摘句卡、Markdown 和阅读书签 |
| `src/main/resources/static/right-menu/right-menu-ai.js` | AI 流式面板及取消处理 |
| `ui/src/components/` | 设置预览与可选模型选择器 |
| `ui/src/__tests__/right-menu-runtime.test.ts` | 前台运行时单元测试 |

常用命令：

```bash
# 后端单元测试
./gradlew test

# 后端 + 前端校验
./gradlew check

# 完整构建插件 JAR
./gradlew build

# 前端运行时测试
cd ui
pnpm test:unit
```

`./gradlew build` 会先执行 `ui` 模块的 `assemble`，再把前端产物复制到插件资源目录。

自动化检查覆盖菜单回归、新安装默认菜单、AI 流分片及错误、权限与额度、取消释放、SDK 最终错误和缺少依赖时的条件配置。`1.0.0-beta2` 已在隔离 Halo 2.25.4 / 2.27.0 验证加载、设置和权限，并在 Halo 2.27.0 + AI Foundation 1.1.1 下使用本地模拟供应商验证流式输出、失败、限额与取消。模拟供应商验证不代表真实商业模型供应商或生产部署已验收。

## 发布

1. 更新 `gradle.properties` 中的 `version`。
2. 执行 `./gradlew check` 和 `./gradlew build`。
3. 创建 GitHub Release。
4. CD 工作流会构建并上传插件产物，再使用仓库的 `HALO_PAT` 向 Halo 应用市场提交版本；市场审核和上架状态需单独核验。

## 常见问题

### 菜单在控制台或用户中心不显示

这是默认行为。插件默认排除了 `/console/**` 和 `/uc/**`，避免影响 Halo 后台和用户中心。

### 图片或链接菜单项不出现

菜单项按 `context` 判断是否显示。`image` 只在图片上右键出现，`link` 只在链接上右键出现，`text` 需要页面存在选中文本。

### 复制失败

插件优先使用 `navigator.clipboard.writeText`，失败后会回退到 `document.execCommand('copy')`。如果浏览器权限、非安全上下文或主题脚本拦截复制行为，仍可能失败。

### Iconify 图标不显示

默认内置图标不依赖网络。非内置 Iconify 图标会请求 `https://api.iconify.design`，如果站点网络策略拦截该域名，建议改用站内图片路径或内联 SVG。

### 会员收藏提示没有可收藏的文章

当前页面需要是 Halo 文章页，并且主题上下文里存在 `post` 变量；或者页面中提供 `data-member-favorite-subject` 作为备用文章标识。

## 许可证

[GPL-3.0](./LICENSE) © Lywq
