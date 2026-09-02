#!/usr/bin/env node

const port = process.argv[2] ?? '9333'
const previewUS = process.argv.includes('--preview-us')
const keepPreview = process.argv.includes('--keep-preview')
const option = (name) => process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1)
const trainingType = option('--training') ?? 'I'
const poleCode = option('--pole')
const poleHeight = option('--pole-height')
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

function waitForEvent(method, predicate) {
  return new Promise((resolve) => {
    const listener = (event) => {
      const message = JSON.parse(event.data)
      if (message.method !== method || !predicate(message.params)) return
      socket.removeEventListener('message', listener)
      resolve(message.params)
    }
    socket.addEventListener('message', listener)
  })
}

const unwrap = (output) => {
  if (typeof output === 'string') {
    try { return unwrap(JSON.parse(output)) } catch { return output }
  }
  const text = output?.content?.find((item) => item.type === 'text')?.text
  if (!text) return output
  try { return unwrap(JSON.parse(text)) } catch { return text }
}

await call('WebMCP.enable')
const frameTree = await call('Page.getFrameTree')
const frameId = frameTree.frameTree.frame.id

async function invoke(toolName, input = {}) {
  const { invocationId } = await call('WebMCP.invokeTool', { frameId, toolName, input })
  const response = await waitForEvent(
    'WebMCP.toolResponded',
    (params) => params.invocationId === invocationId,
  )
  if (response.status !== 'Completed') {
    throw new Error(`${toolName} failed: ${response.errorText ?? response.status}`)
  }
  return unwrap(response.output)
}

async function toolNames() {
  const result = await call('Runtime.evaluate', {
    expression: 'document.modelContext.getTools().then(tools => tools.map(tool => tool.name))',
    awaitPromise: true,
    returnByValue: true,
  })
  return result.result.value
}

const initialTools = await toolNames()
const economy = await invoke('simulate_design', {
  label: `Training ${trainingType} · ${poleCode ?? 'current pole'}`,
  rationale: 'Visual verification candidate for training direction and selected pole asset.',
  trainingType,
  ...(poleCode ? { poleCode } : {}),
  ...(poleHeight ? { poleEffectiveHeightM: Number(poleHeight) } : {}),
})
const northAmerica = await invoke('simulate_design', {
  label: 'North America reference',
  rationale: 'Adapt the current site to sourced 18 ft high-trellis dimensions and materials.',
  profileId: 'US_HIGH_TRELLIS',
})
const shown = await invoke('show_candidates', {
  candidateIds: [economy.candidateId, northAmerica.candidateId],
})
const previewTarget = previewUS ? northAmerica : economy
const preview = await invoke('preview_candidate', { candidateId: previewTarget.candidateId })
await new Promise((resolve) => setTimeout(resolve, 100))
const contextAfterPreview = await invoke('get_design_context')
const previewTools = await toolNames()
const discarded = keepPreview ? null : await invoke('discard_preview')
if (!keepPreview) await new Promise((resolve) => setTimeout(resolve, 100))
const finalTools = await toolNames()
const uiResult = await call('Runtime.evaluate', {
  expression: `({
    trayVisible: Boolean(document.querySelector('[aria-label="Agent design candidates"]')),
    activeTrainingLabel: document.body.innerText.includes('V자형 — 유인줄 2줄'),
  })`,
  returnByValue: true,
})

socket.close()
console.log(JSON.stringify({
  initialTools,
  economy,
  northAmerica,
  shown,
  preview: { status: preview.status, candidateId: preview.candidateId },
  contextAfterPreview,
  previewTools,
  discarded,
  finalTools,
  ui: uiResult.result.value,
}, null, 2))
