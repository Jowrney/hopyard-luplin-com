'use client'

import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { useLocale } from '@/components/i18n/LocaleProvider'
import {
  CORE_WEBMCP_TOOLS,
  PREVIEW_WEBMCP_TOOLS,
  WEBMCP_PLATFORM_GUIDANCE,
  WEBMCP_TEST_PROMPTS,
  WEBMCP_TOOL_HELP,
} from '@/lib/webmcp/help-content'

const Overlay = styled.div`
  position:fixed;inset:0;z-index:300;background:rgba(15,23,42,0.48);
  backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;
  padding:1rem;
  @media(max-width:640px){padding:0.4rem;align-items:flex-end;}
`
const Dialog = styled.section`
  width:min(720px,calc(100vw - 2rem));max-height:min(840px,calc(100dvh - 2rem));
  overflow:hidden;background:white;border-radius:1rem;border:1px solid #dbe7d8;
  box-shadow:0 28px 80px rgba(15,23,42,0.3);display:flex;flex-direction:column;
  @media(max-width:640px){width:100%;max-height:94dvh;border-radius:0.9rem 0.9rem 0 0;}
`
const Header = styled.header`
  padding:1rem 1.15rem;background:#1A2E18;color:white;display:flex;
  align-items:flex-start;justify-content:space-between;gap:1rem;
  @media(max-width:640px){padding:0.8rem 0.9rem;}
`
const Eyebrow = styled.div`font-size:0.65rem;color:#86efac;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;`
const Title = styled.h2`font-size:1.05rem;margin:0.2rem 0 0;font-weight:800;`
const HeaderStatus = styled.div<{ $active:boolean }>`
  margin-top:0.35rem;font-size:0.7rem;color:${({$active})=>$active?'#bbf7d0':'#fde68a'};
`
const CloseButton = styled.button`
  width:2rem;height:2rem;border:1px solid rgba(255,255,255,0.2);border-radius:0.5rem;
  background:rgba(255,255,255,0.08);color:white;cursor:pointer;font-size:1rem;
`
const Body = styled.div`
  padding:1rem 1.15rem 1.2rem;overflow-y:auto;overscroll-behavior:contain;
  @media(max-width:640px){padding:0.8rem 0.85rem 1rem;}
`
const Intro = styled.p`margin:0 0 0.9rem;color:#475569;font-size:0.78rem;line-height:1.55;`
const Section = styled.section`margin-top:1rem;`
const SectionTitle = styled.h3`font-size:0.82rem;margin:0 0 0.55rem;color:#1A2E18;`
const Steps = styled.ol`
  margin:0;padding-left:1.2rem;color:#475569;font-size:0.75rem;line-height:1.55;
  li+li{margin-top:0.3rem;}
`
const PromptBox = styled.div`
  margin-top:0.6rem;border:1px solid #bbd5b7;background:#f0f7ef;border-radius:0.75rem;
  padding:0.75rem;position:relative;
  @media(max-width:640px){display:flex;flex-direction:column;gap:0.55rem;padding:0.65rem;}
`
const Prompt = styled.pre`
  margin:0;padding-right:5.2rem;white-space:pre-wrap;font:inherit;font-size:0.7rem;
  line-height:1.5;color:#264323;
  overflow-wrap:anywhere;
  @media(max-width:640px){padding-right:0;font-size:0.68rem;}
`
const CopyButton = styled.button`
  position:absolute;right:0.55rem;top:0.55rem;border:1px solid #86a882;background:white;
  color:#2D5A27;border-radius:0.45rem;padding:0.3rem 0.5rem;font-size:0.65rem;
  font-weight:800;cursor:pointer;
  @media(max-width:640px){position:static;align-self:flex-end;}
`
const ToolGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:0.45rem;@media(max-width:640px){grid-template-columns:1fr;}`
const ToolCard = styled.div`
  border:1px solid #e2e8f0;border-radius:0.6rem;padding:0.55rem 0.65rem;background:#fafcf9;
`
const ToolName = styled.code`display:block;font-size:0.66rem;font-weight:800;color:#2D5A27;margin-bottom:0.18rem;`
const ToolDescription = styled.p`font-size:0.66rem;line-height:1.4;color:#64748b;margin:0;`
const DynamicNote = styled.div`
  margin-top:0.55rem;border-left:3px solid #16a34a;background:#f0fdf4;padding:0.55rem 0.65rem;
  color:#3f5f3c;font-size:0.68rem;line-height:1.45;
`
const Code = styled.code`font-size:0.68rem;background:#f1f5f9;padding:0.1rem 0.25rem;border-radius:0.25rem;`
const Footer = styled.footer`
  margin-top:1rem;padding-top:0.75rem;border-top:1px solid #e5e7eb;color:#64748b;
  font-size:0.66rem;line-height:1.45;
`

interface WebMCPHelpDialogProps {
  open: boolean
  onClose: () => void
  supported: boolean
  registered: number
}

export function WebMCPHelpDialog({ open, onClose, supported, registered }: WebMCPHelpDialogProps) {
  const { locale } = useLocale()
  const [copied, setCopied] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    setCopied(false)
    window.requestAnimationFrame(() => closeButtonRef.current?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [onClose, open])

  if (!open) return null
  const ko = locale === 'ko'
  const prompt = WEBMCP_TEST_PROMPTS[locale]
  const allTools = [...CORE_WEBMCP_TOOLS, ...PREVIEW_WEBMCP_TOOLS]

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Overlay onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <Dialog ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="webmcp-help-title">
        <Header>
          <div>
            <Eyebrow>WebMCP Challenge</Eyebrow>
            <Title id="webmcp-help-title">{ko ? 'WebMCP 테스트 방법' : 'How to test WebMCP'}</Title>
            <HeaderStatus $active={supported}>
              {supported
                ? (ko ? `활성 · ${registered}개 도구 등록됨` : `Active · ${registered} tools registered`)
                : (ko ? '현재 브라우저에서 WebMCP API를 사용할 수 없습니다.' : 'The WebMCP API is unavailable in this browser.')}
            </HeaderStatus>
          </div>
          <CloseButton ref={closeButtonRef} type="button" onClick={onClose} aria-label={ko?'닫기':'Close'}>×</CloseButton>
        </Header>

        <Body>
          <Intro>
            {ko
              ? 'WebMCP는 에이전트가 화면을 추측해서 클릭하는 대신, 이 설계 앱이 제공하는 구조화 도구를 직접 호출하게 합니다. 후보 설계는 현재 작업을 파괴하지 않으며, 사용자가 미리보기 후 적용하거나 폐기합니다.'
              : 'WebMCP lets an agent call structured tools provided by this design app instead of guessing how to click the UI. Alternatives are non-destructive: a human previews them and then applies or discards them.'}
          </Intro>

          <Section>
            <SectionTitle>{ko?'웹 ChatGPT·Claude에서 사용할 수 있나요?':'Can I use this from ChatGPT or Claude on the web?'}</SectionTitle>
            <Intro>{WEBMCP_PLATFORM_GUIDANCE[locale]}</Intro>
          </Section>

          <Section>
            <SectionTitle>{ko?'가장 빠른 테스트 — ChatGPT Desktop':'Fastest test — ChatGPT Desktop'}</SectionTitle>
            <Steps>
              <li>{ko?'ChatGPT Desktop의 브라우저에서 이 Demo URL을 엽니다.':'Open this Demo URL in the ChatGPT Desktop browser.'}</li>
              <li>{ko?'아래 테스트 문장을 ChatGPT에 붙여넣습니다.':'Paste the test prompt below into ChatGPT.'}</li>
              <li>{ko?'후보 카드와 2D/3D 미리보기가 바뀌는지 확인합니다.':'Confirm that candidate cards appear and the shared 2D/3D preview changes.'}</li>
              <li>{ko?'에이전트가 자동 적용하지 않고 승인 또는 폐기를 기다리는지 확인합니다.':'Confirm the agent waits for Apply or Discard instead of committing automatically.'}</li>
            </Steps>
            <PromptBox>
              <Prompt>{prompt}</Prompt>
              <CopyButton type="button" onClick={copyPrompt}>{copied?(ko?'복사됨':'Copied'):(ko?'문장 복사':'Copy prompt')}</CopyButton>
            </PromptBox>
          </Section>

          <Section>
            <SectionTitle>{ko?'Chrome에서 직접 검사':'Inspect directly in Chrome'}</SectionTitle>
            <Steps>
              <li>{ko?'Chrome 149~156에서 이 운영 URL을 엽니다. 운영 사이트는 WebMCP Origin Trial이 적용되어 있습니다.':'Open this production URL in Chrome 149–156. The production site is enrolled in the WebMCP Origin Trial.'}</li>
              <li>{ko?'개발자 도구 → Application → WebMCP 패널을 엽니다.':'Open DevTools → Application → WebMCP.'}</li>
              <li>{ko?`기본 도구 ${CORE_WEBMCP_TOOLS.length}개가 표시되는지 확인합니다.`:`Confirm that ${CORE_WEBMCP_TOOLS.length} core tools are listed.`}</li>
              <li>{ko?'먼저 get_design_context를 실행하고, simulate_design에 아래 예시를 입력합니다.':'Run get_design_context, then call simulate_design with the example below.'}</li>
            </Steps>
            <PromptBox><Prompt>{'{ "label": "I-training test", "trainingType": "I" }'}</Prompt></PromptBox>
          </Section>

          <Section>
            <SectionTitle>{ko?'등록 도구':'Registered tools'}</SectionTitle>
            <ToolGrid>
              {allTools.map((tool)=>(
                <ToolCard key={tool}>
                  <ToolName>{tool}</ToolName>
                  <ToolDescription>{WEBMCP_TOOL_HELP[tool][locale]}</ToolDescription>
                </ToolCard>
              ))}
            </ToolGrid>
            <DynamicNote>
              {ko
                ? `기본 상태에서는 ${CORE_WEBMCP_TOOLS.length}개 도구가 등록됩니다. 후보를 미리보기 하면 apply_candidate와 discard_preview가 동적으로 추가되어 총 ${CORE_WEBMCP_TOOLS.length+PREVIEW_WEBMCP_TOOLS.length}개가 됩니다.`
                : `${CORE_WEBMCP_TOOLS.length} tools are registered initially. While a candidate is being previewed, apply_candidate and discard_preview are added dynamically for a total of ${CORE_WEBMCP_TOOLS.length+PREVIEW_WEBMCP_TOOLS.length}.`}
            </DynamicNote>
          </Section>

          <Footer>
            {ko
              ? <>로컬 <Code>localhost</Code>에서는 <Code>chrome://flags/#enable-webmcp-testing</Code>을 활성화하고 Chrome을 재시작해야 합니다. 운영 origin의 Origin Trial은 2026-11-17까지 유효합니다.</>
              : <>For <Code>localhost</Code>, enable <Code>chrome://flags/#enable-webmcp-testing</Code> and relaunch Chrome. The production Origin Trial is valid through November 17, 2026.</>}
          </Footer>
        </Body>
      </Dialog>
    </Overlay>
  )
}
