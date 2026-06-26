import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import StyledComponentsRegistry from './registry'

export const metadata: Metadata = {
  title: 'HopEden Designer — 홉 시설설계 & 비용산출 플랫폼',
  description: '홉 재배 시설 설계, 자재 견적, 2D/3D 시각화를 한 번에. 농업회사법인 홉이든.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
    <body>
    <StyledComponentsRegistry>
      <Providers>
        {children} 1
      </Providers>
    </StyledComponentsRegistry>
    </body>
    </html>
  )
}
