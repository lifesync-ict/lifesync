import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveActionEvaluationStatus } from '../src/api/actionState.ts'

test('review-required evidence does not block a non-empty action result', () => {
  assert.equal(resolveActionEvaluationStatus({ status: 'review_required', obligations: [{ id: 'demo-action' }] }), 'complete')
})

test('an unsupported empty result uses the expert-review branch', () => {
  assert.equal(resolveActionEvaluationStatus({ status: 'review_required', obligations: [] }), 'needs_review')
  assert.equal(resolveActionEvaluationStatus({ status: 'complete', obligations: [] }), 'needs_review')
})
