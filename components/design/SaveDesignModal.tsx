'use client'

import { useState, useEffect } from 'react'
import styled, { keyframes, css } from 'styled-components'
import { useDesignStore } from '@/stores/designStore'
import { useLocale } from '@/components/i18n/LocaleProvider'
import { getRegionalProfile } from '@/lib/design/regional-profiles'

interface Project {
  id: string
  name: string
  location?: string
  designs: { id: string; name: string; updatedAt: string }[]
}

const fadeIn  = keyframes`from{opacity:0}to{opacity:1}`
const slideUp = keyframes`from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}`

const Overlay = styled.div`
  position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);padding:1rem;
  animation:${css`${fadeIn}`} 0.15s ease;
`
const ModalBox   = styled.div`background:white;border-radius:1.25rem;box-shadow:0 20px 60px rgba(0,0,0,0.2);width:480px;max-width:95vw;overflow:hidden;animation:${css`${slideUp}`} 0.2s ease;`
const Header     = styled.div`background:#1A2E18;padding:1.25rem 1.5rem;display:flex;align-items:center;justify-content:space-between;`
const HeaderText = styled.div``
const HeaderTitle= styled.h2`color:white;font-size:1.125rem;font-weight:700;margin:0;`
const HeaderSub  = styled.p`color:#8BA888;font-size:0.8rem;margin:0.25rem 0 0;`
const CloseBtn   = styled.button`color:#8BA888;background:none;border:none;font-size:1.25rem;width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:0.5rem;&:hover{color:white;}`
const Body       = styled.div`padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem;`
const ErrorBox   = styled.div`background:#fef2f2;border:1px solid #fecaca;color:#dc2626;font-size:0.8rem;padding:0.75rem 1rem;border-radius:0.75rem;`
const DoneBox    = styled.div`text-align:center;padding:2rem 0;`
const DoneIcon   = styled.div`font-size:3rem;margin-bottom:0.75rem;`
const DoneTitle  = styled.p`font-size:1.125rem;font-weight:700;color:#2D5A27;margin:0;`
const DoneSub    = styled.p`font-size:0.8rem;color:#6b7280;margin:0.25rem 0 0;`
const FieldLabel = styled.label`font-size:0.8rem;font-weight:600;color:#374151;display:block;margin-bottom:0.5rem;`
const LabelRow   = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;`
const ToggleBtn  = styled.button`font-size:0.75rem;color:#2D5A27;font-weight:600;background:none;border:none;cursor:pointer;&:hover{text-decoration:underline;}`
const NewProjBox = styled.div`background:#F0F7EF;border-radius:0.875rem;padding:1rem;display:flex;flex-direction:column;gap:0.5rem;`
const TextInput  = styled.input`width:100%;padding:0.625rem 0.875rem;border:1.5px solid #e5e7eb;border-radius:0.625rem;font-size:0.875rem;color:#111827;outline:none;box-sizing:border-box;&:focus{border-color:#2D5A27;}`
const CreateBtn  = styled.button`width:100%;padding:0.625rem;background:#2D5A27;color:white;border:none;border-radius:0.625rem;font-size:0.875rem;font-weight:600;cursor:pointer;&:hover{background:#234820;}&:disabled{opacity:0.5;cursor:not-allowed;}`
const Skeleton   = styled.div`height:6rem;background:#f3f4f6;border-radius:0.875rem;`
const EmptyProj  = styled.div`text-align:center;padding:1.5rem;color:#9ca3af;font-size:0.8rem;background:#f9fafb;border-radius:0.875rem;`
const ProjectList= styled.div`display:flex;flex-direction:column;gap:0.5rem;max-height:11rem;overflow-y:auto;`
const ProjectItem= styled.button<{$selected:boolean}>`width:100%;text-align:left;padding:0.75rem 1rem;border-radius:0.875rem;cursor:pointer;border:2px solid ${({$selected})=>$selected?'#2D5A27':'#e5e7eb'};background:${({$selected})=>$selected?'#F0F7EF':'white'};transition:all 0.12s;&:hover{border-color:#2D5A27;}`
const ProjRow    = styled.div`display:flex;align-items:center;justify-content:space-between;`
const ProjName   = styled.p`font-size:0.875rem;font-weight:600;color:#1A2E18;margin:0;`
const ProjLoc    = styled.p`font-size:0.72rem;color:#9ca3af;margin:0.15rem 0 0;`
const ProjCount  = styled.span`font-size:0.72rem;color:#9ca3af;`
const ProjCheck  = styled.div`color:#2D5A27;font-size:0.875rem;margin-top:0.15rem;`
const SummaryGrid= styled.div`background:#F0F7EF;border-radius:0.875rem;padding:0.75rem 1rem;display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;text-align:center;`
const SumLabel   = styled.p`font-size:0.7rem;color:#6b7280;margin:0;`
const SumValue   = styled.p<{$green?:boolean}>`font-size:0.875rem;font-weight:700;margin:0.2rem 0 0;color:${({$green})=>$green?'#2D5A27':'#1A2E18'};`
const OverwriteToggle = styled.div`display:flex;gap:0.5rem;`
const OverwriteBtn = styled.button<{$active:boolean}>`
  flex:1;padding:0.625rem 0.5rem;border-radius:0.75rem;cursor:pointer;text-align:center;
  border:2px solid ${({$active})=>$active?'#2D5A27':'#e5e7eb'};
  background:${({$active})=>$active?'#F0F7EF':'white'};
  font-size:0.8rem;font-weight:${({$active})=>$active?'700':'500'};
  color:${({$active})=>$active?'#1A2E18':'#6b7280'};
  display:flex;flex-direction:column;align-items:center;gap:0.15rem;
  transition:all 0.12s;
`
const OverwriteSub = styled.span`font-size:0.7rem;color:#2D5A27;font-weight:400;`

const SaveButton = styled.button`width:100%;padding:0.875rem;background:#2D5A27;color:white;border:none;border-radius:0.875rem;font-size:0.9rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.5rem;&:hover{background:#234820;}&:disabled{opacity:0.5;cursor:not-allowed;}`

export function SaveDesignModal({ onClose }: { onClose: () => void }) {
  const { locale, text, number, currency } = useLocale()
  const { profileId, inputs, quantities, loads, estimate, currentDesignId, currentDesignName } = useDesignStore()
  const activeProfile = getRegionalProfile(profileId)

  const [projects, setProjects]            = useState<Project[]>([])
  const [isLoadingProjects, setIsLoading]  = useState(true)
  const [selectedProjectId, setSelectedPId]= useState('')
  const [designName, setDesignName]        = useState(() => text('New design', '새 설계안'))
  const [isCreatingProject, setIsCreating] = useState(false)
  const [newProjectName, setNewProjName]   = useState('')
  const [newProjectLocation, setNewProjLoc]= useState('')
  const [isSaving, setIsSaving]            = useState(false)
  const [done, setDone]                    = useState(false)
  const [error, setError]                  = useState('')
  // 덮어쓰기 모드: 불러온 설계안이 있으면 기본값 true
  const [isOverwrite, setIsOverwrite]      = useState(!!currentDesignId)

  useEffect(() => {
    setDesignName(current => current === 'New design' || current === '새 설계안'
      ? text('New design', '새 설계안')
      : current)
  }, [locale, text])

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProjects(data.data)
          if (data.data.length > 0) setSelectedPId(data.data[0].id)
          else setIsCreating(true)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    const res  = await fetch('/api/projects', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName, location: newProjectLocation }),
    })
    const data = await res.json()
    if (data.success) {
      setProjects(prev => [{ ...data.data, designs: [] }, ...prev])
      setSelectedPId(data.data.id)
      setIsCreating(false); setNewProjName(''); setNewProjLoc('')
    }
  }

  const handleSave = async () => {
    setIsSaving(true); setError('')
    try {
      let res: Response
      if (isOverwrite && currentDesignId) {
        // 덮어쓰기 — PUT
        res = await fetch(`/api/designs/${currentDesignId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs, quantities: quantities ?? null, loads: loads ?? null, estimate: estimate ?? null }),
        })
      } else {
        // 새로 저장 — POST
        if (!selectedProjectId || !designName.trim()) { setError(text('Enter a project and design name.', '프로젝트와 설계명을 입력해주세요')); setIsSaving(false); return }
        res = await fetch('/api/designs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: selectedProjectId, name: designName, inputs, quantities: quantities ?? null, loads: loads ?? null, estimate: estimate ?? null }),
        })
      }
      const data = await res.json()
      if (data.success) { setDone(true); setTimeout(onClose, 1500) }
      else setError(data.error ?? text('Save failed.', '저장 실패'))
    } catch { setError(text('Network error.', '네트워크 오류')) }
    finally { setIsSaving(false) }
  }

  return (
    <Overlay onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <ModalBox>
        <Header>
          <HeaderText>
            <HeaderTitle>💾 {text('Save design', '설계 저장')}</HeaderTitle>
            <HeaderSub>{text('Choose a project and save this design.', '프로젝트를 선택하고 설계안을 저장하세요')}</HeaderSub>
          </HeaderText>
          <CloseBtn onClick={onClose} aria-label={text('Close', '닫기')}>✕</CloseBtn>
        </Header>
        <Body>
          {error && <ErrorBox>⚠️ {error}</ErrorBox>}

          {/* 덮어쓰기 / 새로 저장 선택 */}
          {currentDesignId && (
            <OverwriteToggle>
              <OverwriteBtn $active={isOverwrite} onClick={() => setIsOverwrite(true)}>
                ♻️ {text('Overwrite', '덮어쓰기')}
                {isOverwrite && <OverwriteSub>{currentDesignName ?? text('Current design', '현재 설계안')}</OverwriteSub>}
              </OverwriteBtn>
              <OverwriteBtn $active={!isOverwrite} onClick={() => setIsOverwrite(false)}>
                ➕ {text('Save as new', '새로 저장')}
              </OverwriteBtn>
            </OverwriteToggle>
          )}

          {done ? (
            <DoneBox>
              <DoneIcon>✅</DoneIcon>
              <DoneTitle>{text('Saved!', '저장 완료!')}</DoneTitle>
              <DoneSub>{text('The design was saved to the project.', '프로젝트에 설계가 저장되었습니다')}</DoneSub>
            </DoneBox>
          ) : (
            <>
              {/* 새로 저장 모드에서만 프로젝트/이름 입력 */}
              {!isOverwrite && <div>
                <LabelRow>
                  <FieldLabel style={{margin:0}}>{text('Choose project', '프로젝트 선택')}</FieldLabel>
                  <ToggleBtn onClick={() => setIsCreating(v => !v)}>
                    {isCreatingProject
                      ? text('← Choose existing project', '← 기존 프로젝트 선택')
                      : text('+ Create new project', '+ 새 프로젝트 만들기')}
                  </ToggleBtn>
                </LabelRow>
                {isCreatingProject ? (
                  <NewProjBox>
                    <TextInput placeholder={text('Project name (e.g. Yakima Hopyard, Block A)', '프로젝트명 (예: 안동 홉 농장 A구역)')} value={newProjectName} onChange={e=>setNewProjName(e.target.value)} />
                    <TextInput placeholder={text('Location (optional, e.g. Yakima, WA)', '위치 (선택, 예: 경북 안동시)')} value={newProjectLocation} onChange={e=>setNewProjLoc(e.target.value)} />
                    <CreateBtn onClick={handleCreateProject} disabled={!newProjectName.trim()}>{text('Create project', '프로젝트 생성')}</CreateBtn>
                  </NewProjBox>
                ) : isLoadingProjects ? (
                  <Skeleton />
                ) : projects.length === 0 ? (
                  <EmptyProj>{text('No projects yet. Create a new project.', '프로젝트가 없습니다. 새 프로젝트를 만들어주세요.')}</EmptyProj>
                ) : (
                  <ProjectList>
                    {projects.map(p => (
                      <ProjectItem key={p.id} $selected={selectedProjectId===p.id} onClick={()=>setSelectedPId(p.id)}>
                        <ProjRow>
                          <div>
                            <ProjName>{p.name}</ProjName>
                            {p.location && <ProjLoc>📍 {p.location}</ProjLoc>}
                          </div>
                          <div style={{textAlign:'right'}}>
                            <ProjCount>{text(`${number(p.designs?.length ?? 0)} designs`, `설계 ${number(p.designs?.length ?? 0)}개`)}</ProjCount>
                            {selectedProjectId===p.id && <ProjCheck>✓</ProjCheck>}
                          </div>
                        </ProjRow>
                      </ProjectItem>
                    ))}
                  </ProjectList>
                )}
              </div>}

              {!isOverwrite && <div>
                <FieldLabel>{text('Design name', '설계안 이름')}</FieldLabel>
                <TextInput value={designName} onChange={e=>setDesignName(e.target.value)} placeholder={text('e.g. Option A — steel poles at 3 m', '예: A안 - 강관 3m 간격')} />
              </div>}

              <SummaryGrid>
                <div><SumLabel>{text('Area', '면적')}</SumLabel><SumValue>{number(inputs.widthM * inputs.heightM)} ㎡</SumValue></div>
                <div><SumLabel>{text('Poles', '폴 수량')}</SumLabel><SumValue>{text(`${number(quantities?.totalPoleCount ?? 0)} each`, `${number(quantities?.totalPoleCount ?? 0)}개`)}</SumValue></div>
                <div><SumLabel>{text('Estimate', '총 견적')}</SumLabel><SumValue $green>{currency(estimate?.total ?? 0, activeProfile.currency)}</SumValue></div>
              </SummaryGrid>

              <SaveButton onClick={handleSave} disabled={isSaving || !selectedProjectId || !designName.trim()}>
                {isSaving ? '⌛' : '💾'}{isSaving ? text('Saving…', '저장 중…') : text('Save design', '설계 저장')}
              </SaveButton>
            </>
          )}
        </Body>
      </ModalBox>
    </Overlay>
  )
}
