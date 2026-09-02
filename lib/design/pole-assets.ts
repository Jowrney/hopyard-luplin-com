import type { RegionalProfileId } from '@/lib/design/regional-profiles'

const POLE_ASSET_BY_CODE: Readonly<Record<string, string>> = {
  POLE_STEEL_60_2T_6M: 'KR_SteelPole_6m',
  POLE_STEEL_60_2T_9M: 'KR_SteelPole_9m',
  POLE_WOOD_H4_100_6M: 'KR_WoodPole_100_6m',
  POLE_WOOD_H4_120_6M: 'KR_WoodPole_120_6m',
  POLE_PC_9M: 'KR_PCPole_9m',
  POLE_PC_12M: 'KR_PCPole_12m',
  POLE_US_WOOD_22FT: 'US_WoodPole_22ft',
}

const POLE_LABEL_BY_CODE: Readonly<Record<string, string>> = {
  POLE_STEEL_60_2T_6M: 'Galvanized steel 60 mm · 6 m',
  POLE_STEEL_60_2T_9M: 'Galvanized steel 60 mm · 9 m',
  POLE_WOOD_H4_100_6M: 'H4 timber 100 mm · 6 m',
  POLE_WOOD_H4_120_6M: 'H4 timber 120 mm · 6 m',
  POLE_PC_9M: 'Precast concrete · 9 m',
  POLE_PC_12M: 'Precast concrete · 12 m',
  POLE_US_WOOD_22FT: 'New wood pole · 22 ft',
}

export function getPoleAssetName(
  poleCode: string,
  profileId: RegionalProfileId,
): string {
  return POLE_ASSET_BY_CODE[poleCode]
    ?? (profileId === 'US_HIGH_TRELLIS' ? 'US_WoodPole_22ft' : 'KR_SteelPole_6m')
}

export function getPoleAssetLabel(
  poleCode: string,
  profileId: RegionalProfileId,
): string {
  return POLE_LABEL_BY_CODE[poleCode]
    ?? (profileId === 'US_HIGH_TRELLIS' ? 'New wood pole · 22 ft' : 'Galvanized steel 60 mm · 6 m')
}
