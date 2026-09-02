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
      expression: `(async () => {
        const roots = [];
        const findRoots = (root) => {
          roots.push(root);
          for (const element of root.querySelectorAll('*')) {
            if (element.shadowRoot) findRoots(element.shadowRoot);
          }
        };
        findRoots(document);
        for (const root of roots) {
          const toast = root.querySelector('[data-nextjs-toast], .nextjs-toast-errors-parent');
          if (toast) { toast.click(); break; }
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        const collect = (root, output = []) => {
          for (const element of root.querySelectorAll('*')) {
            if (element.shadowRoot) collect(element.shadowRoot, output);
            if (element.children.length === 0) {
              const text = element.textContent?.trim();
              if (text) output.push(text);
            }
          }
          return output;
        };
        return Array.from(document.querySelectorAll('nextjs-portal')).map((portal) => ({
          texts: [...new Set(collect(portal.shadowRoot))].filter((text) => text.length < 2000),
        }));
      })()`,
      awaitPromise: true,
      returnByValue: true,
    },
  }))
})
socket.close()
console.log(JSON.stringify(result.result.value, null, 2))
