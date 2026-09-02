#!/usr/bin/env node

const port = process.argv[2] ?? '9333'
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

const result = await call('Runtime.evaluate', {
  expression: `(async () => {
    const supported = typeof document.modelContext?.getTools === 'function';
    const tools = supported ? await document.modelContext.getTools() : [];
    return {
      supported,
      tools: tools.map(({ name, description, inputSchema, annotations }) => ({
        name,
        description,
        inputSchema,
        annotations,
      })),
    };
  })()`,
  awaitPromise: true,
  returnByValue: true,
})

socket.close()
if (result.exceptionDetails) {
  throw new Error(result.exceptionDetails.exception?.description ?? 'Runtime evaluation failed.')
}
console.log(JSON.stringify(result.result.value, null, 2))
