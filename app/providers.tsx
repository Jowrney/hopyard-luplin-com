'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { usePriceStore } from '@/stores/priceStore'

function PriceInitializer() {
  const fetchPrices = usePriceStore((s) => s.fetchPrices)
  useEffect(() => { fetchPrices() }, [fetchPrices])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <PriceInitializer />
      {children}
    </QueryClientProvider>
  )
}
