#!/usr/bin/env node

const port = process.argv[2] ?? '9333'
const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
const page = pages.find((candidate) => candidate.type === 'page' && candidate.url.includes('/design/demo'))
if (!page) throw new Error('The /design/demo page is not open.')

const ws = new WebSocket(page.webSocketDebuggerUrl)
let nextId = 0
const pending = new Map()
ws.onmessage = ({ data }) => {
  const message = JSON.parse(data)
  if (!message.id) return
  const handler = pending.get(message.id)
  if (!handler) return
  pending.delete(message.id)
  message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result)
}
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})
const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId
  pending.set(id, { resolve, reject })
  ws.send(JSON.stringify({ id, method, params }))
})
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
  return result.result.value
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

await evaluate(`localStorage.setItem('hopeden.locale','en'); location.reload(); true`)
await wait(4500)
const opened = await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.includes('WebMCP'));
  button?.click();
  return Boolean(button);
})()`)
await wait(300)
const english = await evaluate(`document.querySelector('[role=dialog]')?.innerText || ''`)
const switched = await evaluate(`(() => {
  const dialog = document.querySelector('[role=dialog]');
  const tab = [...(dialog?.querySelectorAll('[role=tab]') ?? [])].find((node) => node.textContent?.trim() === '한국어');
  tab?.click();
  return Boolean(tab);
})()`)
await wait(300)
const korean = await evaluate(`document.querySelector('[role=dialog]')?.innerText || ''`)
const report = {
  opened,
  englishTitle: english.includes('How to test WebMCP'),
  englishPrompt: english.includes('two design alternatives'),
  switched,
  koreanTitle: korean.includes('WebMCP 테스트 방법'),
  koreanPrompt: korean.includes('두 개의 설계 대안'),
  toolNamesPresent: ['get_design_context','simulate_design','preview_candidate','apply_candidate','discard_preview'].every((name) => korean.includes(name)),
}
console.log(JSON.stringify(report, null, 2))
ws.close()
if (Object.values(report).some((value) => value !== true)) process.exit(1)
