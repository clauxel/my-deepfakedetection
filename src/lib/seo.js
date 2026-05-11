import { keywordPages } from '../content/keyword-pages.js'

export const SITE = {
  name: 'Deepfake Detection',
  origin: 'https://deepfakedetection.site',
  supportEmail: 'support@aigeamy.com',
  primaryKeyword: 'Deepfake Detection',
  secondaryKeyword: '',
}

export const HOME_SEO = {
  title: 'Deepfake Detection | Real-Time KYC Fraud API',
  description:
    'Deepfake Detection API for KYC, fintech, HR, video, image, and audio fraud checks with probability scores, anomaly regions, webhooks, and developer-ready pricing.',
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
  const canonicalUrl = `${SITE.origin}${canonicalPath === '/' ? '/' : canonicalPath}`

  document.title = title
  setMeta('name', 'description', description)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', canonicalUrl)
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) canonical.setAttribute('href', canonicalUrl)
}

function setMeta(attrName, attrValue, content) {
  const element = document.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (element) element.setAttribute('content', content)
}
