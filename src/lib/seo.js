import { keywordPages } from '../content/keyword-pages.js'

export const SITE = {
  name: 'AI Demand Forecasting',
  origin: 'https://aidemandforecasting.space',
  supportEmail: 'support@aigeamy.com',
  primaryKeyword: 'AI Demand Forecasting',
  marketFocus: 'United States Shopify sellers first; India Flipkart and Meesho sellers next; Brazil Mercado Libre sellers third.',
}

export const HOME_SEO = {
  title: 'AI Demand Forecasting | Shopify Inventory Forecasting',
  description:
    'AI Demand Forecasting for Shopify sellers: predict 30, 60, and 90 day SKU demand, get reorder quantities, order dates, stockout alerts, and forecast accuracy tracking.',
  canonicalPath: '/',
}

export function getPageByPath(pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return keywordPages.find((page) => page.path === normalized)
}

export function applyDocumentSeo(page) {
  const title = page ? `${page.title} | ${SITE.name}` : HOME_SEO.title
  const description = page?.description || HOME_SEO.description
  const canonicalPath = page?.path || HOME_SEO.canonicalPath
  document.title = title
  setMeta('name', 'description', description)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', `${SITE.origin}${canonicalPath === '/' ? '/' : canonicalPath}`)
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) canonical.setAttribute('href', `${SITE.origin}${canonicalPath === '/' ? '/' : canonicalPath}`)
}

function setMeta(attrName, attrValue, content) {
  const element = document.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (element) element.setAttribute('content', content)
}
