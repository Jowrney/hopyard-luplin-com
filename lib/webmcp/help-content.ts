export const CORE_WEBMCP_TOOLS = [
  'get_design_context',
  'list_regional_profiles',
  'simulate_design',
  'show_candidates',
  'preview_candidate',
] as const

export const PREVIEW_WEBMCP_TOOLS = [
  'apply_candidate',
  'discard_preview',
] as const

export const WEBMCP_TEST_PROMPTS = {
  en: `Use this page's WebMCP tools. First read the current design context. Then create two design alternatives: (1) an I-training alternative using the current Korean profile, and (2) a North America 18 ft reference alternative. Show both candidates in the comparison tray, preview the more suitable one in the shared 2D/3D canvas, summarize the differences in pole count, wire length, plant count, estimate, and safety or review status, then wait for my approval. Do not apply a candidate until I explicitly approve it.`,
  ko: `이 페이지의 WebMCP 도구를 사용해 주세요. 먼저 현재 설계 컨텍스트를 읽으세요. 그다음 두 개의 설계 대안을 만드세요. (1) 현재 한국 프로파일을 사용하는 I자형 유인 대안, (2) 북미 18 ft 참고 프로파일 대안. 두 후보를 비교 트레이에 표시하고, 더 적합한 후보를 공유 2D/3D 캔버스에서 미리보기 하세요. 폴 수, 와이어 길이, 식재 수, 예상 비용, 안전 또는 검토 상태의 차이를 요약한 뒤 제 승인을 기다리세요. 제가 명시적으로 승인하기 전에는 후보를 적용하지 마세요.`,
} as const

export const WEBMCP_PLATFORM_GUIDANCE = {
  en: `Ordinary ChatGPT web and Claude web chats do not directly connect to WebMCP tools in another browser tab. OpenAI Site tools are officially supported in the ChatGPT Desktop built-in browser. ChatGPT's cloud browser may automate public websites, but that is separate from WebMCP Site tools. Anthropic does not currently document WebMCP support for Claude web; Claude can only use this page through general browser automation unless a supported WebMCP browser surface is announced.`,
  ko: `일반 ChatGPT 웹 채팅과 Claude 웹 채팅은 다른 브라우저 탭의 WebMCP 도구에 직접 연결되지 않습니다. OpenAI Site tools는 공식적으로 ChatGPT Desktop 내장 브라우저에서 지원됩니다. ChatGPT의 Cloud Browser는 공개 웹사이트를 자동 조작할 수 있지만 WebMCP Site tools와는 별개입니다. Anthropic은 현재 Claude 웹의 WebMCP 지원을 공식 안내하지 않고 있으므로, 지원되는 WebMCP 브라우저가 별도로 제공되기 전에는 일반 브라우저 자동화 방식으로만 이 페이지를 사용할 수 있습니다.`,
} as const

export const WEBMCP_TOOL_HELP = {
  get_design_context: {
    en: 'Read the active design, calculated quantities, pricing, safety, and preview state.',
    ko: '현재 설계, 계산 수량, 가격, 안전 상태와 미리보기 상태를 읽습니다.',
  },
  list_regional_profiles: {
    en: 'List the Korean and North American reference systems and sourced materials.',
    ko: '한국 및 북미 참고 시스템과 출처가 있는 자재를 조회합니다.',
  },
  simulate_design: {
    en: 'Calculate a non-destructive alternative and return a candidate ID.',
    ko: '현재 설계를 바꾸지 않고 대안을 계산해 후보 ID를 반환합니다.',
  },
  show_candidates: {
    en: 'Show one to three alternatives in the comparison tray.',
    ko: '1~3개의 설계 대안을 비교 트레이에 표시합니다.',
  },
  preview_candidate: {
    en: 'Temporarily preview a candidate in the shared 2D/3D UI.',
    ko: '후보를 공유 2D/3D 화면에 임시 미리보기 합니다.',
  },
  apply_candidate: {
    en: 'Keep the preview as the active design after explicit human approval.',
    ko: '사용자의 명시적 승인 후 미리보기를 현재 설계에 적용합니다.',
  },
  discard_preview: {
    en: 'Discard the preview and restore the exact previous design.',
    ko: '미리보기를 폐기하고 이전 설계를 정확히 복원합니다.',
  },
} as const
