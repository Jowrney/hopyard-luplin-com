#!/usr/bin/env node

import { writeFileSync } from 'node:fs'

const port = process.argv[2] ?? '9333'
const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
const page = pages.find((candidate) => candidate.type === 'page' && candidate.url.includes('/design'))
if (!page) throw new Error('A design page is not open.')

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
const capture = async (path) => {
  const result = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  writeFileSync(path, Buffer.from(result.data, 'base64'))
}

async function setViewport(width, height, mobile) {
  await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
  await call('Page.reload', { ignoreCache: true })
  await wait(4500)
}

const baseState = () => evaluate(`(() => {
  const inputButton = document.querySelector('[aria-controls="design-input-panel"]');
  const reviewButton = document.querySelector('[aria-controls="design-review-panel"]');
  const canvas = document.querySelector('main');
  return {
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    inputExpanded: inputButton?.getAttribute('aria-expanded'),
    reviewExpanded: reviewButton?.getAttribute('aria-expanded'),
    headerRight: reviewButton?.getBoundingClientRect().right ?? 0,
    canvasWidth: canvas?.getBoundingClientRect().width ?? 0,
  };
})()`)

await setViewport(1440, 900, false)
const desktop = await baseState()
await capture('/tmp/hopyard-layout-desktop.png')

await setViewport(1024, 820, false)
const tabletClosed = await baseState()
await evaluate(`document.querySelector('[aria-controls="design-input-panel"]')?.click(); true`)
await wait(300)
const tabletLeft = await evaluate(`(() => {
  const rect=document.querySelector('#design-input-panel')?.getBoundingClientRect();
  return {expanded:document.querySelector('[aria-controls="design-input-panel"]')?.getAttribute('aria-expanded'),left:rect?.left,right:rect?.right,width:rect?.width};
})()`)
await evaluate(`document.querySelector('[aria-controls="design-review-panel"]')?.click(); true`)
await wait(300)
const tabletRight = await evaluate(`(() => {
  const panel=document.querySelector('#design-review-panel');
  const rect=panel?.getBoundingClientRect();
  const text=panel?.innerText || '';
  return {expanded:document.querySelector('[aria-controls="design-review-panel"]')?.getAttribute('aria-expanded'),left:rect?.left,right:rect?.right,width:rect?.width,utilities:/WebMCP/.test(text)&&/Estimate PDF/.test(text)&&/Structurally safe/.test(text)};
})()`)

await setViewport(390, 844, true)
const mobileClosed = await baseState()
await capture('/tmp/hopyard-layout-mobile-closed.png')
await evaluate(`document.querySelector('[aria-controls="design-review-panel"]')?.click(); true`)
await wait(300)
const mobileRight = await evaluate(`(() => {
  const rect=document.querySelector('#design-review-panel')?.getBoundingClientRect();
  return {expanded:document.querySelector('[aria-controls="design-review-panel"]')?.getAttribute('aria-expanded'),left:rect?.left,right:rect?.right,width:rect?.width,scrollWidth:document.documentElement.scrollWidth};
})()`)
await capture('/tmp/hopyard-layout-mobile-right.png')

const report = { desktop, tabletClosed, tabletLeft, tabletRight, mobileClosed, mobileRight }
console.log(JSON.stringify(report, null, 2))
ws.close()
const valid =
  desktop.scrollWidth === 1440 && desktop.headerRight <= 1440 && desktop.inputExpanded === 'true' && desktop.reviewExpanded === 'true' && desktop.canvasWidth >= 500 &&
  tabletClosed.scrollWidth === 1024 && tabletClosed.inputExpanded === 'false' && tabletClosed.reviewExpanded === 'false' && tabletClosed.headerRight <= 1024 &&
  tabletLeft.expanded === 'true' && tabletLeft.left >= 0 && tabletLeft.right <= 1024 &&
  tabletRight.expanded === 'true' && tabletRight.left >= 0 && tabletRight.right <= 1024 && tabletRight.utilities &&
  mobileClosed.scrollWidth === 390 && mobileClosed.inputExpanded === 'false' && mobileClosed.reviewExpanded === 'false' && mobileClosed.headerRight <= 390 &&
  mobileRight.expanded === 'true' && mobileRight.left >= 0 && mobileRight.right <= 390 && mobileRight.scrollWidth === 390
if (!valid) process.exit(1)
