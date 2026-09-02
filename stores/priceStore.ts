// stores/priceStore.ts
// 자재 가격 캐시 스토어
// 가격은 절대 하드코딩 금지 — 항상 이 스토어에서 참조

import { create } from 'zustand'
import type { PriceMap, PriceStoreState } from '@/types'

export const usePriceStore = create<PriceStoreState>()((set, get) => ({
  prices: {} as PriceMap,
  lastFetchedAt: null,
  isLoading: false,

  fetchPrices: async () => {
    // 5분 캐시
    const { lastFetchedAt } = get()
    if (
      lastFetchedAt &&
      Date.now() - lastFetchedAt.getTime() < 5 * 60 * 1000
    ) {
      return
    }

    set({ isLoading: true })

    try {
      const res = await fetch('/api/prices')
      if (!res.ok) throw new Error('Failed to load price data')

      const data = await res.json() as { prices: PriceMap }
      set({
        prices: data.prices,
        lastFetchedAt: new Date(),
        isLoading: false,
      })
    } catch (error) {
      console.error('Price loading error:', error)
      set({ isLoading: false })
    }
  },

  getPrice: (code: string) => {
    return get().prices[code] ?? 0
  },
}))
