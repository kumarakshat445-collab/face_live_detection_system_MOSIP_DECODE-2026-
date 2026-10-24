/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MOSIP ISO/IEC 30107 Presentation Attack Simulator & Automated Test Scenarios
 * Bonus Task Implementation (Page 10)
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  Cpu, 
  Layers, 
  Sparkles, 
  Smartphone, 
  FileImage, 
  Video, 
  Users, 
  CheckCircle2, 
  XCircle,
  Clock
} from 'lucide-react';
import { AttackType, FaceFrameData } from '../types/mosip';
import { generateSyntheticFrame, evaluatePassiveFrame, DEFAULT_CONFIG } from '../lib/liveness-engine';

interface AttackScenario {
  id: AttackType;
  title: string;
  category: 'BONA_FIDE' | 'LEVEL_1_2D' | 'LEVEL_2_3D' | 'ENVIRONMENTAL';
  description: string;
  isoStandardRef: string;
  icon: any;
  expectedResult: 'PASS' | 'REJECT';
}

const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: 'NONE_BONA_FIDE',
    title: 'Bona Fide Live Subject',
    category: 'BONA_FIDE',
    description: 'Authentic live human face present before the L0/L1 biometric device with natural physiological micro-movements.',
    isoStandardRef: 'ISO/IEC 30107-1 Clause 4.2',
    icon: Sparkles,
    expectedResult: 'PASS',
  },
  {
    id: 'PRINTED_PHOTO',
    title: 'Printed Photo Attack (Paper/Glossy)',
    category: 'LEVEL_1_2D',
    description: 'High-resolution colored printout on matte paper. Lacks 3D depth, exhibits paper specular glare, and planar landmark invariance.',
    isoStandardRef: 'ISO/IEC 30107-3 Level 1 PAI',
    icon: FileImage,
    expectedResult: 'REJECT',
  },
  {
    id: 'DIGITAL_SCREEN_DISPLAY',
    title: 'Digital Screen Replay (OLED/LCD)',
    category: 'LEVEL_1_2D',
    description: 'Resident image or video presented on an iPad or smartphone screen. High pixel grid moiré pattern, bezel boundary, and display refresh artifacts.',
    isoStandardRef: 'ISO/IEC 30107-3 Level 1 Screen Replay',
    icon: Smartphone,
    expectedResult: 'REJECT',
  },
  {
    id: 'VIDEO_REPLAY',
    title: 'Video Stream Loop Attack',
    category: 'LEVEL_1_2D',
    description: 'Recorded live video of a genuine resident replayed in a loop. Detected via motion recurrence periodicity and frame timing irregularities.',
    isoStandardRef: 'ISO/IEC 30107-3 Replay Attack',
    icon: Video,
    expectedResult: 'REJECT',
  },
  {
    id: 'SILICONE_MASK',
    title: '3D Silicone / Latex Mask',
    category: 'LEVEL_2_3D',
    description: 'Molded facial mask worn by attacker. Fails skin micro-texture entropy, thermal consistency, and micro-pore distribution analysis.',
    isoStandardRef: 'ISO/IEC 30107-3 Level 2 3D PAI',
    icon: Layers,
    expectedResult: 'REJECT',
  },
  {
    id: 'MULTI_FACE_INTERFERENCE',
    title: 'Multiple Faces in Viewport',
    category: 'ENVIRONMENTAL',
    description: 'Two or more individuals standing in the capture zone simultaneously, violating single-resident biometric capture standards.',
    isoStandardRef: 'ISO/IEC 19794-5 Quality Check',
    icon: Users,
    expectedResult: 'REJECT',
  },
];

export const AttackSimulatorPanel: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<AttackScenario>(ATTACK_SCENARIOS[0]);
  const [testResult, setTestResult] = useState<{
    frame: FaceFrameData;
    evaluation: ReturnType<typeof evaluatePassiveFrame>;
    durationMs: number;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runScenarioTest = (scenario: AttackScenario) => {
    setSelectedScenario(scenario);
    setIsRunning(true);
    setTestResult(null);

    const startTime = performance.now();
    setTimeout(() => {
      const frame = generateSyntheticFrame(scenario.id, true);
      const evaluation = evaluatePassiveFrame(frame, DEFAULT_CONFIG, 'RESIDENT_REGISTRATION');
      const durationMs = Math.round(performance.now() - startTime);

      setTestResult({
        frame,
        evaluation,
        durationMs,
      });
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h2 className="text-xl font-bold text-slate-900">
            Automated PAD Attack Test Suite & Scenarios
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Evaluate MOSIP Face Liveness and Presentation Attack Detection (PAD) algorithms against ISO/IEC 30107 attack vectors.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Scenarios Selector */}
        <div className="lg:col-span-5 space-y-2.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Select Test Scenario Vector:
          </label>
          {ATTACK_SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            const isSelected = selectedScenario.id === sc.id;
            return (
              <button
                type="button"
                key={sc.id}
                onClick={() => runScenarioTest(sc)}
                className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all block ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/80 shadow-xs ring-1 ring-orange-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
                aria-label={`Select ${sc.title}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-orange-600' : 'text-slate-500'}`} />
                    <span>{sc.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      sc.expectedResult === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Expected: {sc.expectedResult}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{sc.description}</p>
              </button>
            );
          })}
        </div>

        {/* Right: Real-time Evaluation Results */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 rounded-xl p-5 text-white shadow-inner border border-slate-800 min-h-[440px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-orange-400" />
                  <span className="font-mono text-xs font-bold text-orange-300">
                    MOSIP PAD EVALUATION ENGINE
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {selectedScenario.isoStandardRef}
                </span>
              </div>

              {isRunning ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-xs font-mono text-slate-400">Analyzing frame stream texture & volumetric cues...</p>
                </div>
              ) : testResult ? (
                <div className="mt-4 space-y-4 font-mono">
                  {/* Verdict Banner */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      testResult.evaluation.passed
                        ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200'
                        : testResult.evaluation.padAttackDetected
                        ? 'bg-rose-950/80 border-rose-500/80 text-rose-200'
                        : 'bg-amber-950/80 border-amber-500/80 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {testResult.evaluation.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400" />
                      )}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider">
                          {testResult.evaluation.passed
                            ? 'Bona Fide Verification Succeeded'
                            : testResult.evaluation.padAttackDetected
                            ? 'Presentation Attack Blocked (PAD Triggered)'
                            : 'Escalated to Active Challenge'}
                        </div>
                        <div className="text-[11px] opacity-80 mt-0.5">
                          {testResult.evaluation.userMessage}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] opacity-70">Latency</div>
                      <div className="text-xs font-bold">{testResult.durationMs}ms</div>
                    </div>
                  </div>

                  {/* Quantitative Telemetry Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-800/70 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block">Passive Liveness Score:</span>
                      <span className="text-sm font-bold text-amber-300">
                        {(testResult.frame.passiveLivenessScore * 100).toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        (Threshold: {(testResult.evaluation.threshold * 100).toFixed(0)}%)
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-800/70 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block">Attack Confidence:</span>
                      <span className="text-sm font-bold text-rose-400">
                        {(testResult.frame.padMetrics.attackConfidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-800/70 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block">Screen Moiré Score:</span>
                      <span className="text-xs font-bold text-slate-200">
                        {testResult.frame.padMetrics.moirePatternScore.toFixed(3)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-800/70 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block">Surface Flatness (2D):</span>
                      <span className="text-xs font-bold text-slate-200">
                        {testResult.frame.padMetrics.surfaceFlatnessScore.toFixed(3)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-800/70 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block">Micro-Texture Variance:</span>
                      <span className="text-xs font-bold text-slate-200">
                        {testResult.frame.qualityMetrics.textureMicroVariance.toFixed(3)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-800/70 rounded-lg border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] block">L1 Digital Signature:</span>
                      <span className="text-[11px] font-bold text-emerald-400 truncate block">
                        {testResult.frame.deviceSignature || 'Hardware Token Valid'}
                      </span>
                    </div>
                  </div>

                  {/* Audit Diagnostic Output */}
                  <div className="p-3 bg-black/50 border border-slate-800 rounded-lg text-[11px] text-slate-300">
                    <span className="text-slate-500 font-bold block mb-1">
                      ISO/IEC 30107 DIAGNOSTIC TELEMETRY:
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {testResult.evaluation.diagnosticDetail}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-500 text-xs">
                  Select a test attack scenario on the left or click "Run Automated Test" below.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Evaluation target: Resident Registration Flow
              </span>
              <button
                type="button"
                onClick={() => runScenarioTest(selectedScenario)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Automated Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
