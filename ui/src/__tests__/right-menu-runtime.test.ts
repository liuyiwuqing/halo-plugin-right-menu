// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type RightMenuRuntimeWindow = Window &
  typeof globalThis & {
    __rightMenuRuntime?: {
      destroy: () => void
    }
  }

const runtimeSource = readFileSync(
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../../src/main/resources/static/right-menu/right-menu.js',
  ),
  'utf8',
)

function runtimeWindow() {
  return window as RightMenuRuntimeWindow
}

function installConfig(config: unknown) {
  const script = document.createElement('script')
  script.id = 'right-menu-config'
  script.type = 'application/json'
  script.textContent = JSON.stringify(config)
  document.body.appendChild(script)
}

function loadRuntime() {
  for (const module of ['right-menu-panel.js', 'right-menu-reader.js']) {
    new Function(
      readFileSync(
        resolve(
          dirname(fileURLToPath(import.meta.url)),
          '../../../src/main/resources/static/right-menu',
          module,
        ),
        'utf8',
      ),
    )()
  }
  new Function(runtimeSource)()
}

function openMenu() {
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 24,
    clientY: 24,
  })
  document.body.dispatchEvent(event)
  return event.defaultPrevented
}

function navigateWithPjax(path: string) {
  window.history.pushState({}, '', path)
  document.dispatchEvent(new Event('pjax:complete'))
}

function pjaxPathConfig() {
  return {
    enabled: true,
    pjaxCompatible: true,
    includePaths: ['/posts/**'],
    excludePaths: ['/posts/private/**'],
    menuItems: [
      {
        label: '复制链接',
        action: 'copyPageLink',
        icon: 'ri:link',
        enabled: true,
      },
    ],
  }
}

describe('right-menu runtime', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    window.history.replaceState({}, '', '/')
    window.getSelection()?.removeAllRanges()
    window.localStorage.clear()
    runtimeWindow().__rightMenuRuntime?.destroy()
    delete runtimeWindow().__rightMenuRuntime
  })

  afterEach(() => {
    runtimeWindow().__rightMenuRuntime?.destroy()
    delete runtimeWindow().__rightMenuRuntime
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('reports failed clipboard fallback and preserves the original selection', () => {
    installConfig({ menuItems: [{ label: '复制', action: 'copySelection', context: 'text' }] })
    const paragraph = document.createElement('p')
    paragraph.textContent = '保留这段选区'
    document.body.appendChild(paragraph)
    const range = document.createRange()
    range.selectNodeContents(paragraph)
    window.getSelection()?.addRange(range)
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => false),
    })
    loadRuntime()
    openMenu()
    document.querySelector<HTMLButtonElement>('.right-menu-button')?.click()
    expect(document.querySelector('.right-menu-toast')?.textContent).toBe('复制失败')
    expect(window.getSelection()?.toString()).toBe('保留这段选区')
  })

  it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>'])(
    'rejects an unsafe link: %s',
    (url) => {
      const open = vi.spyOn(window, 'open').mockReturnValue(null)
      installConfig({ menuItems: [{ label: '打开', action: 'customLink', url, target: '_blank' }] })
      loadRuntime()
      openMenu()
      document.querySelector<HTMLButtonElement>('.right-menu-button')?.click()
      expect(open).not.toHaveBeenCalled()
      expect(document.querySelector('.right-menu-toast')?.textContent).toBe('不支持的链接协议')
    },
  )

  it('navigates with arrow keys and restores focus when dismissed', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    installConfig({
      menuItems: [
        { label: '复制', action: 'copyPageLink' },
        { label: '顶部', action: 'scrollTop' },
      ],
    })
    loadRuntime()
    openMenu()
    const buttons = document.querySelectorAll('.right-menu-button')
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    )
    expect(document.activeElement).toBe(buttons[1])
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(document.activeElement).toBe(trigger)
    expect(document.querySelector<HTMLElement>('.right-menu-root')?.hidden).toBe(true)
  })

  it('does not retain an old article on PJAX when its config node is missing or stale', () => {
    vi.stubGlobal('memberFavorite', { toggle: vi.fn() })
    window.history.replaceState({}, '', '/posts/a')
    installConfig({
      currentPost: { subjectName: 'post-a', permalink: '/posts/a' },
      menuItems: [
        { label: '收藏', action: 'memberFavorite' },
        { label: '复制', action: 'copyPageLink' },
      ],
    })
    loadRuntime()
    openMenu()
    expect(document.querySelector('[data-action="memberFavorite"]')).not.toBeNull()
    navigateWithPjax('/posts/b')
    openMenu()
    expect(document.querySelector('[data-action="memberFavorite"]')).toBeNull()
    document.getElementById('right-menu-config')?.remove()
    navigateWithPjax('/posts/c')
    openMenu()
    expect(document.querySelector('[data-action="memberFavorite"]')).toBeNull()
    expect(document.querySelector('[data-action="copyPageLink"]')).not.toBeNull()
  })

  it('allows Shift + right click to use the native menu and closes the previous menu', () => {
    installConfig(pjaxPathConfig())
    window.history.replaceState({}, '', '/posts/a')
    loadRuntime()
    openMenu()
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, shiftKey: true })
    document.body.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    expect(document.querySelector<HTMLElement>('.right-menu-root')?.hidden).toBe(true)
  })

  it('hides unavailable integrations and serializes favorite toggles', async () => {
    let finish: (result: { favorited: boolean }) => void = () => {}
    const toggle = vi.fn(
      () =>
        new Promise<{ favorited: boolean }>((resolve) => {
          finish = resolve
        }),
    )
    vi.stubGlobal('memberFavorite', { toggle })
    installConfig({
      currentPost: { subjectName: 'post-a', permalink: '/' },
      menuItems: [
        { label: '收藏', action: 'memberFavorite' },
        { label: '签到', action: 'memberSignIn' },
        { label: '友链', action: 'openLinksSubmit' },
      ],
    })
    loadRuntime()
    openMenu()
    expect(document.querySelector('[data-action="memberSignIn"]')).toBeNull()
    expect(document.querySelector('[data-action="openLinksSubmit"]')).toBeNull()
    const button = document.querySelector<HTMLButtonElement>('[data-action="memberFavorite"]')!
    button.click()
    button.click()
    await vi.waitFor(() => expect(toggle).toHaveBeenCalledTimes(1))
    openMenu()
    expect(
      document.querySelector<HTMLButtonElement>('[data-action="memberFavorite"]')?.disabled,
    ).toBe(true)
    finish({ favorited: true })
    await vi.waitFor(() =>
      expect(document.querySelector('[data-action="memberFavorite"]')?.textContent).toContain(
        '取消收藏',
      ),
    )
    expect(
      document.querySelector<HTMLButtonElement>('[data-action="memberFavorite"]')?.disabled,
    ).toBe(false)
  })

  it('saves a paragraph bookmark and finds it after the article layout changes', () => {
    const paragraph = document.createElement('p')
    paragraph.textContent = '这段文字是上次阅读位置'
    document.body.appendChild(paragraph)
    installConfig({
      currentPost: { subjectName: 'post-a', permalink: '/' },
      menuItems: [
        { label: '记住', action: 'saveReadingPosition', context: 'article' },
        { label: '继续', action: 'resumeReadingPosition', context: 'article' },
      ],
    })
    loadRuntime()
    paragraph.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    document.querySelector<HTMLButtonElement>('[data-action="saveReadingPosition"]')?.click()
    expect(document.querySelector('.right-menu-toast')?.textContent).toContain('已记住阅读位置')
    paragraph.remove()
    const replacement = document.createElement('p')
    replacement.textContent = '这段文字是上次阅读位置'
    replacement.scrollIntoView = vi.fn()
    document.body.appendChild(replacement)
    openMenu()
    document.querySelector<HTMLButtonElement>('[data-action="resumeReadingPosition"]')?.click()
    expect(replacement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    window.history.pushState({}, '', '/another-article')
    document.dispatchEvent(new Event('pjax:complete'))
    openMenu()
    expect(document.querySelector('[data-action="resumeReadingPosition"]')).toBeNull()
  })

  it('copies a Markdown quote with its article source and displays configured groups', () => {
    const copy = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { configurable: true, value: copy })
    const paragraph = document.createElement('p')
    paragraph.textContent = '值得摘录的句子'
    document.body.appendChild(paragraph)
    const range = document.createRange()
    range.selectNodeContents(paragraph)
    window.getSelection()?.addRange(range)
    installConfig({
      menuItems: [
        { label: '引用', action: 'copyMarkdownQuote', context: 'text', group: 'sharing' },
      ],
    })
    loadRuntime()
    openMenu()
    expect(document.querySelector('.right-menu-group')?.textContent).toBe('复制与分享')
    let copied = ''
    copy.mockImplementation(() => {
      copied = document.querySelector('textarea')?.value || ''
      return true
    })
    document.querySelector<HTMLButtonElement>('[data-action="copyMarkdownQuote"]')?.click()
    expect(copied).toContain('> 值得摘录的句子')
    expect(copied).toContain(window.location.href)
  })

  it('renders menuItems icon configured as ri:* with inline svg', () => {
    installConfig({
      enabled: true,
      menuItems: [
        {
          label: '复制链接',
          action: 'copyPageLink',
          icon: 'ri:link',
          enabled: true,
        },
      ],
    })

    loadRuntime()
    openMenu()

    const icon = document.querySelector('.right-menu-icon')
    const svg = document.querySelector('.right-menu-icon-svg')

    expect(svg).toBeInstanceOf(SVGElement)
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg?.innerHTML).toContain('M18.364 15.536')
    expect(icon?.classList.contains('right-menu-icon-fallback')).toBe(false)
    expect(icon?.textContent).not.toBe('L')
  })

  it('uses the icon field instead of the action fallback when both differ', () => {
    installConfig({
      enabled: true,
      menuItems: [
        {
          label: '自定义入口',
          action: 'customLink',
          icon: 'ri:home-4-line',
          url: '/',
          enabled: true,
        },
      ],
    })

    loadRuntime()
    openMenu()

    const svg = document.querySelector('.right-menu-icon-svg')

    expect(svg).toBeInstanceOf(SVGElement)
    expect(svg?.innerHTML).toContain('M19 21H5')
    expect(document.querySelector('.right-menu-icon')?.textContent).not.toBe('*')
  })

  it('disables on PJAX navigation to excluded paths and restores on included paths', () => {
    window.history.replaceState({}, '', '/posts/hello')
    installConfig(pjaxPathConfig())

    loadRuntime()

    expect(openMenu()).toBe(true)
    expect(document.querySelector<HTMLElement>('.right-menu-root')?.dataset.open).toBe('true')

    navigateWithPjax('/posts/private/secret')

    expect(
      document.querySelector<HTMLElement>('.right-menu-root')?.getAttribute('aria-hidden'),
    ).toBe('true')
    expect(openMenu()).toBe(false)

    navigateWithPjax('/posts/world')

    expect(openMenu()).toBe(true)
  })

  it('keeps PJAX listeners alive after an excluded response removes the config node', () => {
    window.history.replaceState({}, '', '/posts/hello')
    installConfig(pjaxPathConfig())
    loadRuntime()

    expect(openMenu()).toBe(true)

    document.getElementById('right-menu-config')?.remove()
    navigateWithPjax('/posts/private/secret')

    expect(openMenu()).toBe(false)

    installConfig(pjaxPathConfig())
    navigateWithPjax('/posts/world')

    expect(openMenu()).toBe(true)
  })
})
