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
const hangulLeaks = (text) => text
  .replaceAll('한국어', '')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => /[가-힣]/.test(line))

await evaluate(`localStorage.removeItem('hopeden.locale'); location.reload(); true`)
await wait(5000)
const englishText = await evaluate('document.body.innerText')
const englishLeaks = hangulLeaks(englishText)
const defaultDocumentLang = await evaluate('document.documentElement.lang')

const pdfOpened = await evaluate(`(async () => {
  const button = [...document.querySelectorAll('button')].find((node) => /Estimate PDF|PDF Estimate/i.test(node.textContent || ''));
  button?.click();
  if (!button) return false;
  for (let index = 0; index < 30; index += 1) {
    if (document.querySelector('[data-pdf-root]')) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
})()`)
await wait(1000)
const pdfEnglishText = await evaluate(`document.querySelector('[data-pdf-root]')?.textContent || ''`)
const pdfEnglishLeaks = hangulLeaks(pdfEnglishText)
await evaluate(`document.querySelector('[data-pdf-root]')?.closest('.fixed')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); true`)

const switched = await evaluate(`(() => {
  const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === '한국어');
  button?.click();
  return Boolean(button);
})()`)
await wait(1000)
const koreanText = await evaluate('document.body.innerText')

const report = {
  defaultDocumentLang,
  englishLeaks,
  pdfOpened,
  pdfEnglishChars: pdfEnglishText.length,
  pdfEnglishLeaks,
  switched,
  koreanVisible: /[가-힣]/.test(koreanText),
}
console.log(JSON.stringify(report, null, 2))
ws.close()
if (defaultDocumentLang !== 'en' || englishLeaks.length || pdfEnglishLeaks.length || !pdfOpened || pdfEnglishText.length < 200 || !switched || !report.koreanVisible) process.exit(1)
