export const keywordPages = [
  page({
    keyword: 'Deepfake detection github',
    path: '/resources/deepfake-detection-github',
    title: 'Deepfake Detection GitHub Guide',
    h1: 'Deepfake detection GitHub guide for production teams',
    description:
      'How to evaluate Deepfake Detection GitHub projects, model licenses, dataset coverage, inference speed, and the gap between research code and a production KYC API.',
    intent: 'Engineering teams comparing open-source detectors before deciding whether to host, fine-tune, or buy an API.',
    sections: [
      section('What to check before cloning a repo', [
        'A good repository is only the starting point. Before using it in onboarding or account recovery, check the model license, dataset lineage, benchmark methodology, inference hardware, and whether the detector handles the media you actually receive.',
        'Most research repositories assume clean frames or prepared clips. Production KYC traffic has screen glare, compression, partial faces, camera movement, spoofed audio, and retries from the same device.',
      ], [
        'Look for model cards, dataset citations, and evaluation scripts.',
        'Check whether image, video, and audio are handled by one ensemble or separate models.',
        'Measure latency on your expected file sizes, not only on paper benchmarks.',
        'Plan for calibration, alert thresholds, webhooks, and audit logging.',
      ]),
      section('When an API is safer than self-hosting', [
        'Self-hosting can work for research teams with model operations capacity. An API is usually faster when the business risk is KYC fraud, HR identity verification, or money movement and you need response times, usage logs, and billing controls from day one.',
      ]),
    ],
  }),
  page({
    keyword: 'Deepfake detection online',
    path: '/resources/deepfake-detection-online',
    title: 'Deepfake Detection Online',
    h1: 'Deepfake detection online without slowing onboarding',
    description:
      'A practical guide to online Deepfake Detection for images, videos, and AI voice checks in KYC, fintech, HR, and trust-and-safety workflows.',
    intent: 'Operators who need real-time screening before accepting uploads or approving accounts.',
    sections: [
      section('What online detection should return', [
        'An online detector should return more than a red or green label. Fraud teams need a probability score, confidence, anomaly regions, timeline evidence for video, audio synthesis signals, and a clear action recommendation.',
        'The output should arrive fast enough to fit inside the existing verification step. If the scan takes too long, users abandon the flow or teams bypass the control.',
      ], [
        'Image score from 0 to 100 with anomaly regions.',
        'Video confidence curve by second or frame group.',
        'Audio synthetic voice probability and evidence windows.',
        'Webhook delivery for longer clips and batch review.',
      ]),
      section('Good user experience for high-risk results', [
        'Do not show a raw model accusation to an applicant. Hold the workflow, request a fresh capture or liveness step, and send the evidence package to a trained reviewer.',
      ]),
    ],
  }),
  page({
    keyword: 'Deepfake detection project',
    path: '/resources/deepfake-detection-project',
    title: 'Deepfake Detection Project Plan',
    h1: 'Deepfake detection project plan from prototype to KYC control',
    description:
      'A project plan for building or buying Deepfake Detection: scope, datasets, threshold calibration, dashboard, webhooks, audit logs, and rollout.',
    intent: 'Product and engineering leaders turning a fraud concern into a shippable control.',
    sections: [
      section('Minimum project scope', [
        'Start with one business decision: should this upload be approved, reviewed, or blocked? That keeps the project focused on risk routing instead of model theater.',
        'A practical first version accepts media metadata or signed upload URLs, returns a score, explains the strongest signals, and stores an auditable event for compliance and fraud teams.',
      ], [
        'Define media types: selfie image, selfie video, document selfie, voice clip, or screen recording.',
        'Choose thresholds for pass, review, and block.',
        'Add webhook callbacks for async video and batch checks.',
        'Connect API keys, usage limits, and billing before external customers use it.',
      ]),
      section('Rollout advice', [
        'Run shadow mode first. Compare detector output against confirmed fraud, manual-review decisions, and customer-support outcomes before tightening automatic blocks.',
      ]),
    ],
  }),
  page({
    keyword: 'Deepfake detection free',
    path: '/resources/deepfake-detection-free',
    title: 'Deepfake Detection Free Options',
    h1: 'Deepfake detection free tools: what they are good for',
    description:
      'Where free Deepfake Detection helps, where it fails, and why production KYC teams still need API controls, audit trails, and calibrated thresholds.',
    intent: 'Founders and fraud teams deciding whether a free tool is enough for their risk level.',
    sections: [
      section('Use free tools for learning, not final approval', [
        'Free detectors are useful for demos, education, and a quick second opinion. They are usually not enough for regulated onboarding because they may lack service levels, audit logs, data-processing controls, or repeatable thresholds.',
        'If a single fake KYC approval can trigger account takeover, money movement, or compliance escalation, the detection layer needs to behave like infrastructure.',
      ], [
        'Check whether uploads are retained or used for training.',
        'Confirm whether the result includes evidence, not just a label.',
        'Do not use free public tools for sensitive identity documents unless data handling is clear.',
        'Move to an API once detections affect business decisions.',
      ]),
      section('A balanced path', [
        'Prototype with public examples, then validate a paid API in shadow mode against your real review queue. That gives you cost control without making free tooling responsible for expensive fraud outcomes.',
      ]),
    ],
  }),
  page({
    keyword: 'Deepfake detection software',
    path: '/resources/deepfake-detection-software',
    title: 'Deepfake Detection Software Evaluation',
    h1: 'Deepfake detection software buyers guide',
    description:
      'How to evaluate Deepfake Detection software for image upload APIs, video analysis, AI voice detection, dashboards, webhooks, pricing, and security.',
    intent: 'Teams comparing vendors or deciding between software, API, and in-house deployment.',
    sections: [
      section('Capabilities that matter', [
        'The best software is not the one with the loudest demo. It is the one that fits your approval workflow and gives reviewers enough evidence to make consistent decisions.',
        'For KYC, HR, and fintech platforms, the software should expose API keys, rate limits, webhook retries, signed upload handling, result retention settings, usage analytics, and plan-level billing.',
      ], [
        'Image endpoint with 0 to 100 score and anomaly coordinates.',
        'Video endpoint with per-second confidence curve.',
        'Audio endpoint for AI voice and replay attacks.',
        'Dashboard for keys, usage, invoices, and team access.',
        'Clear security and privacy controls for identity media.',
      ]),
      section('Evaluation question', [
        'Ask every vendor to show the exact JSON response, a failed webhook retry, and a reviewer screen for a high-risk result. That reveals whether the software is production-ready.',
      ]),
    ],
  }),
  page({
    keyword: 'Deepfake detection AI',
    path: '/resources/deepfake-detection-ai',
    title: 'Deepfake Detection AI',
    h1: 'Deepfake detection AI for image, video, and voice risk',
    description:
      'How Deepfake Detection AI combines visual artifacts, temporal consistency, audio synthesis signals, and workflow thresholds for fraud prevention.',
    intent: 'Technical and non-technical teams who need to understand what the AI is actually scoring.',
    sections: [
      section('Signals an AI detector can combine', [
        'Modern detection works best as an ensemble. Face texture artifacts, lighting inconsistency, blink cadence, lip-sync drift, audio prosody, and metadata all become stronger when calibrated together.',
        'The model score should be adjusted by workflow risk. A harmless community upload and a bank KYC approval should not use the same decision threshold.',
      ], [
        'Spatial signals from face crops and anomaly maps.',
        'Temporal signals from frame-to-frame movement.',
        'Audio signals from synthetic voice artifacts.',
        'Operational signals from retries, device context, and reviewer outcome.',
      ]),
      section('Human review still matters', [
        'The AI should route risk, not replace judgment in every case. High-risk results need fresh capture, liveness, reference matching, and a trained reviewer when the decision affects a person or money movement.',
      ]),
    ],
  }),
  page({
    keyword: 'Deepfake detection research',
    path: '/resources/deepfake-detection-research',
    title: 'Deepfake Detection Research',
    h1: 'Deepfake detection research that matters in production',
    description:
      'A practical research map for Deepfake Detection: datasets, generalization, adversarial robustness, explainability, latency, and deployment calibration.',
    intent: 'Research and ML teams deciding which papers and benchmarks should influence a product roadmap.',
    sections: [
      section('Research questions to track', [
        'A detector can perform well on one benchmark and fail on new generators, camera conditions, or compression settings. Production teams should care about generalization, calibration, robustness, and explainability as much as headline accuracy.',
        'Useful research usually explains how the model handles unseen manipulation methods, low-quality uploads, multilingual voice clips, and adversarial re-encoding.',
      ], [
        'Cross-dataset performance, not only in-dataset accuracy.',
        'Calibration curves for pass, review, and block thresholds.',
        'Robustness to compression, scaling, screen recording, and noise.',
        'Evidence that reviewers can interpret quickly.',
      ]),
      section('From paper to API', [
        'The deployment step adds constraints that papers often omit: cold-start latency, signed upload storage, webhook reliability, audit retention, and customer-specific thresholds.',
      ]),
    ],
  }),
  page({
    keyword: 'Deepfake detection dataset',
    path: '/resources/deepfake-detection-dataset',
    title: 'Deepfake Detection Dataset Guide',
    h1: 'Deepfake detection dataset guide for model evaluation',
    description:
      'How to choose a Deepfake Detection dataset for image, video, and audio evaluation, including labels, consent, domain coverage, and benchmark limits.',
    intent: 'ML teams building evaluation sets or checking whether a detector covers their media domain.',
    sections: [
      section('Dataset fit beats dataset fame', [
        'A famous dataset is not automatically the right benchmark. The useful question is whether its media, labels, compression, demographics, capture devices, and manipulation methods resemble the traffic you need to protect.',
        'KYC datasets should be handled with strict privacy controls. Avoid mixing sensitive identity media into experiments unless consent, access control, retention, and legal basis are clear.',
      ], [
        'Separate training, validation, calibration, and holdout sets.',
        'Include real upload quality: blur, glare, compression, partial faces, and background noise.',
        'Track generator family and manipulation type where labels allow it.',
        'Build a private challenge set from confirmed fraud outcomes when possible.',
      ]),
      section('Dataset limits', [
        'Datasets age quickly because generation models improve. Keep a refresh process, monitor false positives, and do not treat one benchmark number as permanent protection.',
      ]),
    ],
  }),
]

function page({ keyword, path, title, h1, description, intent, sections }) {
  return {
    keyword,
    path,
    title,
    h1,
    description,
    eyebrow: keyword,
    lede: description,
    intent,
    sections,
    faqs: [
      {
        question: `What is the practical takeaway for ${keyword}?`,
        answer:
          'Use it to decide what evidence, thresholds, and review workflow you need before detection results affect approvals.',
      },
      {
        question: 'Can this replace fraud review completely?',
        answer:
          'No. Deepfake scoring should route risk and preserve evidence. High-impact decisions still need liveness, reference checks, policy rules, and trained review.',
      },
    ],
  }
}

function section(heading, paragraphs, bullets = []) {
  return { heading, paragraphs, bullets }
}
