/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MOSIP Face Liveness and Presentation Attack Detection (PAD) Engine
 * Conforms to ISO/IEC 30107-1:2023 and ISO/IEC 30107-3:2023
 */

import {
  ActiveChallenge,
  AttackType,
  ChallengeType,
  FaceFrameData,
  LivenessConfiguration,
  WorkflowType,
} from '../types/mosip';

export const DEFAULT_CONFIG: LivenessConfiguration = {
  enabled: true,
  passiveLivenessThreshold: 0.75,
  activeLivenessPolicy: 'AUTO_ON_LOW_CONFIDENCE',
  minimumActiveChallenges: 2,
  supportedChallengeTypes: ['BLINK', 'SMILE', 'TURN_HEAD_LEFT', 'TURN_HEAD_RIGHT', 'LOOK_UP'],
  challengeTimeoutSeconds: 8,
  maxRetryCount: 3,
  repeatedFailureBehaviour: 'SUPERVISOR_OVERRIDE_REQUIRED',
  residentPolicy: {
    passiveThreshold: 0.75,
    challengeCount: 2,
  },
  operatorPolicy: {
    passiveThreshold: 0.80,
    challengeCount: 2,
  },
  supervisorPolicy: {
    passiveThreshold: 0.85,
    challengeCount: 3,
  },
};

export const CHALLENGE_PROMPTS: Record<ChallengeType, { prompt: string; actionGuidance: string }> = {
  BLINK: {
    prompt: 'Please blink',
    actionGuidance: 'Close both eyes gently and reopen them',
  },
  SMILE: {
    prompt: 'Please smile',
    actionGuidance: 'Show a natural smile towards the camera',
  },
  TURN_HEAD_LEFT: {
    prompt: 'Please turn your head to the left',
    actionGuidance: 'Slowly turn your head towards the left side',
  },
  TURN_HEAD_RIGHT: {
    prompt: 'Please turn your head to the right',
    actionGuidance: 'Slowly turn your head towards the right side',
  },
  LOOK_UP: {
    prompt: 'Please look up',
    actionGuidance: 'Direct your eyes and tilt head upwards slightly',
  },
  LOOK_DOWN: {
    prompt: 'Please look down',
    actionGuidance: 'Direct your eyes slightly downwards',
  },
  NOD_HEAD: {
    prompt: 'Please nod your head',
    actionGuidance: 'Nod your head up and down once',
  },
};

/**
 * Dynamically and unpredictably picks active challenges from the configured challenge pool
 */
export function generateDynamicChallenges(
  pool: ChallengeType[],
  count: number,
  avoidPrevious?: ChallengeType[]
): ActiveChallenge[] {
  const available: ChallengeType[] = pool.length > 0 ? [...pool] : (['BLINK', 'SMILE', 'TURN_HEAD_LEFT'] as ChallengeType[]);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  
  // Pick distinct challenge types
  const chosen: ChallengeType[] = [];
  for (const t of shuffled) {
    if (!avoidPrevious || !avoidPrevious.includes(t)) {
      chosen.push(t);
    }
    if (chosen.length >= count) break;
  }

  // Fallback if needed
  while (chosen.length < count && available.length > 0) {
    const fallback = available[chosen.length % available.length];
    chosen.push(fallback);
  }

  return chosen.map((type, idx) => ({
    id: `challenge-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    promptText: CHALLENGE_PROMPTS[type]?.prompt || `Please perform ${type}`,
    actionGuidance: CHALLENGE_PROMPTS[type]?.actionGuidance || 'Follow on-screen instructions',
    status: idx === 0 ? 'IN_PROGRESS' : 'PENDING',
    progress: 0,
    timeRemainingSeconds: 8,
  }));
}

/**
 * Returns effective passive threshold and challenge count for a given workflow
 */
export function getWorkflowParameters(
  config: LivenessConfiguration,
  workflow: WorkflowType
): { threshold: number; challengeCount: number } {
  switch (workflow) {
    case 'OPERATOR_AUTHENTICATION':
      return {
        threshold: config.operatorPolicy.passiveThreshold,
        challengeCount: config.operatorPolicy.challengeCount,
      };
    case 'SUPERVISOR_AUTHENTICATION':
      return {
        threshold: config.supervisorPolicy.passiveThreshold,
        challengeCount: config.supervisorPolicy.challengeCount,
      };
    case 'RESIDENT_REGISTRATION':
    default:
      return {
        threshold: config.residentPolicy.passiveThreshold,
        challengeCount: config.residentPolicy.challengeCount,
      };
  }
}

export interface PassiveEvaluationResult {
  passed: boolean;
  requiresActiveChallenge: boolean;
  padAttackDetected: boolean;
  attackType: AttackType;
  score: number;
  threshold: number;
  userMessage: string;
  diagnosticDetail: string;
}

/**
 * Evaluates passive liveness & PAD according to ISO/IEC 30107
 */
export function evaluatePassiveFrame(
  frame: FaceFrameData,
  config: LivenessConfiguration,
  workflow: WorkflowType
): PassiveEvaluationResult {
  const { threshold } = getWorkflowParameters(config, workflow);

  // 1. Device or Frame sanity check
  if (!frame.faceDetected) {
    return {
      passed: false,
      requiresActiveChallenge: false,
      padAttackDetected: false,
      attackType: 'NONE_BONA_FIDE',
      score: 0,
      threshold,
      userMessage: 'Face not detected. Ensure your face is clearly visible.',
      diagnosticDetail: 'ERR_NO_FACE_DETECTED: No facial bounding box identified in stream.',
    };
  }

  if (frame.multipleFacesDetected) {
    return {
      passed: false,
      requiresActiveChallenge: false,
      padAttackDetected: false,
      attackType: 'MULTI_FACE_INTERFERENCE',
      score: 0,
      threshold,
      userMessage: 'Multiple faces detected. Ensure only one person is in front of the camera.',
      diagnosticDetail: 'ERR_MULTI_FACE: More than 1 face present in capture zone.',
    };
  }

  // 2. PAD (Presentation Attack Detection) check
  if (frame.padMetrics.isAttack) {
    return {
      passed: false,
      requiresActiveChallenge: false,
      padAttackDetected: true,
      attackType: frame.padMetrics.attackTypeDetected,
      score: frame.passiveLivenessScore,
      threshold,
      // Note PDF requirement: generic message for user, detailed in diagnostics!
      userMessage: 'Face verification could not be completed. Please try again.',
      diagnosticDetail: `PAD_ATTACK_CLASSIFICATION: ISO/IEC 30107 presentation attack identified (${frame.padMetrics.attackTypeDetected}, confidence: ${(frame.padMetrics.attackConfidence * 100).toFixed(1)}%, moire: ${frame.padMetrics.moirePatternScore.toFixed(2)}, flatness: ${frame.padMetrics.surfaceFlatnessScore.toFixed(2)})`,
    };
  }

  // 3. Quality threshold check
  if (frame.qualityMetrics.sharpness < 0.4 || frame.qualityMetrics.illumination < 0.35) {
    return {
      passed: false,
      requiresActiveChallenge: false,
      padAttackDetected: false,
      attackType: 'NONE_BONA_FIDE',
      score: frame.passiveLivenessScore,
      threshold,
      userMessage: 'Poor face quality. Look directly at the camera and ensure good lighting.',
      diagnosticDetail: `POOR_QUALITY: Sharpness (${frame.qualityMetrics.sharpness.toFixed(2)}) or Illumination (${frame.qualityMetrics.illumination.toFixed(2)}) below ISO 19794-5 standard.`,
    };
  }

  // 4. Passive score comparison against workflow threshold
  const score = frame.passiveLivenessScore;

  if (!config.enabled) {
    // If liveness disabled by config
    return {
      passed: true,
      requiresActiveChallenge: false,
      padAttackDetected: false,
      attackType: 'NONE_BONA_FIDE',
      score,
      threshold,
      userMessage: 'Good, face captured successfully',
      diagnosticDetail: 'LIVENESS_BYPASSED: Configuration disabled liveness verification.',
    };
  }

  if (config.activeLivenessPolicy === 'ALWAYS_REQUIRE') {
    return {
      passed: false,
      requiresActiveChallenge: true,
      padAttackDetected: false,
      attackType: 'NONE_BONA_FIDE',
      score,
      threshold,
      userMessage: 'Passive check complete. Initiating required active verification.',
      diagnosticDetail: 'POLICY_ALWAYS_REQUIRE: Active challenge escalated by system policy.',
    };
  }

  if (score >= threshold) {
    // Meets configured threshold and no presentation attack!
    return {
      passed: true,
      requiresActiveChallenge: false,
      padAttackDetected: false,
      attackType: 'NONE_BONA_FIDE',
      score,
      threshold,
      userMessage: 'Good, face captured successfully',
      diagnosticDetail: `PASSIVE_LIVENESS_PASSED: Confidence ${(score * 100).toFixed(1)}% satisfies threshold ${(threshold * 100).toFixed(1)}%.`,
    };
  }

  // Below threshold: initiate active liveness automatically
  return {
    passed: false,
    requiresActiveChallenge: true,
    padAttackDetected: false,
    attackType: 'NONE_BONA_FIDE',
    score,
    threshold,
    userMessage: 'Checking face liveness...',
    diagnosticDetail: `PASSIVE_LIVENESS_INSUFFICIENT: Score ${(score * 100).toFixed(1)}% < threshold ${(threshold * 100).toFixed(1)}%. Triggering active challenge escalation.`,
  };
}

/**
 * Validates whether the active facial challenge action was performed by the live subject
 */
export function evaluateActiveChallengeAction(
  challenge: ActiveChallenge,
  frame: FaceFrameData
): { isActionDetected: boolean; isComplete: boolean; updatedProgress: number } {
  let detected = false;

  switch (challenge.type) {
    case 'BLINK':
      detected = frame.facialActions.blinkDetected;
      break;
    case 'SMILE':
      detected = frame.facialActions.smileDetected;
      break;
    case 'TURN_HEAD_LEFT':
      detected = frame.facialActions.headYaw < -18;
      break;
    case 'TURN_HEAD_RIGHT':
      detected = frame.facialActions.headYaw > 18;
      break;
    case 'LOOK_UP':
      detected = frame.facialActions.gazeDirection === 'UP' || frame.facialActions.headPitch > 12;
      break;
    case 'LOOK_DOWN':
      detected = frame.facialActions.gazeDirection === 'DOWN' || frame.facialActions.headPitch < -12;
      break;
    case 'NOD_HEAD':
      detected = Math.abs(frame.facialActions.headPitch) > 14;
      break;
    default:
      detected = false;
  }

  if (detected) {
    const nextProgress = Math.min(100, challenge.progress + 40);
    return {
      isActionDetected: true,
      isComplete: nextProgress >= 100,
      updatedProgress: nextProgress,
    };
  }

  return {
    isActionDetected: false,
    isComplete: false,
    updatedProgress: challenge.progress,
  };
}

/**
 * Calculate simulated PAD and facial characteristics for mock frames or synthetic streams
 */
export function generateSyntheticFrame(attack: AttackType, isL1Device = false): FaceFrameData {
  const isAttack = attack !== 'NONE_BONA_FIDE' && attack !== 'MULTI_FACE_INTERFERENCE';
  
  let passiveScore = 0.88;
  let sharpness = 0.85;
  let illumination = 0.82;
  let moire = 0.05;
  let flatness = 0.12;
  let motionRecurrence = 0.04;
  let attackConfidence = 0.0;

  if (attack === 'PRINTED_PHOTO') {
    passiveScore = 0.31;
    flatness = 0.94;
    sharpness = 0.72;
    attackConfidence = 0.96;
  } else if (attack === 'DIGITAL_SCREEN_DISPLAY') {
    passiveScore = 0.28;
    moire = 0.91;
    attackConfidence = 0.95;
  } else if (attack === 'VIDEO_REPLAY') {
    passiveScore = 0.42;
    motionRecurrence = 0.88;
    attackConfidence = 0.92;
  } else if (attack === 'SILICONE_MASK') {
    passiveScore = 0.35;
    flatness = 0.75;
    attackConfidence = 0.89;
  }

  return {
    frameId: `frame-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    width: 640,
    height: 480,
    faceDetected: true,
    multipleFacesDetected: attack === 'MULTI_FACE_INTERFERENCE',
    qualityMetrics: {
      sharpness,
      illumination,
      frontalPoseScore: 0.90,
      faceCentered: true,
      eyeGazeForward: true,
      textureMicroVariance: isAttack ? 0.22 : 0.84,
      depthPlanarVariance: isAttack ? 0.15 : 0.89,
      specularReflectionRatio: attack === 'PRINTED_PHOTO' ? 0.78 : 0.12,
    },
    padMetrics: {
      attackTypeDetected: attack,
      attackConfidence,
      moirePatternScore: moire,
      bezelScreenBorderScore: attack === 'DIGITAL_SCREEN_DISPLAY' ? 0.85 : 0.05,
      motionRecurrenceScore: motionRecurrence,
      surfaceFlatnessScore: flatness,
      isAttack,
    },
    passiveLivenessScore: isAttack ? passiveScore : 0.86,
    facialActions: {
      blinkDetected: false,
      smileDetected: false,
      headYaw: 0,
      headPitch: 0,
      gazeDirection: 'CENTER',
    },
    deviceSignature: isL1Device ? `L1-SIG-RSA4096-HEX-${Math.random().toString(16).substring(2, 14)}` : undefined,
  };
}
