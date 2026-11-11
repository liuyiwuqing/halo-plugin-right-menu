// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { TextDecoder, TextEncoder } from 'node:util'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type State = { selection: string }
type Panels = { open: (...args: unknown[]) => unknown; close: () => void; destroy: () => void }
type Assistant = {
  refresh: () => Promise<void>
  canShow: (action: string, state: State) => boolean
  execute: (action: string, state: State) => void
  destroy: () => void
}
const globals = window as unknown as {
  RightMenuPanel: { create: () => Panels }
  RightMenuAi: { create: (options: unknown) => Assistant }
}
const sourceDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../src/main/resources/static/right-menu',
)
const encoder = new TextEncoder()
const state = { selection: '理解这句话' }
let panels: Panels
let assistant: Assistant
let fetchMock: ReturnType<typeof vi.fn>
let notify: ReturnType<typeof vi.fn>

function button(label: string) {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (node) => node.textContent === label,
  )!
}
function output() {
  return document.querySelector('.right-menu-ai-result')?.textContent
}
function status() {
  return document.querySelector('.right-menu-panel-status')?.textContent
}
function stream(text: string, byteByByte = false) {
  const bytes = encoder.encode(text)
  return {
    ok: true,
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        if (byteByByte) bytes.forEach((byte) => controller.enqueue(new Uint8Array([byte])))
        else controller.enqueue(bytes)
        controller.close()
      },
    }),
  }
}
async function ready() {
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ enabled: true, available: true, maxInputCharacters: 3000 }),
  })
  await assistant.refresh()
}

describe('AI reading assistant', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.stubGlobal('TextDecoder', TextDecoder)
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    for (const name of ['right-menu-panel.js', 'right-menu-ai.js']) {
      new Function(readFileSync(resolve(sourceDirectory, name), 'utf8'))()
    }
    panels = globals.RightMenuPanel.create()
    notify = vi.fn()
    assistant = globals.RightMenuAi.create({
      panels,
      notify,
      copyText: vi.fn().mockResolvedValue(true),
    })
  })
  afterEach(() => {
    assistant.destroy()
    panels.destroy()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps AI entries hidden when configuration is absent or unreadable', async () => {
    expect(assistant.canShow('aiExplain', state)).toBe(false)
    fetchMock.mockRejectedValueOnce(new Error('offline'))
    await assistant.refresh()
    expect(assistant.canShow('aiTranslate', state)).toBe(false)
    await ready()
    expect(assistant.canShow('aiExample', state)).toBe(true)
    expect(assistant.canShow('aiExample', { selection: '' })).toBe(false)
  })

  it('decodes Chinese across byte boundaries and renders model text safely', async () => {
    await ready()
    fetchMock.mockResolvedValueOnce(
      stream(
        '{"type":"delta","text":"中文<script>alert(1)</script>"}\n{"type":"done","text":""}\n',
        true,
      ),
    )
    assistant.execute('aiExplain', state)
    await vi.waitFor(() => expect(status()).toContain('生成完成'))
    expect(output()).toBe('中文<script>alert(1)</script>')
    expect(document.querySelector('.right-menu-ai-result script')).toBeNull()
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      mode: 'explain',
      text: state.selection,
    })
    expect(button('复制结果').disabled).toBe(false)
  })

  it.each([
    ['{"type":"delta","text":"部分结果"}\n', '连接中断'],
    ['{"type":"delta","text":"部分结果"}\n{"type":"error","text":"模型超时"}\n', '模型超时'],
    ['{"type":"done","text":""}\n', '模型没有返回文字'],
  ])('reports incomplete, failed, and empty streams: %s', async (body, message) => {
    await ready()
    fetchMock.mockResolvedValueOnce(stream(body))
    assistant.execute('aiTranslate', state)
    await vi.waitFor(() => expect(status()).toContain(message))
    expect(status()).not.toContain('生成完成')
    expect(button('重新生成').disabled).toBe(false)
  })

  it('ignores a fetch that resolves after the request has been stopped', async () => {
    await ready()
    let resolveFetch!: (value: unknown) => void
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )
    assistant.execute('aiExplain', state)
    button('停止生成').click()
    resolveFetch(stream('{"type":"delta","text":"旧请求"}\n{"type":"done","text":""}\n'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(output()).toBe('')
    expect(status()).toBe('已停止生成')
  })

  it('does not let a pending old chunk overwrite a retry', async () => {
    await ready()
    let resolveRead!: (value: { done: boolean; value: Uint8Array }) => void
    const cancel = vi.fn().mockResolvedValue(undefined)
    const read = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRead = resolve
        }),
    )
    fetchMock.mockResolvedValueOnce({ ok: true, body: { getReader: () => ({ read, cancel }) } })
    assistant.execute('aiExample', state)
    await vi.waitFor(() => expect(read).toHaveBeenCalledOnce())
    button('停止生成').click()
    fetchMock.mockResolvedValueOnce(
      stream('{"type":"delta","text":"新请求结果"}\n{"type":"done","text":""}\n'),
    )
    button('重新生成').click()
    await vi.waitFor(() => expect(output()).toBe('新请求结果'))
    resolveRead({ done: false, value: encoder.encode('{"type":"delta","text":"旧请求结果"}\n') })
    await vi.waitFor(() => expect(cancel).toHaveBeenCalledOnce())
    expect(output()).toBe('新请求结果')
    expect(status()).toContain('生成完成')
  })

  it('keeps a single login entry across unauthorized retries', async () => {
    await ready()
    const unauthorized = { ok: false, status: 401, json: async () => ({ message: '请先登录' }) }
    fetchMock.mockResolvedValueOnce(unauthorized)
    assistant.execute('aiExplain', state)
    await vi.waitFor(() => expect(status()).toBe('请先登录'))
    fetchMock.mockResolvedValueOnce(unauthorized)
    button('重新生成').click()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
    await vi.waitFor(() => expect(button('重新生成').disabled).toBe(false))
    expect(
      [...document.querySelectorAll('button')].filter((node) => node.textContent === '登录后使用'),
    ).toHaveLength(1)
  })

  it('aborts a running request when its panel closes', async () => {
    await ready()
    fetchMock.mockImplementationOnce(() => new Promise(() => {}))
    assistant.execute('aiExplain', state)
    const signal = fetchMock.mock.calls[1][1].signal as AbortSignal
    panels.close()
    expect(signal.aborted).toBe(true)
    expect(document.querySelector('dialog')).toBeNull()
  })

  it('rejects oversized selection before issuing a generation request', async () => {
    await ready()
    assistant.execute('aiExplain', { selection: '字'.repeat(3001) })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledWith('选区过长，请缩短后重试')
  })
})
