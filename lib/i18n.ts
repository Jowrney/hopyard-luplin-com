export type Locale = 'en' | 'ko'

export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_STORAGE_KEY = 'hopeden.locale'

export function normalizeLocale(value: string | null | undefined): Locale {
  return value?.toLowerCase().startsWith('ko') ? 'ko' : 'en'
}

export function localeTag(locale: Locale): 'en-US' | 'ko-KR' {
  return locale === 'ko' ? 'ko-KR' : 'en-US'
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag(locale)).format(value)
}

export function formatCurrency(value: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    maximumFractionDigits: currency === 'KRW' ? 0 : 2,
  }).format(value)
}

export function formatDate(value: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    year: 'numeric',
    month: locale === 'ko' ? 'long' : 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(value)
}

const REGION_LABELS: Record<string, Record<Locale, string>> = {
  INLAND: { en: 'Inland', ko: '내륙 일반' },
  SEOUL: { en: 'Seoul / Gyeonggi', ko: '서울/경기' },
  GANGWON: { en: 'Gangwon mountains', ko: '강원 산간' },
  COASTAL: { en: 'Busan / South coast', ko: '부산/경남 해안' },
  JEJU: { en: 'Jeju', ko: '제주' },
}

export function getRegionLabel(region: string, locale: Locale): string {
  return REGION_LABELS[region]?.[locale] ?? region
}

const ESTIMATE_CATEGORIES: Record<string, Record<Locale, string>> = {
  materials: { en: 'Materials', ko: '자재비' },
  labor: { en: 'Installation', ko: '시공비' },
  plants: { en: 'Planting stock', ko: '종자비' },
}

export function getEstimateCategoryLabel(category: string, locale: Locale): string {
  const key = category === '자재비' ? 'materials'
    : category === '시공비' ? 'labor'
      : category === '종자비' ? 'plants'
        : category
  return ESTIMATE_CATEGORIES[key]?.[locale] ?? category
}

const ITEM_LABELS: Record<string, Record<Locale, string>> = {
  POLE_STEEL_60_2T_6M: { en: 'Galvanized steel pole · 60 mm × 2T × 6 m', ko: '아연도금 강관 · 60 mm × 2T × 6 m' },
  POLE_STEEL_60_2T_9M: { en: 'Galvanized steel pole · 60 mm × 2T × 9 m', ko: '아연도금 강관 · 60 mm × 2T × 9 m' },
  POLE_WOOD_H4_100_6M: { en: 'H4 treated timber pole · 100 mm × 6 m', ko: 'H4 방부목 지주 · 100 mm × 6 m' },
  POLE_WOOD_H4_120_6M: { en: 'H4 treated timber pole · 120 mm × 6 m', ko: 'H4 방부목 지주 · 120 mm × 6 m' },
  POLE_PC_9M: { en: 'Precast concrete pole · 9 m', ko: 'PC 전봇대 · 9 m' },
  POLE_PC_12M: { en: 'Precast concrete pole · 12 m', ko: 'PC 전봇대 · 12 m' },
  POLE_US_WOOD_22FT: { en: 'New wood trellis pole · 22 ft', ko: '북미형 목재 지주 · 22 ft' },
  WIRE_25MM: { en: 'High-tensile steel wire · 2.5 mm', ko: '고장력 스틸와이어 · 2.5 mm' },
  WIRE_32MM: { en: 'High-tensile steel wire · 3.2 mm', ko: '고장력 스틸와이어 · 3.2 mm' },
  WIRE_40MM: { en: 'High-tensile steel wire · 4.0 mm', ko: '고장력 스틸와이어 · 4.0 mm' },
  WIRE_50MM: { en: 'High-tensile steel wire · 5.0 mm', ko: '고장력 스틸와이어 · 5.0 mm' },
  WIRE_COIR_3MM: { en: 'Biodegradable coir rope · 3 mm', ko: '생분해 코이어 로프 · 3 mm' },
  WIRE_US_MAIN_5_16_7X19: { en: 'Galvanized aircraft main cable · 5/16 in', ko: '아연도금 메인 케이블 · 5/16 in' },
  ANCHOR_SCREW_600: { en: 'Screw anchor · 600 mm', ko: '나사말뚝 앵커 · 600 mm' },
  ANCHOR_SCREW_900: { en: 'Screw anchor · 900 mm', ko: '나사말뚝 앵커 · 900 mm' },
  ANCHOR_CONCRETE: { en: 'Concrete anchor block', ko: '콘크리트 앵커 기초블록' },
  ANCHOR_US_HELIX_48IN: { en: 'Helical ground anchor · 48 in', ko: '헬리컬 지중 앵커 · 48 in' },
  CLIP_U_BOLT: { en: 'Connection hardware · U-bolt clamp', ko: '연결부속 · U볼트 클램프' },
  LABOR_MANUAL_LABOR: { en: 'Labor', ko: '인건비' },
  LABOR_MANUAL_EQUIPMENT: { en: 'Equipment', ko: '장비대' },
  LABOR_MANUAL_PLANTING: { en: 'Planting labor', ko: '식재비' },
  LABOR_MANUAL_ETC: { en: 'Other installation costs', ko: '기타 시공비' },
}

export function getEstimateItemLabel(code: string, fallback: string, locale: Locale): string {
  const known = ITEM_LABELS[code]?.[locale]
  if (known) return known
  if (code.startsWith('HOP_')) {
    const variety = code.replace(/^HOP_/, '').replaceAll('_', ' ')
    return locale === 'ko' ? `종근 (${variety}) · 면세` : `${variety} rhizomes · tax-exempt`
  }
  if (locale === 'en' && /[가-힣]/.test(fallback)) return code
  return fallback
}

const UNIT_LABELS: Record<string, Record<Locale, string>> = {
  개: { en: 'ea', ko: '개' },
  주: { en: 'plants', ko: '주' },
  식: { en: 'lot', ko: '식' },
  m: { en: 'm', ko: 'm' },
}

export function getUnitLabel(unit: string, locale: Locale): string {
  return UNIT_LABELS[unit]?.[locale] ?? unit
}

const VARIETIES: Record<string, { name: Record<Locale, string>; description: Record<Locale, string> }> = {
  HOP_CASCADE: {
    name: { en: 'Cascade', ko: '캐스케이드' },
    description: { en: 'Citrus and floral; versatile', ko: '감귤·꽃향, 범용성' },
  },
  HOP_CENTENNIAL: {
    name: { en: 'Centennial', ko: '센테니얼' },
    description: { en: 'Balanced bitterness and citrus', ko: '쓴맛과 시트러스 향' },
  },
  HOP_CITRA: {
    name: { en: 'Citra', ko: '시트라' },
    description: { en: 'Tropical fruit aroma', ko: '열대과일향' },
  },
  HOP_CHINOOK: {
    name: { en: 'Chinook', ko: '치누크' },
    description: { en: 'Pine and spice aroma', ko: '송진·향신료 향' },
  },
  HOP_FUGGLES: {
    name: { en: 'Fuggles', ko: '퍼글스' },
    description: { en: 'Earthy; traditional ales', ko: '흙향, 전통 에일' },
  },
  HOP_HALLERTAU: {
    name: { en: 'Hallertau', ko: '할러타우' },
    description: { en: 'Noble hop for lagers', ko: '라거용 노블 홉' },
  },
  HOP_EDEN_01: {
    name: { en: 'HOPEDEN No. 1', ko: '홉이든 1호' },
    description: { en: 'HOPEDEN breeding line adapted to Korean climate', ko: '자체 육종, 국내 기후 적응' },
  },
}

export function getVarietyName(code: string, fallback: string, locale: Locale): string {
  const known = VARIETIES[code]?.name[locale]
  if (known) return known
  if (locale === 'en' && /[가-힣]/.test(fallback)) return code
  return fallback
}

export function getVarietyDescription(code: string, locale: Locale): string {
  return VARIETIES[code]?.description[locale] ?? ''
}

export function localize(locale: Locale, en: string, ko: string): string {
  return locale === 'ko' ? ko : en
}
