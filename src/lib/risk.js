export const MODALITY_FACTORS = {
  image: {
    label: 'Image',
    base: 48,
    signals: ['face boundary artifacts', 'specular mismatch', 'skin texture repetition', 'eye reflection drift'],
  },
  video: {
    label: 'Video',
    base: 58,
    signals: ['temporal face jitter', 'blink cadence anomaly', 'compression mismatch', 'mouth sync drift'],
  },
  audio: {
    label: 'Audio',
    base: 54,
    signals: ['prosody flattening', 'vocoder residue', 'breath pattern gap', 'speaker embedding drift'],
  },
}

export const WORKFLOW_FACTORS = {
  'fintech-kyc': { label: 'Fintech KYC', lift: 14 },
  'bank-onboarding': { label: 'Bank onboarding', lift: 12 },
  'crypto-exchange': { label: 'Crypto exchange KYC', lift: 13 },
  'hr-verification': { label: 'HR identity verification', lift: 9 },
  'marketplace-trust': { label: 'Marketplace trust and safety', lift: 6 },
}

export function normalizeSample(input = {}) {
  const mediaType = MODALITY_FACTORS[input.mediaType] ? input.mediaType : inferMediaType(input.fileType, input.fileName)
  const workflow = WORKFLOW_FACTORS[input.workflow] ? input.workflow : 'fintech-kyc'

  return {
    fileName: String(input.fileName || '').trim() || sampleNameFor(mediaType),
    fileType: String(input.fileType || '').trim() || defaultMimeFor(mediaType),
    fileSizeMb: Number.isFinite(Number(input.fileSizeMb)) ? Number(input.fileSizeMb) : mediaType === 'video' ? 18.4 : 3.2,
    mediaType,
    workflow,
    region: String(input.region || '').trim() || 'United States fintech onboarding',
    livenessCheck: Boolean(input.livenessCheck),
    referenceMatch: Boolean(input.referenceMatch),
    webhookUrl: String(input.webhookUrl || '').trim(),
    apiMode: input.apiMode === 'batch' ? 'batch' : 'realtime',
  }
}

export function inferMediaType(fileType = '', fileName = '') {
  const value = `${fileType} ${fileName}`.toLowerCase()
  if (value.includes('audio') || /\.(mp3|wav|m4a|aac|ogg)$/i.test(value)) return 'audio'
  if (value.includes('video') || /\.(mp4|mov|webm|mkv)$/i.test(value)) return 'video'
  return 'image'
}

export function classifyMediaSample(input = {}) {
  const sample = normalizeSample(input)
  const modality = MODALITY_FACTORS[sample.mediaType]
  const workflow = WORKFLOW_FACTORS[sample.workflow]
  const hash = stableHash(`${sample.fileName}:${sample.fileType}:${sample.region}:${sample.workflow}`)
  const sizeLift = Math.min(10, Math.max(0, sample.fileSizeMb - 2) * (sample.mediaType === 'video' ? 0.42 : 0.85))
  const controlDiscount = (sample.livenessCheck ? 10 : 0) + (sample.referenceMatch ? 7 : 0)
  const modeLift = sample.apiMode === 'batch' ? -3 : 0
  const probability = clamp(Math.round(modality.base + workflow.lift + (hash % 17) - 8 + sizeLift + modeLift - controlDiscount), 8, 97)
  const confidence = clamp(Math.round(88 - Math.abs(70 - probability) * 0.18 + (hash % 6)), 61, 98)
  const verdict = probability >= 82 ? 'Block' : probability >= 62 ? 'Review' : 'Pass'
  const severity = probability >= 82 ? 'critical' : probability >= 62 ? 'elevated' : 'low'
  const responseTimeMs = sample.mediaType === 'video' ? 1280 + (hash % 360) : sample.mediaType === 'audio' ? 760 + (hash % 240) : 420 + (hash % 180)
  const anomalies = buildAnomalies(sample.mediaType, probability, hash)
  const timeline = buildTimeline(sample.mediaType, probability, hash)
  const apiResponse = {
    id: `df_${hash.toString(16).padStart(8, '0')}`,
    score: probability,
    confidence,
    verdict,
    media_type: sample.mediaType,
    anomaly_regions: anomalies.map(({ label, x, y, width, height }) => ({ label, x, y, width, height })),
    webhook: sample.webhookUrl ? 'queued' : 'not_configured',
  }

  return {
    sample,
    probability,
    confidence,
    verdict,
    severity,
    responseTimeMs,
    anomalies,
    timeline,
    apiResponse,
    factors: buildFactors(sample, probability),
    recommendation: recommendationFor(verdict, sample),
  }
}

export function buildReportLines(result) {
  const { sample, probability, confidence, verdict, responseTimeMs, factors, anomalies, recommendation } = result
  return [
    'Deepfake Detection report',
    '',
    `File: ${sample.fileName}`,
    `Media type: ${sample.mediaType}`,
    `Workflow: ${WORKFLOW_FACTORS[sample.workflow]?.label || sample.workflow}`,
    `Region: ${sample.region}`,
    `Deepfake probability: ${probability}/100`,
    `Model confidence: ${confidence}%`,
    `Verdict: ${verdict}`,
    `Response time: ${responseTimeMs} ms`,
    '',
    'Primary factors',
    ...factors.map((factor) => `${factor.label}: ${factor.detail}`),
    '',
    'Anomaly regions',
    ...(anomalies.length ? anomalies.map((item) => `${item.label} at ${item.x}%,${item.y}%`) : ['No visible anomaly region returned.']),
    '',
    'Recommended action',
    recommendation,
    '',
    'This report is a screening aid. Production decisions should combine liveness, document checks, policy rules, and human review.',
  ]
}

function buildFactors(sample, probability) {
  const modality = MODALITY_FACTORS[sample.mediaType]
  const workflow = WORKFLOW_FACTORS[sample.workflow]
  const factors = modality.signals.slice(0, 3).map((signal, index) => ({
    label: signal,
    detail: index === 0 ? `${probability >= 62 ? 'material' : 'minor'} signal detected` : 'included in ensemble score',
  }))

  factors.push({
    label: workflow.label,
    detail: 'risk threshold tightened for identity and account-opening workflows',
  })

  if (sample.livenessCheck) factors.push({ label: 'liveness check', detail: 'reduced risk because active liveness was supplied' })
  if (sample.referenceMatch) factors.push({ label: 'reference match', detail: 'reduced risk because a trusted reference identity was supplied' })
  return factors
}

function buildAnomalies(mediaType, probability, hash) {
  if (probability < 42) return []

  const base =
    mediaType === 'audio'
      ? [
          { label: 'synthetic prosody window', x: 20, y: 58, width: 27, height: 18 },
          { label: 'vocoder residue', x: 61, y: 48, width: 22, height: 24 },
        ]
      : mediaType === 'video'
        ? [
            { label: 'mouth sync drift', x: 42, y: 55, width: 18, height: 14 },
            { label: 'temporal face jitter', x: 28, y: 24, width: 17, height: 19 },
            { label: 'lighting inconsistency', x: 62, y: 27, width: 21, height: 25 },
          ]
        : [
            { label: 'eye reflection mismatch', x: 31, y: 25, width: 16, height: 16 },
            { label: 'skin texture repeat', x: 57, y: 37, width: 20, height: 23 },
          ]

  return base.slice(0, probability > 78 ? base.length : Math.max(1, base.length - 1)).map((item, index) => ({
    ...item,
    x: clamp(item.x + ((hash + index * 11) % 7) - 3, 5, 82),
    y: clamp(item.y + ((hash + index * 13) % 7) - 3, 5, 82),
    severity: probability > 78 ? 'high' : 'medium',
  }))
}

function buildTimeline(mediaType, probability, hash) {
  const count = mediaType === 'image' ? 6 : 10
  return Array.from({ length: count }, (_, index) => {
    const swing = Math.sin((index + 1) * 0.78 + (hash % 5)) * 13
    const jitter = ((hash >> (index % 8)) % 9) - 4
    return clamp(Math.round(probability + swing + jitter), 5, 99)
  })
}

function recommendationFor(verdict, sample) {
  if (verdict === 'Block') {
    return `Block the ${sample.workflow.replace(/-/g, ' ')} flow, require a fresh capture, and send the full evidence package to manual review.`
  }
  if (verdict === 'Review') {
    return 'Hold the approval decision until liveness, reference match, and human review agree.'
  }
  return 'Continue the onboarding flow, keep the score and metadata in the audit trail, and monitor repeat attempts.'
}

function sampleNameFor(mediaType) {
  if (mediaType === 'video') return 'kyc-selfie-video.mp4'
  if (mediaType === 'audio') return 'voice-verification.wav'
  return 'passport-selfie.png'
}

function defaultMimeFor(mediaType) {
  if (mediaType === 'video') return 'video/mp4'
  if (mediaType === 'audio') return 'audio/wav'
  return 'image/png'
}

function stableHash(value) {
  let hash = 2166136261
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}
