const MS_PER_DAY = 86400000

export const DEFAULT_SKU = {
  sku: 'Coastal Linen Tote',
  category: 'Accessories',
  channel: 'Shopify US',
  salesLast30: 540,
  inventoryOnHand: 420,
  inboundUnits: 120,
  leadTimeDays: 14,
  safetyStockDays: 10,
  promoLiftPct: 20,
  seasonalityPct: 12,
  forecastAccuracyPct: 86,
  unitCost: 18,
  grossMarginPct: 58,
}

export function normalizeForecastInput(input = {}) {
  return {
    sku: String(input.sku || '').trim() || DEFAULT_SKU.sku,
    category: String(input.category || '').trim() || DEFAULT_SKU.category,
    channel: String(input.channel || '').trim() || DEFAULT_SKU.channel,
    salesLast30: positiveNumber(input.salesLast30, DEFAULT_SKU.salesLast30),
    inventoryOnHand: nonNegativeNumber(input.inventoryOnHand, DEFAULT_SKU.inventoryOnHand),
    inboundUnits: nonNegativeNumber(input.inboundUnits, DEFAULT_SKU.inboundUnits),
    leadTimeDays: positiveNumber(input.leadTimeDays, DEFAULT_SKU.leadTimeDays),
    safetyStockDays: positiveNumber(input.safetyStockDays, DEFAULT_SKU.safetyStockDays),
    promoLiftPct: boundedNumber(input.promoLiftPct, 0, 300, DEFAULT_SKU.promoLiftPct),
    seasonalityPct: boundedNumber(input.seasonalityPct, -80, 200, DEFAULT_SKU.seasonalityPct),
    forecastAccuracyPct: boundedNumber(input.forecastAccuracyPct, 40, 99, DEFAULT_SKU.forecastAccuracyPct),
    unitCost: positiveNumber(input.unitCost, DEFAULT_SKU.unitCost),
    grossMarginPct: boundedNumber(input.grossMarginPct, 5, 95, DEFAULT_SKU.grossMarginPct),
  }
}

export function forecastDemand(input = {}, now = new Date()) {
  const sku = normalizeForecastInput(input)
  const baseDailyDemand = sku.salesLast30 / 30
  const liftMultiplier = 1 + sku.promoLiftPct / 100
  const seasonalityMultiplier = 1 + sku.seasonalityPct / 100
  const adjustedDailyDemand = round(baseDailyDemand * liftMultiplier * seasonalityMultiplier, 1)
  const demandStdDev = Math.max(1, adjustedDailyDemand * (1 - sku.forecastAccuracyPct / 100) * 1.35)
  const safetyStock = Math.ceil(adjustedDailyDemand * sku.safetyStockDays + demandStdDev * Math.sqrt(sku.leadTimeDays) * 1.64)
  const leadTimeDemand = Math.ceil(adjustedDailyDemand * sku.leadTimeDays)
  const reorderPoint = leadTimeDemand + safetyStock
  const availableSoon = sku.inventoryOnHand + sku.inboundUnits
  const daysOfCover = availableSoon / Math.max(1, adjustedDailyDemand)
  const targetCoverDays = sku.leadTimeDays + sku.safetyStockDays + 30
  const targetInventory = Math.ceil(adjustedDailyDemand * targetCoverDays)
  const reorderQuantity = Math.max(0, targetInventory - availableSoon)
  const orderInDays = Math.max(0, Math.floor(daysOfCover - sku.leadTimeDays - sku.safetyStockDays))
  const orderDate = addDays(now, orderInDays)
  const stockoutRisk = riskScore(reorderPoint, availableSoon)
  const overstockRisk = overstockScore(daysOfCover, targetCoverDays)
  const cashAtRisk = Math.round(Math.max(0, availableSoon - targetInventory) * sku.unitCost)
  const lostRevenueRisk = Math.round(Math.max(0, reorderPoint - availableSoon) * sku.unitCost * (1 + sku.grossMarginPct / 100))
  const forecast30 = Math.ceil(adjustedDailyDemand * 30)
  const forecast60 = Math.ceil(adjustedDailyDemand * 60 * 0.98)
  const forecast90 = Math.ceil(adjustedDailyDemand * 90 * 0.96)

  const alerts = []
  if (stockoutRisk >= 70) alerts.push('High stockout risk before the next replenishment window.')
  if (overstockRisk >= 60) alerts.push('Inventory cover is above the target range; slow the next purchase order.')
  if (sku.forecastAccuracyPct < 75) alerts.push('Forecast accuracy is below the operating target; review promotions and outlier sales days.')
  if (!alerts.length) alerts.push('Current cover is healthy. Recheck after the next sales spike or promotion.')

  return {
    sku,
    baseDailyDemand: round(baseDailyDemand, 1),
    adjustedDailyDemand,
    forecasts: {
      30: forecast30,
      60: forecast60,
      90: forecast90,
    },
    reorderPoint,
    reorderQuantity,
    orderDate: formatDate(orderDate),
    orderInDays,
    daysOfCover: round(daysOfCover, 1),
    safetyStock,
    stockoutRisk,
    overstockRisk,
    cashAtRisk,
    lostRevenueRisk,
    accuracyStatus:
      sku.forecastAccuracyPct >= 85 ? 'stable' : sku.forecastAccuracyPct >= 75 ? 'watch' : 'needs review',
    alerts,
    chart: buildChartSeries(adjustedDailyDemand),
  }
}

export function buildReportLines(result) {
  const { sku, forecasts, reorderQuantity, orderDate, daysOfCover, safetyStock, stockoutRisk, overstockRisk, alerts } = result
  return [
    'AI Demand Forecasting Replenishment Report',
    '',
    `SKU: ${sku.sku}`,
    `Category: ${sku.category}`,
    `Channel: ${sku.channel}`,
    `30 day forecast: ${forecasts[30]} units`,
    `60 day forecast: ${forecasts[60]} units`,
    `90 day forecast: ${forecasts[90]} units`,
    `Recommended reorder quantity: ${reorderQuantity} units`,
    `Recommended order date: ${orderDate}`,
    `Days of cover: ${daysOfCover}`,
    `Safety stock: ${safetyStock} units`,
    `Stockout risk: ${stockoutRisk}/100`,
    `Overstock risk: ${overstockRisk}/100`,
    '',
    'Alerts',
    ...alerts.map((alert) => `- ${alert}`),
    '',
    'Operating note',
    'This forecast is a planning aid. Confirm supplier constraints, purchase order minimums, promotions, and market events before committing capital.',
  ]
}

function buildChartSeries(adjustedDailyDemand) {
  return Array.from({ length: 8 }, (_, index) => {
    const week = index + 1
    const seasonalWave = 1 + Math.sin(index / 1.7) * 0.08
    const predicted = Math.round(adjustedDailyDemand * 7 * seasonalWave)
    const actual = Math.round(predicted * (0.92 + ((index % 3) * 0.04)))
    return { week, actual, predicted }
  })
}

function riskScore(reorderPoint, availableSoon) {
  if (reorderPoint <= 0) return 0
  return Math.max(0, Math.min(100, Math.round(((reorderPoint - availableSoon) / reorderPoint) * 100 + 48)))
}

function overstockScore(daysOfCover, targetCoverDays) {
  if (daysOfCover <= targetCoverDays) return 12
  return Math.max(12, Math.min(100, Math.round(((daysOfCover - targetCoverDays) / targetCoverDays) * 100 + 24)))
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function positiveNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

function nonNegativeNumber(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : fallback
}

function boundedNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, number))
}

function round(value, places = 0) {
  const multiplier = 10 ** places
  return Math.round(value * multiplier) / multiplier
}
