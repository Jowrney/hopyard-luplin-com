'use client'

import styled from 'styled-components'
import { useLocale } from './LocaleProvider'

const Switch = styled.div`
  display:inline-flex;align-items:center;padding:0.18rem;border:1px solid #dbe7d8;
  border-radius:999px;background:#f8faf8;white-space:nowrap;
`

const Option = styled.button<{ $active: boolean }>`
  border:0;border-radius:999px;padding:0.25rem 0.48rem;cursor:pointer;
  font-size:0.64rem;font-weight:700;
  color:${({ $active }) => $active ? '#fff' : '#64748b'};
  background:${({ $active }) => $active ? '#2D5A27' : 'transparent'};
`

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()
  return (
    <Switch role="group" aria-label="Language">
      <Option type="button" $active={locale === 'en'} onClick={() => setLocale('en')}>EN</Option>
      <Option type="button" $active={locale === 'ko'} onClick={() => setLocale('ko')}>한국어</Option>
    </Switch>
  )
}
