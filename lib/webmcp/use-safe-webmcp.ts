'use client'

import { useEffect, useRef, useState } from 'react'

interface ToolAnnotations {
  readOnlyHint?: boolean
  untrustedContentHint?: boolean
}

interface SafeWebMCPOptions<Args, Result> {
  name: string
  description: string
  inputSchema?: object
  annotations?: ToolAnnotations
  execute: (args: Args) => Result | Promise<Result>
  enabled?: boolean
  onError?: (error: unknown) => void
}

interface SafeWebMCPState {
  supported: boolean
  registered: boolean
  error: Error | null
}

interface ModelContextLike {
  registerTool(
    tool: {
      name: string
      description: string
      inputSchema?: object
      annotations?: ToolAnnotations
      execute: (args: unknown) => Promise<unknown>
    },
    options?: { signal?: AbortSignal },
  ): Promise<void> | void
}

type DocumentWithModelContext = Document & { modelContext?: ModelContextLike }

export function isExpectedAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError'
}

function safelySerialize(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function toToolResponse(value: unknown) {
  if (value && typeof value === 'object' && 'content' in value) return value
  if (value === undefined || value === null) return { content: [] }
  return { content: [{ type: 'text', text: safelySerialize(value) }] }
}

function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : safelySerialize(error)
  return { content: [{ type: 'text', text: message }], isError: true }
}

export function useSafeWebMCP<Args = Record<string, unknown>, Result = unknown>(
  options: SafeWebMCPOptions<Args, Result>,
): SafeWebMCPState {
  const {
    name,
    description,
    inputSchema,
    annotations,
    execute,
    enabled = true,
    onError,
  } = options
  const executeRef = useRef(execute)
  const onErrorRef = useRef(onError)
  executeRef.current = execute
  onErrorRef.current = onError
  const [detectTick, setDetectTick] = useState(0)
  const [state, setState] = useState<SafeWebMCPState>({
    supported: false,
    registered: false,
    error: null,
  })
  const schemaKey = safelySerialize(inputSchema)
  const annotationsKey = safelySerialize(annotations)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const modelContext = (document as DocumentWithModelContext).modelContext
    if (!modelContext) {
      setState({ supported: false, registered: false, error: null })
      let attempts = 0
      const timer = window.setInterval(() => {
        if ((document as DocumentWithModelContext).modelContext) {
          window.clearInterval(timer)
          setDetectTick((value) => value + 1)
        } else if (++attempts >= 20) {
          window.clearInterval(timer)
        }
      }, 500)
      return () => window.clearInterval(timer)
    }

    if (!enabled) {
      setState({ supported: true, registered: false, error: null })
      return
    }

    const controller = new AbortController()
    let active = true
    try {
      const registration = modelContext.registerTool({
        name,
        description,
        inputSchema,
        annotations,
        async execute(rawArgs) {
          try {
            return toToolResponse(await executeRef.current(rawArgs as Args))
          } catch (error) {
            onErrorRef.current?.(error)
            return toErrorResponse(error)
          }
        },
      }, { signal: controller.signal })

      Promise.resolve(registration)
        .then(() => {
          if (active) setState({ supported: true, registered: true, error: null })
        })
        .catch((error: unknown) => {
          if (!active || isExpectedAbortError(error)) return
          const normalized = error instanceof Error ? error : new Error(safelySerialize(error))
          setState({ supported: true, registered: false, error: normalized })
        })
    } catch (error) {
      if (!isExpectedAbortError(error)) {
        const normalized = error instanceof Error ? error : new Error(safelySerialize(error))
        setState({ supported: true, registered: false, error: normalized })
      }
    }

    return () => {
      active = false
      controller.abort()
    }
    // Schema and annotation content keys intentionally replace object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description, schemaKey, annotationsKey, enabled, detectTick])

  return state
}
