import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_LOCALE,
  formatCurrency,
  formatDate,
  formatNumber,
  getEstimateCategoryLabel,
  getEstimateItemLabel,
  getRegionLabel,
  getUnitLabel,
  getVarietyDescription,
  getVarietyName,
  normalizeLocale,
} from '../lib/i18n'

test('English is the default locale for a fresh global and demo session', () => {
  assert.equal(DEFAULT_LOCALE, 'en')
  assert.equal(normalizeLocale(undefined), 'en')
  assert.equal(normalizeLocale('ko-KR'), 'ko')
  assert.equal(normalizeLocale('en-US'), 'en')
})

test('numbers, currencies, dates, and region names follow the selected locale', () => {
  assert.equal(formatNumber(12345, 'en'), '12,345')
  assert.equal(formatNumber(12345, 'ko'), '12,345')
  assert.match(formatCurrency(12345, 'KRW', 'en'), /12,345/)
  assert.match(formatCurrency(12345, 'KRW', 'ko'), /12,345/)
  assert.equal(getRegionLabel('INLAND', 'en'), 'Inland')
  assert.equal(getRegionLabel('INLAND', 'ko'), '내륙 일반')
  assert.match(formatDate(new Date('2026-09-02T00:00:00Z'), 'en'), /2026/)
  assert.match(formatDate(new Date('2026-09-02T00:00:00Z'), 'ko'), /2026/)
})

test('estimate display labels are derived from stable codes instead of Korean calculation text', () => {
  assert.equal(getEstimateCategoryLabel('자재비', 'en'), 'Materials')
  assert.equal(getEstimateCategoryLabel('자재비', 'ko'), '자재비')
  assert.equal(getEstimateItemLabel('POLE_PC_12M', 'ignored', 'en'), 'Precast concrete pole · 12 m')
  assert.equal(getEstimateItemLabel('POLE_PC_12M', 'ignored', 'ko'), 'PC 전봇대 · 12 m')
  assert.equal(getUnitLabel('개', 'en'), 'ea')
  assert.equal(getUnitLabel('주', 'en'), 'plants')
})

test('catalog varieties have bilingual names and descriptions by stable code', () => {
  assert.equal(getVarietyName('HOP_EDEN_01', '홉이든 1호', 'en'), 'HopEden No. 1')
  assert.equal(getVarietyName('HOP_EDEN_01', 'HopEden No. 1', 'ko'), '홉이든 1호')
  assert.equal(getVarietyDescription('HOP_CASCADE', 'en'), 'Citrus and floral; versatile')
  assert.equal(getVarietyDescription('HOP_CASCADE', 'ko'), '감귤·꽃향, 범용성')
})
