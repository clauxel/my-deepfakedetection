import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { keywordPages } from '../src/content/keyword-pages.js'
import { HOME_SEO, SITE } from '../src/lib/seo.js'
import { buildRobotsTxt, buildSitemapXml } from '../worker/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const sourceIndexPath = path.join(distDir, 'index.html')
const googleVerification = (process.env.GOOGLE_SITE_VERIFICATION || '').trim()
const bingVerification = (process.env.BING_SITE_VERIFICATION || '').trim()

const sourceIndex = await fs.readFile(sourceIndexPath, 'utf8')

await writeStaticPage('/', {
  title: HOME_SEO.title,
  description: HOME_SEO.description,
  robots: 'index,follow',
  canonicalPath: '/',
  rootHtml: buildHomePrerender(),
  structuredData: [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: `${SITE.origin}/`,
      description: HOME_SEO.description,
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '24.50',
        highPrice: '149.50',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE.name,
      url: `${SITE.origin}/`,
    },
  ],
})

for (const page of keywordPages) {
  const title = `${page.title} | ${SITE.name}`
  await writeStaticPage(page.path, {
    title,
    description: page.description,
    robots: 'index,follow',
    canonicalPath: page.path,
    rootHtml: buildKeywordPrerender(page),
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description: page.description,
        url: `${SITE.origin}${page.path}`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE.origin}/` },
          { '@type': 'ListItem', position: 2, name: page.h1, item: `${SITE.origin}${page.path}` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  })
}

await writeStaticPage('/privacy', {
  title: `Privacy | ${SITE.name}`,
  description: 'How AI Demand Forecasting handles SKU input, checkout metadata, support, analytics, and service providers.',
  robots: 'index,follow',
  canonicalPath: '/privacy',
  rootHtml: buildLegalPrerender(
    'Privacy Policy',
    'AI Demand Forecasting collects only the information needed to operate forecasts, checkout, support, security, analytics, and service improvement.',
  ),
  structuredData: [],
})

await writeStaticPage('/terms', {
  title: `Terms | ${SITE.name}`,
  description: 'Terms for using AI Demand Forecasting forecasts, alerts, reports, checkout, and related materials.',
  robots: 'index,follow',
  canonicalPath: '/terms',
  rootHtml: buildLegalPrerender(
    'Terms of Service',
    'AI Demand Forecasting provides inventory planning assistance and forecasts. It does not guarantee demand, revenue, supplier performance, or business outcomes.',
  ),
  structuredData: [],
})

await fs.writeFile(path.join(distDir, 'sitemap.xml'), buildSitemapXml())
await fs.writeFile(path.join(distDir, 'robots.txt'), buildRobotsTxt())
if (bingVerification) {
  await fs.writeFile(
    path.join(distDir, 'BingSiteAuth.xml'),
    `<?xml version="1.0"?><users><user>${escapeHtml(bingVerification)}</user></users>`,
  )
}

async function writeStaticPage(routePath, page) {
  const html = renderHtml(page)

  if (routePath === '/') {
    await fs.writeFile(sourceIndexPath, html)
    return
  }

  const outputDir = path.join(distDir, routePath.replace(/^\/+/, ''))
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'index.html'), html)
}

function renderHtml({ title, description, robots, canonicalPath, rootHtml, structuredData }) {
  const canonicalUrl = `${SITE.origin}${canonicalPath === '/' ? '/' : canonicalPath}`
  let html = sourceIndex
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`)
  html = upsertMeta(html, 'name', 'description', description)
  html = upsertMeta(html, 'name', 'robots', robots)
  html = upsertMeta(html, 'property', 'og:title', title)
  html = upsertMeta(html, 'property', 'og:description', description)
  html = upsertMeta(html, 'property', 'og:url', canonicalUrl)
  html = upsertMeta(html, 'name', 'twitter:title', title)
  html = upsertMeta(html, 'name', 'twitter:description', description)
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeAttr(canonicalUrl)}" />`)
  html = html.replace('<div id="root"></div>', `<div id="root">${rootHtml}</div>`)

  if (googleVerification) {
    html = html.replace('</head>', `    <meta name="google-site-verification" content="${escapeAttr(googleVerification)}" />\n  </head>`)
  }
  if (bingVerification) {
    html = html.replace('</head>', `    <meta name="msvalidate.01" content="${escapeAttr(bingVerification)}" />\n  </head>`)
  }

  const graph =
    structuredData.length > 1
      ? { '@context': 'https://schema.org', '@graph': structuredData.map(stripContext) }
      : structuredData[0]

  if (graph) {
    html = html.replace(
      '</head>',
      `    <script type="application/ld+json" id="aidemandforecasting-prerender-schema">${JSON.stringify(graph)}</script>\n  </head>`,
    )
  }

  return html
}

function upsertMeta(html, attrName, attrValue, content) {
  const escapedAttrValue = escapeRegExp(attrValue)
  const pattern = new RegExp(`<meta\\s+${attrName}="${escapedAttrValue}"\\s+content="[^"]*"\\s*\\/?>`, 's')
  const replacement = `<meta ${attrName}="${escapeAttr(attrValue)}" content="${escapeAttr(content)}" />`
  return html.replace(pattern, replacement)
}

function stripContext(item) {
  const { '@context': _context, ...rest } = item
  return rest
}

function buildHomePrerender() {
  return `
    <main>
      <section class="hero" id="forecast">
        <div class="hero-copy">
          <p class="eyebrow">AI Demand Forecasting for Shopify sellers</p>
          <h1>Know what to reorder before inventory turns red.</h1>
          <p class="lede">Connect Shopify, read 180 days of sales, and get SKU-level 30, 60, and 90 day forecasts with reorder quantities, order dates, and red-risk alerts.</p>
          <p><a class="btn btn-primary" href="#forecast-result">See reorder advice</a></p>
        </div>
        <section class="forecast-panel">
          <p class="eyebrow">Live SKU forecast</p>
          <h2>Replenishment preview</h2>
          <p>Shopify sales sync, SKU forecasts, replenishment dates, stockout alerts, overstock risk, and actual versus forecast tracking.</p>
        </section>
      </section>
    </main>`
}

function buildKeywordPrerender(page) {
  const sections = page.sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
          ${section.bullets?.length ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>` : ''}
        </section>`,
    )
    .join('\n')
  const links = page.links
    .map((link) => `<a href="${escapeAttr(link)}" rel="noreferrer">Reference</a>`)
    .join('\n')
  const faqs = page.faqs
    .map((faq) => `<article><h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p></article>`)
    .join('\n')

  return `
    <main class="article-wrap">
      <article class="article">
        <a class="back-link" href="/">AI Demand Forecasting workspace</a>
        <p class="eyebrow">${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.h1)}</h1>
        <p class="lede">${escapeHtml(page.lede)}</p>
        <div class="intent-box"><strong>Best for</strong><span>${escapeHtml(page.intent)}</span></div>
        ${links ? `<div class="official-links">${links}</div>` : ''}
        ${sections}
        <section>
          <h2>Quick answers</h2>
          ${faqs}
        </section>
      </article>
    </main>`
}

function buildLegalPrerender(title, description) {
  return `
    <main class="article-wrap">
      <article class="article">
        <a class="back-link" href="/">AI Demand Forecasting workspace</a>
        <h1>${escapeHtml(title)}</h1>
        <p class="lede">${escapeHtml(description)}</p>
      </article>
    </main>`
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
