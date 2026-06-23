# 全能右键

为 Halo 主题页面注入一套可配置的自定义右键菜单。插件通过 Halo 的 `TemplateHeadProcessor` 自动注入运行时资源，不需要改主题模板。

## 交流群

[点击链接加入群聊【halo博客-lywq插件】](https://qm.qq.com/q/wuC7NZr0sw)

<img src="https://github.com/user-attachments/assets/bf162401-07fd-49ec-b50f-5218c9510937" style="height: 400px !important; width: auto; object-fit: contain;" />

## 功能特性

- 自定义右键菜单：支持通用、选中文本、链接、图片 4 类显示场景。
- 内置常用动作：复制页面链接、复制标题和链接、复制选中文本、复制图片地址、打开图片、复制链接地址、打开链接、返回顶部、刷新页面、返回首页、搜索、自定义链接。
- 可选插件联动：支持会员收藏、会员签到、友链自助提交。
- 路径控制：支持启用路径、排除路径，并且排除规则优先。
- 样式配置：支持浅色、深色、跟随系统，支持强调色、菜单宽度、圆角配置。
- PJAX 兼容：监听 `pjax:complete`、`pjax:end`、`turbo:load`、`swup:contentReplaced` 后重新初始化。
- 编辑区域保护：可在输入框、文本域、可编辑区域保留浏览器原生右键菜单。

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

这些依赖是可选的。没装也能使用基础右键功能，只是对应菜单项会提示依赖不可用。

## 安装使用

1. 从 GitHub Release 下载插件 JAR。
2. 进入 Halo 控制台，打开“插件”页面。
3. 上传并启用插件。
4. 进入插件设置页，按需调整启用路径、菜单项和样式。
5. 回到前台主题页面，右键检查菜单是否出现。

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
| `context` | 显示场景：`common`、`text`、`link`、`image` |
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

### 友链自助提交

`openLinksSubmit` 会尝试调用 `window.LinksSubmit.openLinksSubmitOverlay()`，也兼容 `window.openLinksSubmitOverlay()`。如果主题页面没有注入友链弹窗，会提示“友链申请弹窗未注入”。

## 主题兼容说明

插件会向主题页面 `<head>` 注入：

- `/plugins/right-menu/assets/static/right-menu/right-menu.css`
- 内联 JSON 配置脚本 `#right-menu-config`
- `/plugins/right-menu/assets/static/right-menu/right-menu.js`

默认不会在 `/console/**`、`/uc/**`、`/apis/**` 生效。右键菜单挂载在 `document.body` 下，层级较高，通常不需要主题额外适配。

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

## 发布

1. 更新 `gradle.properties` 中的 `version`。
2. 执行 `./gradlew check` 和 `./gradlew build`。
3. 创建 GitHub Release。
4. CD 工作流会构建并上传插件产物；当前配置默认跳过 Halo 应用市场发布。

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
