// app/(auth)/login/page.tsx
'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styled from 'styled-components'
import { createClient } from '@/lib/supabase/client'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { useLocale } from '@/components/i18n/LocaleProvider'

// ── 스타일 ──────────────────────────────────────────
const PageWrapper = styled.div`
    min-height: 100vh;
    background: #F5F3EE;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 1rem;
`

const Container = styled.div`
    width: 100%;
    max-width: 448px;
`

const SwitcherRow = styled.div`
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.75rem;
`

const LogoArea = styled.div`
    text-align: center;
    margin-bottom: 2rem;
`

const LogoEmoji = styled.span`
    font-size: 2.5rem;
    display: block;
    margin-bottom: 0.5rem;
`

const Title = styled.h1`
    font-size: 1.5rem;
    font-weight: 700;
    color: #1A2E18;
    margin: 0;
`

const Subtitle = styled.p`
    color: #8BA888;
    font-size: 0.875rem;
    margin: 0.25rem 0 0;
`

const Card = styled.div`
    background: white;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    border: 1px solid #E8E4DC;
    overflow: hidden;
`

const CardHeader = styled.div`
    background: #F0F7EF;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #E8E4DC;
`

const CardTitle = styled.h2`
    font-size: 1rem;
    font-weight: 700;
    color: #1A2E18;
    margin: 0;
`

const CardDesc = styled.p`
    font-size: 0.75rem;
    color: #6B7280;
    margin: 0.25rem 0 0;
`

const CardBody = styled.div`
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`

const ErrorBox = styled.div`
    background: #FEF2F2;
    border: 1px solid #FECACA;
    color: #B91C1C;
    font-size: 0.875rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
`


const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
`

const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
`

const Label = styled.label`
    font-size: 0.75rem;
    font-weight: 500;
    color: #4B5563;
`

const Input = styled.input`
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    border: 1px solid #E5E7EB;
    border-radius: 0.75rem;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;

    &:focus { border-color: #2D5A27; }
`

const SubmitButton = styled.button<{ $loading?: boolean }>`
    width: 100%;
    padding: 0.75rem;
    background: #2D5A27;
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    transition: background 0.15s;
    opacity: ${({ $loading }) => ($loading ? 0.6 : 1)};

    &:hover:not(:disabled) { background: #234820; }
    &:disabled { cursor: not-allowed; }
`

const FooterText = styled.p`
    text-align: center;
    font-size: 0.875rem;
    color: #6B7280;
    margin: 0;

    a {
        color: #2D5A27;
        font-weight: 600;
        text-decoration: none;
        &:hover { text-decoration: underline; }
    }
`

const Copyright = styled.p`
    text-align: center;
    font-size: 0.75rem;
    color: #9CA3AF;
    margin-top: 1.5rem;
`

// ── 컴포넌트 ─────────────────────────────────────────
function LoginContent() {
  const { text } = useLocale()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/design'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<'email-confirmation' | 'credentials' | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsLoading(false)

    if (authError) {
      setError(authError.message.includes('Email not confirmed') ? 'email-confirmation' : 'credentials')
    } else {
      // router.push 대신 window.location으로 강제 이동 (미들웨어 세션 갱신 보장)
      window.location.href = callbackUrl
    }
  }


  return (
    <PageWrapper>
      <Container>
        <SwitcherRow><LanguageSwitcher /></SwitcherRow>
        <LogoArea>
          <Link href="/">
            <LogoEmoji>🌿</LogoEmoji>
          </Link>
          <Title>HOPEDEN Designer</Title>
          <Subtitle>{text('Welcome to the hop farm design platform', '홉 농장 설계 플랫폼에 오신 것을 환영합니다')}</Subtitle>
        </LogoArea>

        <Card>
          <CardHeader>
            <CardTitle>{text('Sign in', '로그인')}</CardTitle>
            <CardDesc>{text('Sign in to save your designs', '계정으로 로그인하여 설계를 저장하세요')}</CardDesc>
          </CardHeader>

          <CardBody>
            {error && <ErrorBox>⚠️ {error === 'email-confirmation'
              ? text('Please verify your email. Check the message sent when you registered.', '이메일 인증이 필요합니다. 가입 시 받은 이메일을 확인해주세요.')
              : text('The email or password is incorrect.', '이메일 또는 비밀번호가 올바르지 않습니다')}</ErrorBox>}


            <Form onSubmit={handleSubmit}>
              <Field>
                <Label htmlFor="login-email">{text('Email', '이메일')}</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                />
              </Field>
              <Field>
                <Label htmlFor="login-password">{text('Password', '비밀번호')}</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </Field>
              <SubmitButton type="submit" disabled={isLoading} $loading={isLoading}>
                {isLoading ? '⌛' : '🌿'}
                {isLoading ? text('Signing in…', '로그인 중…') : text('Sign in', '로그인')}
              </SubmitButton>
            </Form>

            <FooterText>
              {text("Don't have an account?", '계정이 없으신가요?')}{' '}
              <Link href="/register">{text('Create one', '회원가입')}</Link>
            </FooterText>
          </CardBody>
        </Card>

        <Copyright>© 2026 {text('HOPEDEN Agricultural Corporation', '농업회사법인 홉이든')} · hopeden.com</Copyright>
      </Container>
    </PageWrapper>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
