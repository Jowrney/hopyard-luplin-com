import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import StyledComponentsRegistry from './registry'

export const metadata: Metadata = {
  title: 'HopEden Designer — Hopyard planning and cost estimation',
  description: 'Plan hop trellis systems, compare materials and estimates, and review the farm in 2D and 3D.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
    <body>
    <StyledComponentsRegistry>
      <Providers>
        {children}
      </Providers>
    </StyledComponentsRegistry>
    </body>
    </html>
  )
}
