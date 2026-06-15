import { keywordPages } from '../src/content/keyword-pages.js'
import { classifyMediaSample } from '../src/lib/risk.js'
import { recordAnalyticsEvents } from './analytics.js'
import { handleNowPaymentsCheckout } from './nowpayments.js'

const CANONICAL_ORIGIN = 'https://deepfakedetection.site'
const CANONICAL_HOSTS = new Set(['deepfakedetection.site', 'www.deepfakedetection.site'])
const ANNUAL_DISCOUNT_MULTIPLIER = 0.5

const creemProductCache = new Map()

const planCatalog = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyAmountCents: 9900,
    currency: 'USD',
    summary: '5,000 image or media checks, dashboard, API keys, and basic anomaly regions',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyAmountCents: 39900,
    currency: 'USD',
    summary: '30,000 checks with image, video, audio, webhook, usage analytics, and billing controls',
  },
  team: {
    id: 'team',
    name: 'Team',
    monthlyAmountCents: 39900,
    currency: 'USD',
    summary: '30,000 checks with image, video, audio, webhook, usage analytics, and billing controls',
  },
  platform: {
    id: 'platform',
    name: 'Platform',
    monthlyAmountCents: 39900,
    currency: 'USD',
    summary: '30,000 checks with image, video, audio, webhook, usage analytics, and billing controls',
  },
}

const indexablePaths = ['/', ...keywordPages.map((page) => page.path), '/pricing', '/resources', '/privacy', '/terms']
const staticAssetPaths = new Set(indexablePaths)

export function securityHeaders() {
  return new Headers({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  })
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers)
  for (const [key, value] of securityHeaders()) headers.set(key, value)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export function jsonResponse(data, status = 200) {
  const headers = securityHeaders()
  headers.set('Content-Type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(data), { status, headers })
}

function xmlResponse(body) {
  const headers = securityHeaders()
  headers.set('Content-Type', 'application/xml; charset=utf-8')
  headers.set('Cache-Control', 'public, max-age=3600')
  return new Response(body, { status: 200, headers })
}

function textResponse(body) {
  const headers = securityHeaders()
  headers.set('Content-Type', 'text/plain; charset=utf-8')
  headers.set('Cache-Control', 'public, max-age=3600')
  return new Response(body, { status: 200, headers })
}

function maybeRedirectToHttps(requestUrl, request) {
  if (typeof isLocalDevRequest === 'function' && isLocalDevRequest(request)) return null
  const canonicalUrl = new URL(CANONICAL_ORIGIN)
  const isKnownHost = typeof CANONICAL_HOSTS !== 'undefined' && CANONICAL_HOSTS.has(requestUrl.hostname)
  if (isKnownHost && (requestUrl.protocol !== 'https:' || requestUrl.hostname !== canonicalUrl.hostname)) {
    const redirectUrl = new URL(requestUrl)
    redirectUrl.protocol = 'https:'
    redirectUrl.hostname = canonicalUrl.hostname
    return Response.redirect(redirectUrl.toString(), 301)
  }
  return null
}

function resolvePublicAppOrigin(requestUrl) {
  if (CANONICAL_HOSTS.has(requestUrl.hostname)) return `https://${requestUrl.hostname}`
  if (requestUrl.hostname.endsWith('.workers.dev') || requestUrl.hostname.endsWith('.pages.dev')) return requestUrl.origin
  return CANONICAL_ORIGIN
}

function resolveCreemBase(env) {
  const raw = String(env?.CREEM_API_BASE || '').trim()
  return raw ? raw.replace(/\/+$/, '') : 'https://api.creem.io'
}

async function getSecretValue(value) {
  if (typeof value === 'string') return value.trim()
  if (value && typeof value.get === 'function') {
    const resolved = await value.get()
    return typeof resolved === 'string' ? resolved.trim() : ''
  }
  return ''
}

async function firstSecretEnv(env, ...keys) {
  for (const key of keys) {
    const value = await getSecretValue(env?.[key])
    if (value) return value
  }
  return ''
}

function normalizeEnvKey(value) {
  return String(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function formatMoney(amountCents, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2,
  }).format(amountCents / 100)
}

function resolveConfiguredProductId(env, planId, billing) {
  const cycle = billing === 'monthly' ? 'MONTHLY' : 'YEARLY'
  const normalizedSelection = normalizeEnvKey(`${planId}_${billing}`)
  const tier = planId === 'starter' ? 'STARTER' : 'PRO'
  const keys = [
    `CREEM_PRODUCT_DEEPFAKEDETECTION_${tier}_${cycle}`,
    `CREEM_PRODUCT_ID_DEEPFAKEDETECTION_${normalizedSelection}`,
    `CREEM_PRODUCT_ID_${normalizedSelection}`,
    `CREEM_PRODUCT_ID_${tier}`,
    'CREEM_PRODUCT_ID',
  ]

  for (const key of keys) {
    const value = env?.[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

async function requestCreemJson(apiKey, url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(body),
  })

  const rawText = await response.text()
  let payload = null
  if (rawText) {
    try {
      payload = JSON.parse(rawText)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    throw new Error(
      payload && typeof payload === 'object'
        ? payload.message || payload.error || 'Creem request failed.'
        : 'Creem request failed.',
    )
  }

  return payload || {}
}

async function getOrCreateCreemProduct(env, apiKey, plan, billing, successUrl) {
  const configuredProductId = resolveConfiguredProductId(env, plan.id, billing)
  if (configuredProductId) return configuredProductId

  const cacheKey = `${plan.id}:${billing}`
  if (creemProductCache.has(cacheKey)) return creemProductCache.get(cacheKey)

  const effectiveMonthlyCents =
    billing === 'annual' ? Math.round(plan.monthlyAmountCents * ANNUAL_DISCOUNT_MULTIPLIER) : plan.monthlyAmountCents
  const totalAmountCents = billing === 'annual' ? effectiveMonthlyCents * 12 : effectiveMonthlyCents
  const billingLabel = billing === 'annual' ? 'annual' : 'monthly'

  const product = await requestCreemJson(apiKey, `${resolveCreemBase(env)}/v1/products`, {
    name: `Deepfake Detection ${plan.name} (${billingLabel})`,
    description: `${formatMoney(effectiveMonthlyCents, plan.currency)}/mo - ${plan.summary}`,
    price: totalAmountCents,
    currency: plan.currency,
    billing_type: 'onetime',
    tax_mode: 'inclusive',
    tax_category: 'saas',
    default_success_url: successUrl,
  })

  const productId = product.id || product.product_id
  if (!productId) throw new Error('Creem did not return a product id.')

  creemProductCache.set(cacheKey, productId)
  return productId
}

function extractCheckoutUrl(payload) {
  const candidates = [payload?.checkout_url, payload?.checkoutUrl, payload?.url]
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
  }
  return ''
}

export async function handleCheckout(request, env, requestUrl = new URL(request.url)) {
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405)

  const apiKey = await firstSecretEnv(env, 'API_PROD_KEY', 'CREEM_API_KEY', 'CREEM_KEY')
  if (!apiKey) return jsonResponse({ ok: false, error: 'Payment is not configured yet.' }, 503)

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400)
  }

  const planId = body?.planId === 'starter' ? 'starter' : 'pro'
  const billing = body?.billing === 'monthly' ? 'monthly' : 'annual'
  const plan = planCatalog[planId] || planCatalog.pro
  const successUrl = `${resolvePublicAppOrigin(requestUrl)}/?checkout=success`

  try {
    const productId = await getOrCreateCreemProduct(env, apiKey, plan, billing, successUrl)
    const checkout = await requestCreemJson(apiKey, `${resolveCreemBase(env)}/v1/checkouts`, {
      product_id: productId,
      units: 1,
      success_url: successUrl,
      request_id: `deepfakedetection_${plan.id}_${billing}_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      metadata: {
        site: 'deepfakedetection.site',
        planId: plan.id,
        billing,
      },
    })
    const checkoutUrl = extractCheckoutUrl(checkout)
    if (!checkoutUrl) throw new Error('Creem did not return a checkout URL.')
    return jsonResponse({ ok: true, checkoutUrl })
  } catch {
    return jsonResponse({ ok: false, error: 'Secure checkout could not be created yet.' }, 502)
  }
}

export function handleRuntime(requestUrl = new URL(CANONICAL_ORIGIN)) {
  return jsonResponse({
    ok: true,
    publicAppOrigin: resolvePublicAppOrigin(requestUrl),
    deployment: 'cloudflare-workers-assets',
    paymentProvider: 'creem',
    product: 'Deepfake Detection API',
    ts: Date.now(),
  })
}

export async function handleScan(request) {
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405)
  try {
    const body = await request.json()
    return jsonResponse({ ok: true, result: classifyMediaSample(body || {}) })
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400)
  }
}

function sanitizeAnalyticsValue(value, max = 180) {
  return String(value ?? '')
    .replace(/[^\w .:/?=&@+-]/g, '')
    .slice(0, max)
}

async function persistEvent(env, event) {
  await recordAnalyticsEvents(env, [event], {
    siteKey: event.site || 'unknown',
    requestUrl: new URL(CANONICAL_ORIGIN),
  })
}

export async function handleReminder(request, env) {
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405)

  let body = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const email = sanitizeAnalyticsValue(body.email || '', 160)
  const workflow = sanitizeAnalyticsValue(body.workflow || '', 120)
  if (!email || !email.includes('@')) return jsonResponse({ ok: false, error: 'A valid email is required.' }, 400)

  const event = {
    site: 'deepfakedetection.site',
    type: 'demo_request',
    email,
    workflow,
    ts: Date.now(),
  }
  console.log(JSON.stringify(event))
  await persistEvent(env, event)
  return jsonResponse({ ok: true, message: 'Demo request captured.' })
}

export async function handleAnalytics(request, env) {
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405)

  let body = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const event = {
    site: 'deepfakedetection.site',
    type: 'analytics',
    event: sanitizeAnalyticsValue(body.event || 'unknown', 80),
    path: sanitizeAnalyticsValue(body.path || '/', 220),
    route: sanitizeAnalyticsValue(body.route || '', 220),
    verdict: sanitizeAnalyticsValue(body.verdict || '', 40),
    score: sanitizeAnalyticsValue(body.score || '', 40),
    mediaType: sanitizeAnalyticsValue(body.mediaType || '', 40),
    planId: sanitizeAnalyticsValue(body.planId || '', 40),
    billing: sanitizeAnalyticsValue(body.billing || '', 40),
    utm: body.utm && typeof body.utm === 'object' ? body.utm : {},
    ts: Date.now(),
  }

  console.log(JSON.stringify({ type: 'deepfakedetection_analytics', ...event }))
  try {
    await persistEvent(env, event)
  } catch {
    console.log(JSON.stringify({ type: 'deepfakedetection_analytics_persist_error', ts: Date.now() }))
  }
  return jsonResponse({ ok: true })
}

export function buildSitemapXml() {
  const today = new Date().toISOString().slice(0, 10)
  const urls = indexablePaths
    .map((path) => {
      const priority = path === '/' ? '1.0' : path === '/privacy' || path === '/terms' ? '0.35' : '0.78'
      const changefreq = path === '/' ? 'weekly' : 'monthly'
      const locPath = path === '/' ? '/' : path
      return `  <url>
    <loc>${CANONICAL_ORIGIN}${locPath}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export function handleSitemap() {
  return xmlResponse(buildSitemapXml())
}

export function buildRobotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /api/
Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml
`
}

export function handleRobots() {
  return textResponse(buildRobotsTxt())
}

function noIndexNotFoundResponse(request) {
  const headers = securityHeaders(request)
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  headers.set('X-Robots-Tag', 'noindex, nofollow')
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Page not found</title></head><body><main><h1>Page not found</h1><p>This URL is not a public page for this product.</p></main></body></html>', { status: 404, headers })
}

async function fetchAsset(request, env) {
  const assets = env?.SITE_ASSETS || env?.ASSETS
  if (assets?.fetch) {
    const requestUrl = new URL(request.url)
    const normalizedPath = requestUrl.pathname.replace(/\/+$/, '') || '/'

    if (staticAssetPaths.has(normalizedPath)) {
      const assetUrl = new URL(request.url)
      assetUrl.pathname = normalizedPath === '/' ? '/' : `${normalizedPath}/`
      const assetResponse = await assets.fetch(new Request(assetUrl.toString(), request))
      if (assetResponse.status !== 404) return withSecurityHeaders(assetResponse)
    }

    if (normalizedPath !== '/' && !/\.[a-z0-9]+$/i.test(normalizedPath) && !staticAssetPaths.has(normalizedPath)) {
      return noIndexNotFoundResponse(request)
    }

    return withSecurityHeaders(await assets.fetch(request))
  }

  return new Response('Cloudflare assets binding is unavailable.', {
    status: 500,
    headers: securityHeaders(),
  })
}

export async function handleRequest(request, env) {
  const requestUrl = new URL(request.url)

  if (requestUrl.pathname === '/api/nowpayments-checkout') {
    return handleNowPaymentsCheckout(request, env, {
      plans: planCatalog,
      defaultPlanId: 'pro',
      siteName: 'deepfakedetection',
      siteKey: 'deepfakedetection',
      annualDiscountMultiplier: typeof ANNUAL_DISCOUNT_MULTIPLIER !== 'undefined'
        ? ANNUAL_DISCOUNT_MULTIPLIER
        : (typeof annualBillingMultiplier !== 'undefined' ? annualBillingMultiplier : 0.5),
    })
  }

  if (requestUrl.pathname === '/api/runtime') return handleRuntime(requestUrl)
  if (requestUrl.pathname === '/api/checkout') return handleCheckout(request, env, requestUrl)
  if (requestUrl.pathname === '/api/scan') return handleScan(request, env)
  if (requestUrl.pathname === '/api/reminder') return handleReminder(request, env)
  if (requestUrl.pathname === '/api/analytics') return handleAnalytics(request, env)

  const httpsRedirect = maybeRedirectToHttps(requestUrl)
  if (httpsRedirect) return httpsRedirect

  if (requestUrl.pathname === '/sitemap.xml') return handleSitemap()
  if (requestUrl.pathname === '/robots.txt') return handleRobots()

  return fetchAsset(request, env)
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env)
    } catch {
      return jsonResponse({ ok: false, error: 'Internal server error.' }, 500)
    }
  },
}
