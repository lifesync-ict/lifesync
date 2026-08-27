import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveActionEvaluationStatus } from '../src/api/actionState.ts'
import { buildPendingActionBundleItems, canShowOfficialEvidence, canonicalDemoProfile, containsInternalDisplayValue, demoReviewDate, shouldShowSharedHandoffNotice } from '../src/api/guidancePolicy.ts'
import { actionTranslations } from '../src/features/action-guidance/translations.ts'
import { handoffTranslations } from '../src/features/institution-handoff/translations.ts'

test('review-required evidence does not block a non-empty action result', () => {
  assert.equal(resolveActionEvaluationStatus({ status: 'review_required', obligations: [{ id: 'demo-action' }] }), 'complete')
})

test('confirmed event date is retained as a demo review date', () => {
  assert.equal(demoReviewDate('2026-08-20'), '2026-08-20')
  assert.equal(demoReviewDate(null), null)
})

test('the supported synthetic profile keeps all API matching fields', () => {
  assert.deepEqual(canonicalDemoProfile({ visa: 'E-9', nationality: 'Vietnam', region: 'Eumseong-gun, Chungbuk', industry: 'Manufacturing' }), { visaType: 'E-9', nationality: '베트남', region: '충북 음성군', industry: '제조업' })
})

test('action copy contains distinct preparation and inquiry guidance', () => {
  const copy = actionTranslations.ko
  assert.match(copy.obligationText.workerPrepareDescription, /발생일/)
  assert.match(copy.obligationText.employerDocumentsDescription, /서류/)
  assert.match(copy.guidanceText.institutionQuestion, /관할/)
})

test('handoff bundle uses the actual pending action title', () => {
  const items = buildPendingActionBundleItems([{ id: 'worker', title: 'workerPrepareTitle', description: 'workerPrepareDescription' }], [])
  assert.deepEqual(items[0], { id: 'action-worker', title: 'workerPrepareTitle', description: 'workerPrepareDescription' })
})

test('unverified evidence stays compact and user copy has no internal placeholders', () => {
  assert.equal(canShowOfficialEvidence(null, 'review_required'), false)
  assert.equal(canShowOfficialEvidence('https://example.com', 'verified'), true)
  const exposedCopy = JSON.stringify({ actionTranslations, handoffTranslations })
  assert.equal(containsInternalDisplayValue(exposedCopy), false)
})

test('handoff uses one shared jurisdiction notice without candidate labels', () => {
  const copy = handoffTranslations.ko
  assert.equal(Number(shouldShowSharedHandoffNotice('needs_review')), 1)
  assert.match(copy.jurisdictionNotice, /정확한 관할 기관/)
  assert.equal(Object.values(copy.institutions).some((label) => label.includes('후보')), false)
})

test('an unsupported empty result uses the expert-review branch', () => {
  assert.equal(resolveActionEvaluationStatus({ status: 'review_required', obligations: [] }), 'needs_review')
  assert.equal(resolveActionEvaluationStatus({ status: 'complete', obligations: [] }), 'needs_review')
})
