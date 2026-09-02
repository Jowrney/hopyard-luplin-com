'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_LOCALE,
  formatCurrency,
  formatDate,
  formatNumber,
  LOCALE_STORAGE_KEY,
  localize,
  normalizeLocale,
  type Locale,
} from '@/lib/i18n'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  text: (en: string, ko: string) => string
  number: (value: number) => string
  currency: (value: number, currency: string) => string
  date: (value: Date) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    setLocaleState(normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY)))
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((nextLocale: Locale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale)
    setLocaleState(nextLocale)
  }, [])

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    text: (en, ko) => localize(locale, en, ko),
    number: (value) => formatNumber(value, locale),
    currency: (value, currencyCode) => formatCurrency(value, currencyCode, locale),
    date: (value) => formatDate(value, locale),
  }), [locale, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used inside LocaleProvider')
  return context
}
