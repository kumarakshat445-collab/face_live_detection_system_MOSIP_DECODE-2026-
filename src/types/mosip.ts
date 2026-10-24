/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MOSIP Biometric Face Liveness & Presentation Attack Detection (PAD) Specifications
 * Conforming to ISO/IEC 30107-1/3 and ISO/IEC 19794-5
 */

export type DeviceType = 'L0_BASIC_CAMERA' | 'L1_SECURE_BIOMETRIC_DEVICE' | 'MOCK_TEST_DEVICE';

export type WorkflowType = 'RESIDENT_REGISTRATION' | 'OPERATOR_AUTHENTICATION' | 'SUPERVISOR_AUTHENTICATION';

export type ChallengeType = 
  | 'BLINK' 
  | 'SMILE' 
  | 'TURN_HEAD_LEFT' 
  | 'TURN_HEAD_RIGHT' 
  | 'LOOK_UP' 
  | 'LOOK_DOWN'
  | 'NOD_HEAD';

export type AttackType = 
  | 'NONE_BONA_FIDE' 
  | 'PRINTED_PHOTO' 
  | 'DIGITAL_SCREEN_DISPLAY' 
  | 'VIDEO_REPLAY' 
  | 'SILICONE_MASK' 
  | 'MULTI_FACE_INTERFERENCE';

export type LivenessStatus = 
  | 'IDLE'
  | 'CONNECTING_DEVICE'
  | 'CHECKING_PASSIVE_LIVENESS'
  | 'ACTIVE_CHALLENGE_REQUIRED'
  | 'ACTIVE_CHALLENGE_IN_PROGRESS'
  | 'VERIFICATION_SUCCESS'
  | 'LIVENESS_FAILED'
  | 'PAD_ATTACK_DETECTED'
  | 'MAX_RETRIES_EXCEEDED'
  | 'DEVICE_ERROR';

export interface FaceQualityMetrics {
  sharpness: number;         // 0 to 1
  illumination: number;      // 0 to 1
  frontalPoseScore: number;  // 0 to 1 (yaw, pitch, roll close to 0)
  faceCentered: boolean;
  eyeGazeForward: boolean;
  textureMicroVariance: number; // Skin micro-texture analysis
  depthPlanarVariance: number;  // 3D volumetric depth cues vs flat plane
  specularReflectionRatio: number; // Glare/paper/glass sheen
}

export interface PadMetrics {
  attackTypeDetected: AttackType;
  attackConfidence: number;     // 0 to 1
  moirePatternScore: number;    // High for screens/phones
  bezelScreenBorderScore: number; // Screen bezel edge detection
  motionRecurrenceScore: number;  // Video loop detection
  surfaceFlatnessScore: number;   // Paper/photo attack
  isAttack: boolean;
}

export interface FaceFrameData {
  frameId: string;
  timestamp: number;
  width: number;
  height: number;
  faceDetected: boolean;
  multipleFacesDetected: boolean;
  qualityMetrics: FaceQualityMetrics;
  padMetrics: PadMetrics;
  passiveLivenessScore: number; // 0 to 1
  facialActions: {
    blinkDetected: boolean;
    smileDetected: boolean;
    headYaw: number;   // negative = left, positive = right
    headPitch: number; // negative = down, positive = up
    gazeDirection: 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
  };
  deviceSignature?: string; // For L1 secure biometric devices
  capturedImageDataUrl?: string;
}

export interface ActiveChallenge {
  id: string;
  type: ChallengeType;
  promptText: string;
  actionGuidance: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'ACTION_DETECTED' | 'COMPLETED' | 'FAILED' | 'TIMED_OUT';
  progress: number; // 0 to 100
  timeRemainingSeconds: number;
}

export interface LivenessConfiguration {
  enabled: boolean;
  passiveLivenessThreshold: number; // default: 0.75
  activeLivenessPolicy: 'AUTO_ON_LOW_CONFIDENCE' | 'ALWAYS_REQUIRE' | 'DISABLED';
  minimumActiveChallenges: number;  // 1, 2, or 3
  supportedChallengeTypes: ChallengeType[];
  challengeTimeoutSeconds: number;  // e.g. 7
  maxRetryCount: number;            // e.g. 3
  repeatedFailureBehaviour: 'SUPERVISOR_OVERRIDE_REQUIRED' | 'MANUAL_EXCEPTION_QUEUE' | 'BLOCK_AND_LOCKOUT';
  
  // Workflow-specific overrides
  residentPolicy: {
    passiveThreshold: number;
    challengeCount: number;
  };
  operatorPolicy: {
    passiveThreshold: number;
    challengeCount: number;
  };
  supervisorPolicy: {
    passiveThreshold: number;
    challengeCount: number;
  };
}

export interface BiometricAuditRecord {
  id: string;
  timestamp: string;
  workflow: WorkflowType;
  deviceType: DeviceType;
  isOnline: boolean;
  passiveScore: number;
  thresholdUsed: number;
  activeChallengesCompleted: number;
  padResult: {
    attackDetected: boolean;
    attackType: AttackType;
    confidence: number;
  };
  outcome: 'SUCCESS' | 'LIVENESS_FAILED' | 'PAD_REJECTED' | 'MAX_RETRIES_EXCEEDED' | 'TIMEOUT';
  iso30107Compliant: boolean;
  syncedToMosipServer: boolean;
  operatorId: string;
  residentId?: string;
}

export interface OperationalMetrics {
  totalAttempts: number;
  successfulVerifications: number;
  passivePassCount: number;
  activeEscalationCount: number;
  padAttackBlocks: number;
  retryCount: number;
  averageProcessingTimeMs: number;
  averageChallengeCompletionTimeSec: number;
  apcer: number; // Attack Presentation Classification Error Rate (%)
  bpcer: number; // Bona Fide Presentation Classification Error Rate (%)
}
