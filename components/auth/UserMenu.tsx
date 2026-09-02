// components/auth/UserMenu.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styled from 'styled-components'
import { createClient } from '@/lib/supabase/client'
import { useLocale } from '@/components/i18n/LocaleProvider'

// ── 스타일 ──────────────────────────────────────────
const Wrapper = styled.div`
    position: relative;
`

const TriggerButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: #F0F7EF;
    border: 1px solid #D1E8CF;
    border-radius: 9999px;
    font-size: 0.875rem;
    color: #1A2E18;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: #E0F0DE; }
`

const Avatar = styled.div`
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #2D5A27;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
`

const Dropdown = styled.div`
    position: absolute;
    right: 0;
    top: calc(100% + 0.5rem);
    background: white;
    border: 1px solid #E8E4DC;
    border-radius: 0.75rem;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    min-width: 180px;
    overflow: hidden;
    z-index: 50;
`

const DropdownHeader = styled.div`
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #F3F4F6;
`

const UserName = styled.p`
    font-size: 0.875rem;
    font-weight: 600;
    color: #1A2E18;
    margin: 0;
`

const UserEmail = styled.p`
    font-size: 0.75rem;
    color: #9CA3AF;
    margin: 0.125rem 0 0;
`

const RoleBadge = styled.span`
    display: inline-block;
    font-size: 0.625rem;
    font-weight: 700;
    background: #1A2E18;
    color: #8BA888;
    padding: 0.125rem 0.375rem;
    border-radius: 9999px;
    margin-top: 0.25rem;
`

const DropdownItem = styled.button`
    width: 100%;
    padding: 0.625rem 1rem;
    text-align: left;
    font-size: 0.875rem;
    color: #374151;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.1s;

    &:hover { background: #F9FAFB; }
`

const AdminItem = styled(DropdownItem)`
  color: #2D5A27;
  font-weight: 600;
  border-top: 1px solid #F3F4F6;

  &:hover { background: #F0F7EF; }
`

const LogoutItem = styled(DropdownItem)`
  color: #EF4444;
  border-top: 1px solid #F3F4F6;

  &:hover { background: #FEF2F2; }
`

// ── 컴포넌트 ─────────────────────────────────────────
interface UserMenuProps {
  userName?: string
  userEmail?: string
}

export default function UserMenu({ userName, userEmail }: UserMenuProps) {
  const { text } = useLocale()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const role = user?.user_metadata?.role as string | undefined
      setIsAdmin(role === 'ADMIN' || role === 'SUPER')
    })
  }, []) // eslint-disable-line

  const initial = userName?.[0]?.toUpperCase() ?? userEmail?.[0]?.toUpperCase() ?? '?'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const go = (path: string) => { router.push(path); setOpen(false) }

  return (
    <Wrapper>
      <TriggerButton onClick={() => setOpen((v) => !v)}>
        <Avatar>{initial}</Avatar>
        <span>{userName ?? text('User', '사용자')}</span>
        <span>{open ? '▲' : '▼'}</span>
      </TriggerButton>

      {open && (
        <Dropdown>
          <DropdownHeader>
            <UserName>{userName ?? text('User', '사용자')}</UserName>
            <UserEmail>{userEmail}</UserEmail>
            {isAdmin && <RoleBadge>🔒 ADMIN</RoleBadge>}
          </DropdownHeader>

          <DropdownItem onClick={() => go('/projects')}>📁 {text('My projects', '내 프로젝트')}</DropdownItem>
          <DropdownItem onClick={() => go('/design')}>✏️ {text('New design', '새 설계')}</DropdownItem>

          {isAdmin && (
            <AdminItem onClick={() => go('/admin')}>⚙️ {text('Admin', '관리자 페이지')}</AdminItem>
          )}

          <LogoutItem onClick={handleLogout}>🚪 {text('Log out', '로그아웃')}</LogoutItem>
        </Dropdown>
      )}
    </Wrapper>
  )
}
