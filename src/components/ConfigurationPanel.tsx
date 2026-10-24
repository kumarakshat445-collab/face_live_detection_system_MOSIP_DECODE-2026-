/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * MOSIP Registration Client Liveness & PAD Configuration Management
 * Strictly covers Page 3-4, 7 Configuration Requirements
 */

import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  RotateCcw, 
  Save, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Lock,
  UserCheck,
  Briefcase
} from 'lucide-react';
import { ChallengeType, LivenessConfiguration } from '../types/mosip';
import { DEFAULT_CONFIG } from '../lib/liveness-engine';

interface ConfigurationPanelProps {
  config: LivenessConfiguration;
  onSave: (newConfig: LivenessConfiguration) => void;
}

const ALL_CHALLENGES: { type: ChallengeType; label: string; desc: string }[] = [
  { type: 'BLINK', label: 'Blink Eyes', desc: 'Evaluates bilateral eyelid occlusion' },
  { type: 'SMILE', label: 'Smile', desc: 'Validates zygomaticus major muscle motion' },
  { type: 'TURN_HEAD_LEFT', label: 'Turn Head Left', desc: 'Evaluates head yaw >= 18 degrees left' },
  { type: 'TURN_HEAD_RIGHT', label: 'Turn Head Right', desc: 'Evaluates head yaw >= 18 degrees right' },
  { type: 'LOOK_UP', label: 'Look Up', desc: 'Evaluates vertical pitch & eye gaze angle up' },
  { type: 'LOOK_DOWN', label: 'Look Down', desc: 'Evaluates pitch & eye gaze angle down' },
  { type: 'NOD_HEAD', label: 'Nod Head', desc: 'Dynamic pitch oscillatory gesture' },
];

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ config, onSave }) => {
  const [currentConfig, setCurrentConfig] = useState<LivenessConfiguration>(config);
  const [saveToast, setSaveToast] = useState(false);

  const handleToggleChallenge = (type: ChallengeType) => {
    const exists = currentConfig.supportedChallengeTypes.includes(type);
    let updated: ChallengeType[];
    if (exists) {
      if (currentConfig.supportedChallengeTypes.length <= 1) return; // keep at least 1
      updated = currentConfig.supportedChallengeTypes.filter((t) => t !== type);
    } else {
      updated = [...currentConfig.supportedChallengeTypes, type];
    }
    setCurrentConfig({ ...currentConfig, supportedChallengeTypes: updated });
  };

  const handleResetDefaults = () => {
    setCurrentConfig({ ...DEFAULT_CONFIG });
    onSave(DEFAULT_CONFIG);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(currentConfig);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-bold text-slate-900">Registration Client Liveness Policies</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure ISO/IEC 30107 thresholds, active challenge sequences, and workflow rules for online & offline operation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Configuration updated and cached in local Registration Client runtime!
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Section 1: Global Liveness & Passive Threshold */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">1</span>
            Core Liveness & Passive Detection Thresholds
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
            {/* Liveness Verification Toggle */}
            <div className="flex items-start justify-between">
              <div>
                <label className="text-sm font-semibold text-slate-800">Liveness Verification</label>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enable or disable face liveness and presentation attack checking during capture.
                </p>
              </div>
              <input
                type="checkbox"
                checked={currentConfig.enabled}
                onChange={(e) => setCurrentConfig({ ...currentConfig, enabled: e.target.checked })}
                className="w-5 h-5 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
              />
            </div>

            {/* Active Liveness Policy */}
            <div>
              <label className="text-sm font-semibold text-slate-800">Active Liveness Escalation Policy</label>
              <p className="text-xs text-slate-500 mt-0.5 mb-2">When should facial movement challenges be prompted?</p>
              <select
                value={currentConfig.activeLivenessPolicy}
                onChange={(e) =>
                  setCurrentConfig({
                    ...currentConfig,
                    activeLivenessPolicy: e.target.value as any,
                  })
                }
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800"
              >
                <option value="AUTO_ON_LOW_CONFIDENCE">
                  Hybrid Auto (Trigger if passive score is below threshold)
                </option>
                <option value="ALWAYS_REQUIRE">Always Require Active Challenge</option>
                <option value="DISABLED">Passive Only (Never escalate to active)</option>
              </select>
            </div>

            {/* Passive Threshold Slider */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-slate-800">
                  Global Passive Liveness Quality / Confidence Threshold
                </label>
                <span className="text-sm font-bold text-orange-600 font-mono">
                  {(currentConfig.passiveLivenessThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Minimum passive score required before accepting the face frame without requiring active movement challenges.
              </p>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={currentConfig.passiveLivenessThreshold}
                onChange={(e) =>
                  setCurrentConfig({
                    ...currentConfig,
                    passiveLivenessThreshold: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-orange-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>50% (Permissive)</span>
                <span>75% (Recommended Default)</span>
                <span>95% (High Security)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Active Challenge Pool & Timing */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">2</span>
            Active Challenge Configuration & Supported Types
          </h3>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_CHALLENGES.map((ch) => {
                const isSelected = currentConfig.supportedChallengeTypes.includes(ch.type);
                return (
                  <label
                    key={ch.type}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-orange-50/70 border-orange-300 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-600 opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleChallenge(ch.type)}
                      className="mt-1 w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{ch.label}</div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{ch.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Minimum Active Challenges
                </label>
                <select
                  value={currentConfig.minimumActiveChallenges}
                  onChange={(e) =>
                    setCurrentConfig({
                      ...currentConfig,
                      minimumActiveChallenges: parseInt(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value={1}>1 Dynamic Challenge</option>
                  <option value={2}>2 Dynamic Challenges</option>
                  <option value={3}>3 Dynamic Challenges</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Challenge Timeout (Seconds)
                </label>
                <input
                  type="number"
                  min="4"
                  max="20"
                  value={currentConfig.challengeTimeoutSeconds}
                  onChange={(e) =>
                    setCurrentConfig({
                      ...currentConfig,
                      challengeTimeoutSeconds: parseInt(e.target.value) || 7,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Maximum Retry Attempts
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={currentConfig.maxRetryCount}
                  onChange={(e) =>
                    setCurrentConfig({
                      ...currentConfig,
                      maxRetryCount: parseInt(e.target.value) || 3,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Workflow-Specific Liveness Policies & Repeated Failure */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold flex items-center justify-center">3</span>
            Workflow-Specific Policies & Exception Handling
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Resident Registration Policy */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Resident Registration
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 block mb-1">Passive Threshold</label>
                  <select
                    value={currentConfig.residentPolicy.passiveThreshold}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        residentPolicy: {
                          ...currentConfig.residentPolicy,
                          passiveThreshold: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md p-1.5"
                  >
                    <option value={0.70}>70% (Standard)</option>
                    <option value={0.75}>75% (Recommended)</option>
                    <option value={0.80}>80% (Strict)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Active Challenges</label>
                  <select
                    value={currentConfig.residentPolicy.challengeCount}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        residentPolicy: {
                          ...currentConfig.residentPolicy,
                          challengeCount: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md p-1.5"
                  >
                    <option value={1}>1 Challenge</option>
                    <option value={2}>2 Challenges</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Operator Authentication Policy */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                Operator Authentication
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 block mb-1">Passive Threshold</label>
                  <select
                    value={currentConfig.operatorPolicy.passiveThreshold}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        operatorPolicy: {
                          ...currentConfig.operatorPolicy,
                          passiveThreshold: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md p-1.5"
                  >
                    <option value={0.75}>75%</option>
                    <option value={0.80}>80% (High Security)</option>
                    <option value={0.85}>85%</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Active Challenges</label>
                  <select
                    value={currentConfig.operatorPolicy.challengeCount}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        operatorPolicy: {
                          ...currentConfig.operatorPolicy,
                          challengeCount: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md p-1.5"
                  >
                    <option value={2}>2 Challenges</option>
                    <option value={3}>3 Challenges</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Supervisor Authentication Policy */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900 mb-2">
                <Lock className="w-4 h-4 text-purple-600" />
                Supervisor Authentication
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 block mb-1">Passive Threshold</label>
                  <select
                    value={currentConfig.supervisorPolicy.passiveThreshold}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        supervisorPolicy: {
                          ...currentConfig.supervisorPolicy,
                          passiveThreshold: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md p-1.5"
                  >
                    <option value={0.80}>80%</option>
                    <option value={0.85}>85% (Maximum Security)</option>
                    <option value={0.90}>90%</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Active Challenges</label>
                  <select
                    value={currentConfig.supervisorPolicy.challengeCount}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        supervisorPolicy: {
                          ...currentConfig.supervisorPolicy,
                          challengeCount: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-md p-1.5"
                  >
                    <option value={2}>2 Challenges</option>
                    <option value={3}>3 Challenges</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Repeated Failure Behaviour */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <label className="text-sm font-semibold text-slate-800 block mb-1">
              Behaviour when liveness verification repeatedly fails
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Action executed by the Registration Client when the user reaches the maximum retry limit:
            </p>
            <select
              value={currentConfig.repeatedFailureBehaviour}
              onChange={(e) =>
                setCurrentConfig({
                  ...currentConfig,
                  repeatedFailureBehaviour: e.target.value as any,
                })
              }
              className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 font-medium text-slate-800"
            >
              <option value="SUPERVISOR_OVERRIDE_REQUIRED">
                Require Supervisor Biometric Authorization to Override (Default MOSIP Standard)
              </option>
              <option value="MANUAL_EXCEPTION_QUEUE">
                Route packet to Manual Exception Adjudication Queue
              </option>
              <option value="BLOCK_AND_LOCKOUT">
                Block & Lock Out Session (High Security Restriction)
              </option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
};
