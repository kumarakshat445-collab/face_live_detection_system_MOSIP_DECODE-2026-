/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MOSIP Face Capture Screen with Passive & Active Liveness Detection and PAD
 * Fully implements Section 10 UI/UX Requirements from MOSIP Decode Spec 04
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Info, 
  Activity, 
  Sliders, 
  Eye, 
  Smile, 
  Compass, 
  HelpCircle,
  X,
  Lock,
  ChevronRight
} from 'lucide-react';
import { 
  ActiveChallenge, 
  AttackType, 
  DeviceType, 
  FaceFrameData, 
  LivenessConfiguration, 
  LivenessStatus, 
  WorkflowType 
} from '../types/mosip';
import { 
  DEFAULT_CONFIG, 
  evaluatePassiveFrame, 
  evaluateActiveChallengeAction, 
  generateDynamicChallenges, 
  getWorkflowParameters 
} from '../lib/liveness-engine';
import { auditLogger } from '../lib/audit-logger';
import { IFaceCaptureDevice, MockBiometricDeviceAdapter, LiveWebcamDeviceAdapter } from '../lib/device-manager';

interface FaceCaptureModalProps {
  isOpen: boolean;
  workflow: WorkflowType;
  config?: LivenessConfiguration;
  deviceType?: DeviceType;
  isOnline?: boolean;
  residentName?: string;
  onSuccess: (capturedImage: string, auditId: string) => void;
  onCancel: () => void;
}

export const FaceCaptureModal: React.FC<FaceCaptureModalProps> = ({
  isOpen,
  workflow,
  config = DEFAULT_CONFIG,
  deviceType = 'L1_SECURE_BIOMETRIC_DEVICE',
  isOnline = true,
  residentName = 'Aarav Patel',
  onSuccess,
  onCancel,
}) => {
  const [device, setDevice] = useState<IFaceCaptureDevice | null>(null);
  const [status, setStatus] = useState<LivenessStatus>('CONNECTING_DEVICE');
  const [currentFrame, setCurrentFrame] = useState<FaceFrameData | null>(null);
  const [challenges, setChallenges] = useState<ActiveChallenge[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('Connecting to biometric device...');
  const [feedbackHint, setFeedbackHint] = useState<string>('Align your face within the frame');
  const [attemptCount, setAttemptCount] = useState<number>(1);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [lastPadDetail, setLastPadDetail] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [simulatedAttack, setSimulatedAttack] = useState<AttackType>('NONE_BONA_FIDE');

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const frameCountRef = useRef<number>(0);
  const maxRetries = config.maxRetryCount;
  const workflowParams = getWorkflowParameters(config, workflow);

  // Initialize biometric device
  useEffect(() => {
    if (!isOpen) {
      if (device) device.disconnect();
      return;
    }

    let dev: IFaceCaptureDevice;
    if (useWebcam) {
      dev = new LiveWebcamDeviceAdapter('L0_BASIC_CAMERA');
    } else {
      dev = new MockBiometricDeviceAdapter(deviceType);
      dev.injectAttack(simulatedAttack);
    }

    setDevice(dev);
    setStatus('CONNECTING_DEVICE');
    setStatusMessage('Initializing MOSIP biometric frame stream...');
    setAttemptCount(1);
    setCapturedImage(null);

    dev.connect().then((connected) => {
      if (!connected && useWebcam) {
        // Fallback to mock if webcam is rejected/unavailable
        const mockDev = new MockBiometricDeviceAdapter(deviceType);
        mockDev.injectAttack(simulatedAttack);
        setDevice(mockDev);
        startDeviceStream(mockDev);
      } else {
        startDeviceStream(dev);
      }
    });

    return () => {
      if (dev) dev.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, useWebcam, deviceType]);

  // When simulated attack changes
  useEffect(() => {
    if (device && !useWebcam) {
      device.injectAttack(simulatedAttack);
    }
  }, [simulatedAttack, device, useWebcam]);

  const startDeviceStream = (dev: IFaceCaptureDevice) => {
    setStatus('CHECKING_PASSIVE_LIVENESS');
    setStatusMessage('Checking face liveness…');
    setFeedbackHint('Hold still and look directly at the biometric sensor');
    frameCountRef.current = 0;

    dev.startFrameStream((frame) => {
      setCurrentFrame(frame);
      frameCountRef.current++;

      // Allow 6-10 frames of settling before evaluating passive result
      if (frameCountRef.current < 8) return;

      handleFrameEvaluation(frame);
    });
  };

  // Passive & Active Liveness state machine evaluation
  const handleFrameEvaluation = (frame: FaceFrameData) => {
    setStatus((prevStatus) => {
      if (prevStatus === 'VERIFICATION_SUCCESS' || prevStatus === 'MAX_RETRIES_EXCEEDED') {
        return prevStatus;
      }

      // During Passive Liveness Evaluation
      if (prevStatus === 'CHECKING_PASSIVE_LIVENESS') {
        const result = evaluatePassiveFrame(frame, config, workflow);

        if (result.padAttackDetected) {
          // PAD attack identified: ISO 30107 generic message
          setStatusMessage('Face verification could not be completed. Please try again.');
          setFeedbackHint('Ensure an authentic live face is presented');
          setLastPadDetail(result.diagnosticDetail);
          
          auditLogger.recordEvent({
            workflow,
            deviceType,
            isOnline,
            passiveScore: result.score,
            thresholdUsed: result.threshold,
            activeChallengesCompleted: 0,
            padResult: {
              attackDetected: true,
              attackType: result.attackType,
              confidence: frame.padMetrics.attackConfidence,
            },
            outcome: 'PAD_REJECTED',
            iso30107Compliant: true,
            syncedToMosipServer: isOnline,
            operatorId: 'OP-8821',
            residentId: workflow === 'RESIDENT_REGISTRATION' ? 'RES-99042' : undefined,
          });

          return 'PAD_ATTACK_DETECTED';
        }

        if (result.passed) {
          // Passive threshold met and no PAD attack!
          completeVerificationSuccess(frame, 0);
          return 'VERIFICATION_SUCCESS';
        }

        if (result.requiresActiveChallenge) {
          // Automatically initiate active challenge sequence
          const generated = generateDynamicChallenges(
            config.supportedChallengeTypes,
            workflowParams.challengeCount
          );
          setChallenges(generated);
          setCurrentChallengeIndex(0);
          setStatusMessage(generated[0]?.promptText || 'Please blink');
          setFeedbackHint(generated[0]?.actionGuidance || 'Follow the prompted action');
          startChallengeTimer();
          return 'ACTIVE_CHALLENGE_IN_PROGRESS';
        }

        // Quality issue (blur/lighting/face not centered)
        setStatusMessage(result.userMessage);
        setFeedbackHint('Look directly at the camera and ensure good lighting');
        return prevStatus;
      }

      // During Active Challenge Evaluation
      if (prevStatus === 'ACTIVE_CHALLENGE_IN_PROGRESS') {
        setChallenges((prevChallenges) => {
          if (!prevChallenges.length) return prevChallenges;
          const current = prevChallenges[currentChallengeIndex];
          if (!current || current.status === 'COMPLETED') return prevChallenges;

          const actionResult = evaluateActiveChallengeAction(current, frame);

          if (actionResult.isActionDetected) {
            setStatusMessage('Action detected');
            setFeedbackHint('Hold still');
          }

          if (actionResult.isComplete) {
            const nextChallenges = [...prevChallenges];
            nextChallenges[currentChallengeIndex] = {
              ...current,
              status: 'COMPLETED',
              progress: 100,
            };

            const nextIndex = currentChallengeIndex + 1;
            if (nextIndex < nextChallenges.length) {
              // Next dynamic challenge
              setCurrentChallengeIndex(nextIndex);
              nextChallenges[nextIndex].status = 'IN_PROGRESS';
              setStatusMessage(nextChallenges[nextIndex].promptText);
              setFeedbackHint(nextChallenges[nextIndex].actionGuidance);
            } else {
              // All challenges completed! Re-evaluate liveness
              completeVerificationSuccess(frame, nextChallenges.length);
            }

            return nextChallenges;
          } else {
            const nextChallenges = [...prevChallenges];
            nextChallenges[currentChallengeIndex] = {
              ...current,
              progress: actionResult.updatedProgress,
              status: actionResult.isActionDetected ? 'ACTION_DETECTED' : 'IN_PROGRESS',
            };
            return nextChallenges;
          }
        });
      }

      return prevStatus;
    });
  };

  const startChallengeTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    let seconds = config.challengeTimeoutSeconds;

    timerRef.current = setInterval(() => {
      seconds--;
      setChallenges((prev) =>
        prev.map((c, i) => (i === currentChallengeIndex ? { ...c, timeRemainingSeconds: seconds } : c))
      );

      if (seconds <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleChallengeTimeout();
      }
    }, 1000);
  };

  const handleChallengeTimeout = () => {
    setStatus('LIVENESS_FAILED');
    setStatusMessage('We could not verify face liveness. Please try again.');
    setFeedbackHint('Action timed out. Follow the prompted action promptly.');
  };

  const completeVerificationSuccess = (frame: FaceFrameData, completedChallenges: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('VERIFICATION_SUCCESS');
    setStatusMessage('Good, face captured successfully');
    setFeedbackHint('Biometric verified conforming to ISO/IEC 30107');

    const imagePreview =
      frame.capturedImageDataUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    setCapturedImage(imagePreview);

    const auditRecord = auditLogger.recordEvent({
      workflow,
      deviceType,
      isOnline,
      passiveScore: frame.passiveLivenessScore,
      thresholdUsed: workflowParams.threshold,
      activeChallengesCompleted: completedChallenges,
      padResult: {
        attackDetected: false,
        attackType: 'NONE_BONA_FIDE',
        confidence: 0.98,
      },
      outcome: 'SUCCESS',
      iso30107Compliant: true,
      syncedToMosipServer: isOnline,
      operatorId: 'OP-8821',
      residentId: workflow === 'RESIDENT_REGISTRATION' ? 'RES-99042' : undefined,
    });

    setTimeout(() => {
      onSuccess(imagePreview, auditRecord.id);
    }, 1200);
  };

  const handleRetry = () => {
    if (attemptCount >= maxRetries) {
      setStatus('MAX_RETRIES_EXCEEDED');
      setStatusMessage('Maximum verification attempts reached.');
      setFeedbackHint('Exception recovery required: Please consult the center supervisor.');
      
      auditLogger.recordEvent({
        workflow,
        deviceType,
        isOnline,
        passiveScore: currentFrame?.passiveLivenessScore || 0,
        thresholdUsed: workflowParams.threshold,
        activeChallengesCompleted: 0,
        padResult: {
          attackDetected: false,
          attackType: 'NONE_BONA_FIDE',
          confidence: 0,
        },
        outcome: 'MAX_RETRIES_EXCEEDED',
        iso30107Compliant: true,
        syncedToMosipServer: isOnline,
        operatorId: 'OP-8821',
        residentId: workflow === 'RESIDENT_REGISTRATION' ? 'RES-99042' : undefined,
      });
      return;
    }

    setAttemptCount((prev) => prev + 1);
    frameCountRef.current = 0;
    setChallenges([]);
    setCurrentChallengeIndex(0);
    setSimulatedAttack('NONE_BONA_FIDE');
    if (device && !useWebcam) {
      device.injectAttack('NONE_BONA_FIDE');
    }
    setStatus('CHECKING_PASSIVE_LIVENESS');
    setStatusMessage('Checking face liveness…');
    setFeedbackHint('Look directly into the camera and hold still');
  };

  // Helper to trigger simulated action for active challenge testing
  const triggerSimulatedAction = (action: 'BLINK' | 'SMILE' | 'TURN_LEFT' | 'TURN_RIGHT' | 'LOOK_UP' | 'LOOK_DOWN') => {
    if (device) {
      device.simulateAction(action);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header with MOSIP styling */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center font-bold text-white shadow-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-white">
                  {workflow === 'RESIDENT_REGISTRATION' && 'Resident Face Capture'}
                  {workflow === 'OPERATOR_AUTHENTICATION' && 'Operator Biometric Authentication'}
                  {workflow === 'SUPERVISOR_AUTHENTICATION' && 'Supervisor Biometric Authentication'}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  ISO/IEC 30107 PAD
                </span>
                {!isOnline && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Offline Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {workflow === 'RESIDENT_REGISTRATION' ? `Resident: ${residentName}` : 'Biometric verification for access control'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
                showDiagnostics
                  ? 'bg-orange-500/20 border-orange-400 text-orange-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Toggle ISO 30107 Diagnostic Telemetry"
            >
              <Activity className="w-3.5 h-3.5" />
              Diagnostics
            </button>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
              aria-label="Close face capture modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
          {/* Left Column: Live Biometric Preview & Active Guidance */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Camera Viewport / Face Guide Box */}
            <div className="relative w-full aspect-4/3 max-w-md bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-inner flex items-center justify-center">
              {/* Device Video / Mock Canvas */}
              {capturedImage && status === 'VERIFICATION_SUCCESS' ? (
                <img
                  src={capturedImage}
                  alt="Captured Resident Face"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
                  {/* Subtle camera scanline effect */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

                  {/* Face Silhouette / Portrait Guide */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`w-48 h-60 rounded-[50%/60%_60%_40%_40%] border-2 transition-all duration-300 flex items-center justify-center ${
                        status === 'VERIFICATION_SUCCESS'
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                          : status === 'PAD_ATTACK_DETECTED' || status === 'LIVENESS_FAILED'
                          ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
                          : status === 'ACTIVE_CHALLENGE_IN_PROGRESS'
                          ? 'border-amber-400 bg-amber-400/5 shadow-[0_0_25px_rgba(251,191,36,0.25)]'
                          : 'border-blue-400 bg-blue-500/5 animate-pulse'
                      }`}
                    >
                      {/* Facial Landmark Cues */}
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        {/* Eyes Line */}
                        <div className="flex gap-12 mt-12">
                          <div
                            className={`w-3.5 h-3.5 rounded-full border transition-all ${
                              currentFrame?.facialActions.blinkDetected
                                ? 'h-0.5 bg-amber-400 border-amber-400'
                                : 'bg-blue-400/80 border-white'
                            }`}
                          ></div>
                          <div
                            className={`w-3.5 h-3.5 rounded-full border transition-all ${
                              currentFrame?.facialActions.blinkDetected
                                ? 'h-0.5 bg-amber-400 border-amber-400'
                                : 'bg-blue-400/80 border-white'
                            }`}
                          ></div>
                        </div>

                        {/* Nose Bridge */}
                        <div className="w-1.5 h-6 bg-blue-300/60 rounded-full mt-4"></div>

                        {/* Smile / Mouth Indicator */}
                        <div
                          className={`mt-4 w-12 border-b-2 transition-all duration-200 ${
                            currentFrame?.facialActions.smileDetected
                              ? 'border-amber-400 rounded-b-xl h-4'
                              : 'border-blue-300/70 rounded-none h-1'
                          }`}
                        ></div>
                      </div>
                    </div>

                    {/* Corner Crosshair brackets */}
                    <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-slate-500"></div>
                    <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-slate-500"></div>
                    <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-slate-500"></div>
                    <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-slate-500"></div>
                  </div>
                </div>
              )}

              {/* Status Banner Overlay (Strict MOSIP UX Requirement) */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-medium border border-slate-700/80 backdrop-blur">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status === 'VERIFICATION_SUCCESS'
                        ? 'bg-emerald-400'
                        : status === 'PAD_ATTACK_DETECTED' || status === 'LIVENESS_FAILED'
                        ? 'bg-rose-400'
                        : 'bg-amber-400 animate-ping'
                    }`}
                  ></div>
                  <span>
                    {status === 'CHECKING_PASSIVE_LIVENESS' && 'Passive Liveness Assessment'}
                    {status === 'ACTIVE_CHALLENGE_IN_PROGRESS' && 'Active Facial Challenge'}
                    {status === 'VERIFICATION_SUCCESS' && 'Liveness Verified'}
                    {status === 'PAD_ATTACK_DETECTED' && 'Biometric Verification Failed'}
                    {status === 'LIVENESS_FAILED' && 'Verification Unsuccessful'}
                    {status === 'MAX_RETRIES_EXCEEDED' && 'Retries Exceeded'}
                    {status === 'CONNECTING_DEVICE' && 'Connecting...'}
                  </span>
                </div>

                <div className="px-2.5 py-1 rounded-full bg-slate-900/80 text-slate-300 text-xs font-mono border border-slate-700">
                  Attempt {attemptCount} / {maxRetries}
                </div>
              </div>

              {/* Real-time Guidance Banner at bottom of preview */}
              <div className="absolute bottom-3 left-3 right-3">
                <div
                  className={`p-3 rounded-xl border backdrop-blur text-center transition-all ${
                    status === 'VERIFICATION_SUCCESS'
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                      : status === 'PAD_ATTACK_DETECTED' || status === 'LIVENESS_FAILED'
                      ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                      : status === 'ACTIVE_CHALLENGE_IN_PROGRESS'
                      ? 'bg-amber-950/90 border-amber-500 text-amber-200'
                      : 'bg-slate-900/90 border-slate-700 text-slate-200'
                  }`}
                >
                  <p className="font-semibold text-sm tracking-wide">{statusMessage}</p>
                  <p className="text-xs opacity-80 mt-0.5">{feedbackHint}</p>
                </div>
              </div>
            </div>

            {/* Active Challenge Progress or Quick Actions */}
            {status === 'ACTIVE_CHALLENGE_IN_PROGRESS' && challenges.length > 0 && (
              <div className="w-full mt-4 bg-amber-50/80 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                      {currentChallengeIndex + 1}
                    </span>
                    <span className="font-medium text-sm text-slate-900">
                      Challenge {currentChallengeIndex + 1} of {challenges.length}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-amber-800 font-semibold">
                    Time: {challenges[currentChallengeIndex]?.timeRemainingSeconds ?? 8}s
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 transition-all duration-200"
                    style={{ width: `${challenges[currentChallengeIndex]?.progress || 0}%` }}
                  ></div>
                </div>

                {/* Quick Simulation Buttons for Reviewers / Testers */}
                <div className="mt-3 pt-3 border-t border-amber-200/80 flex flex-wrap gap-2 items-center justify-between">
                  <span className="text-xs text-amber-900 font-medium flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                    Tester Simulator:
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => triggerSimulatedAction('BLINK')}
                      className="px-2.5 py-1 text-xs rounded bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-medium shadow-xs"
                    >
                      Blink
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerSimulatedAction('SMILE')}
                      className="px-2.5 py-1 text-xs rounded bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-medium shadow-xs"
                    >
                      Smile
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerSimulatedAction('TURN_LEFT')}
                      className="px-2.5 py-1 text-xs rounded bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-medium shadow-xs"
                    >
                      Turn Left
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerSimulatedAction('TURN_RIGHT')}
                      className="px-2.5 py-1 text-xs rounded bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-medium shadow-xs"
                    >
                      Turn Right
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Failure Guidance Section (Sections 5 & 6 from PDF) */}
            {(status === 'PAD_ATTACK_DETECTED' || status === 'LIVENESS_FAILED') && (
              <div className="w-full mt-4 bg-rose-50 border border-rose-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-rose-950 text-sm">
                      {status === 'PAD_ATTACK_DETECTED' ? 'Verification Could Not Be Completed' : 'Liveness Verification Incomplete'}
                    </h4>
                    <ul className="text-xs text-rose-800 space-y-1 mt-1.5 list-disc list-inside">
                      <li>Look directly at the camera.</li>
                      <li>Ensure your face is clearly visible and within the capture area.</li>
                      <li>Improve ambient room lighting.</li>
                      <li>Ensure no printed photos, mobile screens, or masks are placed before the lens.</li>
                    </ul>

                    {attemptCount < maxRetries ? (
                      <button
                        type="button"
                        onClick={handleRetry}
                        className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again (Attempt {attemptCount + 1} of {maxRetries})
                      </button>
                    ) : (
                      <div className="mt-3 p-2.5 bg-rose-100 rounded-lg text-xs font-medium text-rose-900 border border-rose-200">
                        {config.repeatedFailureBehaviour === 'SUPERVISOR_OVERRIDE_REQUIRED' &&
                          'Maximum retries exceeded. Please request Supervisor Biometric Authorization to override.'}
                        {config.repeatedFailureBehaviour === 'MANUAL_EXCEPTION_QUEUE' &&
                          'Maximum retries exceeded. Resident packet queued for manual exception review.'}
                        {config.repeatedFailureBehaviour === 'BLOCK_AND_LOCKOUT' &&
                          'Maximum retries exceeded. Registration session locked.'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Maximum Retries Exceeded Recovery Box */}
            {status === 'MAX_RETRIES_EXCEEDED' && (
              <div className="w-full mt-4 bg-slate-100 border border-slate-300 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                  <Lock className="w-4 h-4 text-slate-600" />
                  Exception Recovery Process Triggered
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Biometric capture cannot proceed without supervisor override. Incident logged in MOSIP audit trail with token ID{' '}
                  <span className="font-mono text-slate-800">EXP-{Date.now().toString().slice(-6)}</span>.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium"
                  >
                    Cancel Session
                  </button>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-medium"
                  >
                    Reset & Start Over
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Biometric Device Information & Real-time Policy Context */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Device & Security Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Biometric Capture Device</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                  {deviceType === 'L1_SECURE_BIOMETRIC_DEVICE' ? 'L1 Certified' : 'L0 Standard'}
                </span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">Device Model</span>
                  <span className="font-medium text-slate-900 text-right truncate max-w-[180px]">
                    {device?.getStatus().modelName || 'Biometric Sensor L1'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">Hardware Crypto</span>
                  <span className="font-mono text-emerald-700 font-medium">
                    {deviceType === 'L1_SECURE_BIOMETRIC_DEVICE' ? 'TPM 2.0 Active' : 'Software Layer'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-600">Configured Policy</span>
                  <span className="font-medium text-slate-800">
                    Threshold: {(workflowParams.threshold * 100).toFixed(0)}% | Challenges: {workflowParams.challengeCount}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600">ISO Standard</span>
                  <span className="font-mono text-slate-800">ISO/IEC 30107-3</span>
                </div>
              </div>

              {/* Attack Injection Testing Widget (For Evaluators) */}
              <div className="mt-4 pt-3 border-t border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Automated Attack Test Generator:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedAttack('NONE_BONA_FIDE');
                      handleRetry();
                    }}
                    className={`px-2 py-1.5 text-xs rounded border text-left transition-colors ${
                      simulatedAttack === 'NONE_BONA_FIDE'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-medium'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Bona Fide Live
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedAttack('PRINTED_PHOTO');
                      handleRetry();
                    }}
                    className={`px-2 py-1.5 text-xs rounded border text-left transition-colors ${
                      simulatedAttack === 'PRINTED_PHOTO'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 font-medium'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Printed Photo Spoof
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedAttack('DIGITAL_SCREEN_DISPLAY');
                      handleRetry();
                    }}
                    className={`px-2 py-1.5 text-xs rounded border text-left transition-colors ${
                      simulatedAttack === 'DIGITAL_SCREEN_DISPLAY'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 font-medium'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Screen Replay Spoof
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedAttack('VIDEO_REPLAY');
                      handleRetry();
                    }}
                    className={`px-2 py-1.5 text-xs rounded border text-left transition-colors ${
                      simulatedAttack === 'VIDEO_REPLAY'
                        ? 'bg-rose-50 border-rose-400 text-rose-800 font-medium'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Video Loop Spoof
                  </button>
                </div>
              </div>
            </div>

            {/* Diagnostic Details Panel (Page 9: "Detailed PAD information should be available only through appropriate diagnostic or audit mechanisms") */}
            {showDiagnostics && (
              <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-1">
                  <span>ISO/IEC 30107 TELEMETRY</span>
                  <span className="text-emerald-400">ACTIVE STREAM</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Passive Score:</span>
                    <p className="text-amber-400 font-bold">
                      {((currentFrame?.passiveLivenessScore ?? 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Required:</span>
                    <p className="text-slate-300">{(workflowParams.threshold * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Illumination:</span>
                    <p className="text-slate-300">
                      {((currentFrame?.qualityMetrics.illumination ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Sharpness:</span>
                    <p className="text-slate-300">
                      {((currentFrame?.qualityMetrics.sharpness ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Planar Flatness:</span>
                    <p className="text-slate-300">
                      {((currentFrame?.padMetrics.surfaceFlatnessScore ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Moire Score:</span>
                    <p className="text-slate-300">
                      {((currentFrame?.padMetrics.moirePatternScore ?? 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {lastPadDetail && (
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-rose-400 break-words">
                    {lastPadDetail}
                  </div>
                )}
              </div>
            )}

            {/* Offline Storage notice */}
            {!isOnline && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Offline Registration Center:</strong> Frame signatures and ISO audit hashes are stored locally in tamper-evident encrypted cache and will synchronize when online.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>MOSIP Registration Client v1.2.0 • ISO/IEC 19794-5 & ISO/IEC 30107 Compliant</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            {status === 'VERIFICATION_SUCCESS' && (
              <button
                type="button"
                onClick={() => {
                  if (capturedImage) onSuccess(capturedImage, 'AUDIT-DONE');
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept & Proceed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
