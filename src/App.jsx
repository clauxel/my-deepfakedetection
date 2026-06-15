import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Code2,
  Download,
  FileAudio,
  FileImage,
  FileVideo,
  Globe2,
  KeyRound,
  ShieldCheck,
  UploadCloud,
  Webhook,
  X,
} from 'lucide-react'

import { keywordPages } from './content/keyword-pages.js'
import { trackEvent } from './lib/analytics.js'
import { SITE, applyDocumentSeo, getPageByPath } from './lib/seo.js'
import { buildReportLines, classifyMediaSample, inferMediaType } from './lib/risk.js'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 99,
    limit: '5,000 checks / month',
    summary: 'For teams validating deepfake checks in one onboarding flow.',
    features: ['Image upload API', 'Dashboard and API keys', 'Basic anomaly regions', 'Email support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 399,
    limit: '30,000 checks / month',
    summary: 'Default for fintech, HR, and trust teams moving checks into production.',
    features: ['Image, video, and audio APIs', 'Per-second video curve', 'Webhook delivery', 'Usage and billing analytics'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: null,
    limit: 'Contract volume',
    summary: 'For regulated KYC programs with custom retention, review policy, and procurement needs.',
    features: ['Custom thresholds', 'Private storage routing', 'Security review', 'SLA and volume pricing'],
  },
]

const defaultSample = {
  fileName: 'kyc-selfie-video.mp4',
  fileType: 'video/mp4',
  fileSizeMb: 18.4,
  mediaType: 'video',
  workflow: 'fintech-kyc',
  region: 'United States fintech onboarding',
  livenessCheck: false,
  referenceMatch: false,
  webhookUrl: 'https://customer.example/webhooks/deepfake',
  apiMode: 'realtime',
}

const workflowOptions = [
  ['fintech-kyc', 'Fintech KYC'],
  ['bank-onboarding', 'Bank onboarding'],
  ['crypto-exchange', 'Crypto exchange'],
  ['hr-verification', 'HR verification'],
  ['marketplace-trust', 'Marketplace trust'],
]

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/')
  const [sample, setSample] = useState(defaultSample)
  const [result, setResult] = useState(() => classifyMediaSample(defaultSample))
  const [scanning, setScanning] = useState(false)
  const [billing, setBilling] = useState('annual')
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [planFlowOpen, setPlanFlowOpen] = useState(false)
  const [payment, setPayment] = useState({ open: false, loading: false, error: '', url: '' })
  const [uploadPreview, setUploadPreview] = useState('')

  const page = useMemo(() => getPageByPath(path), [path])

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (path === '/') applyDocumentSeo(null)
    else if (page) applyDocumentSeo(page)
    else {
      const label = path === '/privacy' ? 'Privacy' : 'Terms'
      document.title = `${label} | ${SITE.name}`
    }
    trackEvent('page_view', { route: path })
  }, [path, page])

  useEffect(() => {
    return () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview)
    }
  }, [uploadPreview])

  function updateSample(name, value) {
    setSample((current) => ({ ...current, [name]: value }))
  }

  function handleFile(file) {
    if (!file) return
    const mediaType = inferMediaType(file.type, file.name)
    setSample((current) => ({
      ...current,
      fileName: file.name,
      fileType: file.type || current.fileType,
      fileSizeMb: Number((file.size / 1024 / 1024).toFixed(2)),
      mediaType,
    }))

    if (uploadPreview) URL.revokeObjectURL(uploadPreview)
    setUploadPreview(mediaType === 'image' ? URL.createObjectURL(file) : '')
    trackEvent('sample_file_selected', { mediaType })
  }

  function runScan(event) {
    event?.preventDefault()
    setScanning(true)
    trackEvent('scan_start', { mediaType: sample.mediaType, workflow: sample.workflow })
    const localResult = classifyMediaSample(sample)

    window.setTimeout(() => {
      setResult(localResult)
      setScanning(false)
      trackEvent('scan_complete', {
        mediaType: localResult.sample.mediaType,
        verdict: localResult.verdict,
        score: localResult.probability,
      })
      document.getElementById('scan-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 420)

    fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sample),
      keepalive: true,
    })
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.ok && payload.result) setResult(payload.result)
      })
      .catch(() => {})
  }

  function navigate(event, href) {
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.includes('#')) return
    event.preventDefault()
    window.history.pushState({}, '', href)
    setPath(href.replace(/\/+$/, '') || '/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function openCheckout(planId = selectedPlan, cycle = billing, provider = 'creem') {
    if (planId === 'enterprise') {
      window.location.href = `mailto:${SITE.supportEmail}?subject=Enterprise%20Deepfake%20Detection%20contract`
      return
    }

    setSelectedPlan(planId)
    setBilling(cycle)
    setPayment({ open: true, loading: true, error: '', url: '' })
    trackEvent('checkout_click', { planId, billing: cycle, paymentProvider: provider })

    const popup = window.open('', 'creemCheckout', centeredPopupFeatures(560, 760))
    if (popup) {
      popup.document.write(
        '<!doctype html><title>Secure checkout</title><body style="font-family:Arial,sans-serif;padding:28px;background:#eef7f8;color:#08262f"><h1>Opening secure checkout...</h1><p>You can keep Deepfake Detection open in the original tab.</p></body>',
      )
      popup.document.close()
    }

    try {
      const response = await fetch(provider === 'nowpayments' ? '/api/nowpayments-checkout' : '/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billing: cycle }),
      })
      let payload = {}
      try {
        payload = await response.json()
      } catch {
        payload = {}
      }
      if (!response.ok || !payload.ok || !payload.checkoutUrl) {
        throw new Error(payload.error || 'Secure checkout is not available yet.')
      }
      setPayment({ open: true, loading: false, error: '', url: payload.checkoutUrl })
      if (popup && !popup.closed) {
        popup.location.assign(payload.checkoutUrl)
      } else {
        window.open(payload.checkoutUrl, 'creemCheckout', centeredPopupFeatures(560, 760))
      }
    } catch (error) {
      setPayment({
        open: true,
        loading: false,
        error: error instanceof Error ? error.message : 'Secure checkout is not available yet.',
        url: '',
      })
      if (popup && !popup.closed) popup.close()
      trackEvent('checkout_error', { planId, billing: cycle })
    }
  }

  function openPlanFlow(planId = 'pro', cycle = 'annual') {
    if (planId === 'enterprise') {
      window.location.href = `mailto:${SITE.supportEmail}?subject=Enterprise%20Deepfake%20Detection%20contract`
      return
    }
    setSelectedPlan(planId)
    setBilling(cycle)
    setPlanFlowOpen(true)
    trackEvent('plan_flow_opened', { planId, billing: cycle })
  }

  function continuePlanFlow() {
    setPlanFlowOpen(false)
    void openCheckout(selectedPlan, billing)
  }

  if (page) {
    return (
      <SiteShell navigate={navigate} onCheckout={() => openPlanFlow('pro', 'annual')}>
        <KeywordPage page={page} navigate={navigate} onCheckout={() => openPlanFlow('pro', 'annual')} />
        <PlanFlowModal
          open={planFlowOpen}
          billing={billing}
          setBilling={setBilling}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          onClose={() => setPlanFlowOpen(false)}
          onContinue={continuePlanFlow}
          title="Launch Deepfake Detection with the right screening tier"
          description="Start fraud scan opens plan selection first. Annual billing keeps the same path and cuts Pro to half price before secure checkout."
        />
        <CheckoutOverlay payment={payment} setPayment={setPayment} />
      </SiteShell>
    )
  }

  if (path === '/privacy' || path === '/terms') {
    return (
      <SiteShell navigate={navigate} onCheckout={() => openPlanFlow('pro', 'annual')}>
        {path === '/privacy' ? <Privacy navigate={navigate} /> : <Terms navigate={navigate} />}
        <PlanFlowModal
          open={planFlowOpen}
          billing={billing}
          setBilling={setBilling}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          onClose={() => setPlanFlowOpen(false)}
          onContinue={continuePlanFlow}
          title="Launch Deepfake Detection with the right screening tier"
          description="Start fraud scan opens plan selection first. Annual billing keeps the same path and cuts Pro to half price before secure checkout."
        />
        <CheckoutOverlay payment={payment} setPayment={setPayment} />
      </SiteShell>
    )
  }

  return (
    <SiteShell navigate={navigate} onCheckout={() => openPlanFlow('pro', 'annual')}>
      <main>
        <section className="hero" id="api">
          <div className="hero-copy">
            <p className="eyebrow">Deepfake Detection API</p>
            <h1>Stop synthetic KYC fraud before approval.</h1>
            <p className="lede">
              One successful deepfake onboarding can cost millions. Add image, video, and AI voice screening in three
              lines, get a 0-100 probability score, and route high-risk attempts in seconds.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" type="button" onClick={() => openPlanFlow('pro', 'annual')}>
                Start fraud scan <ArrowRight size={18} />
              </button>
              <a className="btn btn-quiet" href="#scanner">
                Analyze a sample
              </a>
            </div>
            <div className="trust-row" aria-label="Product proof points">
              <span>
                <ShieldCheck size={16} /> KYC fraud routing
              </span>
              <span>
                <Activity size={16} /> second-level video curve
              </span>
              <span>
                <Webhook size={16} /> webhook ready
              </span>
            </div>
            <CodeSnippet />
          </div>

          <div className="hero-media" aria-label="Deepfake detection dashboard preview">
            <img src="/assets/deepfake-hero.png" alt="Deepfake Detection dashboard with face, video, and audio analysis" />
            <div className="hero-stat">
              <span>Median API response</span>
              <strong>0.8s</strong>
            </div>
            <div className="hero-stat secondary">
              <span>Webhook retries</span>
              <strong>built in</strong>
            </div>
          </div>
        </section>

        <section className="scan-band" id="scanner">
          <DetectorSandbox
            sample={sample}
            result={result}
            scanning={scanning}
            uploadPreview={uploadPreview}
            onChange={updateSample}
            onFile={handleFile}
            onSubmit={runScan}
          />
        </section>

        <section className="section" id="scan-result">
          <div className="section-heading">
            <p className="eyebrow">Decision output</p>
            <h2>Scores reviewers can act on, not a black-box label.</h2>
            <p>
              Each API call returns the probability score, confidence, anomaly regions, and the operational action your
              workflow should take next.
            </p>
          </div>
          <ResultPanel result={result} onDownload={() => downloadReport(result)} />
        </section>

        <section className="section proof-section">
          <div className="section-heading">
            <p className="eyebrow">Built for fraud teams</p>
            <h2>Image, video, and voice checks in the same approval path.</h2>
          </div>
          <div className="proof-grid">
            <ProofCard
              icon={<FileImage />}
              title="Image upload API"
              text="Return a deepfake probability score from 0 to 100, plus coordinates for suspicious face regions."
            />
            <ProofCard
              icon={<FileVideo />}
              title="Video detection API"
              text="Analyze frames over time and send a per-second confidence curve for reviewer evidence."
            />
            <ProofCard
              icon={<FileAudio />}
              title="Audio detection API"
              text="Flag AI-generated voice, replay artifacts, and audio windows that need manual review."
            />
            <ProofCard
              icon={<KeyRound />}
              title="Developer dashboard"
              text="Manage API keys, team access, usage analytics, billing, and plan limits from one workspace."
            />
            <ProofCard
              icon={<Webhook />}
              title="Webhook support"
              text="Push completed checks into KYC, case-management, HR, or fraud-review systems."
            />
            <ProofCard
              icon={<Globe2 />}
              title="Global deployment"
              text="API-first design for US fintech and HR platforms, plus GCC financial KYC in Saudi Arabia and the UAE."
            />
          </div>
        </section>

        <Pricing billing={billing} setBilling={setBilling} selectedPlan={selectedPlan} openCheckout={openPlanFlow} />

        <section className="section resources-section" id="resources">
          <div className="section-heading">
            <p className="eyebrow">Useful resources</p>
            <h2>Practical pages for teams researching Deepfake Detection.</h2>
            <p>Each page answers an operational question: build, buy, evaluate, benchmark, or launch.</p>
          </div>
          <div className="resource-grid">
            {keywordPages.map((resource) => (
              <a key={resource.path} className="resource-link" href={resource.path} onClick={(event) => navigate(event, resource.path)}>
                <span>{resource.keyword}</span>
                <ArrowRight size={16} />
              </a>
            ))}
          </div>
        </section>
      </main>
      <PlanFlowModal
        open={planFlowOpen}
        billing={billing}
        setBilling={setBilling}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        onClose={() => setPlanFlowOpen(false)}
        onContinue={continuePlanFlow}
        title="Launch Deepfake Detection with the right screening tier"
        description="Start fraud scan opens plan selection first. Annual billing keeps the same path and cuts Pro to half price before secure checkout."
      />
      <CheckoutOverlay payment={payment} setPayment={setPayment} />
    </SiteShell>
  )
}

function SiteShell({ children, navigate, onCheckout }) {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" onClick={(event) => navigate(event, '/')}>
          <span className="brand-mark">DF</span>
          <span>Deepfake Detection</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/#api">API</a>
          <a href="/#scanner">Demo</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#resources">Resources</a>
          <button type="button" onClick={onCheckout}>
            Start fraud scan
          </button>
        </nav>
      </header>
      {children}
      <Footer navigate={navigate} />
    </>
  )
}

function CodeSnippet() {
  return (
    <div className="code-card" aria-label="Three line API example">
      <div className="code-title">
        <Code2 size={17} />
        <span>3-line integration</span>
      </div>
      <pre>{`const scan = await deepfake.detect({ imageUrl, webhookUrl })
if (scan.score >= 70) await blockKyc(scan.id)
return scan.anomaly_regions`}</pre>
    </div>
  )
}

function DetectorSandbox({ sample, result, scanning, uploadPreview, onChange, onFile, onSubmit }) {
  return (
    <form className="detector-panel" onSubmit={onSubmit}>
      <div className="detector-form">
        <div className="detector-top">
          <div>
            <p className="eyebrow">Live API sandbox</p>
            <h2>Upload metadata or use the sample.</h2>
          </div>
          <div className={`verdict-pill verdict-${result.verdict.toLowerCase()}`}>{result.verdict}</div>
        </div>

        <label className="upload-zone">
          <input
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
          <UploadCloud size={30} />
          <span>{sample.fileName}</span>
          <small>{sample.fileSizeMb} MB, never uploaded from this browser demo</small>
        </label>

        <div className="segmented" role="group" aria-label="Media type">
          {[
            ['image', 'Image'],
            ['video', 'Video'],
            ['audio', 'Audio'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={sample.mediaType === value ? 'active' : ''}
              type="button"
              onClick={() => onChange('mediaType', value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="field-grid">
          <label>
            Workflow
            <select value={sample.workflow} onChange={(event) => onChange('workflow', event.target.value)}>
              {workflowOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Market
            <input value={sample.region} onChange={(event) => onChange('region', event.target.value)} />
          </label>
          <label>
            Webhook URL
            <input value={sample.webhookUrl} onChange={(event) => onChange('webhookUrl', event.target.value)} />
          </label>
          <label>
            API mode
            <select value={sample.apiMode} onChange={(event) => onChange('apiMode', event.target.value)}>
              <option value="realtime">Realtime</option>
              <option value="batch">Batch review</option>
            </select>
          </label>
        </div>

        <div className="checkbox-grid">
          <label>
            <input checked={sample.livenessCheck} type="checkbox" onChange={(event) => onChange('livenessCheck', event.target.checked)} />
            Active liveness supplied
          </label>
          <label>
            <input checked={sample.referenceMatch} type="checkbox" onChange={(event) => onChange('referenceMatch', event.target.checked)} />
            Trusted reference matched
          </label>
        </div>

        <button className="btn btn-primary detector-submit" type="submit" disabled={scanning}>
          {scanning ? 'Analyzing...' : 'Run Deepfake Detection'} <ArrowRight size={18} />
        </button>
      </div>

      <div className="detector-output">
        <HeatmapPreview result={result} uploadPreview={uploadPreview} />
        <div className="score-row">
          <div>
            <span>Deepfake probability</span>
            <strong>{result.probability}/100</strong>
          </div>
          <div>
            <span>Confidence</span>
            <strong>{result.confidence}%</strong>
          </div>
          <div>
            <span>Response</span>
            <strong>{result.responseTimeMs}ms</strong>
          </div>
        </div>
        <ConfidenceCurve timeline={result.timeline} />
      </div>
    </form>
  )
}

function HeatmapPreview({ result, uploadPreview }) {
  return (
    <div className="heatmap">
      <img src={uploadPreview || '/assets/deepfake-hero.png'} alt="" />
      {result.anomalies.map((item) => (
        <span
          className={`anomaly anomaly-${item.severity}`}
          key={`${item.label}-${item.x}-${item.y}`}
          style={{ left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%` }}
        >
          {item.label}
        </span>
      ))}
    </div>
  )
}

function ConfidenceCurve({ timeline }) {
  return (
    <div className="curve" aria-label="Confidence timeline">
      {timeline.map((value, index) => (
        <span key={`${value}-${index}`} style={{ height: `${Math.max(12, value)}%` }}>
          <i>{value}</i>
        </span>
      ))}
    </div>
  )
}

function ResultPanel({ result, onDownload }) {
  return (
    <div className="result-panel">
      <div className="result-score">
        <p className="eyebrow">API verdict</p>
        <h3>{result.verdict}</h3>
        <div className="score-ring" style={{ '--score': `${result.probability}%` }}>
          <span>{result.probability}</span>
          <small>/100</small>
        </div>
      </div>
      <div className="result-detail">
        <p>{result.recommendation}</p>
        <div className="signal-list">
          {result.factors.map((factor) => (
            <div className="signal" key={factor.label}>
              {result.verdict === 'Pass' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <div>
                <strong>{factor.label}</strong>
                <span>{factor.detail}</span>
              </div>
            </div>
          ))}
        </div>
        <pre className="json-card">{JSON.stringify(result.apiResponse, null, 2)}</pre>
        <button className="btn btn-secondary" type="button" onClick={onDownload}>
          Download detection report <Download size={18} />
        </button>
      </div>
    </div>
  )
}

function ProofCard({ icon, title, text }) {
  return (
    <article className="proof-card">
      <div className="proof-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  )
}

function Pricing({ billing, setBilling, selectedPlan, openCheckout }) {
  const annual = billing === 'annual'

  return (
    <section className="section pricing-section" id="pricing">
      <div className="section-heading">
        <p className="eyebrow">Pricing</p>
        <h2>Pro annual is selected by default.</h2>
        <p>Annual billing is 50% lower than paying month to month. Pay-as-you-go is available at $0.02 per image and $0.08 per video minute.</p>
      </div>

      <div className="billing-toggle" role="group" aria-label="Billing cycle">
        <button className={annual ? 'active' : ''} type="button" onClick={() => setBilling('annual')}>
          Annual - 50% off
        </button>
        <button className={!annual ? 'active' : ''} type="button" onClick={() => setBilling('monthly')}>
          Monthly
        </button>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => {
          const isContract = plan.monthly === null
          const monthlyEquivalent = isContract ? null : annual ? plan.monthly * 0.5 : plan.monthly
          const billed = isContract ? null : annual ? monthlyEquivalent * 12 : monthlyEquivalent
          const selected = selectedPlan === plan.id
          return (
            <article className={`plan-card ${plan.recommended ? 'featured' : ''}`} key={plan.id}>
              {plan.recommended ? <span className="plan-badge">Default choice</span> : null}
              <h3>{plan.name}</h3>
              <p>{plan.summary}</p>
              <div className="plan-price">
                {isContract ? (
                  <strong>Custom</strong>
                ) : (
                  <>
                    <strong>${formatPrice(monthlyEquivalent)}</strong>
                    <span>/mo</span>
                  </>
                )}
              </div>
              <p className="billing-note">{isContract ? 'Contract pricing' : annual ? `Billed $${formatPrice(billed)} yearly` : 'Billed monthly'}</p>
              <p className="plan-limit">{plan.limit}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={16} /> {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`btn ${selected && !isContract ? 'btn-primary' : 'btn-secondary'}`}
                type="button"
                onClick={() => openCheckout(plan.id, billing)}
              >
                {isContract ? 'Contact sales' : `Continue with ${plan.name}`} <ArrowRight size={18} />
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function KeywordPage({ page, navigate, onCheckout }) {
  return (
    <main className="article-wrap">
      <article className="article">
        <a className="back-link" href="/" onClick={(event) => navigate(event, '/')}>
          Deepfake Detection API
        </a>
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.h1}</h1>
        <p className="lede">{page.lede}</p>
        <div className="intent-box">
          <strong>Best for</strong>
          <span>{page.intent}</span>
        </div>
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets.length ? (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
        <section>
          <h2>Quick answers</h2>
          {page.faqs.map((faq) => (
            <article className="faq-item" key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </section>
        <aside className="article-cta">
          <div>
            <p className="eyebrow">Next step</p>
            <h2>Test the API shape before the next fraud review.</h2>
            <p>Open the Pro annual checkout with image, video, audio, dashboard, and webhook support included.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={onCheckout}>
            Start fraud scan <ArrowRight size={18} />
          </button>
        </aside>
      </article>
    </main>
  )
}

function Privacy({ navigate }) {
  return (
    <main className="article-wrap">
      <article className="article legal">
        <a className="back-link" href="/" onClick={(event) => navigate(event, '/')}>
          Deepfake Detection API
        </a>
        <h1>Privacy Policy</h1>
        <p className="lede">
          Deepfake Detection collects only the information needed to operate the site, demo scanner, checkout, support,
          analytics, and API-related communications.
        </p>
        <section>
          <h2>Information processed</h2>
          <p>
            You may provide business contact details, support messages, demo metadata, selected plan details, webhook
            endpoints, and payment metadata. In the browser demo, selected media stays local unless a production API
            agreement or upload flow explicitly says otherwise. Payment card data is handled by hosted checkout and is
            not stored by this site.
          </p>
        </section>
        <section>
          <h2>Use of information</h2>
          <p>
            Information is used to provide the scanner experience, create checkout sessions, respond to support, monitor
            reliability, analyze conversion and usage, prevent abuse, comply with legal obligations, and improve the
            service.
          </p>
        </section>
        <section>
          <h2>Retention and security</h2>
          <p>
            Operational records are kept only as long as reasonably needed for service delivery, security, accounting,
            dispute handling, abuse prevention, and legal obligations. Secrets are not committed to source code, and
            production payment uses hosted checkout.
          </p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>
            Privacy and support questions can be sent to <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
          </p>
        </section>
      </article>
    </main>
  )
}

function Terms({ navigate }) {
  return (
    <main className="article-wrap">
      <article className="article legal">
        <a className="back-link" href="/" onClick={(event) => navigate(event, '/')}>
          Deepfake Detection API
        </a>
        <h1>Terms of Service</h1>
        <p className="lede">
          These terms govern access to Deepfake Detection, including the demo scanner, API materials, checkout, support,
          and related documentation.
        </p>
        <section>
          <h2>Screening aid, not a guarantee</h2>
          <p>
            The service provides probabilistic screening, workflow routing, and supporting evidence. It does not
            guarantee fraud prevention, identity verification, legal compliance, regulatory approval, audit results,
            litigation outcomes, or uninterrupted operation.
          </p>
        </section>
        <section>
          <h2>Your responsibilities</h2>
          <p>
            You are responsible for your use of the service, the accuracy and legality of submitted data, notices and
            consents for identity media, human review policies, final onboarding or employment decisions, retention
            settings, and compliance with laws that apply to your business.
          </p>
        </section>
        <section>
          <h2>Payment and subscriptions</h2>
          <p>
            Paid plans are charged through hosted checkout. Plan limits, taxes, renewal, cancellation, and refund
            eligibility may depend on the checkout terms displayed at purchase and any non-waivable law that applies.
          </p>
        </section>
        <section>
          <h2>Acceptable use</h2>
          <p>
            You may not use the service to build, distribute, or improve deepfakes, evade detection, harass people,
            process unlawful biometric data, attack systems, or make fully automated high-impact decisions without
            appropriate legal basis and human oversight.
          </p>
        </section>
        <section>
          <h2>Liability limits</h2>
          <p>
            To the maximum extent permitted by law, the service is provided as is and as available. The operator
            disclaims implied warranties and is not liable for indirect, incidental, special, consequential, exemplary,
            punitive, lost-profit, lost-data, fraud-loss, or business-interruption damages. Total liability is limited to
            the amount paid for the service in the three months before the claim, unless a non-waivable law requires
            otherwise.
          </p>
        </section>
        <section>
          <h2>Disputes</h2>
          <p>
            Before filing a claim, you agree to contact support and attempt a good-faith resolution. Class, collective,
            and representative actions are waived to the maximum extent permitted by law.
          </p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>
            Terms and support questions can be sent to <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
          </p>
        </section>
      </article>
    </main>
  )
}

function Footer({ navigate }) {
  return (
    <footer className="site-footer">
      <div>
        <a className="brand" href="/" onClick={(event) => navigate(event, '/')}>
          <span className="brand-mark">DF</span>
          <span>Deepfake Detection</span>
        </a>
        <p>
          Serving global API customers. Initial market focus: United States fintech and HR platforms, plus Middle East
          financial KYC teams in Saudi Arabia and the UAE.
        </p>
        <p>
          Support: <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <a href="/privacy" onClick={(event) => navigate(event, '/privacy')}>
          Privacy
        </a>
        <a href="/terms" onClick={(event) => navigate(event, '/terms')}>
          Terms
        </a>
        <a href="/sitemap.xml">Sitemap</a>
        <a href="/resources/deepfake-detection-online" onClick={(event) => navigate(event, '/resources/deepfake-detection-online')}>
          Deepfake detection online
        </a>
      </nav>
    </footer>
  )
}

function PlanFlowModal({ open, billing, setBilling, selectedPlan, setSelectedPlan, onClose, onContinue, title, description }) {
  if (!open) return null

  const annual = billing === 'annual'
  const activePlan = plans.find((plan) => plan.id === selectedPlan) || plans[1]
  const paidPlans = plans.filter((plan) => plan.monthly !== null)
  const activeMonthly = activePlan.monthly === null ? null : annual ? activePlan.monthly * 0.5 : activePlan.monthly
  const activeYearly = activeMonthly === null ? null : activeMonthly * 12

  return (
    <div
      className="plan-flow-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-flow-title"
      onClick={(event) => {
        if (event.currentTarget === event.target) onClose()
      }}
    >
      <div className="plan-flow-modal">
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close plan chooser">
          <X size={18} />
        </button>
        <p className="eyebrow">Choose your plan</p>
        <h2 id="plan-flow-title">{title}</h2>
        <p>{description}</p>

        <div className="billing-toggle compact" role="group" aria-label="Billing cycle">
          <button className={annual ? 'active' : ''} type="button" onClick={() => setBilling('annual')}>
            Yearly 50% off
          </button>
          <button className={!annual ? 'active' : ''} type="button" onClick={() => setBilling('monthly')}>
            Monthly
          </button>
        </div>

        <div className="plan-flow-grid">
          {paidPlans.map((plan) => {
            const monthly = annual ? plan.monthly * 0.5 : plan.monthly
            const yearly = monthly * 12
            const active = selectedPlan === plan.id
            return (
              <button
                type="button"
                key={plan.id}
                className={`plan-flow-card ${active ? 'selected' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <span>{plan.limit}</span>
                <strong>{plan.name}</strong>
                <small>{plan.summary}</small>
                <b>${formatPrice(monthly)} /mo</b>
                <em>{annual ? `Billed $${formatPrice(yearly)} yearly` : 'Billed monthly'}</em>
              </button>
            )
          })}
        </div>

        <div className="plan-flow-footer">
          <div>
            <span>Selected plan</span>
            <strong>
              {activePlan.name} · {annual ? 'Yearly' : 'Monthly'}
            </strong>
            <small>
              {activeYearly === null
                ? 'Contract pricing'
                : annual
                  ? `Billed $${formatPrice(activeYearly)} yearly. Equivalent to $${formatPrice(activeMonthly)} per month.`
                  : `$${formatPrice(activeMonthly)} charged monthly.`}
            </small>
          </div>
          <div className="plan-flow-actions">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Not now
            </button>
            <button className="btn btn-primary" type="button" onClick={onContinue}>
              Continue to Payment <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckoutOverlay({ payment, setPayment }) {
  if (!payment.open) return null

  return (
    <div className="checkout-overlay" role="dialog" aria-modal="true" aria-label="Checkout status">
      <div className="checkout-modal">
        <button className="icon-button" type="button" onClick={() => setPayment({ open: false, loading: false, error: '', url: '' })}>
          <X size={18} />
        </button>
        <p className="eyebrow">Secure checkout</p>
        <h2>{payment.error ? 'Checkout needs attention' : payment.loading ? 'Opening Creem checkout' : 'Checkout is open'}</h2>
        <p>
          {payment.error
            ? payment.error
            : 'The payment window is centered while this page stays open. After payment, checkout returns to the Deepfake Detection homepage.'}
        </p>
        {payment.url ? (
          <button className="btn btn-primary" type="button" onClick={() => window.open(payment.url, 'creemCheckout', centeredPopupFeatures(560, 760))}>
            Reopen payment window <ArrowRight size={18} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function centeredPopupFeatures(width, height) {
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2))
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2))
  return `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
}

function formatPrice(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function downloadReport(result) {
  const body = `${buildReportLines(result).join('\n')}\n\nJSON\n${JSON.stringify(result.apiResponse, null, 2)}\n`
  const blob = new Blob([body], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${result.apiResponse.id}-deepfake-detection-report.txt`
  anchor.click()
  URL.revokeObjectURL(url)
  trackEvent('report_download', { verdict: result.verdict, score: result.probability })
}
