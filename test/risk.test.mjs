import test from 'node:test'
import assert from 'node:assert/strict'

import { classifyMediaSample, inferMediaType } from '../src/lib/risk.js'
import { buildSitemapXml } from '../worker/index.js'

test('classifies fintech KYC video as review or block risk', () => {
  const result = classifyMediaSample({
    fileName: 'kyc-selfie-video.mp4',
    fileType: 'video/mp4',
    fileSizeMb: 18.4,
    mediaType: 'video',
    workflow: 'fintech-kyc',
  })

  assert.ok(result.probability >= 62)
  assert.match(result.verdict, /Review|Block/)
  assert.ok(result.timeline.length >= 8)
  assert.ok(result.anomalies.length >= 1)
})

test('liveness and reference controls reduce score', () => {
  const raw = classifyMediaSample({
    fileName: 'candidate-selfie.png',
    fileType: 'image/png',
    mediaType: 'image',
    workflow: 'hr-verification',
  })
  const controlled = classifyMediaSample({
    fileName: 'candidate-selfie.png',
    fileType: 'image/png',
    mediaType: 'image',
    workflow: 'hr-verification',
    livenessCheck: true,
    referenceMatch: true,
  })

  assert.ok(controlled.probability < raw.probability)
})

test('infers media type from common extensions', () => {
  assert.equal(inferMediaType('', 'clip.webm'), 'video')
  assert.equal(inferMediaType('', 'voice.m4a'), 'audio')
  assert.equal(inferMediaType('', 'selfie.jpeg'), 'image')
})

test('sitemap includes homepage and deepfake keyword pages', () => {
  const xml = buildSitemapXml()
  assert.match(xml, /https:\/\/deepfakedetection\.site\//)
  assert.match(xml, /\/resources\/deepfake-detection-online/)
  assert.match(xml, /\/resources\/deepfake-detection-dataset/)
})
