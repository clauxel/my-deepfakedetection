import test from 'node:test'
import assert from 'node:assert/strict'

import { DEFAULT_SKU, forecastDemand, normalizeForecastInput } from '../src/lib/forecast.js'

test('forecastDemand creates SKU-level 30/60/90 forecasts and reorder advice', () => {
  const result = forecastDemand(DEFAULT_SKU, new Date('2026-05-11T00:00:00Z'))

  assert.equal(result.forecasts[30] > 0, true)
  assert.equal(result.forecasts[60] > result.forecasts[30], true)
  assert.equal(result.forecasts[90] > result.forecasts[60], true)
  assert.equal(result.reorderQuantity >= 0, true)
  assert.equal(typeof result.orderDate, 'string')
  assert.equal(result.chart.length, 8)
})

test('normalizeForecastInput guards numeric ranges', () => {
  const sku = normalizeForecastInput({ salesLast30: -1, promoLiftPct: 999, forecastAccuracyPct: 5 })

  assert.equal(sku.salesLast30, DEFAULT_SKU.salesLast30)
  assert.equal(sku.promoLiftPct, 300)
  assert.equal(sku.forecastAccuracyPct, 40)
})
