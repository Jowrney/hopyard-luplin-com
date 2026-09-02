#!/usr/bin/env node

const port = process.argv[2] ?? '9333'
const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
const page = pages.find((candidate) => candidate.type === 'page' && candidate.url.includes('/design/demo'))
if (!page) throw new Error('The /design/demo page is not open.')
const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})
const result = await new Promise((resolve, reject) => {
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id !== 1) return
    if (message.error) reject(new Error(JSON.stringify(message.error)))
    else resolve(message.result)
  })
  socket.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `({
        resources: performance.getEntriesByType('resource')
          .filter((entry) => entry.name.includes('hopyard-asset-kit.glb'))
          .map((entry) => ({ name: entry.name, duration: entry.duration, transferSize: entry.transferSize })),
        canvas: (() => {
          const canvas = document.querySelector('#hopeden-3d-canvas');
          return canvas ? {
            width: canvas.width,
            height: canvas.height,
            assetKit: canvas.dataset.assetKit ?? null,
            poleAsset: canvas.dataset.poleAsset ?? null,
            trainingType: canvas.dataset.trainingType ?? null,
            vineInstances: Number(canvas.dataset.vineInstances ?? 0),
          } : null;
        })(),
        northAmerica: document.body.innerText.includes('North America 18 ft reference'),
        korea: document.body.innerText.includes('Korea steel trellis'),
      })`,
      returnByValue: true,
    },
  }))
})
socket.close()
console.log(JSON.stringify(result.result.value, null, 2))
