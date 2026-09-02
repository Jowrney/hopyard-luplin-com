#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'

const port = process.argv[2] ?? '9077'
const timingsPath = process.argv[3]
const outputPath = process.argv[4]
if (!timingsPath || !outputPath) {
  throw new Error('Usage: node record-submission-video.mjs <port> <timings.json> <output.mp4>')
}

const timings = JSON.parse(readFileSync(timingsPath, 'utf8'))
mkdirSync(dirname(outputPath), { recursive: true })
const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json())
const page = pages.find((candidate) => candidate.type === 'page' && candidate.url.includes('hopyard.luplin.com'))
if (!page) throw new Error('Open the HOPEDEN live site in the target Chrome instance first.')

const socket = new WebSocket(page.webSocketDebuggerUrl)
let nextId = 0
const pending = new Map()
const eventWaiters = new Map()
let latestFrame = null

socket.onmessage = ({ data }) => {
  const message = JSON.parse(data)
  if (message.id) {
    const handler = pending.get(message.id)
    if (!handler) return
    pending.delete(message.id)
    message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result)
    return
  }
  if (message.method === 'Page.screencastFrame') {
    latestFrame = Buffer.from(message.params.data, 'base64')
    socket.send(JSON.stringify({
      id: ++nextId,
      method: 'Page.screencastFrameAck',
      params: { sessionId: message.params.sessionId },
    }))
  }
  const waiters = eventWaiters.get(message.method) ?? []
  for (const waiter of [...waiters]) {
    if (!waiter.predicate(message.params)) continue
    eventWaiters.set(message.method, waiters.filter((candidate) => candidate !== waiter))
    waiter.resolve(message.params)
  }
}
await new Promise((resolve, reject) => {
  socket.onopen = resolve
  socket.onerror = reject
})

const call = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId
  pending.set(id, { resolve, reject })
  socket.send(JSON.stringify({ id, method, params }))
})
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
const waitForEvent = (method, predicate) => new Promise((resolve) => {
  eventWaiters.set(method, [...(eventWaiters.get(method) ?? []), { predicate, resolve }])
})
const evaluate = async (expression) => {
  const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
  return result.result.value
}

async function waitFor(expression, timeout = 30000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await evaluate(`Boolean(${expression})`)) return
    await wait(250)
  }
  throw new Error(`Timed out waiting for ${expression}`)
}

async function navigate(url, selector) {
  await call('Page.navigate', { url })
  await waitFor("document.readyState === 'complete'")
  if (selector) await waitFor(`document.querySelector(${JSON.stringify(selector)})`)
  await wait(750)
}

async function clickByText(label) {
  return evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === ${JSON.stringify(label)});
    button?.click();
    return Boolean(button);
  })()`)
}

async function showOverlay(title, lines, tone = '#4ade80', top = 155, eyebrow = 'LIVE WEBMCP CALL') {
  await evaluate(`(() => {
    let overlay = document.getElementById('recording-agent-overlay');
    if (!overlay) {
      overlay = document.createElement('aside');
      overlay.id = 'recording-agent-overlay';
      document.body.appendChild(overlay);
    }
    overlay.setAttribute('style', [
      'position:fixed','left:50%','top:${top}px','transform:translateX(-50%)',
      'width:min(560px,48vw)','z-index:500','background:rgba(15,23,42,.94)',
      'color:white','border:1px solid rgba(134,239,172,.65)','border-radius:16px',
      'box-shadow:0 24px 70px rgba(15,23,42,.35)','padding:18px 20px',
      'font-family:Arial,sans-serif','pointer-events:none'
    ].join(';'));
    overlay.innerHTML = '<div style="font-size:12px;font-weight:800;letter-spacing:.12em;color:${tone};margin-bottom:8px">${eyebrow}</div>' +
      '<div style="font-size:22px;font-weight:800;margin-bottom:10px">' + ${JSON.stringify(title)} + '</div>' +
      ${JSON.stringify(lines)}.map((line) => '<div style="font:15px/1.5 ui-monospace,SFMono-Regular,monospace;color:#e2e8f0">' + line + '</div>').join('');
  })()`)
}

async function removeOverlay() {
  await evaluate("document.getElementById('recording-agent-overlay')?.remove(); true")
}

async function orbit3D(durationMilliseconds = 5000) {
  await waitFor("document.getElementById('hopeden-3d-canvas')")
  const box = await evaluate(`document.getElementById('hopeden-3d-canvas').getBoundingClientRect().toJSON()`)
  const startX = box.x + box.width * 0.56
  const startY = box.y + box.height * 0.48
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: startX, y: startY })
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: startX, y: startY, button: 'left', buttons: 1, clickCount: 1 })
  const steps = 48
  for (let step = 1; step <= steps; step += 1) {
    const progress = step / steps
    const x = startX + Math.sin(progress * Math.PI) * box.width * 0.18
    const y = startY + Math.sin(progress * Math.PI * 2) * box.height * 0.06
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 })
    await wait(durationMilliseconds / steps)
  }
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: startX, y: startY, button: 'left', buttons: 0, clickCount: 1 })
}

async function zoom3D(direction, steps = 8, durationMilliseconds = 1800) {
  await waitFor("document.getElementById('hopeden-3d-canvas')")
  const box = await evaluate(`document.getElementById('hopeden-3d-canvas').getBoundingClientRect().toJSON()`)
  const x = box.x + box.width * 0.54
  const y = box.y + box.height * 0.5
  for (let step = 0; step < steps; step += 1) {
    await call('Input.dispatchMouseEvent', {
      type: 'mouseWheel', x, y, deltaX: 0, deltaY: direction === 'in' ? -120 : 120,
    })
    await wait(durationMilliseconds / steps)
  }
}

async function move3D(keys) {
  const box = await evaluate(`document.getElementById('hopeden-3d-canvas').getBoundingClientRect().toJSON()`)
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  for (const key of keys) {
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key })
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key })
    await wait(120)
  }
}

async function humanClick(targetExpression, badgeText) {
  const box = await evaluate(`(() => {
    const target = ${targetExpression};
    if (!target) return null;
    target.scrollIntoView({block:'center', inline:'center'});
    target.style.boxShadow = '0 0 0 5px #facc15, 0 12px 30px rgba(15,23,42,.28)';
    target.style.position = 'relative';
    target.style.zIndex = '50';
    const badge = document.createElement('div');
    badge.id = 'recording-human-choice';
    badge.textContent = ${JSON.stringify(badgeText)};
    badge.setAttribute('style','position:fixed;right:48px;top:210px;z-index:700;background:#facc15;color:#422006;padding:10px 16px;border-radius:999px;font:800 14px Arial,sans-serif;letter-spacing:.08em;box-shadow:0 10px 28px rgba(15,23,42,.22)');
    document.body.appendChild(badge);
    return target.getBoundingClientRect().toJSON();
  })()`)
  if (!box) throw new Error(`Human click target missing: ${badgeText}`)
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await wait(1000)
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 })
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 })
  await wait(650)
  await evaluate("document.getElementById('recording-human-choice')?.remove(); true")
}

const unwrap = (output) => {
  if (typeof output === 'string') {
    try { return unwrap(JSON.parse(output)) } catch { return output }
  }
  const text = output?.content?.find((item) => item.type === 'text')?.text
  if (!text) return output
  try { return unwrap(JSON.parse(text)) } catch { return text }
}

let frameId
async function enableWebMCP() {
  await call('WebMCP.enable')
  const frameTree = await call('Page.getFrameTree')
  frameId = frameTree.frameTree.frame.id
}
async function invoke(toolName, input = {}) {
  const { invocationId } = await call('WebMCP.invokeTool', { frameId, toolName, input })
  const response = await waitForEvent('WebMCP.toolResponded', (params) => params.invocationId === invocationId)
  if (response.status !== 'Completed') throw new Error(`${toolName}: ${response.errorText ?? response.status}`)
  return unwrap(response.output)
}
async function toolNames() {
  return evaluate('document.modelContext.getTools().then((tools) => tools.map((tool) => tool.name).sort())')
}

async function waitForToolCount(expected, timeout = 10000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if ((await toolNames()).length === expected) return
    await wait(150)
  }
  throw new Error(`Timed out waiting for ${expected} WebMCP tools.`)
}

await call('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false })
await navigate('https://hopyard.luplin.com/?video=webmcp-challenge', 'a[href="/design/demo"]')
await evaluate("localStorage.setItem('hopeden.locale','en'); true")
await navigate('https://hopyard.luplin.com/design/demo?video=preload', '[data-testid="view-metrics-row"]')
await clickByText('3D')
await waitFor("document.body.textContent.includes('Blender GLB · 10 assets')", 45000)
await clickByText('2D')
await navigate('https://hopyard.luplin.com/?video=webmcp-challenge', 'a[href="/design/demo"]')

const ffmpeg = spawn('ffmpeg', [
  '-y', '-loglevel', 'warning', '-f', 'image2pipe', '-framerate', '15', '-vcodec', 'mjpeg', '-i', 'pipe:0',
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outputPath,
], { stdio: ['pipe', 'inherit', 'inherit'] })

await call('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
await waitFor('document.body')
for (let attempt = 0; attempt < 80 && !latestFrame; attempt += 1) await wait(100)
if (!latestFrame) throw new Error('No screencast frame received.')

const frameTimer = setInterval(() => {
  if (!latestFrame || ffmpeg.stdin.writableNeedDrain) return
  ffmpeg.stdin.write(latestFrame)
}, 1000 / 15)

let economy
let northAmerica
const recordingStarted = Date.now()
let expectedEnd = 0

for (const segment of timings) {
  const scene = segment.scene
  if (scene === 'landing') {
    await removeOverlay()
  } else if (scene === 'problem') {
    await navigate('https://hopyard.luplin.com/design/demo?video=webmcp-challenge', '[data-testid="view-metrics-row"]')
  } else if (scene === 'human-workflow') {
    await showOverlay('Connected farm decisions', ['seed cost  •  facility quantities', 'structural load  •  live estimate'], '#86efac')
  } else if (scene === 'two-d') {
    await removeOverlay()
    await clickByText('2D')
  } else if (scene === 'three-d') {
    await clickByText('3D')
    await wait(900)
    await orbit3D(Math.min(6000, segment.duration * 600))
  } else if (scene === 'asset-closeups') {
    await showOverlay('Galvanized pole + wire hardware', ['Reusable Blender GLB components'], '#86efac', 155, '3D ASSET CLOSE-UP')
    await zoom3D('in', 9, 1700)
    await move3D(['ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowUp'])
    await orbit3D(2200)
    await showOverlay('Perimeter ground anchors', ['Procedurally placed at structural edges'], '#86efac', 155, '3D ASSET CLOSE-UP')
    await orbit3D(2200)
    await showOverlay('Y-shaped training lines + hops', ['Two branches rise from each planting point'], '#86efac', 155, '3D ASSET CLOSE-UP')
    await orbit3D(2200)
    await zoom3D('out', 9, 1700)
    await removeOverlay()
  } else if (scene === 'webmcp-tools') {
    await clickByText('2D')
    await enableWebMCP()
    const names = await toolNames()
    await showOverlay(`Site tools discovered · ${names.length}`, names.map((name) => `✓ ${name}`))
  } else if (scene === 'read-context') {
    const context = await invoke('get_design_context')
    await showOverlay('get_design_context  ✓', [
      `profile: ${context.profile.id}`,
      `poles: ${context.results.poleCount}  ·  wire: ${context.results.wireLengthM} m`,
      `plants: ${context.results.plantCount}  ·  safety: ${context.results.safetyStatus}`,
    ])
  } else if (scene === 'simulate') {
    await showOverlay('simulate_design', ['Creating Korean I-shaped training candidate…'])
    economy = await invoke('simulate_design', {
      label: 'Korean I-shaped training alternative',
      rationale: 'Reduce training-wire length while preserving the current Korean steel system.',
      trainingType: 'I',
    })
    await showOverlay('simulate_design  ✓', [`${economy.candidateId} · Korean I-shaped training`, 'Creating North America Y-trained reference…'])
    northAmerica = await invoke('simulate_design', {
      label: 'North America 18 ft Y-trained reference',
      rationale: 'Compare the current site with sourced high-trellis dimensions and materials.',
      profileId: 'US_HIGH_TRELLIS',
    })
  } else if (scene === 'compare') {
    await invoke('show_candidates', { candidateIds: [economy.candidateId, northAmerica.candidateId] })
    await removeOverlay()
  } else if (scene === 'human-choice') {
    await showOverlay('Two alternatives ready', ['The farmer chooses which candidate to preview.'], '#facc15', 230, 'HUMAN CHOICE')
    await humanClick(
      `[...document.querySelectorAll('article')].find((card) => card.textContent?.includes('Korean I-shaped training alternative'))?.querySelector('button')`,
      'HUMAN CHOICE · PREVIEW KOREAN I-SHAPED DESIGN',
    )
    await waitForToolCount(7)
  } else if (scene === 'preview') {
    await showOverlay('Selected candidate in shared preview', [`${economy.candidateId}`, 'status: previewing-not-saved'], '#86efac', 230, 'HUMAN + AGENT WORKSPACE')
    await clickByText('3D')
    await wait(900)
    await orbit3D(Math.min(4200, segment.duration * 450))
    await zoom3D('in', 4, 900)
    await zoom3D('out', 4, 900)
  } else if (scene === 'approval') {
    const names = await toolNames()
    await showOverlay(`Human approval boundary · ${names.length} tools`, [
      '✓ apply_candidate',
      '✓ discard_preview',
      'The agent waits for the farmer.',
    ], '#facc15', 230)
  } else if (scene === 'integrity') {
    await removeOverlay()
    await humanClick(
      `[...document.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Discard')`,
      'HUMAN DECISION · DISCARD',
    )
    await waitForToolCount(5)
    const names = await toolNames()
    const context = await invoke('get_design_context')
    await clickByText('2D')
    await showOverlay('Original design restored  ✓', [
      `previewing: ${context.collaboration.previewing}`,
      `registered tools: ${names.length}`,
      'No invented price or engineering approval.',
    ], '#86efac', 230, 'VERIFIED AFTER HUMAN DECISION')
  } else if (scene === 'impact') {
    await removeOverlay()
  } else if (scene === 'closing') {
    await evaluate(`(() => {
      let card = document.getElementById('recording-closing-card');
      if (!card) { card = document.createElement('div'); card.id = 'recording-closing-card'; document.body.appendChild(card); }
      card.setAttribute('style', 'position:fixed;inset:0;z-index:600;background:linear-gradient(135deg,#10230f,#2D5A27);color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Arial,sans-serif;text-align:center');
      card.innerHTML = '<div style="font-size:18px;letter-spacing:.16em;color:#86efac;font-weight:800">OPENAI WEBMCP CHALLENGE</div><div style="font-size:64px;font-weight:900;margin:18px 0 10px">Hopyard Designer</div><div style="font-size:22px;color:#86efac;font-weight:700">BY HOPEDEN</div><div style="font-size:26px;color:#dcfce7;margin-top:20px">Plan precisely · Compare safely · Decide together</div><div style="font-size:22px;margin-top:38px;color:#bbf7d0">hopyard.luplin.com/design/demo</div>';
    })()`)
  }

  expectedEnd += segment.sceneDuration
  const remaining = recordingStarted + expectedEnd * 1000 - Date.now()
  if (remaining > 0) await wait(remaining)
}

clearInterval(frameTimer)
await call('Page.stopScreencast')
ffmpeg.stdin.end()
await new Promise((resolve, reject) => {
  ffmpeg.on('close', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))
})
socket.close()
console.log(JSON.stringify({ outputPath, duration: expectedEnd, segments: timings.length }, null, 2))
