'use client'

import Link from 'next/link'
import styled from 'styled-components'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Blueprint, Cube, CurrencyCircleDollar, Plant, SignIn, Sparkle, UserPlus } from '@phosphor-icons/react'

const Page = styled.main`
    min-height: 100vh;
    background: linear-gradient(to bottom, #f0fdf4, #ffffff);
`

const Header = styled.header`
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
`

const Logo = styled(Link)`
    display: flex;
    align-items: center;
    text-decoration: none;
`

const HeaderActions = styled.div`
    display:flex;align-items:center;justify-content:flex-end;gap:0.55rem;
    @media(max-width:640px){gap:0.35rem;}
`

const AuthLink = styled(Link)`
    color:#2D5A27;text-decoration:none;font-size:0.82rem;font-weight:700;
    display:inline-flex;align-items:center;gap:0.35rem;padding:0.45rem 0.65rem;border-radius:0.55rem;
    &:hover{background:#F0F7EF;}
    @media(max-width:480px){span{display:none;}}
`

const RegisterLink = styled(AuthLink)`
    background:#2D5A27;color:white;
    &:hover{background:#234820;}
`

const Hero = styled.section`
    max-width: 1200px;
    margin: 0 auto;
    padding: 5rem 1rem;
    text-align: center;
`

const HeroTitle = styled.h1`
    font-size: clamp(2rem, 5vw, 3.5rem);
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
    margin-bottom: 1.5rem;

    em {
        font-style: normal;
        color: #16a34a;
    }
`

const HeroDesc = styled.p`
    font-size: 1.125rem;
    color: #6b7280;
    max-width: 640px;
    margin: 0 auto 2.5rem;
    line-height: 1.7;
`

const CTAButton = styled(Link)`
    display: inline-block;
    background: #16a34a;
    color: white;
    padding: 1rem 2rem;
    border-radius: 0.75rem;
    font-size: 1.125rem;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.15s;

    &:hover { background: #15803d; }
`

const CTAGroup = styled.div`
    display:flex;align-items:center;justify-content:center;gap:0.75rem;flex-wrap:wrap;
`

const DemoButton = styled(CTAButton)`
    background:white;color:#166534;border:2px solid #86a882;
    display:inline-flex;align-items:center;gap:0.5rem;
    &:hover{background:#F0F7EF;}
`

const DemoNote = styled.p`
    margin:0.85rem auto 0;color:#64748b;font-size:0.76rem;
`

const Features = styled.section`
    max-width: 1200px;
    margin: 0 auto;
    padding: 5rem 1rem;
`

const FeatureGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
`

const FeatureCard = styled.div`
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    border: 1px solid #f3f4f6;
`

const FeatureIcon = styled.div`
    color:#2D5A27;
    margin-bottom: 1rem;
`

const FeatureTitle = styled.h3`
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.5rem;
`

const FeatureDesc = styled.p`
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.5;
`

const Footer = styled.footer`
    border-top: 1px solid #e5e7eb;
    padding: 2.5rem 1rem;
    text-align: center;
    font-size: 0.875rem;
    color: #9ca3af;
`

export default function LandingPage() {
  const { text } = useLocale()
  const features = [
    { icon: <Plant size={32} weight="fill" />, title: text('Seed cost estimate', '종자 비용 산출'), desc: text('Automatically calculate rootstock quantities and costs by variety', '품종별 종근 수량·비용 자동 계산') },
    { icon: <Blueprint size={32} weight="duotone" />, title: text('Infrastructure design', '시설 설계'), desc: text('Validate pole and wire loads against KBC standards', '폴·와이어 하중 KBC 기준 검증') },
    { icon: <Cube size={32} weight="duotone" />, title: text('2D/3D visualization', '2D/3D 시각화'), desc: text('Preview plans and perspective views in real time', '실시간 평면도·투시도 확인') },
    { icon: <CurrencyCircleDollar size={32} weight="duotone" />, title: text('Real-time estimates', '실시간 견적'), desc: text('See cost updates as soon as materials change', '자재 변경 즉시 비용 반영') },
  ]

  return (
    <Page>
      <Header>
        <Logo href="/" aria-label="Hopyard Designer home">
          <BrandLogo width={190} />
        </Logo>
        <HeaderActions>
          <LanguageSwitcher />
          <AuthLink href="/login"><SignIn size={18} weight="bold"/><span>{text('Sign in', '로그인')}</span></AuthLink>
          <RegisterLink href="/register"><UserPlus size={18} weight="bold"/><span>{text('Create account', '회원가입')}</span></RegisterLink>
        </HeaderActions>
      </Header>

      <Hero>
        <HeroTitle>
          {text('Build your hop farm,', '홉 농장의 첫 삽,')}<br />
          <em>{text('starting with precision', '정확하게 시작하세요')}</em>
        </HeroTitle>
        <HeroDesc>
          {text(
            'A smart agricultural design platform that calculates everything from seed costs to support infrastructure and materials, with real-time estimates.',
            '종자 비용부터 지주 시설 설계·자재비까지 한 번에 산출하고, 실시간 견적을 받을 수 있는 스마트 농업 설계 플랫폼'
          )}
        </HeroDesc>
        <CTAGroup>
          <CTAButton href="/design">{text('Start designing for free →', '무료로 설계 시작하기 →')}</CTAButton>
          <DemoButton href="/design/demo"><Sparkle size={20} weight="fill"/>{text('Try WebMCP Demo', 'WebMCP 데모 체험')}</DemoButton>
        </CTAGroup>
        <DemoNote>{text('The challenge demo works without signing in.', '챌린지 데모는 로그인 없이 사용할 수 있습니다.')}</DemoNote>
      </Hero>

      <Features>
        <FeatureGrid>
          {features.map((f) => (
            <FeatureCard key={f.title}>
              <FeatureIcon>{f.icon}</FeatureIcon>
              <FeatureTitle>{f.title}</FeatureTitle>
              <FeatureDesc>{f.desc}</FeatureDesc>
            </FeatureCard>
          ))}
        </FeatureGrid>
      </Features>

      <Footer>{text('HOPEDEN Agricultural Corporation', '농업회사법인 홉이든')} | hopeden.com</Footer>
    </Page>
  )
}
