// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

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
    runtimeWindow().__rightMenuRuntime?.destroy()
    delete runtimeWindow().__rightMenuRuntime
  })

  afterEach(() => {
    runtimeWindow().__rightMenuRuntime?.destroy()
    delete runtimeWindow().__rightMenuRuntime
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

    expect(document.querySelector<HTMLElement>('.right-menu-root')?.getAttribute('aria-hidden'))
      .toBe('true')
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
