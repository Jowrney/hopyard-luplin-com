import Link from 'next/link'
import styled from 'styled-components'

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
`

const Logo = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
`

const LogoEmoji = styled.span`font-size: 1.5rem;`

const LogoText = styled.span`
    font-size: 1.25rem;
    font-weight: 700;
    color: #15803d;
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
    font-size: 2rem;
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

const FEATURES = [
  { icon: '🌱', title: '종자 비용 산출', desc: '품종별 종근 수량·비용 자동 계산' },
  { icon: '🏗️', title: '시설 설계', desc: '폴·와이어 하중 KBC 기준 검증' },
  { icon: '🗺️', title: '2D/3D 시각화', desc: '실시간 평면도·투시도 확인' },
  { icon: '💰', title: '실시간 견적', desc: '자재 변경 즉시 비용 반영' },
]

export default function LandingPage() {
  return (
    <Page>
      <Header>
        <Logo>
          <LogoEmoji>🌿</LogoEmoji>
          <LogoText>HopEden Designer</LogoText>
        </Logo>
      </Header>

      <Hero>
        <HeroTitle>
          홉 농장의 첫 삽,<br />
          <em>정확하게 시작하세요</em>
        </HeroTitle>
        <HeroDesc>
          종자 비용부터 지주 시설 설계·자재비까지 한 번에 산출하고,
          실시간 견적을 받을 수 있는 스마트 농업 설계 플랫폼
        </HeroDesc>
        <CTAButton href="/design">무료로 설계 시작하기 →</CTAButton>
      </Hero>

      <Features>
        <FeatureGrid>
          {FEATURES.map((f) => (
            <FeatureCard key={f.title}>
              <FeatureIcon>{f.icon}</FeatureIcon>
              <FeatureTitle>{f.title}</FeatureTitle>
              <FeatureDesc>{f.desc}</FeatureDesc>
            </FeatureCard>
          ))}
        </FeatureGrid>
      </Features>

      <Footer>농업회사법인 홉이든 | hopeden.kr</Footer>
    </Page>
  )
}
