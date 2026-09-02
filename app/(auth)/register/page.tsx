'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    padding: 2rem 1rem;
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

const SuccessBox = styled.div`
    background: #F0FDF4;
    border: 1px solid #BBF7D0;
    color: #15803D;
    font-size: 0.875rem;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
`

const GoogleButton = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    border: 1px solid #E5E7EB;
    border-radius: 0.75rem;
    padding: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    background: white;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: #F9FAFB; }
`

const Divider = styled.div`
    display: flex;
    align-items: center;
    gap: 0.75rem;

    &::before, &::after {
        content: '';
        flex: 1;
        border-top: 1px solid #E5E7EB;
    }

    span {
        font-size: 0.75rem;
        color: #9CA3AF;
        white-space: nowrap;
    }
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

const Input = styled.input<{ $error?: boolean }>`
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    border: 1px solid ${({ $error }) => ($error ? '#FCA5A5' : '#E5E7EB')};
    border-radius: 0.75rem;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;

    &:focus {
        border-color: ${({ $error }) => ($error ? '#F87171' : '#2D5A27')};
    }
`

const FieldError = styled.p`
    font-size: 0.75rem;
    color: #EF4444;
    margin: 0;
`

const StrengthBar = styled.div`
    margin-top: 0.375rem;
`

const StrengthTrack = styled.div`
    height: 4px;
    background: #F3F4F6;
    border-radius: 9999px;
    overflow: hidden;
`

const StrengthFill = styled.div<{ $width: string; $color: string }>`
    height: 100%;
    border-radius: 9999px;
    width: ${({ $width }) => $width};
    background: ${({ $color }) => $color};
    transition: all 0.3s;
`

const StrengthLabel = styled.p<{ $color: string }>`
    font-size: 0.75rem;
    color: ${({ $color }) => $color};
    margin: 0.25rem 0 0;
`

const BenefitBox = styled.div`
    background: #F0F7EF;
    border-radius: 0.75rem;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
`

const BenefitTitle = styled.p`
    font-size: 0.75rem;
    font-weight: 700;
    color: #2D5A27;
    margin: 0;
`

const BenefitItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #4B5563;

    span:first-child { color: #22C55E; }
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

// ── 비밀번호 강도 계산 ────────────────────────────────
type TextFn = (en: string, ko: string) => string
type RegisterError = 'name' | 'email' | 'password-length' | 'password-match' | 'registered' | 'provider-password' | 'signup' | 'google'

function getStrength(pw: string, text: TextFn) {
  if (!pw) return null
  if (pw.length < 8) return { label: text('Weak', '약함'), color: '#F87171', width: '25%' }
  if (pw.length < 12 && !/[!@#$%^&*]/.test(pw)) return { label: text('Fair', '보통'), color: '#FBBF24', width: '50%' }
  if (/[!@#$%^&*]/.test(pw) && /[0-9]/.test(pw)) return { label: text('Strong', '강함'), color: '#22C55E', width: '100%' }
  return { label: text('Good', '양호'), color: '#60A5FA', width: '75%' }
}

// ── 컴포넌트 ─────────────────────────────────────────
export default function RegisterPage() {
  const { text } = useLocale()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<{ type: RegisterError; detail?: string } | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = (): RegisterError | null => {
    if (form.name.length < 2) return 'name'
    if (!form.email.includes('@')) return 'email'
    if (form.password.length < 8) return 'password-length'
    if (form.password !== form.confirm) return 'password-match'
    return null
  }

  const errorMessage = (value: { type: RegisterError; detail?: string }) => ({
    name: text('Your name must be at least 2 characters.', '이름은 2자 이상이어야 합니다'),
    email: text('Enter a valid email address.', '올바른 이메일 형식이 아닙니다'),
    'password-length': text('Your password must be at least 8 characters.', '비밀번호는 8자 이상이어야 합니다'),
    'password-match': text('The passwords do not match.', '비밀번호가 일치하지 않습니다'),
    registered: text('This email is already in use.', '이미 사용 중인 이메일입니다'),
    'provider-password': text('The password does not meet the provider requirements.', '비밀번호가 인증 서비스 요구 사항을 충족하지 않습니다'),
    signup: `${text('Sign-up error:', '회원가입 오류:')} ${value.detail ?? ''}`,
    google: `${text('Google sign-in error:', '구글 로그인 중 오류가 발생했습니다:')} ${value.detail ?? ''}`,
  })[value.type]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validErr = validate()
    if (validErr) { setError({ type: validErr }); return }

    setIsLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name, role: 'FARMER' },
      },
    })

    setIsLoading(false)

    if (authError) {
      setError(
        authError.message === 'User already registered'
          ? { type: 'registered' }
          : authError.message.includes('Password')
            ? { type: 'provider-password' }
            : { type: 'signup', detail: authError.message }
      )
    } else {
      // 이메일 인증 여부에 따라 분기
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // 이메일 인증 불필요 — 바로 로그인됨
        router.refresh()
        setTimeout(() => router.push('/design'), 100)
      } else {
        // 이메일 인증 필요
        setSuccess(true)
        setTimeout(() => router.push('/login'), 3000)
      }
    }
  }

  const handleGoogle = async () => {
    setIsLoading(true)
    setError(null)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/design`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (oauthError) {
      setError({ type: 'google', detail: oauthError.message })
      setIsLoading(false)
    }
  }

  const strength = getStrength(form.password, text)
  const pwMismatch = !!form.confirm && form.password !== form.confirm

  return (
    <PageWrapper>
      <Container>
        <SwitcherRow><LanguageSwitcher /></SwitcherRow>
        <LogoArea>
          <Link href="/">
            <LogoEmoji>🌿</LogoEmoji>
          </Link>
          <Title>HopEden Designer</Title>
          <Subtitle>{text('Start designing your hop farm for free', '홉 농장 설계를 무료로 시작하세요')}</Subtitle>
        </LogoArea>

        <Card>
          <CardHeader>
            <CardTitle>{text('Create an account', '회원가입')}</CardTitle>
            <CardDesc>{text('Create a free account and save your designs', '무료 계정을 만들고 설계를 저장하세요')}</CardDesc>
          </CardHeader>

          <CardBody>
            {error && <ErrorBox>⚠️ {errorMessage(error)}</ErrorBox>}
            {success && <SuccessBox>✅ {text('Your account is ready! Check your inbox to verify your email.', '가입이 완료되었습니다! 이메일함을 확인하여 인증을 완료해주세요.')}</SuccessBox>}

            <GoogleButton onClick={handleGoogle} type="button">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {text('Sign up with Google', 'Google 계정으로 가입')}
            </GoogleButton>

            <Divider><span>{text('or sign up with email', '또는 이메일로 가입')}</span></Divider>

            <Form onSubmit={handleSubmit}>
              <Field>
                <Label>{text('Name', '이름')}</Label>
                <Input type="text" value={form.name} onChange={update('name')} placeholder={text('Your name', '홍길동')} required />
              </Field>

              <Field>
                <Label>{text('Email', '이메일')}</Label>
                <Input type="email" value={form.email} onChange={update('email')} placeholder="example@email.com" required />
              </Field>

              <Field>
                <Label>{text('Password', '비밀번호')}</Label>
                <Input type="password" value={form.password} onChange={update('password')} placeholder={text('At least 8 characters', '8자 이상')} required />
                {strength && (
                  <StrengthBar>
                    <StrengthTrack>
                      <StrengthFill $width={strength.width} $color={strength.color} />
                    </StrengthTrack>
                    <StrengthLabel $color={strength.color}>{text('Password strength:', '비밀번호 강도:')} {strength.label}</StrengthLabel>
                  </StrengthBar>
                )}
              </Field>

              <Field>
                <Label>{text('Confirm password', '비밀번호 확인')}</Label>
                <Input
                  type="password"
                  value={form.confirm}
                  onChange={update('confirm')}
                  placeholder="••••••••"
                  $error={pwMismatch}
                  required
                />
                {pwMismatch && <FieldError>{text('The passwords do not match.', '비밀번호가 일치하지 않습니다')}</FieldError>}
              </Field>

              <BenefitBox>
                <BenefitTitle>✓ {text('Free account benefits', '무료 가입 혜택')}</BenefitTitle>
                {[
                  text('Save unlimited designs', '설계안 무제한 저장'),
                  text('Use the 3D/2D viewer', '3D/2D 뷰어 사용'),
                  text('Export estimate PDFs', '견적서 PDF 출력'),
                  text('Get real-time material prices', '자재 가격 실시간 반영'),
                ].map((b) => (
                  <BenefitItem key={b}>
                    <span>✓</span>
                    <span>{b}</span>
                  </BenefitItem>
                ))}
              </BenefitBox>

              <SubmitButton type="submit" disabled={isLoading || pwMismatch} $loading={isLoading}>
                {isLoading ? '⌛' : '🌿'}
                {isLoading ? text('Creating account…', '가입 중…') : text('Create free account', '무료 회원가입')}
              </SubmitButton>
            </Form>

            <FooterText>
              {text('Already have an account?', '이미 계정이 있으신가요?')}{' '}
              <Link href="/login">{text('Sign in', '로그인')}</Link>
            </FooterText>
          </CardBody>
        </Card>

        <Copyright>© 2026 {text('HopEden Agricultural Corporation', '농업회사법인 홉이든')} · hopeden.kr</Copyright>
      </Container>
    </PageWrapper>
  )
}
