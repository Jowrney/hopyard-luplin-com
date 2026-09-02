#!/usr/bin/env node

const port = process.argv[2] ?? '9333'
const locale = process.argv[3] === 'ko' ? 'ko' : 'en'
const downloadPath = process.argv[4] ?? `/tmp/hopyard-pdf-${locale}`
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

await call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, eventsEnabled: true })
await evaluate(`localStorage.setItem('hopeden.locale', ${JSON.stringify(locale)}); location.reload(); true`)
await wait(5000)
const opened = await evaluate(`(async () => {
  const button = [...document.querySelectorAll('button')].find((node) => /Estimate PDF|견적서(?: PDF)?/i.test(node.textContent || ''));
  button?.click();
  if (!button) return false;
  for (let index = 0; index < 30; index += 1) {
    if (document.querySelector('[data-pdf-root]')) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
})()`)
const started = await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((node) => /PDF.*Download|Download.*PDF|PDF.*다운로드|다운로드.*PDF/i.test(node.textContent || ''));
  button?.click();
  return Boolean(button);
})()`)
await wait(5000)
const buttonLabels = started ? [] : await evaluate(`[...document.querySelectorAll('button')].map((node) => node.textContent?.trim()).filter(Boolean)`)
console.log(JSON.stringify({ locale, downloadPath, opened, started, buttonLabels }, null, 2))
ws.close()
if (!opened || !started) process.exit(1)
