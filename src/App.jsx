import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  Database,
  Download,
  ExternalLink,
  LineChart,
  MailCheck,
  PackageCheck,
  PackageX,
  RefreshCw,
  ShoppingCart,
  Slack,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  X,
} from 'lucide-react'

import { keywordPages } from './content/keyword-pages.js'
import { trackEvent } from './lib/analytics.js'
import { buildReportLines, DEFAULT_SKU, forecastDemand } from './lib/forecast.js'
import { SITE, applyDocumentSeo, getPageByPath } from './lib/seo.js'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 49,
    limit: '<=100 SKU',
    summary: 'For a lean Shopify store that needs a clean weekly reorder list.',
    features: ['Shopify sales sync', '30/60/90 day forecasts', 'Reorder quantity and date', 'Email risk alerts'],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthly: 149,
    limit: '<=1000 SKU',
    summary: 'The default plan for growing stores with promotions and supplier lead times.',
    features: ['Everything in Starter', 'Promotion and seasonality adjustments', 'Slack alerts', 'Forecast accuracy tracking'],
    recommended: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 299,
    limit: 'Unlimited SKU + multi-store',
    summary: 'For operators managing multiple stores, broad catalogs, or purchase teams.',
    features: ['Everything in Growth', 'Unlimited SKU', 'Multi-store rollups', 'Priority onboarding'],
  },
]

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/')
  const [skuInput, setSkuInput] = useState(DEFAULT_SKU)
  const [result, setResult] = useState(() => forecastDemand(DEFAULT_SKU))
  const [billing, setBilling] = useState('annual')
  const [selectedPlan, setSelectedPlan] = useState('growth')
  const [payment, setPayment] = useState({ open: false, loading: false, error: '', url: '' })
  const [successNotice, setSuccessNotice] = useState(false)

  const page = useMemo(() => getPageByPath(path), [path])
  const annual = billing === 'annual'

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname.replace(/\/+$/, '') || '/')
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (path === '/') applyDocumentSeo(null)
    else if (page) applyDocumentSeo(page)
    else {
      document.title = `${path === '/privacy' ? 'Privacy' : 'Terms'} | ${SITE.name}`
    }
    trackEvent('page_view', { route: path })
  }, [path, page])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      setSuccessNotice(true)
      trackEvent('checkout_success_return')
      window.history.replaceState({}, '', '/')
      setPath('/')
    }
  }, [])

  function updateField(name, value) {
    setSkuInput((current) => ({ ...current, [name]: value }))
  }

  function runForecast(event) {
    event.preventDefault()
    const next = forecastDemand(skuInput)
    setResult(next)
    trackEvent('forecast_complete', {
      sku: next.sku.sku,
      stockoutRisk: next.stockoutRisk,
      overstockRisk: next.overstockRisk,
      reorderQuantity: next.reorderQuantity,
    })
    document.getElementById('forecast-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function navigate(event, href) {
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.includes('#')) return
    event.preventDefault()
    window.history.pushState({}, '', href)
    setPath(href.replace(/\/+$/, '') || '/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function openCheckout(planId = selectedPlan, cycle = billing) {
    setSelectedPlan(planId)
    setBilling(cycle)
    setPayment({ open: true, loading: true, error: '', url: '' })
    trackEvent('checkout_click', { planId, billing: cycle })

    const popup = window.open('', 'creemCheckout', centeredPopupFeatures(560, 760))
    if (popup) {
      popup.document.write(
        '<!doctype html><title>Secure checkout</title><body style="font-family:Arial,sans-serif;padding:28px;background:#f5f7f1;color:#12372f"><h1>Opening secure checkout...</h1><p>You can keep AI Demand Forecasting open in the original tab.</p></body>',
      )
      popup.document.close()
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billing: cycle }),
      })
      const payload = await response.json()
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

  if (page) {
    return (
      <SiteShell navigate={navigate} onCheckout={() => openCheckout('growth', 'annual')}>
        <KeywordPage page={page} navigate={navigate} onCheckout={() => openCheckout('growth', 'annual')} />
        <CheckoutOverlay payment={payment} setPayment={setPayment} />
      </SiteShell>
    )
  }

  if (path === '/privacy' || path === '/terms') {
    return (
      <SiteShell navigate={navigate} onCheckout={() => openCheckout('growth', 'annual')}>
        {path === '/privacy' ? <Privacy navigate={navigate} /> : <Terms navigate={navigate} />}
        <CheckoutOverlay payment={payment} setPayment={setPayment} />
      </SiteShell>
    )
  }

  return (
    <SiteShell navigate={navigate} onCheckout={() => openCheckout('growth', 'annual')}>
      <main>
        <section className="hero" id="forecast">
          <div className="hero-copy">
            <p className="eyebrow">AI Demand Forecasting for Shopify sellers</p>
            <h1>Know what to reorder before inventory turns red.</h1>
            <p className="lede">
              Connect Shopify, read 180 days of sales, and get SKU-level 30, 60, and 90 day forecasts with reorder
              quantities, order dates, and red-risk alerts.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#forecast-result">
                See reorder advice <ArrowRight size={18} />
              </a>
              <button className="btn btn-quiet" type="button" onClick={() => openCheckout('growth', 'annual')}>
                Start Growth annual
              </button>
            </div>
            <div className="trust-row" aria-label="Demand forecasting proof points">
              <span>
                <Store size={16} /> Shopify first
              </span>
              <span>
                <LineChart size={16} /> 30/60/90 forecasts
              </span>
              <span>
                <Bell size={16} /> Email and Slack alerts
              </span>
            </div>
          </div>

          <ForecastWorkbench input={skuInput} result={result} onChange={updateField} onSubmit={runForecast} />
        </section>

        {successNotice ? (
          <section className="success-band" aria-label="Checkout success">
            <CheckCircle2 size={20} />
            <span>Payment returned successfully. Check your inbox for the Creem receipt and onboarding next steps.</span>
          </section>
        ) : null}

        <section className="metric-band" aria-label="Product metrics">
          <div>
            <p className="eyebrow">Sales history</p>
            <strong>180 days</strong>
            <span>pulled from Shopify on install</span>
          </div>
          <div>
            <p className="eyebrow">Forecast horizon</p>
            <strong>30/60/90</strong>
            <span>SKU-level demand windows</span>
          </div>
          <div>
            <p className="eyebrow">Planning output</p>
            <strong>PO-ready</strong>
            <span>quantity, date, and risk reason</span>
          </div>
        </section>

        <section className="section" id="forecast-result">
          <div className="section-heading">
            <p className="eyebrow">Decision-ready output</p>
            <h2>The forecast becomes a replenishment list, not another chart.</h2>
            <p>
              Buyers see which SKUs need action, how much to order, when to order, and why the risk changed. Forecast
              accuracy is tracked after the period closes.
            </p>
          </div>
          <ForecastResult result={result} onDownload={() => downloadPdfReport(result)} />
        </section>

        <section className="section workflow-section">
          <div className="section-heading">
            <p className="eyebrow">MVP workflow</p>
            <h2>Built for the weekly inventory meeting.</h2>
          </div>
          <div className="workflow-grid">
            <ProofCard
              icon={<Database />}
              title="Install and sync"
              text="Shopify App install pulls historical sales, products, variants, and inventory context without a spreadsheet ritual."
            />
            <ProofCard
              icon={<TrendingUp />}
              title="Forecast demand"
              text="Models adjust SKU demand for seasonality, promotions, recent velocity, and lead-time uncertainty."
            />
            <ProofCard
              icon={<Truck />}
              title="Reorder on time"
              text="Each SKU gets a suggested quantity, suggested order date, and a reason the buyer can verify."
            />
            <ProofCard
              icon={<RefreshCw />}
              title="Close the loop"
              text="Actual sales are compared with the forecast so planners know which products need model or assumption review."
            />
          </div>
        </section>

        <section className="section proof-section">
          <div className="section-heading">
            <p className="eyebrow">Why sellers switch</p>
            <h2>Inventory cash gets easier to manage when the next action is obvious.</h2>
          </div>
          <div className="proof-grid">
            <SignalCard
              icon={<PackageX />}
              title="Stockout prevention"
              value={`${result.stockoutRisk}/100`}
              text="Red-risk alerts appear before lead time makes the SKU unrecoverable."
            />
            <SignalCard
              icon={<PackageCheck />}
              title="Overstock control"
              value={`${result.daysOfCover} days`}
              text="Slow movers are visible before another purchase order turns cash into shelf inventory."
            />
            <SignalCard
              icon={<BadgeCheck />}
              title="Accuracy tracking"
              value={`${result.sku.forecastAccuracyPct}%`}
              text="Actual versus forecast review keeps the model grounded in seller reality."
            />
          </div>
        </section>

        <Pricing billing={billing} setBilling={setBilling} selectedPlan={selectedPlan} openCheckout={openCheckout} />

        <section className="section resources-section" id="resources">
          <div className="section-heading">
            <p className="eyebrow">Operator resources</p>
            <h2>Useful pages for the demand planning questions buyers already ask.</h2>
            <p>Each page is written for practical decisions: tools, models, examples, vendor fit, and retail use cases.</p>
          </div>
          <div className="resource-grid">
            {keywordPages.map((resource) => (
              <a
                key={resource.path}
                className="resource-link"
                href={resource.path}
                onClick={(event) => navigate(event, resource.path)}
              >
                <span>{resource.keyword}</span>
                <ArrowRight size={16} />
              </a>
            ))}
          </div>
        </section>
      </main>
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
          <span>AI Demand Forecasting</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/#forecast">Forecast</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#resources">Resources</a>
          <button type="button" onClick={onCheckout}>
            Checkout
          </button>
        </nav>
      </header>
      {children}
      <Footer navigate={navigate} />
    </>
  )
}

function ForecastWorkbench({ input, result, onChange, onSubmit }) {
  return (
    <form className="forecast-panel" onSubmit={onSubmit}>
      <div className="panel-top">
        <div>
          <p className="eyebrow">Live SKU forecast</p>
          <h2>Replenishment preview</h2>
        </div>
        <div className={`risk-pill ${result.stockoutRisk >= 70 ? 'risk-high' : result.stockoutRisk >= 45 ? 'risk-medium' : 'risk-low'}`}>
          {result.stockoutRisk >= 70 ? 'High risk' : result.stockoutRisk >= 45 ? 'Watch' : 'Healthy'}
        </div>
      </div>

      <div className="field-grid">
        <label>
          SKU
          <input value={input.sku} onChange={(event) => onChange('sku', event.target.value)} />
        </label>
        <label>
          Channel
          <input value={input.channel} onChange={(event) => onChange('channel', event.target.value)} />
        </label>
        <NumberField label="Sales last 30 days" value={input.salesLast30} onChange={(value) => onChange('salesLast30', value)} />
        <NumberField label="Inventory on hand" value={input.inventoryOnHand} onChange={(value) => onChange('inventoryOnHand', value)} />
        <NumberField label="Inbound units" value={input.inboundUnits} onChange={(value) => onChange('inboundUnits', value)} />
        <NumberField label="Lead time days" value={input.leadTimeDays} onChange={(value) => onChange('leadTimeDays', value)} />
        <NumberField label="Promo lift %" value={input.promoLiftPct} onChange={(value) => onChange('promoLiftPct', value)} />
        <NumberField label="Seasonality %" value={input.seasonalityPct} onChange={(value) => onChange('seasonalityPct', value)} />
      </div>

      <div className="mini-dashboard" aria-label="Forecast summary">
        <div>
          <span>30 day</span>
          <strong>{result.forecasts[30]}</strong>
          <small>units</small>
        </div>
        <div>
          <span>60 day</span>
          <strong>{result.forecasts[60]}</strong>
          <small>units</small>
        </div>
        <div>
          <span>90 day</span>
          <strong>{result.forecasts[90]}</strong>
          <small>units</small>
        </div>
      </div>

      <div className="panel-footer">
        <div>
          <CalendarClock size={18} />
          <span>Order by {result.orderDate}</span>
        </div>
        <button className="btn btn-primary" type="submit">
          Forecast SKU <Sparkles size={18} />
        </button>
      </div>
    </form>
  )
}

function NumberField({ label, value, onChange }) {
  return (
    <label>
      {label}
      <input type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function ForecastResult({ result, onDownload }) {
  return (
    <div className="result-panel">
      <div className="result-score">
        <p className="eyebrow">Recommended action</p>
        <h3>Reorder {result.reorderQuantity} units</h3>
        <div className="score-ring" style={{ '--score': `${Math.max(4, 100 - result.stockoutRisk)}%` }}>
          <span>{result.daysOfCover}</span>
          <small>days cover</small>
        </div>
      </div>
      <div className="result-detail">
        <div className="decision-grid">
          <DecisionItem icon={<Clock />} label="Suggested order date" value={result.orderDate} />
          <DecisionItem icon={<ShoppingCart />} label="Reorder point" value={`${result.reorderPoint} units`} />
          <DecisionItem icon={<PackageCheck />} label="Safety stock" value={`${result.safetyStock} units`} />
          <DecisionItem icon={<BarChart3 />} label="Accuracy status" value={result.accuracyStatus} />
        </div>
        <ForecastChart result={result} />
        <div className="signal-list">
          {result.alerts.map((alert) => (
            <div className={`signal ${alert.toLowerCase().includes('high') ? 'signal-warning' : ''}`} key={alert}>
              {alert.toLowerCase().includes('high') ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <div>
                <strong>{alert}</strong>
                <span>
                  Stockout risk {result.stockoutRisk}/100. Overstock risk {result.overstockRisk}/100.
                </span>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" type="button" onClick={onDownload}>
          Export forecast report <Download size={18} />
        </button>
      </div>
    </div>
  )
}

function ForecastChart({ result }) {
  const max = Math.max(...result.chart.flatMap((point) => [point.actual, point.predicted]), 1)
  return (
    <div className="forecast-chart" aria-label="Actual versus predicted forecast chart">
      <div className="chart-legend">
        <span>
          <i className="predicted-dot" /> Predicted
        </span>
        <span>
          <i className="actual-dot" /> Actual
        </span>
      </div>
      <div className="chart-bars">
        {result.chart.map((point) => (
          <div className="chart-week" key={point.week}>
            <div className="bar-pair">
              <span style={{ height: `${Math.max(12, (point.predicted / max) * 118)}px` }} />
              <span style={{ height: `${Math.max(12, (point.actual / max) * 118)}px` }} />
            </div>
            <small>W{point.week}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

function DecisionItem({ icon, label, value }) {
  return (
    <div className="decision-item">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
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

function SignalCard({ icon, title, value, text }) {
  return (
    <article className="signal-card">
      <div className="proof-icon">{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
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
        <h2>Growth annual is selected by default.</h2>
        <p>Annual billing is 50% lower than paying month to month. Checkout opens in a centered Creem window.</p>
      </div>

      <div className="billing-toggle" role="group" aria-label="Billing cycle">
        <button className={annual ? 'active' : ''} type="button" onClick={() => setBilling('annual')}>
          Annual - save 50%
        </button>
        <button className={!annual ? 'active' : ''} type="button" onClick={() => setBilling('monthly')}>
          Monthly
        </button>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => {
          const monthlyEquivalent = annual ? plan.monthly * 0.5 : plan.monthly
          const billed = annual ? monthlyEquivalent * 12 : monthlyEquivalent
          const selected = selectedPlan === plan.id
          return (
            <article className={`plan-card ${plan.recommended ? 'featured' : ''}`} key={plan.id}>
              {plan.recommended ? <span className="plan-badge">Default choice</span> : null}
              <h3>{plan.name}</h3>
              <p>{plan.summary}</p>
              <div className="plan-price">
                <strong>${formatPrice(monthlyEquivalent)}</strong>
                <span>/mo</span>
              </div>
              <p className="billing-note">{annual ? `Billed $${formatPrice(billed)} yearly` : 'Billed monthly'}</p>
              <p className="plan-limit">{plan.limit}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <CheckCircle2 size={16} /> {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`btn ${selected ? 'btn-primary' : 'btn-secondary'}`}
                type="button"
                onClick={() => openCheckout(plan.id, billing)}
              >
                Checkout <ArrowRight size={18} />
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
          AI Demand Forecasting workspace
        </a>
        <p className="eyebrow">{page.eyebrow}</p>
        <h1>{page.h1}</h1>
        <p className="lede">{page.lede}</p>
        <div className="intent-box">
          <strong>Best for</strong>
          <span>{page.intent}</span>
        </div>
        {page.links.length ? (
          <div className="official-links">
            {page.links.map((link) => (
              <a href={link} key={link} target="_blank" rel="noreferrer">
                Reference <ExternalLink size={15} />
              </a>
            ))}
          </div>
        ) : null}
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
            <h2>Run a real SKU through the forecast.</h2>
            <p>Turn the idea into a reorder quantity, order date, and risk alert your buyer can review.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={onCheckout}>
            Start Growth annual <ArrowRight size={18} />
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
          AI Demand Forecasting workspace
        </a>
        <h1>Privacy Policy</h1>
        <p className="lede">
          AI Demand Forecasting collects only the information needed to operate forecasts, checkout, support, security,
          analytics, and service improvement.
        </p>
        <section>
          <h2>Information we process</h2>
          <p>
            You may provide SKU names, sales counts, inventory levels, lead times, promotion assumptions, email
            addresses, support messages, and payment metadata. Payment card details are processed by the hosted payment
            provider and are not stored by this site.
          </p>
        </section>
        <section>
          <h2>How information is used</h2>
          <p>
            Information is used to provide forecasts, operate checkout, return payment status, respond to support
            requests, detect abuse, measure product reliability, understand conversion performance, and improve the
            service.
          </p>
        </section>
        <section>
          <h2>Service providers</h2>
          <p>
            Cloudflare supports hosting, routing, security, analytics infrastructure, and edge execution. Creem supports
            hosted checkout and payment processing. GitHub may be used for code deployment and operational records.
          </p>
        </section>
        <section>
          <h2>Retention and security</h2>
          <p>
            Operational records are kept only as long as reasonably needed for service operation, security, accounting,
            dispute handling, and legal obligations. Secrets are not committed to source code. No internet service can be
            guaranteed perfectly secure.
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
          AI Demand Forecasting workspace
        </a>
        <h1>Terms of Service</h1>
        <p className="lede">
          These terms govern access to AI Demand Forecasting, including forecasts, alerts, reports, checkout, support,
          and related materials.
        </p>
        <section>
          <h2>Planning aid only</h2>
          <p>
            The service provides inventory planning assistance, forecasts, alerts, and workflow outputs. It does not
            provide financial, legal, tax, accounting, procurement, or supply-chain professional advice. Forecasts are
            estimates and do not guarantee demand, revenue, margin, inventory availability, supplier performance, or any
            business outcome.
          </p>
        </section>
        <section>
          <h2>Your responsibilities</h2>
          <p>
            You are responsible for the accuracy of information supplied to the service, for reviewing all forecasts and
            purchase recommendations before acting, for supplier negotiations and purchase commitments, for maintaining
            your own backups and records, and for compliance with laws and marketplace rules that apply to your business.
          </p>
        </section>
        <section>
          <h2>Subscriptions and payment</h2>
          <p>
            Paid plans are charged through hosted checkout. Plan limits, billing cadence, taxes, renewal, cancellation,
            refunds, and payment disputes may depend on checkout terms shown at purchase and non-waivable law. Access may
            be suspended for failed payment, abuse, security risk, or violation of these terms.
          </p>
        </section>
        <section>
          <h2>No warranties</h2>
          <p>
            To the maximum extent permitted by law, the service is provided as is and as available. The operator
            disclaims all warranties, including implied warranties of merchantability, fitness for a particular purpose,
            non-infringement, accuracy, uninterrupted availability, and error-free operation.
          </p>
        </section>
        <section>
          <h2>Liability limits</h2>
          <p>
            To the maximum extent permitted by law, the operator will not be liable for indirect, incidental, special,
            consequential, exemplary, punitive, lost profit, lost revenue, lost data, lost inventory, procurement, or
            supply-chain damages. Total liability is limited to the amount paid for the service in the three months before
            the claim, unless a non-waivable law requires otherwise.
          </p>
        </section>
        <section>
          <h2>Disputes</h2>
          <p>
            Before filing a claim, you agree to contact support and attempt a good-faith resolution. Class, collective,
            and representative actions are waived to the maximum extent permitted by law. If a court finds any term
            unenforceable, the remaining terms remain in effect.
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
          <span>AI Demand Forecasting</span>
        </a>
        <p>{SITE.marketFocus}</p>
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
        <a
          href="/resources/demand-forecasting-ai-tools"
          onClick={(event) => navigate(event, '/resources/demand-forecasting-ai-tools')}
        >
          Tools guide
        </a>
      </nav>
    </footer>
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
            : 'The payment window is centered while this page stays open. Payment returns to the AI Demand Forecasting homepage.'}
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

function downloadPdfReport(result) {
  const lines = buildReportLines(result).flatMap((line) => wrapLine(line, 88))
  const pdf = buildPdf(lines)
  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${result.sku.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'sku'}-forecast-report.pdf`
  anchor.click()
  URL.revokeObjectURL(url)
  trackEvent('pdf_export', { stockoutRisk: result.stockoutRisk })
}

function wrapLine(line, maxLength) {
  if (!line) return ['']
  const words = String(line).split(/\s+/)
  const lines = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxLength && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

function buildPdf(lines) {
  const encoder = new TextEncoder()
  const objects = [null]
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = ''
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'

  const chunks = []
  for (let index = 0; index < lines.length; index += 45) chunks.push(lines.slice(index, index + 45))
  const pageRefs = []

  for (const chunk of chunks) {
    const stream = renderPdfTextStream(chunk)
    const contentId = objects.push(`<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`) - 1
    const pageId =
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
      ) - 1
    pageRefs.push(`${pageId} 0 R`)
  }

  objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageRefs.length} >>`

  let output = '%PDF-1.4\n'
  const offsets = [0]
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = encoder.encode(output).length
    output += `${index} 0 obj\n${objects[index]}\nendobj\n`
  }
  const xrefOffset = encoder.encode(output).length
  output += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let index = 1; index < objects.length; index += 1) {
    output += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  output += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return output
}

function renderPdfTextStream(lines) {
  const escaped = lines.map((line) => `(${escapePdfText(line)}) Tj`)
  return `BT\n/F1 11 Tf\n54 748 Td\n14 TL\n${escaped.join('\nT*\n')}\nET`
}

function escapePdfText(value) {
  return String(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}
