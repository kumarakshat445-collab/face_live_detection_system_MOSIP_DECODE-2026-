/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Unit tests for MOSIP Face Liveness & PAD Engine
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CONFIG,
  generateDynamicChallenges,
  getWorkflowParameters,
  evaluatePassiveFrame,
  evaluateActiveChallengeAction,
  generateSyntheticFrame,
} from './liveness-engine';
import { FaceFrameData } from '../types/mosip';

test('Workflow parameter extraction returns specific thresholds', () => {
  const residentParams = getWorkflowParameters(DEFAULT_CONFIG, 'RESIDENT_REGISTRATION');
  assert.equal(residentParams.threshold, 0.75);
  assert.equal(residentParams.challengeCount, 2);

  const operatorParams = getWorkflowParameters(DEFAULT_CONFIG, 'OPERATOR_AUTHENTICATION');
  assert.equal(operatorParams.threshold, 0.80);
  assert.equal(operatorParams.challengeCount, 2);

  const supervisorParams = getWorkflowParameters(DEFAULT_CONFIG, 'SUPERVISOR_AUTHENTICATION');
  assert.equal(supervisorParams.threshold, 0.85);
  assert.equal(supervisorParams.challengeCount, 3);
});

test('Dynamic challenge generator selects requested count and unpredicted types', () => {
  const pool = DEFAULT_CONFIG.supportedChallengeTypes;
  const challenges = generateDynamicChallenges(pool, 2);

  assert.equal(challenges.length, 2);
  assert.notEqual(challenges[0].id, challenges[1].id);
  assert.ok(pool.includes(challenges[0].type));
  assert.ok(pool.includes(challenges[1].type));
  assert.equal(challenges[0].status, 'IN_PROGRESS');
  assert.equal(challenges[1].status, 'PENDING');
});

test('Passive evaluation passes when bona fide score >= threshold', () => {
  const frame = generateSyntheticFrame('NONE_BONA_FIDE');
  frame.passiveLivenessScore = 0.88;

  const result = evaluatePassiveFrame(frame, DEFAULT_CONFIG, 'RESIDENT_REGISTRATION');

  assert.equal(result.passed, true);
  assert.equal(result.requiresActiveChallenge, false);
  assert.equal(result.padAttackDetected, false);
  assert.match(result.userMessage, /Good, face captured successfully/i);
});

test('Passive evaluation triggers active challenge when score is below threshold', () => {
  const frame = generateSyntheticFrame('NONE_BONA_FIDE');
  frame.passiveLivenessScore = 0.65; // Below 0.75 threshold

  const result = evaluatePassiveFrame(frame, DEFAULT_CONFIG, 'RESIDENT_REGISTRATION');

  assert.equal(result.passed, false);
  assert.equal(result.requiresActiveChallenge, true);
  assert.equal(result.padAttackDetected, false);
  assert.match(result.userMessage, /Checking face liveness/i);
});

test('PAD detects printed photo attack and presents generic user message with diagnostic detail', () => {
  const frame = generateSyntheticFrame('PRINTED_PHOTO');

  const result = evaluatePassiveFrame(frame, DEFAULT_CONFIG, 'RESIDENT_REGISTRATION');

  assert.equal(result.passed, false);
  assert.equal(result.padAttackDetected, true);
  assert.equal(result.attackType, 'PRINTED_PHOTO');
  // ISO/IEC 30107 security guideline: Generic message for user
  assert.equal(result.userMessage, 'Face verification could not be completed. Please try again.');
  // Detailed explanation in diagnostic
  assert.match(result.diagnosticDetail, /PAD_ATTACK_CLASSIFICATION.*PRINTED_PHOTO/i);
});

test('PAD detects digital screen display attack', () => {
  const frame = generateSyntheticFrame('DIGITAL_SCREEN_DISPLAY');

  const result = evaluatePassiveFrame(frame, DEFAULT_CONFIG, 'OPERATOR_AUTHENTICATION');

  assert.equal(result.passed, false);
  assert.equal(result.padAttackDetected, true);
  assert.equal(result.attackType, 'DIGITAL_SCREEN_DISPLAY');
  assert.equal(result.userMessage, 'Face verification could not be completed. Please try again.');
});

test('Multiple faces detected triggers rejection with guidance', () => {
  const frame = generateSyntheticFrame('MULTI_FACE_INTERFERENCE');

  const result = evaluatePassiveFrame(frame, DEFAULT_CONFIG, 'RESIDENT_REGISTRATION');

  assert.equal(result.passed, false);
  assert.equal(result.padAttackDetected, false);
  assert.match(result.userMessage, /Multiple faces detected/i);
});

test('Active facial action evaluator detects blink and increments progress', () => {
  const challenges = generateDynamicChallenges(['BLINK'], 1);
  const challenge = challenges[0];

  const frame: FaceFrameData = generateSyntheticFrame('NONE_BONA_FIDE');
  frame.facialActions.blinkDetected = true;

  const evaluation = evaluateActiveChallengeAction(challenge, frame);
  assert.equal(evaluation.isActionDetected, true);
  assert.equal(evaluation.updatedProgress, 40);

  // Second frame action
  challenge.progress = 60;
  const evaluation2 = evaluateActiveChallengeAction(challenge, frame);
  assert.equal(evaluation2.isComplete, true);
  assert.equal(evaluation2.updatedProgress, 100);
});

test('Active facial action evaluator detects head turn', () => {
  const challenges = generateDynamicChallenges(['TURN_HEAD_LEFT'], 1);
  const challenge = challenges[0];

  const frame: FaceFrameData = generateSyntheticFrame('NONE_BONA_FIDE');
  frame.facialActions.headYaw = -25; // Turned left past -18 deg

  const evaluation = evaluateActiveChallengeAction(challenge, frame);
  assert.equal(evaluation.isActionDetected, true);
});
