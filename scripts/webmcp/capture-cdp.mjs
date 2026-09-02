#!/usr/bin/env node

import { writeFile } from 'node:fs/promises'

const port = process.argv[2] ?? '9333'
const outputPath = process.argv[3] ?? '/tmp/hopyard-webmcp-demo.png'
const show3D = process.argv.includes('--3d')
const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
const page = pages.find((candidate) => candidate.type === 'page' && candidate.url.includes('/design/demo'))
if (!page) throw new Error('The /design/demo page is not open in the target Chrome instance.')

const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})
let nextId = 1
function call(method, params = {}) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    const listener = (event) => {
      const message = JSON.parse(event.data)
      if (message.id !== id) return
      socket.removeEventListener('message', listener)
      if (message.error) reject(new Error(JSON.stringify(message.error)))
      else resolve(message.result)
    }
    socket.addEventListener('message', listener)
    socket.send(JSON.stringify({ id, method, params }))
  })
}

if (show3D) {
  await call('Runtime.evaluate', {
    expression: `Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.replace(/\\s/g, '').includes('3D투시도'))?.click()`,
  })
  await new Promise((resolve) => setTimeout(resolve, 1800))
}
const result = await call('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
  captureBeyondViewport: false,
})
socket.close()
await writeFile(outputPath, Buffer.from(result.data, 'base64'))
console.log(outputPath)
