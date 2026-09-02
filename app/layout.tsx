import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import StyledComponentsRegistry from './registry'
import { WEBMCP_ORIGIN_TRIAL_TOKEN } from '@/lib/webmcp/origin-trial'

export const metadata: Metadata = {
  title: 'HopEden Designer — Hopyard planning and cost estimation',
  description: 'Plan hop trellis systems, compare materials and estimates, and review the farm in 2D and 3D.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
    <head>
      <meta httpEquiv="origin-trial" content={WEBMCP_ORIGIN_TRIAL_TOKEN} />
    </head>
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
